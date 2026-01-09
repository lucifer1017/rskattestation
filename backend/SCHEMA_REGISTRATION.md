# Schema Registration Guide

## Overview

Before you can issue attestations, you need to register the schemas with the EAS Schema Registry on Rootstock. This script will register two schemas:
1. **NFT Gating Schema** - For token-gated NFT minting
2. **Vault Gating Schema** - For token-gated vault access

## Prerequisites

1. ✅ Backend is running (`npm run dev`)
2. ✅ Health endpoint works (`GET http://localhost:4000/health`)
3. ✅ `.env` file is configured with:
   - `BACKEND_PRIVATE_KEY` (with funds for gas)
   - `RSK_RPC_URL` (testnet or mainnet)
   - `EAS_CONTRACT_ADDRESS`
   - `ATTESTATION_GATE_ADDRESS`

## Step 1: Register Schemas

Run the schema registration script:

```bash
npm run register-schemas
```

This will:
- Connect to the EAS Schema Registry on Rootstock
- Register both schemas (if not already registered)
- Output the schema UIDs that you need to add to your `.env` file

## Step 2: Update .env File

After running the script, you'll see output like:

```
NFT_SCHEMA_UID=0x...
VAULT_SCHEMA_UID=0x...
```

Add these to your `.env` file:

```env
NFT_SCHEMA_UID=0x...
VAULT_SCHEMA_UID=0x...
```

## Step 3: Restart Backend

After updating `.env`, restart your backend:

```bash
# Stop the current process (Ctrl+C)
npm run dev
```

## Step 4: Test Attestation Endpoints

### Test Issue Attestation

```bash
POST http://localhost:4000/attestations/issue
Content-Type: application/json

{
  "address": "0xYourTestAddress",
  "schemaType": "nft",
  "statement": "User is eligible for gated NFT"
}
```

### Test Attestation Status

```bash
GET http://localhost:4000/attestations/0xYourTestAddress/status?schemaType=nft
```

## Troubleshooting

### "Schema already registered"
- This is fine! The script will output the existing schema UID
- Just add it to your `.env` file

### "Insufficient funds"
- Make sure your `BACKEND_PRIVATE_KEY` wallet has enough RBTC for gas
- Testnet: Get free RBTC from a faucet

### "NFT_SCHEMA_UID is not configured"
- Make sure you added the schema UIDs to your `.env` file
- Restart the backend after updating `.env`

## Next Steps

After schemas are registered and `.env` is updated:

1. ✅ Test attestation issuance
2. ✅ Test attestation status checking
3. ✅ Integrate with frontend
4. ✅ Test token-gated contracts (GatedNFTMinter, GatedVault)




