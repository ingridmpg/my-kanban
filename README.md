# My Kanban

A small project management app: sign up, and get your own Kanban board with five renamable columns and cards you can add, edit and drag between them. Next.js frontend, FastAPI backend, SQLite, all in one Docker container.

Live demo: https://ingrid-kanban.onrender.com (sign in with `user` / `password`)

- It runs on the Render free plan, so the first visit after a while idle takes a little longer while the server wakes up.
- Data is reset on every restart or deploy: accounts created there do not last, and the demo board goes back to its sample cards. The demo account is shared by every visitor.

## Run locally

Requires Docker.

```bash
scripts/start.sh     # Mac / Linux; scripts/start.ps1 on Windows
scripts/stop.sh      # scripts/stop.ps1 on Windows
```

The app runs at http://localhost:8000. Data is kept on the `my-kanban-data` Docker volume.

## Deploy

`render.yaml` is a Render Blueprint. In the Render dashboard, create a Blueprint from this GitHub repo; every push to `main` deploys.
