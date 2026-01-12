# Smart Contracts - Rootstock Attestation Module

Smart contracts for token-gated access using Rootstock Attestation Service (RAS).

## Overview

This directory contains three main contracts:
- **AttestationGate**: Registry mapping user addresses to RAS attestation UIDs
- **GatedNFTMinter**: ERC721 NFT contract requiring valid attestation to mint
- **GatedVault**: DeFi vault requiring valid attestation to deposit/withdraw tokens

## Prerequisites

- Node.js 18+ and npm
- Hardhat 3+
- Rootstock Testnet wallet with tRBTC for gas fees
- Schema UIDs (register schemas via backend first)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the `contracts/` directory:

```env
# Deployer Wallet
PRIVATE_KEY=your_64_character_hex_private_key_here

# Rootstock Network
RSK_TESTNET_RPC_URL=https://public-node.testnet.rsk.co
RSK_MAINNET_RPC_URL=https://public-node.rsk.co
```

### 3. Deploy Contracts

**Deployment Order:**
1. Deploy AttestationGate (required for others)
2. Deploy GatedNFTMinter (requires AttestationGate + Schema UID)
3. Deploy GatedVault (optional, requires AttestationGate + Token + Schema UID)

## Deployment Instructions

### Step 1: Deploy AttestationGate

**What it does:** Registry contract that maps user addresses to attestation UIDs and validates RAS attestations.

```bash
npx hardhat ignition deploy ignition/modules/AttestationGate.ts \
  --network rskTestnet \
  --parameters '{"AttestationGateModule":{"easAddress":"0xc300aeEaDd60999933468738c9F5D7e9C0671e1c"}}'
```

**Parameters:**
- `easAddress`: RAS contract address
  - Testnet: `0xc300aeEaDd60999933468738c9F5D7e9C0671e1c`
  - Mainnet: `0x54C0726E9d2D57Bc37AD52c7E219A3229e0eE963`

**Save the deployed address** - you'll need it for the next steps!

### Step 2: Register Schemas (Backend)

Before deploying GatedNFTMinter, you need Schema UIDs. Register schemas using the backend:

```bash
cd ../backend
npm run register-schemas
```

This outputs Schema UIDs like:
```
NFT_SCHEMA_UID=0xf58b8b212ef75ee8cd7e8d803c37c03e0519890502d5e99ee2412aae1456cafe
VAULT_SCHEMA_UID=0xf58b8b212ef75ee8cd7e8d803c37c03e0519890502d5e99ee2412aae1456cafe
```

### Step 3: Deploy GatedNFTMinter

**What it does:** ERC721 NFT contract that requires users to have a valid attestation before minting. Each address can mint once.

```bash
npx hardhat ignition deploy ignition/modules/GatedNFTMinter.ts \
  --network rskTestnet \
  --parameters '{"GatedNFTMinterModule":{"attestationGateAddress":"0xe022df9f57b611675B6b713307E7563D0c9abC74","requiredSchemaUID":"YOUR_NFT_SCHEMA_UID","maxSupply":"1000","mintPrice":"100000000000000","name":"Rootstock Attestation NFT","symbol":"RANFT"}}'
```

**Parameters:**
- `attestationGateAddress`: Deployed AttestationGate address (from Step 1)
- `requiredSchemaUID`: NFT Schema UID (from backend registration)
- `maxSupply`: Maximum NFTs that can be minted (e.g., `1000`)
- `mintPrice`: Mint price in wei (e.g., `100000000000000` = 0.0001 tRBTC)
- `name`: NFT collection name
- `symbol`: NFT collection symbol

**Example:**
```bash
npx hardhat ignition deploy ignition/modules/GatedNFTMinter.ts \
  --network rskTestnet \
  --parameters '{"GatedNFTMinterModule":{"attestationGateAddress":"0xe022df9f57b611675B6b713307E7563D0c9abC74","requiredSchemaUID":"0xf58b8b212ef75ee8cd7e8d803c37c03e0519890502d5e99ee2412aae1456cafe","maxSupply":"1000","mintPrice":"100000000000000","name":"Rootstock Attestation NFT","symbol":"RANFT"}}'
```

### Step 4: Deploy GatedVault (Optional)

**What it does:** ERC20 token vault that requires valid attestation to deposit/withdraw. Users can only withdraw if they still have a valid attestation.

