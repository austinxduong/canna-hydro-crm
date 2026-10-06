# Backlog

Running list of known issues / improvements to revisit later. Not urgent — parked deliberately, come back once MVP is further along.

## Ingestion: source_records duplicates on every pull (no change detection)

**Where:** `ingestion/loader.py` — `insert_source_record()`

**What's happening:** Every time the ingestion pipeline runs against a business, it does a bare `INSERT INTO source_records`, with no check for whether a matching row (same `business_id` + `source` + `source_record_id`) already exists. If the pulled data hasn't changed at all, it still writes a brand new row with a fresh `pulled_at` timestamp. Confirmed via business id 12 ("Canna Bros.") having 6 identical `source_records` rows from repeated manual test runs (Sept 5-7).

**Downstream effect:** `GET /businesses/:id` in `backend/app.ts` aggregates `source_records.source` with `STRING_AGG`, so the `sources` field in the API response shows the same source name repeated once per duplicate row (e.g. `"oregon_olcc, oregon_olcc, oregon_olcc, ..."`).

**Options considered:**
1. **Read-side fix only:** change the aggregation to `STRING_AGG(DISTINCT source_records.source, ', ')`. Keeps every pull as its own row (true audit trail of every check), just de-dupes for display. Simple, no ingestion changes.
2. **Ingestion-side fix (change detection / upsert):** before inserting, look up the most recent `source_records` row for that `business_id` + `source` + `source_record_id`. If the incoming pull is identical (same `raw_name`/`raw_address`), just update that row's `pulled_at` ("last confirmed") instead of inserting a new row. Only insert a new row when something actually changed. Gives a *meaningful* history (license status changes, name/address changes over time) instead of noise, at the cost of reworking `load_record`'s flow (source record insert currently happens before the business match is even resolved).

**Decision:** parked for now — pipeline is still fully manual (no cron/scheduler wired up anywhere yet), so there's no unbounded growth happening in the background. This is now explicitly bundled with the "Ingestion: no scheduled/automatic pipeline runs" item below — adding a scheduler without also landing the ingestion-side fix (option 2 above) would immediately reactivate this bug under sustained, unattended growth instead of just during manual testing, so the two are being treated as one combined feature rather than sequential work.

## Backend: no server-side validation of `stage` values

**Where:** `backend/app.ts` — `PATCH /businesses/:id` (and any future write path touching `stage`); `backend/db/schema.sql` — `Business.stage`

**What's happening:** `stage` is a plain `varchar` column with no `CHECK` constraint or `ENUM` type, and the `PATCH` route only validates that `req.body.stage` is non-empty/truthy — it never checks it against the actual set of valid stages. The only place the five allowed values (`'New' | 'Contacted' | 'Demo Scheduled' | 'Customer' | 'Lost'`) are defined is the frontend constant `PIPELINE_STAGES`.

**Downstream effect:** Nothing stops a bad/typo'd/inconsistently-cased stage value from being written (e.g. `'customer'` instead of `'Customer'`), whether from a frontend bug, a future API client, or a manual DB edit. Any query relying on an exact string match against `stage` — like the dashboard's "Customers Won" count (`WHERE stage = 'Customer'`) — would silently undercount with no error raised.

**Options considered:** a Postgres `CHECK (stage IN (...))` constraint, or an `ENUM` type — either moves the source of truth from the frontend TypeScript array into the schema itself, so an invalid value becomes physically impossible to insert.

**Decision:** parked — not blocking dashboard work. Revisit if/when stage-dependent aggregate queries (dashboard cards, reporting) become numerous enough that a silent mismatch would meaningfully skew real numbers.

## Schema: no `UNIQUE` constraint on `Business.license_number`

**Where:** `backend/db/schema.sql` — `Business.license_number` (currently plain `varchar`)

**What's happening:** The surrogate `id` (`GENERATED ALWAYS AS IDENTITY`) guarantees every *row* is unique, but nothing guarantees every *business* is unique. The same license number can be inserted twice and each row just gets a fresh `id`. The only protection today is the ingestion pipeline's own dedup in `loader.py`, which only covers that one writer — `POST /businesses` in `app.ts`, manual SQL, a future writer, or two overlapping pipeline runs (check-then-insert race) all bypass it.

