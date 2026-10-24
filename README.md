# Nociva (still under development)

## Folder Structure
```
Nociva/
│
├── app/
│   ├── api/                      # Endpoints
│   │   ├── __init__.py
│   │   ├── v1/
│   │       ├── __init__.py
│   │       ├── api.py            # route aggregator
│   │       └── endpoints/
│   │           ├── evaluate.py   # Main evaluation endpoint
│   │           └── drugs.py      # Drug/gene search endpoints
│
│   ├── core/                     # config & settings
│   │   ├── __init__.py
│   │   ├── config.py             # Pydantic settings 
│   │   └── database.py           # Supabase client
│
│   ├── models/                   # Pydantic Models (req and res schemas)
│   │   ├── __init__.py
│   │   └── evaluation.py         # input and output JSON contracts
│
│   ├── repositories/             # Data Access Layer (Repository layer)
│   │   ├── __init__.py
│   │   ├── relation_repo.py      # Queries 'relationships' table
│   │   └── guideline_repo.py     # Queries 'guideline_rules' table
│
│   ├── services/                 # business logic (deterministic engine)
│   │   ├── __init__.py
│   │   └── engine.py             # Set-intersection & bottleneck calculation
│
│   └── main.py                   # fastapi app entry point
│
├── tests/                        # unit testing
│   └── test_engine.py
│
├── .env                          # env vars
├── requirements.txt              # dependencies
└── README.md
```

## API Endpoints, Request & Response Structures

### 1. Endpoint 1: POST /api/v1/evaluate (The Core Engine)
- Purpose: Takes patient genotypes and a drug cocktail, runs the deterministic engine, and returns collisions and clinical guidelines.

Request Body Schema (Sample):
```
{
  "patient_id": "PT_99812",
  "patient_genotypes": {
    "CYP2D6": "Poor Metabolizer",
    "CYP2C9": "Normal Metabolizer"
  },
  "drug_cocktail": ["Codeine", "Citalopram"]
}
```
Response Body Schema (Sample):
```
{
  "evaluation_status": "CRITICAL_COLLISION",
  "input_drugs": ["Codeine", "Citalopram"],
  "detected_bottlenecks": [
    {
      "enzyme": "CYP2D6",
      "competing_drugs": ["Codeine", "Citalopram"],
      "patient_phenotype": "Poor Metabolizer",
      "risk_level": "CRITICAL",
      "mechanism": "Enzyme CYP2D6 is congested by 2 concurrent substrates while patient genetic capacity is 'Poor Metabolizer'."
    }
  ],
  "clinical_guidelines": [
    {
      "guideline_id": "PA166104931",
      "source": "CPIC",
      "recommendation_summary": "Avoid co-administration. Switch Codeine to an alternative analgesic not metabolized by CYP2D6."
    }
  ]
}
```
 ### 2. Endpoint 2: GET /api/v1/drugs/search

- Purpose: Allows frontend search bars to query available drugs and genes instantly.
- Query Parameters: ?q=code

Response Structure:
```
{
  "matches": ["Codeine", "Citalopram", "Clozapine"]
}
```

