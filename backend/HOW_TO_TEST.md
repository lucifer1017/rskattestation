# How to Test the Attestation Endpoints

## Quick Start

Your **test address** (backend wallet): `0x54AEF05D0Ce1Bb16b8Dcbb4329Fce1521374DEA4`

## Step-by-Step Testing Guide

### 1. Open PowerShell

Open PowerShell in your project directory.

### 2. Test Health Endpoint

```powershell
Invoke-RestMethod -Uri http://localhost:4000/health -Method Get | ConvertTo-Json
```

**Expected Result:**
```json
{
  "status": "ok",
  "network": "development",
  "rskRpcUrl": "configured"
}
```

### 3. Issue NFT Attestation

```powershell
# Set your test address
$testAddress = "0x54AEF05D0Ce1Bb16b8Dcbb4329Fce1521374DEA4"

# Create the request body
$body = @{
    address = $testAddress
    schemaType = "nft"
    statement = "User is eligible for gated NFT"
} | ConvertTo-Json

# Send the request
Invoke-RestMethod -Uri http://localhost:4000/attestations/issue -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json
```

**Expected Result:**
```json
{
  "uid": "0x...",
  "txHashAttest": "0x...",
  "txHashRegister": "0x..."
}
```

### 4. Check NFT Attestation Status

```powershell
$testAddress = "0x54AEF05D0Ce1Bb16b8Dcbb4329Fce1521374DEA4"

Invoke-RestMethod -Uri "http://localhost:4000/attestations/$testAddress/status?schemaType=nft" -Method Get | ConvertTo-Json
```

**Expected Result:**
```json
{
  "address": "0x54AEF05D0Ce1Bb16b8Dcbb4329Fce1521374DEA4",
  "schemaType": "nft",
  "hasValid": true
}
```

### 5. Issue Vault Attestation

```powershell
$testAddress = "0x54AEF05D0Ce1Bb16b8Dcbb4329Fce1521374DEA4"

$vaultBody = @{
    address = $testAddress
    schemaType = "vault"
    statement = "User is eligible for gated vault"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:4000/attestations/issue -Method Post -Body $vaultBody -ContentType "application/json" | ConvertTo-Json
```

### 6. Check Vault Attestation Status

```powershell
$testAddress = "0x54AEF05D0Ce1Bb16b8Dcbb4329Fce1521374DEA4"

Invoke-RestMethod -Uri "http://localhost:4000/attestations/$testAddress/status?schemaType=vault" -Method Get | ConvertTo-Json
```

## All-in-One Test Script

Copy and paste this entire block into PowerShell:

```powershell
# Set test address
$testAddress = "0x54AEF05D0Ce1Bb16b8Dcbb4329Fce1521374DEA4"

Write-Host "`n=== 1. Health Check ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri http://localhost:4000/health -Method Get | ConvertTo-Json

Write-Host "`n=== 2. Issue NFT Attestation ===" -ForegroundColor Cyan
$nftBody = @{
    address = $testAddress
    schemaType = "nft"
    statement = "User is eligible for gated NFT"
} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:4000/attestations/issue -Method Post -Body $nftBody -ContentType "application/json" | ConvertTo-Json

Write-Host "`n=== 3. Check NFT Status ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "http://localhost:4000/attestations/$testAddress/status?schemaType=nft" -Method Get | ConvertTo-Json

Write-Host "`n=== 4. Issue Vault Attestation ===" -ForegroundColor Cyan
$vaultBody = @{
    address = $testAddress
    schemaType = "vault"
    statement = "User is eligible for gated vault"
} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:4000/attestations/issue -Method Post -Body $vaultBody -ContentType "application/json" | ConvertTo-Json

Write-Host "`n=== 5. Check Vault Status ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "http://localhost:4000/attestations/$testAddress/status?schemaType=vault" -Method Get | ConvertTo-Json
```

## Understanding the Results

- **`uid`**: The unique identifier of the attestation on the blockchain
- **`txHashAttest`**: Transaction hash for creating the attestation (may show "0x0" if extraction fails, but attestation still works)
- **`txHashRegister`**: Transaction hash for registering the attestation in AttestationGate contract
- **`hasValid: true`**: Means the address has a valid attestation and can access gated features

## Common Issues

### "NFT_SCHEMA_UID is not configured"
- Make sure `NFT_SCHEMA_UID` is set in your `.env` file

### "VAULT_SCHEMA_UID is not configured"
- Make sure `VAULT_SCHEMA_UID` is set in your `.env` file

### Connection refused
- Make sure backend is running: `cd backend; npm run dev`

### Invalid address error
- Make sure your address is 42 characters (0x + 40 hex chars)

## Next Steps

Once all endpoints work:
1. ✅ Your backend is ready!
2. Connect your frontend to these endpoints
3. Deploy `GatedNFTMinter` and `GatedVault` contracts
4. Test the full flow: issue attestation → mint NFT / deposit to vault

