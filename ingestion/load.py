from db import get_connection
from sources.oregon_registry import fetch_oregon_licenses, normalize_oregon_record

def insert_source_record(cur, record):
    cur.execute(
        """
        INSERT INTO source_records (business_id, source, source_record_id, raw_name, raw_address, pulled_at)
        VALUES (%s, %s, %s, %s, %s, now())
        RETURNING id
        """, 
        (None, record["source"], record["source_record_id"], record["name"], record["address"]),
    )
    return cur.fetchone()[0]

def find_matching_business(cur, license_number):
    cur.execute(
        'SELECT id FROM "Business" WHERE license_number = %s',
        (license_number,),
    )
    row = cur.fetchone()
    if row is None:
        return None
    return row[0]

def insert_business(cur, record):
    cur.execute(
        """
        INSERT INTO "Business" (name, address, location, category, license_status, license_number)
        VALUES (%s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, %s, %s, %s)
        RETURNING id
        """,
        (
            record["name"],
            record["address"],
            record["lng"],
            record["lat"],
            record["category"],
            record["license_status"],
            record["license_number"],
        )
    )
    return cur.fetchone()[0]

def update_source_record_business_id(cur, source_record_id, business_id):
    cur.execute(
        "UPDATE source_records SET business_id = %s WHERE id = %s",
        (business_id, source_record_id),
    )

def load_record(conn, record):
    with conn.cursor() as cur:
        source_record_pk = insert_source_record(cur, record)

        business_id = find_matching_business(cur, record["license_number"])
        if business_id is None:
            business_id = insert_business(cur, record)

        update_source_record_business_id(cur, source_record_pk, business_id)

    conn.commit()
    return business_id

def main():
    conn = get_connection()
    raw_records = fetch_oregon_licenses()
    total = len(raw_records)
    failures = []

    for i, raw in enumerate(raw_records, start=1):
        try:
            normalized = normalize_oregon_record(raw)
            business_id = load_record(conn, normalized)
            print(f"{i}/{total} loaded {normalized['name']} -> Business id {business_id}")
        except Exception as e:
            print(f"[{i}/{total}] FAILED: {raw.get('business_name')} - {e}")
            failures.append((raw.get("business_name"), str(e)))

    conn.close()

    print(f"\nDone: {total - len(failures)} loaded, {len(failures)} failed")
    for name, error in failures:
        print(f" - {name}: {error}")

if __name__ == "__main__":
        main()