**Downstream effect:** Duplicate `Business` rows for the same real business, each accumulating its own activity history and `source_records`.

**Options considered:** `license_number varchar UNIQUE`. Postgres treats `NULL`s as distinct by default, so unlicensed prospects / manual leads (all `NULL`) don't conflict with each other — only real license numbers are forced unique. Caveats:
- `UNIQUE` compares exact strings, so it only works because ingestion normalizes license numbers first. Any other write path that sets `license_number` must normalize too (or the DB must enforce the normalized form, e.g. a `CHECK` on format or a unique index on a normalized expression — revisit in Week 6 indexes).
- The `ALTER TABLE ... ADD CONSTRAINT` will fail if duplicates already exist — run a `GROUP BY license_number HAVING COUNT(*) > 1` check first.
- Decide how the pipeline reacts when the constraint rejects an insert (crash / skip / update existing row — see `INSERT ... ON CONFLICT`).

**Principle:** app-level checks give good error messages; DB constraints are the guarantee (defense in depth). Same idea as the `stage` `CHECK` constraint item above.

**Decision:** not yet decided.

## Ingestion: fuzzy match links the record but never writes the license back to `Business`

**Where:** `ingestion/loader.py` — `load_record()` / `find_matching_business_by_proximity()`

**What's happening:** Matching order is (1) exact `license_number` match → (2) if the incoming record has coordinates, proximity + name match (`ST_DWithin` 50m **AND** trigram `similarity(name) >= 0.4`) → (3) otherwise insert a new business. When step 2 matches, the only write is `update_source_record_business_id()` — the `Business` row itself is never updated. Note: there is no separate address-text check; proximity on the geocoded address is effectively the address signal.

**Downstream effect:** A manually created lead (no license) that gets fuzzy-matched keeps `license_number = NULL` forever, so every future run misses the exact match in step 1 and relies on fuzzy matching again. If the name changes or the geocode shifts, it eventually falls through to step 3 and becomes a duplicate.

**Options considered:**
- On a fuzzy match, write the registry's license (and other official fields) back to the `Business` row. Open question: only fill fields that are `NULL`, or also overwrite rep-entered values?
- Check whether `0.4` is too loose for neighboring businesses, e.g. `SELECT similarity('Green Leaf Hydroponics', 'Green Leaf Dispensary');`. Options: raise the threshold, add a category check, or send middling scores to a review tier.
- Tiered matching by confidence: high confidence → auto-merge; uncertain → insert + flag for rep review; no match → insert.

**Principle:** prefer false negatives (visible, fixable duplicates) over false positives (silent wrong merges that corrupt history).

**Decision:** direction chosen — tiered matching with "flag for review" as the safe fallback for uncertain matches. Write-back rules and threshold tuning not yet decided. The "flag for review" tier is implemented as the Dedup Review Queue (see "Feature: Dedup Review Queue") — uncertain matches create a `pending` `duplicate_candidates` row.

## Backend: manual leads are never geocoded, so proximity matching can't find them

**Where:** `backend/app.ts` — `POST /businesses` and `PATCH /businesses/:id` (address can be set/changed in either)

**What's happening:** Manually created leads are saved with `location = NULL` (and no `license_number`). Proximity matching in `loader.py` (`ST_DWithin`) needs a `location` on the existing row, so it can never match a manual lead. When the registry version of that business is ingested later, it misses both the license match and the proximity match and gets inserted as a new row.

**Downstream effect:** Duplicate business — one row with the rep's notes/activity history, one with the official registry data.

**Options considered:** geocode the address server-side in `POST`/`PATCH` and store `location` before insert/update (rep just types an address; optionally add address autocomplete / map-pin confirmation in the UI for accuracy). Open questions were where the geocoding logic lives (`ingestion/geocode.py` is Python; duplicating it in Express means the same rule in two codebases) and what happens on a failed/timed-out geocode call.

