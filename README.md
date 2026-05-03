# Bihar Rozgar Monorepo Layout

This repository is now organized into separate application folders:

```text
backend/   FastAPI backend
frontend/  Next.js frontend
```

## Run the apps

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e .[dev]
uvicorn app.main:app --reload
```