```bash
npx hardhat ignition deploy ignition/modules/GatedVault.ts \
  --network rskTestnet \
  --parameters '{"GatedVaultModule":{"attestationGateAddress":"0xe022df9f57b611675B6b713307E7563D0c9abC74","tokenAddress":"YOUR_ERC20_TOKEN_ADDRESS","requiredSchemaUID":"YOUR_VAULT_SCHEMA_UID"}}'
```

**Parameters:**
- `attestationGateAddress`: Deployed AttestationGate address
- `tokenAddress`: ERC20 token contract address to accept
- `requiredSchemaUID`: Vault Schema UID (from backend registration)

## Contract Details

### AttestationGate

**Purpose:** Central registry for managing user attestations.

**Key Functions:**
- `registerAttestation(user, attestationUID, schemaUID)`: Register an attestation for a user
- `hasValidAttestation(user)`: Check if user has any valid attestation
- `hasValidAttestationOfSchema(user, schemaUID)`: Check if user has valid attestation for specific schema
- `getUserAttestationUID(user)`: Get user's attestation UID
- `removeAttestation(user)`: Remove user's attestation (owner only)

**How it works:**
- Backend calls `registerAttestation` after issuing attestation via RAS
- Contracts query `hasValidAttestationOfSchema` to gate access
- Validates attestations by checking with RAS contract on-chain

### GatedNFTMinter

**Purpose:** ERC721 NFT collection with attestation-gated minting.

**Key Functions:**
- `mint()`: Mint an NFT (requires valid attestation + payment)
- `setMintPrice(newPrice)`: Update mint price (owner only)
- `setRequiredSchema(newSchemaUID)`: Update required schema (owner only)
- `withdraw()`: Withdraw collected funds (owner only)

**Features:**
- One mint per address
- Supply limit enforcement
- Price-based minting
- Attestation validation before mint

**Minting Flow:**
1. User requests attestation via backend
2. Backend issues attestation and registers on AttestationGate
3. User calls `mint()` with required payment
4. Contract checks `hasValidAttestationOfSchema` via AttestationGate
5. If valid, NFT is minted to user

### GatedVault

**Purpose:** Token vault with attestation-gated access.

**Key Functions:**
- `deposit(amount)`: Deposit tokens (requires valid attestation)
- `withdraw(amount)`: Withdraw tokens (requires valid attestation)
- `emergencyWithdraw(user)`: Admin can withdraw for users who lost attestation
- `setRequiredSchema(newSchemaUID)`: Update required schema (owner only)

**Features:**
- Attestation required for both deposit and withdraw
- Users can only withdraw if they still have valid attestation
- Emergency withdrawal for users who lost attestation
- Tracks total deposits and per-user balances

## Scripts

### Check Deployment Status

```bash
npx hardhat run scripts/check-deployment.ts --network rskTestnet
```

Checks if contracts are deployed and verifies their state. Set environment variables:
- `ATTESTATION_GATE_ADDRESS`
- `NFT_MINTER_ADDRESS`
- `VAULT_ADDRESS`

### Update Mint Price

```bash
npx hardhat run scripts/update-mint-price.ts --network rskTestnet
```

Updates the mint price for GatedNFTMinter. Edit the script to change the price (default: 0.0001 tRBTC).

**Requirements:**
- Must be contract owner
- Set `NFT_MINTER_ADDRESS` in `.env` or edit script

### Verify Contracts

```bash
npx hardhat run scripts/verify.ts --network rskTestnet
```

Shows instructions for verifying contracts on Blockscout explorer.

### Deployment Helper

```bash
npx hardhat run scripts/deploy.ts --network rskTestnet
```

Displays deployment commands with proper formatting.

## Testing

Run all tests:

```bash
npx hardhat test
```

Run specific test file:

```bash
npx hardhat test test/AttestationGate.test.ts
npx hardhat test test/GatedNFTMinter.test.ts
npx hardhat test test/GatedVault.test.ts
```

**Test Coverage:**
- AttestationGate: Registration, validation, removal
- GatedNFTMinter: Minting, attestation checks, supply limits
- GatedVault: Deposits, withdrawals, attestation validation

## Network Configuration

### Rootstock Testnet

- **Chain ID:** 31
- **RPC:** `https://public-node.testnet.rsk.co`
- **Explorer:** `https://explorer.testnet.rootstock.io`
- **RAS (EAS):** `0xc300aeEaDd60999933468738c9F5D7e9C0671e1c`
- **Schema Registry:** `0x679c62956cd2801ababf80e9d430f18859eea2d5`

### Rootstock Mainnet

