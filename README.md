# Nociva

### Folder Structure
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

