Set-Location (Join-Path $PSScriptRoot "..")

docker build -t my-kanban .
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (docker ps -aq --filter "name=^my-kanban$") { docker rm -f my-kanban | Out-Null }
docker run -d --name my-kanban -p 8000:8000 -v my-kanban-data:/app/data my-kanban | Out-Null
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "My Kanban is running at http://localhost:8000"
