import requests
from normalize import resolve_coordinates

OREGON_API_URL = "https://data.oregon.gov/resource/q32u-cmam.json"

def fetch_oregon_licenses():
    params = {
        "$where": "license_type = 'RECREATIONAL RETAILER' AND license_status = 'ACTIVE'"
    }
    response = requests.get(OREGON_API_URL, params=params)
    response.raise_for_status()
    return response.json()

def normalize_oregon_record(raw):
    address = raw.get("physical_address")
    lat, lng = resolve_coordinates(address)

    return {
        "name": raw.get("business_name"),
        "address": address,
        "lat": lat,
        "lng": lng,
        "category": "Dispensaries",
        "license_number": raw.get("license_number"),
        "license_status": "ACTIVE",
        "source": "oregon_olcc",
        "source_record_id": raw.get("license_number")
    }