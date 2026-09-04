from geocode import geocode_address

REDACTED_ADDRESS = "Exempt from Public Disclosure"

def resolve_coordinates(address):
    if address == REDACTED_ADDRESS:
        return(None, None)

    coordinates = geocode_address(address)

    if coordinates is None:
        return(None, None)

    return coordinates