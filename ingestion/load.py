from db import get_connection
from loader import load_record

from sources.oregon_registry import fetch_oregon_licenses, normalize_oregon_record
from sources.washington_registry import fetch_washington_licenses, normalize_washington_record
from sources.arcgis_registry import fetch_arcgis_places, normalized_arcgis_record


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

    arcgis_places = fetch_arcgis_places(
        min_lat=45.4,
        max_lat=45.6,
        min_lng=-122.8,
        max_lng=-121.5,
    )
    process_records(arcgis_places, normalized_arcgis_record, "ArcGIS", conn, failures)

    conn.close()

    total_records = len(wa_flat_list) +len(oregon_records) +len(arcgis_places)
    print(f"\nDone: {total_records - len(failures)} loaded, {len(failures)} failed")
    for name, error in failures:
        print(f" - {name} : {error}")

if __name__ == "__main__":
        main()