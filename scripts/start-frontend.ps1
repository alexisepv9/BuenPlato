$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm no está instalado. Instala Node.js 22+ y vuelve a ejecutar este script."
}

Set-Location $frontend
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias de React..." -ForegroundColor Cyan
    npm install
}

Write-Host "Iniciando React en http://localhost:5173" -ForegroundColor Cyan
npm run dev
