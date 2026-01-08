# Exact Commands to Run RIGHT NOW

## What You Need First

1. **Your NFT_SCHEMA_UID** - Get it from `backend/.env` file
2. **Your PRIVATE_KEY** - For deploying contracts (needs to be in `contracts/.env`)

---

## Step 1: Get Your NFT_SCHEMA_UID

Open `backend/.env` file and find this line:
```
NFT_SCHEMA_UID=0x...
```

**Copy the entire value** (should be 66 characters: `0x` + 64 hex characters)

Example: `NFT_SCHEMA_UID=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

---

## Step 2: Set Up Contracts Environment

Create `contracts/.env` file (if it doesn't exist):

```powershell
cd contracts

# Create .env file
@"
PRIVATE_KEY=your_private_key_here
RSK_TESTNET_RPC_URL=https://public-node.testnet.rsk.co
"@ | Out-File -FilePath .env -Encoding utf8
```

**Replace `your_private_key_here` with your actual deployer wallet private key!**

---

## Step 3: Deploy GatedNFTMinter

**Replace `YOUR_NFT_SCHEMA_UID` with the actual value from Step 1!**

```powershell
cd contracts

npx hardhat ignition deploy ignition/modules/GatedNFTMinter.ts --network rskTestnet --parameters '{"GatedNFTMinterModule":{"attestationGateAddress":"0xe022df9f57b611675B6b713307E7563D0c9abC74","requiredSchemaUID":"YOUR_NFT_SCHEMA_UID","maxSupply":"1000","mintPrice":"100000000000000000","name":"Rootstock Attestation NFT","symbol":"RANFT"}}'
```

**Example** (if your NFT_SCHEMA_UID is `0x1234...`):
```powershell
npx hardhat ignition deploy ignition/modules/GatedNFTMinter.ts --network rskTestnet --parameters '{"GatedNFTMinterModule":{"attestationGateAddress":"0xe022df9f57b611675B6b713307E7563D0c9abC74","requiredSchemaUID":"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef","maxSupply":"1000","mintPrice":"100000000000000000","name":"Rootstock Attestation NFT","symbol":"RANFT"}}'
```

---

## Step 4: Save the Deployed Address

After deployment, you'll see:
```
Deployed GatedNFTMinterModule#GatedNFTMinter to: 0x...
```

**Save this address!** It will also be saved in:
```
contracts/ignition/deployments/chain-31/deployed_addresses.json
```

---

## Summary: 3 Commands Total

1. **Get NFT_SCHEMA_UID** from `backend/.env` (manual - just open the file)

2. **Create contracts/.env** (if needed):
   ```powershell
   cd contracts
   # Create .env with PRIVATE_KEY and RSK_TESTNET_RPC_URL
   ```

3. **Deploy**:
   ```powershell
   cd contracts
   npx hardhat ignition deploy ignition/modules/GatedNFTMinter.ts --network rskTestnet --parameters '{"GatedNFTMinterModule":{"attestationGateAddress":"0xe022df9f57b611675B6b713307E7563D0c9abC74","requiredSchemaUID":"YOUR_NFT_SCHEMA_UID","maxSupply":"1000","mintPrice":"100000000000000000","name":"Rootstock Attestation NFT","symbol":"RANFT"}}'
   ```

---

## That's It!

After these 3 steps, you'll have GatedNFTMinter deployed and ready to use!

