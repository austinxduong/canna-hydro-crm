import math
import requests
import os
from dotenv import load_dotenv
from loader import load_record
from db import get_connection

load_dotenv()

def generate_tile_centers(min_lat: float, max_lat: float, min_lng: float, max_lng: float) -> list[tuple[float, float]]:
    centers : list[tuple[float, float]] = []

    radius_km : int = 10
    center_spacing_km : float = radius_km * math.sqrt(2)
    latitude : float = min_lat
    lat_step : float = center_spacing_km / 111 # figure out latitude spacing
    

    while latitude <= max_lat:
        lng_step : float = center_spacing_km / (111 * math.cos(math.radians(latitude))) # figure out longitude spacing

        longitude : float = min_lng # generate longitude values

        while longitude <= max_lng:
            centers.append((latitude, longitude)) # combine them into (lat, lng) pairs and append 

            longitude += lng_step

        latitude += lat_step

    return centers

def search_arcgis(lat: float, lng: float, search_term: str) -> dict:
    url: str = "https://places-api.arcgis.com/arcgis/rest/services/places-service/v1/places/near-point"

    api_key: str | None = os.getenv("ARCGIS_API_KEY")

    params: dict = {
        "x": lng,
        "y": lat,
        "radius": 10000,
        "searchText": search_term,
        "pageSize": 20,
        "token": api_key
    }

    response: requests.Response = requests.get(url, params=params)

    response.raise_for_status()

    data = response.json()

    return data

def search_tile(lat: float, lng: float) -> list[dict]:
    results_by_id: dict[str, dict] = {}


    response: dict = search_arcgis(
        lat=lat,
        lng=lng,
        search_term= "hydroponic"
    )

    for place in response.get("results", []):

        place_id: str = place["placeId"]
        results_by_id[place_id] = place

    return list(results_by_id.values())

def filter_places(places: list[dict]) -> list[dict]:
    filtered_places: list[dict] = []

    for place in places:
        name: str = place["name"].lower()

        if "hydro" in name:
            filtered_places.append(place)

    return filtered_places

def get_place_details(place_id: str) -> dict:
    url = f"https://places-api.arcgis.com/arcgis/rest/services/places-service/v1/places/{place_id}"

    api_key = os.getenv("ARCGIS_API_KEY")

    params = {
        "requestedFields": "name,address:streetAddress,address:locality,address:region,address:postcode",
        "token": api_key
    }

    response = requests.get(url, params=params)
    response.raise_for_status()

    return response.json() 

def enrich_places(places: list[dict]) -> list[dict]:

    enriched_places: list = []

    for place in places:
        place_id: str = place["placeId"]

        details: dict = get_place_details(place_id)

        place["address"] = details["placeDetails"]["address"]

        enriched_places.append(place)

    return enriched_places

def normalized_arcgis_record(record: dict) -> dict:

    normalized: dict = {
        "name": record["name"],
        "address": record["address"]["streetAddress"],
        "lng": record["location"]["x"],
        "lat": record["location"]["y"],
        "zip_code": record["address"]["postcode"],
        "category": "Hydroponics",
        "stage": "New",
        "license_number": None,
        "license_status": None,
        "source": "arcgis",
        "source_record_id": record["placeId"]
    }
    return normalized


def fetch_arcgis_places(
    min_lat: float,
    max_lat: float,
    min_lng: float,
    max_lng: float,
) -> list[dict]:
    
    centers: list[tuple[float, float]] = generate_tile_centers(
        min_lat,
        max_lat,
        min_lng,
        max_lng
    )

    all_places: list[dict] = []

    for lat, lng in centers:
        try:
            places: list[dict] = search_tile(
                lat=lat,
                lng=lng,
            )

            filtered_places: list[dict] = filter_places(places)

            enriched_places: list[dict] = enrich_places(filtered_places)

            all_places.extend(enriched_places)

        except Exception as e:

            print(f"Failed tile ({lat}, {lng}): {e}")

            continue

    return all_places

def test_arcgis_database():

    conn = get_connection()

    places = search_tile(
        lat=45.5152,
        lng=-122.6784
    )

    filtered_places = filter_places(places)

    enriched_places = enrich_places(filtered_places)

    place = enriched_places[0]

    normalized = normalized_arcgis_record(place)

    business_id = load_record(conn, normalized)

    print("Loaded ArcGIS record -> Business ID:", business_id)

    conn.close()

if __name__ == "__main__":
    pass
    # results = search_arcgis(
    #     lat=45.5152,
    #     lng=-122.6784,
    #     search_term="hydroponic"
    # )

    # print(results)

    # centers = generate_tile_centers(
    #     min_lat=45.0,
    #     max_lat=45.3,
    #     min_lng=-122.0,
    #     max_lng=-121.7
    # )

    # places = search_tile(
    #     lat=45.5152,
    #     lng=-122.6784,
    # )

    # filtered_places = filter_places(places)

    # print("Before filtering:", len(places))
    # print("After fitering:", len(filtered_places))

    # for place in filtered_places:
    #     print(
    #         place["name"],
    #         "|",
    #         place["placeId"],
    #         "|",
    #         place["location"]
    #         )

    # enriched_places = enrich_places(filtered_places)

    # for place in enriched_places:
    #     print(place)

    #     normalized = normalized_arcgis_record(place)
        
    #     print("NORMALIZE", normalized)
    #     print("Normalized type is:", type(normalized))

    # test_arcgis_database()

    # def check_business(business_id: int):

    #     conn = get_connection()

    #     with conn.cursor() as cur:
    #         cur.execute(
    #             'SELECT id, name, address, license_number FROM "Business" WHERE id = %s',
    #             (business_id,)
    #         )

    #         business = cur.fetchone()

    #     conn.close()

    #     print("BUSINESS:", business)

    # check_business(1232)

    # def check_source_record(business_id: int):

    #     conn = get_connection()

    #     with conn.cursor() as cur:
    #         cur.execute(
    #             """
    #             SELECT id, business_id, source, source_record_id, raw_name, raw_address
    #             FROM source_records
    #             WHERE business_id = %s
    #             """,
    #             (business_id,)
    #         )

    #         records = cur.fetchall()

    #     conn.close()

    #     for record in records:
    #         print("SOURCE RECORD:", record)
    # check_source_record(1232)

    # fetch_arcgis_places(
    #     min_lat=45.4,
    #     max_lat=45.6,
    #     min_lng=-122.8,
    #     max_lng=-121.5,
    #     conn=get_connection()
    #