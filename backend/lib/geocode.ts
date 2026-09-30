const CENSUS_GEOCODE_URL = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"

export async function geocodeAddress(address: string) {
    let params = new URLSearchParams({
        "address": address,
        "benchmark": "Public_AR_Current",
        "format": "json"
    })

    try {
        const response = await fetch(`${CENSUS_GEOCODE_URL}?${params}`, {signal: AbortSignal.timeout(5000)})

        if (!response.ok) {
            return null
        }
        const data = await response.json()

        const match = data.result?.addressMatches?.[0]

        if (!match) {
            return null
        }

        const lat = match.coordinates.y
        const lng = match.coordinates.x
        return {lat, lng}

    } catch (err) {
        if (err instanceof Error) {
             if (err.name === "TimeoutError") {
                console.log("time out error", address)
             } else {
                console.error(`Geo coding failed for address ${address} - ${err.name}: ${err}`)
             }
        } else {
            console.error("Something unexpected was thrown while geocoding", address, err)
        }
        return null;
    }
}