# Docker Build and Push Script for Blood Pressure Monitor
# Builds multi-architecture images for linux/amd64 and linux/arm64 (Raspberry Pi)

param(
    [string]$Tag = "latest",
    [switch]$PushOnly,
    [switch]$NoPush
)

$ErrorActionPreference = "Stop"

$ImageName = "vkku/blood-pressure-monitor"
$FullTag = "${ImageName}:${Tag}"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Blood Pressure Monitor Docker Build" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Image: $FullTag" -ForegroundColor Yellow
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "Error: Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if logged into Docker Hub
$loginCheck = docker info 2>$null | Select-String "Username"
if (-not $loginCheck) {
    Write-Host "Not logged into Docker Hub. Logging in..." -ForegroundColor Yellow
    docker login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker login failed" -ForegroundColor Red
        exit 1
    }
}

# Create/use buildx builder for multi-arch builds
$builderName = "bp-multiarch"
$existingBuilder = docker buildx ls | Select-String $builderName
if (-not $existingBuilder) {
    Write-Host "Creating multi-architecture builder..." -ForegroundColor Yellow
    docker buildx create --name $builderName --driver docker-container --bootstrap
}
docker buildx use $builderName

if (-not $PushOnly) {
    Write-Host ""
    Write-Host "Building multi-architecture image..." -ForegroundColor Yellow
    Write-Host "Platforms: linux/amd64, linux/arm64" -ForegroundColor Gray
    Write-Host ""

    # Build and push in one command (buildx requires --push for multi-arch)
    if ($NoPush) {
        # Local build only (single platform)
        Write-Host "Building for local platform only (no push)..." -ForegroundColor Yellow
        docker buildx build --load -t $FullTag .
    } else {
        # Multi-arch build and push
        docker buildx build `
            --platform linux/amd64,linux/arm64 `
            -t $FullTag `
            -t "${ImageName}:$(Get-Date -Format 'yyyyMMdd')" `
            --push `
            .
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "Build Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Image pushed: $FullTag" -ForegroundColor Yellow
Write-Host ""
Write-Host "To run on Raspberry Pi:" -ForegroundColor Cyan
Write-Host "  docker pull $FullTag" -ForegroundColor White
Write-Host "  docker-compose up -d" -ForegroundColor White
Write-Host ""
Write-Host "Or run directly:" -ForegroundColor Cyan
Write-Host "  docker run -d -p 8082:8082 -v bp-data:/app/database $FullTag" -ForegroundColor White
