# Backlog

Running list of known issues / improvements to revisit later. Not urgent — parked deliberately, come back once MVP is further along.

## Ingestion: source_records duplicates on every pull (no change detection)

**Where:** `ingestion/loader.py` — `insert_source_record()`

**What's happening:** Every time the ingestion pipeline runs against a business, it does a bare `INSERT INTO source_records`, with no check for whether a matching row (same `business_id` + `source` + `source_record_id`) already exists. If the pulled data hasn't changed at all, it still writes a brand new row with a fresh `pulled_at` timestamp. Confirmed via business id 12 ("Canna Bros.") having 6 identical `source_records` rows from repeated manual test runs (Sept 5-7).

**Downstream effect:** `GET /businesses/:id` in `backend/app.ts` aggregates `source_records.source` with `STRING_AGG`, so the `sources` field in the API response shows the same source name repeated once per duplicate row (e.g. `"oregon_olcc, oregon_olcc, oregon_olcc, ..."`).

**Options considered:**
1. **Read-side fix only:** change the aggregation to `STRING_AGG(DISTINCT source_records.source, ', ')`. Keeps every pull as its own row (true audit trail of every check), just de-dupes for display. Simple, no ingestion changes.
2. **Ingestion-side fix (change detection / upsert):** before inserting, look up the most recent `source_records` row for that `business_id` + `source` + `source_record_id`. If the incoming pull is identical (same `raw_name`/`raw_address`), just update that row's `pulled_at` ("last confirmed") instead of inserting a new row. Only insert a new row when something actually changed. Gives a *meaningful* history (license status changes, name/address changes over time) instead of noise, at the cost of reworking `load_record`'s flow (source record insert currently happens before the business match is even resolved).

**Decision:** parked for now — pipeline is still fully manual (no cron/scheduler wired up anywhere yet), so there's no unbounded growth happening in the background. Revisit before adding any kind of automatic/scheduled ingestion run — that's the point duplicate rows would start accumulating unattended instead of just during manual testing.

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

**Where:** `backend/app.ts` — `POST /businesses` (inserts only `name`, `address`, `category`)

**What's happening:** Manually created leads are saved with `location = NULL` (and no `license_number`). Proximity matching in `loader.py` (`ST_DWithin`) needs a `location` on the existing row, so it can never match a manual lead. When the registry version of that business is ingested later, it misses both the license match and the proximity match and gets inserted as a new row.

**Downstream effect:** Duplicate business — one row with the rep's notes/activity history, one with the official registry data.

**Options considered:** geocode the address server-side in `POST /businesses` and store `location` before insert (rep just types an address; optionally add address autocomplete / map-pin confirmation in the UI for accuracy). Open questions:
- Where the geocoding logic lives — `ingestion/geocode.py` is Python; duplicating it in Express means the same rule in two codebases (drift risk).
- What happens if the geocoding API fails or times out: block the save, or save with `location = NULL` and backfill later (background job — see system design Week 9).

**Decision:** geocode on submit. Implementation details above not yet decided.
