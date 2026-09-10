$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    throw "Java no está instalado. Instala Java 21 y vuelve a ejecutar este script."
}
if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) {
    throw "Maven no está instalado. Instala Maven 3.9+ y vuelve a ejecutar este script."
}

Write-Host "Iniciando backend y aplicando migraciones Flyway..." -ForegroundColor Cyan
Set-Location $backend
mvn -U org.springframework.boot:spring-boot-maven-plugin:4.1.0:run
