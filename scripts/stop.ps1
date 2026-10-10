if (docker ps -aq --filter "name=^my-kanban$") { docker rm -f my-kanban | Out-Null }

Write-Output "My Kanban stopped"
