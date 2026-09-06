from db import get_connection
from sources.oregon_registry import fetch_oregon_licenses, normalize_oregon_record
from sources.washington_registry import fetch_washington_licenses, normalize_washington_record

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

def find_matching_business_by_proximity(cur, name, lng, lat, threshold=0.4, max_distance_meters=50):
    cur.execute(
        """
        SELECT id, similarity(name, %(search_name)s) AS score
        FROM "Business"
        WHERE ST_DWithin(
            location,
            ST_SetSRID(ST_MakePoint(%(lng)s, %(lat)s), 4326)::geography,
            %(max_dist)s
        )
        AND similarity(name, %(search_name)s) >= %(threshold)s
        ORDER BY score DESC
        LIMIT 1
        """,
        {
            "search_name": name,
            "lng": lng,
            "lat": lat,
            "max_dist": max_distance_meters,
            "threshold": threshold
        }
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

        if business_id is None and record.get("lng") is not None and record.get("lat") is not None:
            business_id = find_matching_business_by_proximity(
                cur,
                name=record["name"],
                lng=record["lng"],
                lat=record["lat"]
            )

        if business_id is None:
            business_id = insert_business(cur, record)

        update_source_record_business_id(cur, source_record_pk, business_id)

    conn.commit()
    return business_id


# def test_normalization():
#     washington_sheets = fetch_washington_licenses()
#     oregon_sheets = fetch_oregon_licenses()

#     wa_flat_list = [row for sheet in washington_sheets.values() for row in sheet]

#     def inspect_samples(records, normalize_fn, source_name, limit=3):
#         sample = records[:limit]
#         print(f"\n============= TEST: {source_name} (First {len(sample)} Rows) ==============")

#         for i, raw in enumerate(sample, start=1):
#             try:
#                 normalized = normalize_fn(raw)
#                 print(f"--- {source_name} Row #{i} Normalized Output ----")
#                 print(normalized)
#             except Exception as e:
#                 print(f"FAILED to NORMALIZE: {e}")

#     inspect_samples(wa_flat_list, normalize_washington_record, "Washington", limit=3)
#     inspect_samples(oregon_sheets, normalize_oregon_record, "Oregon", limit=3)


# if __name__ == "__main__":
#     test_normalization()

def process_records(records, normalize_fn, source_name, conn, failures):
    total = len(records)
    print(f"\n --- Processing {total} records from {source_name} ---")

    for i, raw in enumerate(records, start=1):
        try:
            normalized = normalize_fn(raw)
            business_id = load_record(conn, normalized)
            print(f"[{i}/{total}] loaded {normalized['name']} -> Business ID {business_id}")
        except Exception as e:
            conn.rollback()

            if isinstance(raw, dict):
                raw_name = raw.get("Tradename") or raw.get("business_name") or raw.get("name") or "Unknown Record"
            else:
                raw_name = "Unknown Record"
            print(f"{i}/{total} FAILED: {raw_name} - {e}")
            failures.append((raw_name, f"[{source_name}] {e}"))

def main():
    conn = get_connection()
    failures = []

    washington_sheets = fetch_washington_licenses()
    oregon_records = fetch_oregon_licenses()

    wa_flat_list = [row for sheet in washington_sheets.values() for row in sheet]

    process_records(wa_flat_list, normalize_washington_record, "Washington", conn, failures)
    process_records(oregon_records, normalize_oregon_record, "Oregon", conn, failures)

    conn.close()


    total_records = len(wa_flat_list) +len(oregon_records)
    print(f"\nDone: {total_records - len(failures)} loaded, {len(failures)} failed")
    for name, error in failures:
        print(f" - {name} : {error}")

if __name__ == "__main__":
        main()