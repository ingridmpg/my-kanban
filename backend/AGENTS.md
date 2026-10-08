# Backend

Python FastAPI app. Runs only inside the Docker container (see the root `Dockerfile`); there is no local Python setup.

## Structure

- `app/main.py`: FastAPI app. API routes live under `/api` (currently `GET /api/health`). The `static/` directory is mounted at `/` last, so it never shadows `/api` routes.
- `static/`: files served at `/`. For now a hello world `index.html` that calls `/api/health`; replaced by the exported Next.js build in Part 3.
- `tests/`: pytest tests using FastAPI's `TestClient`. `pytest.ini` puts the backend root on the Python path.
- `requirements.txt`: all dependencies, including test ones, with pinned versions.

## Commands

From the repo root:

```bash
docker build -t my-trello .
docker run --rm my-trello pytest          # backend tests
```

## Architecture

Follow SOLID principles pragmatically, without over-engineering:

- Single responsibility: keep HTTP routes, business logic and database access in separate modules. Routes stay thin.
- Dependency inversion: inject dependencies (e.g. the database session) with FastAPI `Depends` instead of importing globals, so they can be swapped in tests.
- Only add an abstraction (interface, base class, repository layer) when there is a real second implementation or a concrete testing need. Plain functions and modules are preferred over classes when they suffice.
