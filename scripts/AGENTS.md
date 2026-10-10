# Scripts

Start and stop the app in Docker. Both build the `my-kanban` image from the repo root and manage a container named `my-kanban` on `http://localhost:8000`.

- `start.sh` / `stop.sh`: Mac and Linux (`./scripts/start.sh`).
- `start.ps1` / `stop.ps1`: Windows. If the PowerShell execution policy blocks scripts, run `powershell -ExecutionPolicy Bypass -File scripts\start.ps1`.

`start` rebuilds the image and replaces any running container. `stop` removes the container; it is a no-op if none is running.
