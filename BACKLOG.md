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
