# Nociva (still under development)

## Running the application

### 1. Create virtual python environment
- macOS/Linux
```
python3 -m venv venv
source venv/bin/activate
```

- windows(cmd)
```
python -m venv venv
venv\Scripts\activate.bat
```
- windows(powershell)
```
python -m venv venv
venv\Scripts\Activate.ps1
```
### 2. Install dependencies
```
pip install --upgrade pip 
pip install -r requirements.txt
```
### 3. Configure the virtual environments (.env)

```
SUPABASE_URL=XXX
SUPABASE_KEY=XXX
```

### 4. Run using uvicorn
```
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
---

## Folder Structure
```
Nociva
├── README.md
├── app
│   ├── api
│   │   └── v1
│   │       ├── api.py
│   │       └── endpoints
│   │           ├── evaluate.py
│   │           └── search.py
│   ├── core
│   │   ├── config.py
│   │   └── database.py
│   ├── main.py
│   ├── models
│   │   └── evaluation.py
│   ├── repositories
│   │   ├── guideline_repo.py
│   │   ├── relation_repo.py
│   │   └── variant_repo.py
│   └── services
│       └── engine.py
└── requirements.txt

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

---

## Frontend and Stream 1

- `frontend/` is the React + Vite UI (`npm install && npm run dev` inside it).
- Stream 1 (Molecular Intelligence Engine) lives in this app layout:
  router `app/api/v1/endpoints/molecular.py`, services `app/services/molecular/`,
  schemas `app/models/molecular.py`, ML scripts `ml/`, tests `tests/`.
  Its endpoints are `POST /api/molecular/analyze` and `GET /api/molecular/model-info`.
- Model artifacts are gitignored under `models/molecular/`. Generate them with
  `./scripts/setup.sh` (or `python ml/train_cyp2d6_model.py` then
  `python ml/build_reference_index.py`).
- `./scripts/dev.sh` runs uvicorn (`app.main:app`) and Vite together.
- Run the Stream 1 tests with `pytest tests/` (they do not need Supabase).
- See `INTEGRATION.md` for details.
