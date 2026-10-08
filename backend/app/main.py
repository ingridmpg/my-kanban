from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

app = FastAPI(title="My Trello")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


# Mounted last so it does not shadow the /api routes.
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
