import requests
from normalize import resolve_coordinates
import io
import pandas as pd

WASHINGTON_EXCEL_URL= "https://lcb.wa.gov/sites/default/files/2026-09/CannabisApplicants09012026_0.xlsx"

def fetch_washington_licenses():
    response = requests.get(WASHINGTON_EXCEL_URL)
    response.raise_for_status()

    sheets_dict = pd.read_excel(io.BytesIO(response.content), sheet_name=[0,1], dtype=str)

    all_sheets_record = {}


    for sheet_idx, raw_df in sheets_dict.items():
        df = raw_df.copy()
        df.columns = df.columns.str.strip()


        status_col = next((c for c in df.columns if "status" in c.lower()), None)

        if status_col:
            df = df[df[status_col].fillna("").str.upper().str.contains("ACTIVE")]

        all_sheets_record[sheet_idx] = df.to_dict(orient="records")

    return all_sheets_record


def normalize_washington_record(raw):
    street = (raw.get("Street Address") or raw.get("Location Address"))
    if street:
        street = street.strip()

    city = raw.get("City")
    if city:
        city = city.strip()
        
    state = (raw.get("State") or raw.get("St")).strip()

    zipcode = (raw.get("Zip Code") or raw.get("Zip")).strip()

    address_parts = [part for part in [street, city, state, zipcode] if part]
    full_address = ", ".join(address_parts)

    lat, lng = resolve_coordinates(full_address) if full_address else (None, None)


    return {
        "name": raw.get("Tradename").strip(),
        "address": full_address,
        "lat": lat,
        "lng": lng,
        "category": "Dispensaries",
        "license_number": raw.get("License") or raw.get("License #"),
        "license_status": "ACTIVE",
        "source": "WLCB",
        "source_record_id": raw.get("License") or raw.get("License #")

    }

if __name__ == "__main__":
    print("Fetching Washington licenses...")
    sheets_data = fetch_washington_licenses()

    for sheet_idx, records in sheets_data.items():
        sheet_num = sheet_idx + 1
        print(f"\n==================== SHEET {sheet_num} ({len(records)} active records) ====================")
        print(f"Normalizing first 3 examples from sheet {sheet_num}:")
        for raw in records[:3]:
            normalized = normalize_washington_record(raw)
            print(normalized)


