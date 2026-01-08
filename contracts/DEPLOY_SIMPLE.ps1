# Simple deployment script - just run this!
Write-Host "`n=== Deploying GatedNFTMinter ===" -ForegroundColor Cyan

# Use here-string to avoid PowerShell JSON parsing issues
$params = @'
{"GatedNFTMinterModule":{"attestationGateAddress":"0xe022df9f57b611675B6b713307E7563D0c9abC74","requiredSchemaUID":"0xf58b8b212ef75ee8cd7e8d803c37c03e0519890502d5e99ee2412aae1456cafe","maxSupply":"1000","mintPrice":"100000000000000000","name":"Rootstock Attestation NFT","symbol":"RANFT"}}
'@

Write-Host "Deploying to rskTestnet..." -ForegroundColor Yellow
npx hardhat ignition deploy ignition/modules/GatedNFTMinter.ts --network rskTestnet --parameters $params

