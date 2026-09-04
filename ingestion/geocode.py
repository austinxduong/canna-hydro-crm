import requests

CENSUS_GEOCODE_URL = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"

def geocode_address(address):
    params = {
        "address": address,
        "benchmark": "Public_AR_Current",
        "format": "json",
    }
    response = requests.get(CENSUS_GEOCODE_URL, params=params)
    response.raise_for_status()
    data = response.json()
    matches = data["result"]["addressMatches"]

    if not matches:
        return None

    coordinates = matches[0]["coordinates"]
    return (coordinates["y"], coordinates["x"])