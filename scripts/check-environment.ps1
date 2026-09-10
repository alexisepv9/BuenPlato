$ErrorActionPreference = "Stop"

function Test-Command([string]$Name, [string]$InstallHint) {
    if (Get-Command $Name -ErrorAction SilentlyContinue) {
        Write-Host "[OK] $Name" -ForegroundColor Green
        & $Name --version 2>&1 | Select-Object -First 2
    } else {
        Write-Host "[FALTA] $Name - $InstallHint" -ForegroundColor Yellow
    }
}

Write-Host "Entorno de Buen Plato" -ForegroundColor Cyan
Test-Command "java" "Instalar Java 21"
Test-Command "mvn" "Instalar Maven 3.9 o superior"
Test-Command "node" "Instalar Node.js 22 o superior"
Test-Command "npm" "Se instala junto con Node.js"

if (Get-Command docker -ErrorAction SilentlyContinue) {
    Test-Command "docker" "Instalar Docker Desktop"
} else {
    Write-Host "[OPCIONAL] Docker - H2 permite trabajar sin Docker" -ForegroundColor DarkYellow
}
