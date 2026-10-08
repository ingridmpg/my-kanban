if (docker ps -aq --filter "name=^my-trello$") { docker rm -f my-trello | Out-Null }

Write-Output "My Trello stopped"
