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