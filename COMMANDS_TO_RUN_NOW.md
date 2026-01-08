# Commands to Run RIGHT NOW

## Step 1: Get Your NFT Schema UID

You need to get the `NFT_SCHEMA_UID` from your backend `.env` file.

**Option A: Check your backend/.env file**
```bash
# Open backend/.env and find the line:
# NFT_SCHEMA_UID=0x...
```

**Option B: Use PowerShell to get it**
```powershell
cd backend
Get-Content .env | Select-String "NFT_SCHEMA_UID"
```

Copy the value (it should look like: `0x1234567890abcdef...` - 66 characters total)

---

## Step 2: Check Your Contracts Environment

Make sure you have these in your `contracts/.env` file (or set as environment variables):

- `PRIVATE_KEY` - Your deployer wallet private key
- `RSK_TESTNET_RPC_URL` - Should be `https://public-node.testnet.rsk.co`

**Check if you have contracts/.env:**
```powershell
cd contracts
Test-Path .env
```

If you don't have a `.env` file in contracts, create one:
```powershell
cd contracts
@"
PRIVATE_KEY=your_private_key_here
RSK_TESTNET_RPC_URL=https://public-node.testnet.rsk.co
"@ | Out-File -FilePath .env -Encoding utf8
```

---

## Step 3: Deploy GatedNFTMinter

**Replace `YOUR_NFT_SCHEMA_UID` with the actual value from Step 1!**

```powershell
cd contracts

npx hardhat ignition deploy ignition/modules/GatedNFTMinter.ts `
  --network rskTestnet `
  --parameters '{"GatedNFTMinterModule":{"attestationGateAddress":"0xe022df9f57b611675B6b713307E7563D0c9abC74","requiredSchemaUID":"YOUR_NFT_SCHEMA_UID","maxSupply":"1000","mintPrice":"100000000000000000","name":"Rootstock Attestation NFT","symbol":"RANFT"}}'
```

**Or if you prefer bash/command prompt:**
```bash
cd contracts

npx hardhat ignition deploy ignition/modules/GatedNFTMinter.ts \
  --network rskTestnet \
  --parameters '{"GatedNFTMinterModule":{"attestationGateAddress":"0xe022df9f57b611675B6b713307E7563D0c9abC74","requiredSchemaUID":"YOUR_NFT_SCHEMA_UID","maxSupply":"1000","mintPrice":"100000000000000000","name":"Rootstock Attestation NFT","symbol":"RANFT"}}'
```

---

## Step 4: Save the Deployed Address

After deployment completes, you'll see output like:
```
Deployed GatedNFTMinterModule#GatedNFTMinter to: 0x...
```

**Save this address!** You'll need it for:
- Frontend integration
- Testing
- Future reference

The address will also be saved in:
```
contracts/ignition/deployments/chain-31/deployed_addresses.json
```

---

## That's It!

After Step 3, you'll have:
- ✅ GatedNFTMinter deployed
- ✅ Ready for frontend integration
- ✅ Ready for end-to-end testing

---

## Quick Copy-Paste (After Getting NFT_SCHEMA_UID)

```powershell
# 1. Navigate to contracts
cd contracts

# 2. Deploy (replace YOUR_NFT_SCHEMA_UID with actual value)
npx hardhat ignition deploy ignition/modules/GatedNFTMinter.ts --network rskTestnet --parameters '{"GatedNFTMinterModule":{"attestationGateAddress":"0xe022df9f57b611675B6b713307E7563D0c9abC74","requiredSchemaUID":"YOUR_NFT_SCHEMA_UID","maxSupply":"1000","mintPrice":"100000000000000000","name":"Rootstock Attestation NFT","symbol":"RANFT"}}'
```

---

## Troubleshooting

**Error: "PRIVATE_KEY not found"**
- Make sure you have `PRIVATE_KEY` in `contracts/.env`

**Error: "RSK_TESTNET_RPC_URL not found"**
- Make sure you have `RSK_TESTNET_RPC_URL` in `contracts/.env`

**Error: "Insufficient funds"**
- Your deployer wallet needs RBTC for gas fees
- Get testnet RBTC from: https://faucet.rsk.co/

**Error: "Invalid schema UID"**
- Make sure your NFT_SCHEMA_UID is exactly 66 characters (0x + 64 hex chars)
- Copy it exactly from your backend/.env file