**Decision:** geocode on submit, synchronously, inline in the `POST`/`PATCH` route handlers (new TypeScript code in `backend/` — not reused from `ingestion/geocode.py`, since Express can't call into the Python ingestion codebase in-process). Accepted as a deliberate, small duplication: the Census geocoder is a free, stable public API with minimal surface area to drift on.

On a failed/timed-out geocode call: don't block the save. Insert/update the row with `location = NULL` — the business still appears in list views and can be worked by a rep, it just has no map pin until resolved. Backfilling those null-`location` rows is handled by the scheduled sweep described in "Ingestion: no scheduled/automatic pipeline runs" below, which reuses the existing Python geocoding code rather than a second TypeScript implementation.

A related but distinct case: if the address is mistyped but still resolves to *some* real location (geocoding APIs generally return a best-guess match rather than requiring an exact one), the row gets saved with a non-null but incorrect `location`. The null-location sweep above doesn't catch this — it only queries `WHERE location IS NULL`. When the registry version is ingested later, `ST_DWithin` compares the wrong saved point against the correct incoming one; if they're far enough apart, the comparison correctly returns false and the registry version still inserts as a new row, producing the same duplicate-business outcome as the null case, just via a different mechanism. Not being treated as a bug to prevent — loosening the proximity match to catch mistyped-but-nearby addresses risks the opposite failure mode this file already commits to avoiding (see the fuzzy-match entry's "prefer false negatives over false positives" principle). Resolution path: the Dedup Review Queue (see "Feature: Dedup Review Queue"). Note that ingestion will **not** flag this case on its own — the misplaced pin is outside the 50m proximity check, so no candidate is ever created automatically. It reaches the queue only when a rep notices and flags it manually (`POST /duplicate-candidates`), or later via the parked automated sweep.

## Ingestion: no scheduled/automatic pipeline runs

**Where:** `ingestion/main.py` — currently just a DB connection stub (connects, prints the dbname, closes); doesn't invoke `loader.py` at all yet. Confirmed no scheduler anywhere in the repo — no `cron`/`schedule`/`APScheduler` usage, no GitHub Actions workflow, no Render cron job config, no `Procfile`.

**What's happening:** The pipeline only runs when a human manually triggers it. Nothing pulls fresh registry data, or re-checks existing records, on any kind of cadence.

**Downstream effect:** Two concrete costs. First, a manually-created lead's `license_number` (see the fuzzy-match write-back entry above) only has a chance to get backfilled whenever someone happens to rerun the pipeline by hand — there's no reliable guarantee that ever happens. Second, more broadly, state registry changes (new licenses, status changes, name/address updates) only reach the CRM whenever a human remembers to trigger a pull, which doesn't hold up as real usage grows past manual testing.

**Options considered:** A scheduled job — cron, a hosted scheduler (e.g. Render Cron Jobs), GitHub Actions on a schedule — running the pipeline on a regular cadence (e.g. daily).

**Decision:** direction chosen — build this combined with the `source_records` duplicate-row fix above (the ingestion-side change-detection/upsert option specifically, not the read-side `STRING_AGG(DISTINCT ...)` cosmetic fix) as a single piece of work, not two sequential ones. Running an unattended, recurring pull without first landing the duplicate-insert fix would turn a currently-contained, manual-testing-only annoyance into genuine unbounded row growth in production. Cadence and hosting mechanism not yet decided.

Also bundled in: a null-`location` backfill sweep (see "manual leads are never geocoded" above) — re-run geocoding for existing `Business` rows where `location IS NULL`, reusing `resolve_coordinates`/`geocode_address` from `ingestion/normalize.py` and `ingestion/geocode.py` rather than writing new logic. This isn't just convenient to bundle, it's an ordering dependency: `loader.py`'s proximity matching (`ST_DWithin`) can't match a business with no `location`, so a manually-created lead that failed geocoding on submit would also stay unmatched (and its `license_number` unbackfilled) by the registry-pull/matching step until the sweep resolves it. The sweep needs to run before (or as an early step within) each scheduled run, ahead of the registry pull/matching. Ships first as a manual script (`ingestion/backfill_geocode.py`, run on demand); promoted to run automatically once this item's scheduler is built.

## Auth: decide Redis persistence + token lifetime before building the JWT denylist

**Where:** not built yet — JWT + Redis-backed denylist is designed but not implemented, and `docker-compose.yml` currently only runs Postgres (no Redis service).

**What's happening:** Redis keeps data in memory (RAM), which is wiped when the Redis process/server restarts. Whether the denylist survives a restart depends on Redis's persistence settings, not on Redis itself:
- **No persistence:** Redis comes back empty — every revoked token is accepted again.
- **RDB snapshots** (Redis's own default): saves a full copy to disk every few minutes; a restart reloads the last snapshot, so only tokens revoked *since the last snapshot* are lost.
- **AOF (append-only file):** logs every write to disk (similar idea to Postgres's WAL); typically loses at most ~1 second of writes.
- Managed Redis providers often enable stronger persistence, but it varies by provider/plan — check, don't assume.

**Downstream effect:** if denylist entries are lost, revoked tokens (e.g. a removed rep) work again until each token's own expiry.

**Options considered:**
- Enable AOF (or confirm the managed provider's persistence settings) when adding Redis.
- Keep access tokens short-lived (e.g. ~15 min): caps the worst-case exposure window after any denylist loss, and keeps the denylist small. Set each denylist key's TTL to the token's remaining lifetime so entries clean themselves up.
- Alternative: store the denylist in Postgres (`token_denylist (token_id PRIMARY KEY, expires_at)`) — durable on disk and no extra infrastructure, but needs a scheduled cleanup job (`DELETE ... WHERE expires_at < now()`) and adds a query to every authenticated request on the main database.

- **Postgres as source of truth, Redis as a fast copy:** if Redis is the *only* record of a revocation, a lost entry can't even be detected, let alone re-added — there's no record it ever existed. Instead, record every revocation durably in Postgres (e.g. `Users.status = 'disabled'`, which already exists, or a revocations table), write it to Redis for the fast every-request check, and automatically rebuild the Redis denylist from Postgres after a Redis restart. Redis makes the check fast; Postgres keeps it correct. Trade-off: more code (dual writes + a rebuild step) in exchange for never losing a revocation. Same principle as caching (system design Week 7): the cache can be wiped any time because the real data lives elsewhere.

**Decision:** Redis is the planned choice. Persistence setting, token lifetime, and whether to back the denylist with a Postgres source of truth are not yet decided — decide together when building auth.

## Frontend: map gives no visibility into businesses excluded due to missing coordinates

**Where:** `frontend/src/components/MapView.tsx` (no handling for this yet); `backend/app.ts` — `POST`/`PATCH /businesses` is the source of null `location` values, since a failed geocode no longer blocks the save.

**What's happening:** A business with `location = NULL` can't be rendered on the map — a pin (or any marker) needs real coordinates to be positioned at, so there's nothing to place. This isn't a defect: no code is behaving incorrectly, there's no way to put something in coordinate space without a coordinate. But there's also currently no signal anywhere near the map telling a rep "N businesses aren't shown here because they have no coordinates" — someone working from the map view has no way to know it's missing anyone at all.

**Downstream effect:** Nothing is actually lost — a null-location business is still fully reachable through the regular list view, which has no filter on `location`. The gap is discoverability specifically for a rep working map-first: they could stay unaware that leads exist outside what they're looking at, with nothing prompting them to go check the list.

**Options considered:**
- Do nothing beyond what the list view already provides — every business is reachable there regardless of location status.
- A separate, filtered view (`WHERE location IS NULL`) surfaced near the map (not on it, since nothing can render there without coordinates) — listing just the businesses currently excluded from the map.

**Decision:** not yet decided — deliberately deferred. Not required for correctness, only for discoverability in map-first workflows. Revisit once the manual-lead creation form is built and gets real use, to see whether this gap actually matters in practice.

## Feature: Dedup Review Queue (Data tab — Duplicates)

**Where:** not built yet — new `duplicate_candidates` table in `backend/db/schema.sql`; new routes in `backend/app.ts`; candidate creation in `ingestion/loader.py`; new screen in `frontend/` (per Miro wireframe, Data tab → Duplicates).

**What's happening:** Several entries in this file name this screen as the place uncertain or missed duplicates get resolved, but nothing exists yet to store a suspected pair, show it to a rep, or record the decision.

**Downstream effect:** Without a stored decision, a rejected pair is re-flagged on every ingestion run, and duplicates that ingestion can't detect (see "manual leads are never geocoded") have no resolution path at all.

**Options considered:**
1. **Action endpoint:** `POST /businesses/:id/merge`. Works for approve, but reject has no natural request and nothing records that a pair was reviewed — rejected pairs come back next run. Adding a reject endpoint means storing the decision somewhere, which is option 2 under another name.
2. **Resource:** each suspected pair is a row in `duplicate_candidates` with a status. The decision is data other parts of the system (ingestion) read later.

**Decision (System Design Week 5, Day 1):** option 2 — model each suspected pair as a resource (`duplicate_candidates`), not a `/merge` action.
- Table: `duplicate_candidates` (id, business_a_id, business_b_id, score, source, status, survivor_id, reviewed_by, reviewed_at, created_at). `status`: `pending` | `approved` | `rejected`. `source`: `ingestion` | `manual` (who flagged it).
- `GET /duplicate-candidates?status=pending` — loads the queue.
- `POST /duplicate-candidates` `{ business_a_id, business_b_id }` — rep manually flags two existing businesses as a possible duplicate (`source = 'manual'`).
- `PATCH /duplicate-candidates/:id` — records the decision: `{ status: "rejected" }` or `{ status: "approved", survivor_id }`. Same endpoint for both outcomes; the body decides.
- On approve: loser's `activity_log` and `source_records` move to the survivor, survivor's empty fields are filled from the loser, loser is soft-deleted.
- On reject: both businesses untouched; the stored `rejected` row stops ingestion from re-flagging the pair.
- Ingestion: uncertain-tier matches insert a `pending` candidate (`source = 'ingestion'`); skip any pair that already has a candidate row.
- UI: two records side by side, radio select for the survivor (default = the record with a `license_number`), selected card highlighted, preview text above Merge ("X will be archived. Its N notes move to Y.").
- Detection v1 = ingestion + manual flagging. Manual flagging chosen over an automated sweep: higher precision (a human already suspects a match), and at current scale a rep will notice duplicates. Trade-off: lower recall — only catches what someone sees.
- Nothing merges automatically. Every merge requires a reviewer clicking Merge; every detection path (ingestion, manual, future sweep) only creates a `pending` suggestion.

**Dependencies (must land first or alongside):**
- **Soft delete is not built.** `DELETE /businesses/:id` currently hard-deletes and no `deleted_at` column exists. Approve depends on it.
- **Ingestion must ignore archived rows.** `find_matching_business` and `find_matching_business_by_proximity` need `AND deleted_at IS NULL`, or the next run can match the archived loser instead of the survivor.
- **Conflict with the `UNIQUE` license constraint entry.** If the loser has the license and the survivor doesn't, copying it to the survivor duplicates a value the soft-deleted loser still holds. Options: clear it on the loser during merge, or make the constraint a partial unique index (`WHERE deleted_at IS NULL`).
- **Tier thresholds** (see fuzzy-match entry) decide what ingestion sends here vs. auto-links. Not yet decided.

**Open questions:**
- Store each pair in a consistent order (e.g. smaller id as `business_a_id`) plus a `UNIQUE (business_a_id, business_b_id)` constraint, so 42/57 and 57/42 can't become two candidates.
- `reviewed_by` stays `NULL` until auth exists (same as `activity_log.user_id`).
- Should a rejected pair ever be re-flagged (e.g. if either business's name or address changes later)?

**Parked:** automated sweep comparing existing businesses against each other with looser rules (e.g. high name similarity + same city, ignoring distance), inserting `pending` candidates with `source = 'sweep'`.
- Why parked: looser rules mean more false positives (e.g. two different "Green Leaf" stores in the same city). A false positive never merges on its own — it's just a `pending` card a reviewer can reject. The real risk is **reviewer fatigue**: a queue full of bad suggestions trains reviewers to click through without looking closely, and that is when a wrong merge actually happens. That would undercut this file's "prefer false negatives over false positives" principle.
- At current scale (small business count, one reviewer), manual flagging covers the gap the sweep would fill.
- Revisit once the business count is large enough that reps can't reasonably spot duplicates by eye. When built, it likely runs as part of the scheduled pipeline (see "Ingestion: no scheduled/automatic pipeline runs") and should start with conservative rules to keep the queue trustworthy.
