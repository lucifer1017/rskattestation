# Testing Guide for Attestation Endpoints

## Prerequisites

Before testing, make sure you have:

1. ✅ Backend running (`npm run dev` in the `backend` folder)
2. ✅ `.env` file configured with:
   - `EAS_CONTRACT_ADDRESS`
   - `ATTESTATION_GATE_ADDRESS`
   - `BACKEND_PRIVATE_KEY`
   - `NFT_SCHEMA_UID` (for NFT gating tests)
   - `VAULT_SCHEMA_UID` (for vault gating tests)
3. ✅ A test Ethereum address (you can use any valid address format)

## Quick Test Script

Run the automated test script:

```powershell
cd backend
.\test-endpoints.ps1
```

**Note**: Edit `test-endpoints.ps1` and replace `$testAddress` with your actual test address.

## Manual Testing

### 1. Health Check

**PowerShell:**
```powershell
Invoke-RestMethod -Uri http://localhost:4000/health -Method Get | ConvertTo-Json
```

**Expected Response:**
```json
{
  "status": "ok",
  "network": "development",
  "rskRpcUrl": "configured"
}
```

### 2. Issue NFT Attestation

**PowerShell:**
```powershell
$body = @{
    address = "0xYourTestAddress"
    schemaType = "nft"
    statement = "User is eligible for gated NFT"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:4000/attestations/issue -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json
```

**Replace `0xYourTestAddress` with your actual test address!**

**Expected Response:**
```json
{
  "uid": "0x...",
  "txHashAttest": "...",
  "txHashRegister": "0x..."
}
```

**cURL (if you have it installed):**
```bash
curl -X POST http://localhost:4000/attestations/issue \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0xYourTestAddress",
    "schemaType": "nft",
    "statement": "User is eligible for gated NFT"
  }'
```

### 3. Check NFT Attestation Status

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/attestations/0xYourTestAddress/status?schemaType=nft" -Method Get | ConvertTo-Json
```

**Expected Response:**
```json
{
  "address": "0xYourTestAddress",
  "schemaType": "nft",
  "hasValid": true
}
```

### 4. Issue Vault Attestation

**PowerShell:**
```powershell
$vaultBody = @{
    address = "0xYourTestAddress"
    schemaType = "vault"
    statement = "User is eligible for gated vault"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:4000/attestations/issue -Method Post -Body $vaultBody -ContentType "application/json" | ConvertTo-Json
```

### 5. Check Vault Attestation Status

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/attestations/0xYourTestAddress/status?schemaType=vault" -Method Get | ConvertTo-Json
```

## Common Errors

### "NFT_SCHEMA_UID is not configured"
- **Solution**: Make sure you've registered the NFT schema and set `NFT_SCHEMA_UID` in your `.env` file

### "VAULT_SCHEMA_UID is not configured"
- **Solution**: Make sure you've registered the vault schema and set `VAULT_SCHEMA_UID` in your `.env` file

### "Invalid address"
- **Solution**: Make sure your test address is a valid Ethereum address (0x followed by 40 hex characters)

### Connection refused
- **Solution**: Make sure the backend is running (`npm run dev` in the `backend` folder)

## Understanding the Responses

- **`uid`**: The unique identifier of the attestation on the blockchain
- **`txHashAttest`**: Transaction hash for creating the attestation on EAS/RAS
- **`txHashRegister`**: Transaction hash for registering the attestation in AttestationGate contract
- **`hasValid`**: Boolean indicating if the address has a valid attestation for the specified schema