- **Chain ID:** 30
- **RPC:** `https://public-node.rsk.co`
- **Explorer:** `https://explorer.rsk.co`
- **RAS (EAS):** `0x54C0726E9d2D57Bc37AD52c7E219A3229e0eE963`
- **Schema Registry:** `0xef29675d82cc5967069d6d9c17f2719f67728f5b`

## Deployed Contracts (Testnet)

**Current Deployments (Chain 31):**
- AttestationGate: `0xe022df9f57b611675B6b713307E7563D0c9abC74`
- GatedNFTMinter: `0x5e515B34A39c00Ba5C6203606CBc12bFf11fe010`

**Deployment Info:**
- Addresses saved in: `ignition/deployments/chain-31/deployed_addresses.json`
- Artifacts: `ignition/deployments/chain-31/artifacts/`

## Project Structure

```
contracts/
├── contracts/
│   ├── gates/
│   │   ├── AttestationGate.sol      # Main registry contract
│   │   ├── GatedNFTMinter.sol       # NFT gating contract
│   │   └── GatedVault.sol           # Vault gating contract
│   ├── interfaces/
│   │   └── IEAS.sol                 # RAS/EAS interface
│   ├── libraries/
│   │   └── RASConstants.sol         # Network constants
│   └── mocks/
│       ├── MockEAS.sol              # Mock for testing
│       └── MockERC20.sol            # Mock token for testing
├── ignition/
│   ├── modules/                     # Deployment modules
│   │   ├── AttestationGate.ts
│   │   ├── GatedNFTMinter.ts
│   │   ├── GatedVault.ts
│   │   └── CompleteDeployment.ts
│   └── deployments/                 # Deployment artifacts
├── scripts/                         # Utility scripts
│   ├── check-deployment.ts
│   ├── deploy.ts
│   ├── update-mint-price.ts
│   └── verify.ts
├── test/                            # Test files
│   ├── AttestationGate.test.ts
│   ├── GatedNFTMinter.test.ts
│   └── GatedVault.test.ts
└── hardhat.config.ts               # Hardhat configuration
```

## How It Works

### Deployment Flow

```
1. Deploy AttestationGate
   └─→ Needs: EAS contract address
   
2. Register Schemas (via backend)
   └─→ Generates: Schema UIDs
   
3. Deploy GatedNFTMinter
   └─→ Needs: AttestationGate address + Schema UID
   
4. Deploy GatedVault (optional)
   └─→ Needs: AttestationGate address + Token address + Schema UID
```

### User Flow

```
User → Backend API → Issue Attestation (RAS)
                    ↓
              Register on AttestationGate
                    ↓
User → Frontend → Check Status → Valid ✓
                    ↓
User → Frontend → Mint NFT / Access Vault
                    ↓
Contract → AttestationGate → Validate Attestation
                    ↓
              Access Granted ✓
```

## Troubleshooting

### "Insufficient funds"
- Ensure deployer wallet has tRBTC for gas fees
- Get testnet RBTC from: https://faucet.rsk.co/

### "Invalid schema UID"
- Schema UID must be exactly 66 characters (0x + 64 hex)
- Register schemas first using backend script
- Copy UID exactly from backend output

### "Contract already deployed"
- Check `ignition/deployments/chain-31/deployed_addresses.json`
- Use existing addresses or deploy to different network

### Deployment Fails
- Verify RPC URL is accessible
- Check private key is correct in `.env`
- Ensure network name matches (`rskTestnet` or `rskMainnet`)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PRIVATE_KEY` | Yes | Deployer wallet private key (64 hex chars) |
| `RSK_TESTNET_RPC_URL` | Yes* | Rootstock Testnet RPC endpoint |
| `RSK_MAINNET_RPC_URL` | Yes* | Rootstock Mainnet RPC endpoint |
| `NFT_MINTER_ADDRESS` | No | For update-mint-price script |
| `ATTESTATION_GATE_ADDRESS` | No | For check-deployment script |
| `VAULT_ADDRESS` | No | For check-deployment script |

*Required based on which network you're deploying to

## Compilation

Compile contracts:

```bash
npx hardhat compile
```

Compiled artifacts are saved in `artifacts/` directory.

## Security Considerations

- **Ownership:** All contracts are Ownable - owner can update settings
- **Reentrancy:** GatedNFTMinter and GatedVault use ReentrancyGuard
- **Validation:** All attestations are validated on-chain via RAS
- **Access Control:** Only users with valid attestations can access gated features
