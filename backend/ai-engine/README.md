# Verdant AI Engine

FastAPI-based Agent & AI Engine for Verdant Foundry.

## Setup

```bash
# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Unix

# Install dependencies
pip install -e .
```

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
