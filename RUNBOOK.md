# Runbook

Step-by-step procedures for manual admin/database tasks. Run these in the Neon SQL editor.

**General rules for every procedure:**

1. **`SELECT` before you `DELETE`.** Run the pre-check first and confirm you're touching exactly the rows you expect.
2. **Always wrap multi-step changes in `BEGIN; ... COMMIT;`.** If any step fails, Postgres aborts the whole transaction and nothing is half-done. If something looks wrong before you commit, run `ROLLBACK;` instead.
3. **Replace every `<placeholder>`** — never paste IDs from an old run.

---

## Which tables point at `"Business"`?

Both procedures below must handle **every** table with a foreign key to `"Business".id`. As of this writing that's `activity_log.business_id` and `source_records.business_id`. When you add a new table that references `Business`, update the procedures below.

To check the live database instead of trusting this doc:

```sql
SELECT c.conrelid::regclass AS child_table,
       a.attname            AS fk_column,
       c.confdeltype        AS on_delete   -- 'a' = NO ACTION (block), 'c' = CASCADE, 'n' = SET NULL
FROM pg_constraint c
JOIN pg_attribute a
  ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
WHERE c.contype = 'f'
  AND c.confrelid = '"Business"'::regclass;
```

**Why this matters:** these foreign keys have no `ON DELETE` clause, so they use the default (`NO ACTION`): Postgres **blocks** deleting a business while any child row still points at it. That's deliberate — it forces whoever runs a hard delete to decide what happens to the history instead of losing it silently (see *Soft delete vs. hard delete* below).

---

## 1. Merge a duplicate business

**When to use it:** the same real business exists as two rows (e.g. a rep's manual lead and an ingested registry record that didn't match). You want to keep one (`<real_id>`) and remove the other (`<duplicate_id>`) **without losing any history**.

**Pre-check:**

```sql
-- 1. Confirm both rows exist and really are the same business
SELECT id, name, address, license_number, stage, assigned_rep
FROM "Business"
WHERE id IN (<real_id>, <duplicate_id>);

-- 2. See how much history is attached to the duplicate
SELECT 'activity_log'   AS child_table, COUNT(*) FROM activity_log   WHERE business_id = <duplicate_id>
UNION ALL
SELECT 'source_records' AS child_table, COUNT(*) FROM source_records WHERE business_id = <duplicate_id>;
```

Fields on the duplicate row itself (phone, license number, notes in other columns) are **not** moved by this procedure. If the duplicate has values the real row is missing, copy them onto `<real_id>` first.

**Procedure:**

```sql
BEGIN;

-- Move the duplicate's activity history (calls, notes, stage changes) onto the real business
UPDATE activity_log   SET business_id = <real_id> WHERE business_id = <duplicate_id>;

-- Move the registry evidence too, so future ingestion runs keep linking to the real business
UPDATE source_records SET business_id = <real_id> WHERE business_id = <duplicate_id>;

-- Nothing points at the duplicate anymore, so the foreign keys allow this
DELETE FROM "Business" WHERE id = <duplicate_id>;

COMMIT;
```

**What each step does and why:**

- **`UPDATE activity_log ...`** — reassigns every activity row from the duplicate to the real business. We *move* rather than delete because these are real interactions a rep logged; deleting them would silently lose history.
- **`UPDATE source_records ...`** — reassigns the raw registry records. These are the link between external data and the business; keeping them on the real row means the ingestion pipeline's matching keeps pointing at the right business.
- **`DELETE FROM "Business" ...`** — only works once *every* child row has been moved. If you forget a table, Postgres rejects this line with a foreign key violation, the transaction aborts, and the earlier `UPDATE`s are undone too. That's the safety net working, not a bug: add the missing table's `UPDATE` and run it again.
- **`BEGIN` / `COMMIT`** — makes the three steps all-or-nothing. Without it, a failure on the `DELETE` would leave the history moved but the duplicate still present (a half-merged state).

**Verify afterwards:** re-run pre-check query 2 (both counts should be 0) and check the real business shows the merged activity in the app.

---

## 2. Delete a test business

**When to use it:** a business row created for testing, whose history is junk and doesn't need to be kept.

**Pre-check:**

```sql
SELECT id, name, address, license_number FROM "Business" WHERE id = <test_id>;

SELECT 'activity_log'   AS child_table, COUNT(*) FROM activity_log   WHERE business_id = <test_id>
UNION ALL
SELECT 'source_records' AS child_table, COUNT(*) FROM source_records WHERE business_id = <test_id>;
```

Make sure this is really test data — this procedure is permanent.

**Procedure:**

```sql
BEGIN;

-- Delete the children first: the foreign keys block deleting the parent while they exist
DELETE FROM activity_log   WHERE business_id = <test_id>;
DELETE FROM source_records WHERE business_id = <test_id>;

-- Now nothing references the business, so it can be deleted
DELETE FROM "Business" WHERE id = <test_id>;

COMMIT;
```

**Why this order:** children before parent. Deleting the parent first would be blocked by the foreign keys (`NO ACTION`). We delete the children instead of moving them because test history has no value.

---

## Background: soft delete vs. hard delete

- **Soft delete** (planned, not yet built — `"Business"` has no `deleted_at` column yet): the normal user-facing "delete." It's an `UPDATE ... SET deleted_at = now()`, the row stays and is hidden from the UI, it's reversible, and `ON DELETE` never fires because nothing is actually deleted.
- **Hard delete** (this runbook): a real `DELETE`, permanent, rare, done manually here for test data and duplicate cleanup. There is deliberately no hard-delete button in the app.
