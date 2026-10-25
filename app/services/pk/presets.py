"""Built-in SYNTHETIC demonstration compounds. Fictional names and invented parameters only."""

from __future__ import annotations

from typing import Any, Dict, List

DESCRIPTION = "Synthetic demonstration compound; not a real drug and not real parameters."

PRESETS: List[Dict[str, Any]] = [
    {
        "id": "synthetic-x",
        "description": DESCRIPTION,
        "request": {
            "compoundName": "Synthetic Compound X",
            "route": "oral",
            "doseMg": 100,
            "bioavailability": 0.8,
            "volumeL": 50,
            "clearanceLPerH": 10,
            "absorptionRatePerH": 1.2,
            "durationHours": 24,
            "comparison": {"clearanceMultiplier": 0.7, "label": "Hypothetical: clearance reduced to 70%"},
            "monteCarlo": {"enabled": False},
        },
    },
    {
        "id": "synthetic-y",
        "description": DESCRIPTION,
        "request": {
            "compoundName": "Synthetic Compound Y",
            "route": "oral",
            "doseMg": 250,
            "bioavailability": 0.6,
            "volumeL": 120,
            "clearanceLPerH": 18,
            "absorptionRatePerH": 0.8,
            "durationHours": 48,
            "comparison": {"clearanceMultiplier": 1.5, "label": "Hypothetical: clearance increased by 50%"},
            "monteCarlo": {"enabled": False},
        },
    },
    {
        "id": "synthetic-z",
        "description": DESCRIPTION,
        "request": {
            "compoundName": "Synthetic Compound Z",
            "route": "oral",
            "doseMg": 50,
            "bioavailability": 0.95,
            "volumeL": 25,
            "clearanceLPerH": 4,
            "absorptionRatePerH": 2.0,
            "durationHours": 72,
            "comparison": {"alteredClearanceLPerH": 2.0, "label": "Hypothetical: clearance of 2 L/h"},
            "monteCarlo": {"enabled": False},
        },
    },
]

BASE_KEYS = ("compoundName", "route", "doseMg", "bioavailability", "volumeL", "clearanceLPerH", "absorptionRatePerH")


def matches_preset(request_alias_dict: Dict[str, Any]) -> bool:
    """True if the base parameters equal a built-in synthetic preset."""
    return any(all(request_alias_dict.get(k) == p["request"][k] for k in BASE_KEYS) for p in PRESETS)
