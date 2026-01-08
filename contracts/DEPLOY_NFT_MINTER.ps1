# Deployment script for GatedNFTMinter
# Usage: .\DEPLOY_NFT_MINTER.ps1

Write-Host "`n=== Deploying GatedNFTMinter ===" -ForegroundColor Cyan

# Read parameters from JSON file
$paramsFile = "deploy-params.json"
if (-not (Test-Path $paramsFile)) {
    Write-Host "❌ Error: $paramsFile not found!" -ForegroundColor Red
    Write-Host "Please create $paramsFile with deployment parameters." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found parameters file: $paramsFile" -ForegroundColor Green

# Read and compress JSON
$paramsJson = Get-Content $paramsFile -Raw | ConvertFrom-Json | ConvertTo-Json -Depth 10 -Compress

Write-Host "`nDeploying to rskTestnet..." -ForegroundColor Yellow
Write-Host "Parameters:" -ForegroundColor Gray
Write-Host $paramsJson -ForegroundColor DarkGray

# Deploy using the JSON file approach
npx hardhat ignition deploy ignition/modules/GatedNFTMinter.ts `
  --network rskTestnet `
  --parameters $paramsJson

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Cyan

