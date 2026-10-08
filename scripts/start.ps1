Set-Location (Join-Path $PSScriptRoot "..")

docker build -t my-trello .
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (docker ps -aq --filter "name=^my-trello$") { docker rm -f my-trello | Out-Null }
docker run -d --name my-trello -p 8000:8000 my-trello | Out-Null
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "My Trello is running at http://localhost:8000"
