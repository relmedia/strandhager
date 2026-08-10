"""Caches the surveyed position of every parcel from Kartverket's address register.

Each plot has its own address, Strandhagane 1 to 47, and Felleshuset is number
50. Run this when the register changes; build-plan-map.py reads the cache so it
does not need the network.

Run from the repository root:  python scripts/fetch-addresses.py
"""

import json
import urllib.request
from pathlib import Path

URL = (
    "https://ws.geonorge.no/adresser/v1/sok"
    "?sok=Strandhagane&kommunenummer=1124&treffPerSide=200"
)

OUT = Path("scripts/strandhagane-addresses.json")

with urllib.request.urlopen(URL) as response:
    payload = json.load(response)

points = {}
for address in payload["adresser"]:
    if address["adressenavn"] != "Strandhagane":
        continue
    point = address["representasjonspunkt"]
    points[address["nummer"]] = [
        round(point["lat"], 7),
        round(point["lon"], 7),
    ]

missing = sorted(set(range(1, 48)) - set(points))
if missing:
    raise SystemExit(f"no address for plot {missing}")

OUT.write_text(json.dumps({str(k): v for k, v in sorted(points.items())}, indent=2))
print(f"wrote {OUT} with {len(points)} addresses")
