# Test script for attestation endpoints
# Usage: .\test-endpoints.ps1

$baseUrl = "http://localhost:4000"
$testAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"  # Replace with your test address

Write-Host "`n=== Testing Health Endpoint ===" -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Health check passed!" -ForegroundColor Green
    $health | ConvertTo-Json
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Testing Issue Attestation (NFT) ===" -ForegroundColor Cyan
$issueBody = @{
    address = $testAddress
    schemaType = "nft"
    statement = "User is eligible for gated NFT"
} | ConvertTo-Json

try {
    $issueResponse = Invoke-RestMethod -Uri "$baseUrl/attestations/issue" -Method Post -Body $issueBody -ContentType "application/json"
    Write-Host "✅ Attestation issued successfully!" -ForegroundColor Green
    $issueResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Failed to issue attestation: $_" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Error details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Testing Check Status (NFT) ===" -ForegroundColor Cyan
try {
    $statusResponse = Invoke-RestMethod -Uri "$baseUrl/attestations/$testAddress/status?schemaType=nft" -Method Get
    Write-Host "✅ Status check successful!" -ForegroundColor Green
    $statusResponse | ConvertTo-Json
} catch {
    Write-Host "❌ Failed to check status: $_" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Error details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Testing Issue Attestation (Vault) ===" -ForegroundColor Cyan
$vaultBody = @{
    address = $testAddress
    schemaType = "vault"
    statement = "User is eligible for gated vault"
} | ConvertTo-Json

try {
    $vaultResponse = Invoke-RestMethod -Uri "$baseUrl/attestations/issue" -Method Post -Body $vaultBody -ContentType "application/json"
    Write-Host "✅ Vault attestation issued successfully!" -ForegroundColor Green
    $vaultResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Failed to issue vault attestation: $_" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Error details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Testing Check Status (Vault) ===" -ForegroundColor Cyan
try {
    $vaultStatusResponse = Invoke-RestMethod -Uri "$baseUrl/attestations/$testAddress/status?schemaType=vault" -Method Get
    Write-Host "✅ Vault status check successful!" -ForegroundColor Green
    $vaultStatusResponse | ConvertTo-Json
} catch {
    Write-Host "❌ Failed to check vault status: $_" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Error details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Tests Complete ===" -ForegroundColor Cyan

