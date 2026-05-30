$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$port = 5173
$url = "http://127.0.0.1:$port/?v=$(Get-Random)"

$python = Get-Command python -ErrorAction SilentlyContinue
$py = Get-Command py -ErrorAction SilentlyContinue

Write-Host "Shield Orb Trainer local server"
Write-Host "Serving folder: $(Get-Location)"
Write-Host "URL: $url"
Write-Host "Press Ctrl+C in this window to stop the server."
Write-Host ""

Start-Process $url

if ($python) {
    python -m http.server $port --bind 127.0.0.1
} elseif ($py) {
    py -3 -m http.server $port --bind 127.0.0.1
} else {
    Write-Host "Python 3 was not found."
    Write-Host "Install Python 3 or run another local HTTP server in this folder."
    Read-Host "Press Enter to close"
    exit 1
}
