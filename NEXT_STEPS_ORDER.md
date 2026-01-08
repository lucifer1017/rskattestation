# Next Steps - Execution Order

## Recommended Order of Operations

### ✅ **STEP 1: Deploy Contracts** (Do this FIRST)
**Why first?** Frontend needs contract addresses to interact with them.

#### 1.1 Deploy GatedNFTMinter
**What you need:**
- ✅ AttestationGate address: `0xe022df9f57b611675B6b713307E7563D0c9abC74` (already deployed)
- ✅ NFT_SCHEMA_UID (already in your .env)
- ⚙️ Decide: maxSupply, mintPrice, name, symbol

**Command:**
```bash
cd contracts
npx hardhat ignition deploy ignition/modules/GatedNFTMinter.ts \
  --network rskTestnet \
  --parameters '{
    "GatedNFTMinterModule": {
      "attestationGateAddress": "0xe022df9f57b611675B6b713307E7563D0c9abC74",
      "requiredSchemaUID": "<YOUR_NFT_SCHEMA_UID>",
      "maxSupply": "1000",
      "mintPrice": "100000000000000000",
      "name": "Rootstock Attestation NFT",
      "symbol": "RANFT"
    }
  }'
```

**Note:** Replace `<YOUR_NFT_SCHEMA_UID>` with the actual value from your backend `.env` file (NFT_SCHEMA_UID).

**Save the deployed address** - you'll need it for frontend!

#### 1.2 Deploy GatedVault (Optional)
**What you need:**
- ✅ AttestationGate address (already have)
- ✅ VAULT_SCHEMA_UID (already in your .env)
- ⚠️ **Need**: ERC20 token address (if you want vault functionality)

**Command:**
```bash
cd contracts
npx hardhat ignition deploy ignition/modules/GatedVault.ts \
  --network rskTestnet \
  --parameters '{
    "GatedVaultModule": {
      "attestationGateAddress": "0xe022df9f57b611675B6b713307E7563D0c9abC74",
      "tokenAddress": "<YOUR_ERC20_TOKEN_ADDRESS>",
      "requiredSchemaUID": "<YOUR_VAULT_SCHEMA_UID>"
    }
  }'
```

**Note:** Replace `<YOUR_VAULT_SCHEMA_UID>` with the actual value from your backend `.env` file (VAULT_SCHEMA_UID).

**Save the deployed address** if you deploy it.

---

### ✅ **STEP 2: Frontend Integration** (Do this SECOND)
**Why second?** You need contract addresses from Step 1 to connect frontend.

#### 2.1 Create Frontend Config
Create a config file with all addresses:

```typescript
// frontend/src/config/contracts.ts (example)
export const CONFIG = {
  // Backend API
  BACKEND_URL: "http://localhost:4000",
  
  // Contract Addresses
  ATTESTATION_GATE_ADDRESS: "0xe022df9f57b611675B6b713307E7563D0c9abC74",
  NFT_MINTER_ADDRESS: "<DEPLOYED_NFT_MINTER_ADDRESS>",
  VAULT_ADDRESS: "<DEPLOYED_VAULT_ADDRESS>", // if deployed
  
  // Schema UIDs (from backend .env)
  NFT_SCHEMA_UID: "<YOUR_NFT_SCHEMA_UID>",
  VAULT_SCHEMA_UID: "<YOUR_VAULT_SCHEMA_UID>",
  
  // Network
  CHAIN_ID: 31, // Rootstock Testnet
  RPC_URL: "https://public-node.testnet.rsk.co"
};
```

#### 2.2 Connect to Backend Endpoints
Create API service functions:

```typescript
// frontend/src/services/attestationApi.ts (example)
const API_BASE = "http://localhost:4000";

export async function issueAttestation(address: string, schemaType: "nft" | "vault") {
  const response = await fetch(`${API_BASE}/attestations/issue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address,
      schemaType,
      statement: `User is eligible for gated ${schemaType}`
    })
  });
  return response.json();
}

export async function checkAttestationStatus(address: string, schemaType: "nft" | "vault") {
  const response = await fetch(
    `${API_BASE}/attestations/${address}/status?schemaType=${schemaType}`
  );
  return response.json();
}
```

#### 2.3 Connect to Smart Contracts
Create contract interaction functions:

```typescript
// frontend/src/services/contracts.ts (example)
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONFIG } from "./config/contracts";

// Connect to contracts using viem or ethers
// Implement mint() for GatedNFTMinter
// Implement deposit()/withdraw() for GatedVault
```

---

### ✅ **STEP 3: End-to-End Testing** (Do this LAST)
**Why last?** You need everything from Steps 1 & 2 working.

#### 3.1 Test Full NFT Flow
1. **Issue NFT attestation** via frontend → calls backend API
2. **Check status** → verify `hasValid: true`
3. **Mint NFT** → call `GatedNFTMinter.mint()` from frontend
4. **Verify** → NFT should be minted successfully

#### 3.2 Test Full Vault Flow (if deployed)
1. **Issue vault attestation** via frontend → calls backend API
2. **Check status** → verify `hasValid: true`
3. **Approve tokens** → approve ERC20 for vault
4. **Deposit** → call `GatedVault.deposit()` from frontend
5. **Withdraw** → call `GatedVault.withdraw()` from frontend
6. **Verify** → tokens should be deposited/withdrawn

#### 3.3 Test Edge Cases
- Try minting without attestation (should fail)
- Try minting with expired attestation (should fail)
- Try minting twice (should fail if hasMinted check works)

---

## Quick Reference: What You Already Have

✅ **Backend:**
- Health endpoint working
- Issue attestation endpoint working
- Check status endpoint working
- NFT_SCHEMA_UID configured
- VAULT_SCHEMA_UID configured

✅ **Contracts:**
- AttestationGate deployed: `0xe022df9f57b611675B6b713307E7563D0c9abC74`

⏳ **Still Need:**
- GatedNFTMinter deployed (Step 1.1)
- GatedVault deployed (Step 1.2 - optional)
- Frontend integration (Step 2)
- End-to-end testing (Step 3)

---

## Alternative: Test Contracts First (Without Frontend)

If you want to test contracts directly before frontend integration:

1. Deploy contracts (Step 1)
2. Use Hardhat console or scripts to test:
   - Issue attestation via backend API
   - Call `mint()` directly on GatedNFTMinter
   - Verify it works
3. Then do frontend integration (Step 2)

This lets you verify contracts work before building the frontend!

