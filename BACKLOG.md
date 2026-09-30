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

**Decision:** direction chosen — tiered matching with "flag for review" as the safe fallback for uncertain matches. Write-back rules and threshold tuning not yet decided.

## Backend: manual leads are never geocoded, so proximity matching can't find them

**Where:** `backend/app.ts` — `POST /businesses` and `PATCH /businesses/:id` (address can be set/changed in either)

**What's happening:** Manually created leads are saved with `location = NULL` (and no `license_number`). Proximity matching in `loader.py` (`ST_DWithin`) needs a `location` on the existing row, so it can never match a manual lead. When the registry version of that business is ingested later, it misses both the license match and the proximity match and gets inserted as a new row.

**Downstream effect:** Duplicate business — one row with the rep's notes/activity history, one with the official registry data.

**Options considered:** geocode the address server-side in `POST`/`PATCH` and store `location` before insert/update (rep just types an address; optionally add address autocomplete / map-pin confirmation in the UI for accuracy). Open questions were where the geocoding logic lives (`ingestion/geocode.py` is Python; duplicating it in Express means the same rule in two codebases) and what happens on a failed/timed-out geocode call.

**Decision:** geocode on submit, synchronously, inline in the `POST`/`PATCH` route handlers (new TypeScript code in `backend/` — not reused from `ingestion/geocode.py`, since Express can't call into the Python ingestion codebase in-process). Accepted as a deliberate, small duplication: the Census geocoder is a free, stable public API with minimal surface area to drift on.

On a failed/timed-out geocode call: don't block the save. Insert/update the row with `location = NULL` — the business still appears in list views and can be worked by a rep, it just has no map pin until resolved. Backfilling those null-`location` rows is handled by the scheduled sweep described in "Ingestion: no scheduled/automatic pipeline runs" below, which reuses the existing Python geocoding code rather than a second TypeScript implementation.

A related but distinct case: if the address is mistyped but still resolves to *some* real location (geocoding APIs generally return a best-guess match rather than requiring an exact one), the row gets saved with a non-null but incorrect `location`. The null-location sweep above doesn't catch this — it only queries `WHERE location IS NULL`. When the registry version is ingested later, `ST_DWithin` compares the wrong saved point against the correct incoming one; if they're far enough apart, the comparison correctly returns false and the registry version still inserts as a new row, producing the same duplicate-business outcome as the null case, just via a different mechanism. Not being treated as a bug to prevent — loosening the proximity match to catch mistyped-but-nearby addresses risks the opposite failure mode this file already commits to avoiding (see the fuzzy-match entry's "prefer false negatives over false positives" principle). Resolution path: the planned Dedup Review Queue UI (Data tab — Duplicates) is the intended place this gets surfaced and resolved by a rep; not yet built.

## Ingestion: no scheduled/automatic pipeline runs

**Where:** `ingestion/main.py` — currently just a DB connection stub (connects, prints the dbname, closes); doesn't invoke `loader.py` at all yet. Confirmed no scheduler anywhere in the repo — no `cron`/`schedule`/`APScheduler` usage, no GitHub Actions workflow, no Render cron job config, no `Procfile`.

**What's happening:** The pipeline only runs when a human manually triggers it. Nothing pulls fresh registry data, or re-checks existing records, on any kind of cadence.

**Downstream effect:** Two concrete costs. First, a manually-created lead's `license_number` (see the fuzzy-match write-back entry above) only has a chance to get backfilled whenever someone happens to rerun the pipeline by hand — there's no reliable guarantee that ever happens. Second, more broadly, state registry changes (new licenses, status changes, name/address updates) only reach the CRM whenever a human remembers to trigger a pull, which doesn't hold up as real usage grows past manual testing.

**Options considered:** A scheduled job — cron, a hosted scheduler (e.g. Render Cron Jobs), GitHub Actions on a schedule — running the pipeline on a regular cadence (e.g. daily).

**Decision:** direction chosen — build this combined with the `source_records` duplicate-row fix above (the ingestion-side change-detection/upsert option specifically, not the read-side `STRING_AGG(DISTINCT ...)` cosmetic fix) as a single piece of work, not two sequential ones. Running an unattended, recurring pull without first landing the duplicate-insert fix would turn a currently-contained, manual-testing-only annoyance into genuine unbounded row growth in production. Cadence and hosting mechanism not yet decided.

Also bundled in: a null-`location` backfill sweep (see "manual leads are never geocoded" above) — re-run geocoding for existing `Business` rows where `location IS NULL`, reusing `resolve_coordinates`/`geocode_address` from `ingestion/normalize.py` and `ingestion/geocode.py` rather than writing new logic. This isn't just convenient to bundle, it's an ordering dependency: `loader.py`'s proximity matching (`ST_DWithin`) can't match a business with no `location`, so a manually-created lead that failed geocoding on submit would also stay unmatched (and its `license_number` unbackfilled) by the registry-pull/matching step until the sweep resolves it. The sweep needs to run before (or as an early step within) each scheduled run, ahead of the registry pull/matching. Ships first as a manual script (`ingestion/backfill_geocode.py`, run on demand); promoted to run automatically once this item's scheduler is built.
