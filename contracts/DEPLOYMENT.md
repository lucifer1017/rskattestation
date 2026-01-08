# Deployment Guide

## Overview

This guide covers deploying the Rootstock Attestation Module contracts to Rootstock Testnet and Mainnet.

## Prerequisites

1. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Fill in your `DEPLOYER_PRIVATE_KEY`
   - Set RPC URLs (or use defaults)

2. **RBTC Balance**
   - Ensure your deployer account has sufficient RBTC for gas fees
   - Testnet: Get free RBTC from [Rootstock Faucet](https://faucet.rsk.co/)

3. **Schema Registration**
   - Register schemas on Schema Registry via backend (before deploying GatedNFTMinter/GatedVault)
   - Get schema UIDs after registration

## Network Configuration

### Rootstock Testnet
- **Chain ID**: 31
- **RPC URL**: `https://public-node.testnet.rsk.co`
- **EAS Contract**: `0xc300aeEaDd60999933468738c9F5D7e9C0671e1c`
- **Schema Registry**: `0x679c62956cD2801AbAbF80e9D430f18859Eea2d5`
- **Explorer**: https://rootstock-testnet.blockscout.com

### Rootstock Mainnet
- **Chain ID**: 30
- **RPC URL**: `https://public-node.rsk.co`
- **EAS Contract**: `0x54C0726E9d2D57Bc37AD52c7E219A3229e0eE963`
- **Schema Registry**: `0xeF29675d82CC5967069d6d9C17F2719f67728F5B`
- **Explorer**: https://rootstock.blockscout.com

## Deployment Order

### Step 1: Deploy AttestationGate

```bash
# Testnet
npx hardhat ignition deploy ignition/modules/AttestationGate.ts \
  --network rootstockTestnet \
  --parameters '{"AttestationGateModule":{"easAddress":"0xc300aeEaDd60999933468738c9F5D7e9C0671e1c"}}'

# Mainnet
npx hardhat ignition deploy ignition/modules/AttestationGate.ts \
  --network rootstockMainnet \
  --parameters '{"AttestationGateModule":{"easAddress":"0x54C0726E9d2D57Bc37AD52c7E219A3229e0eE963"}}'
```

**Save the deployed AttestationGate address** - you'll need it for next steps.

### Step 2: Register Schemas (Backend)

Before deploying GatedNFTMinter/GatedVault, register schemas on Schema Registry:

```typescript
// Example schemas to register:
// 1. KYC: "bool isKYCVerified,string kycProvider,uint256 verifiedAt"
// 2. Age Verification: "bool isOver18,uint256 dateOfBirth,string statement"
// 3. Document Ownership: "string documentType,bytes32 documentHash,string statement"
```

**Save the schema UIDs** after registration.

### Step 3: Deploy GatedNFTMinter

```bash
# Replace <ATTESTATION_GATE_ADDRESS> and <SCHEMA_UID> with actual values
npx hardhat ignition deploy ignition/modules/GatedNFTMinter.ts \
  --network rootstockTestnet \
  --parameters '{
    "GatedNFTMinterModule": {
      "attestationGateAddress": "<ATTESTATION_GATE_ADDRESS>",
      "requiredSchemaUID": "<SCHEMA_UID>",
      "maxSupply": "1000",
      "mintPrice": "100000000000000000",
      "name": "Rootstock Attestation NFT",
      "symbol": "RANFT"
    }
  }'
```

### Step 4: Deploy GatedVault (Optional)

```bash
# Replace <ATTESTATION_GATE_ADDRESS>, <TOKEN_ADDRESS>, and <SCHEMA_UID>
npx hardhat ignition deploy ignition/modules/GatedVault.ts \
  --network rootstockTestnet \
  --parameters '{
    "GatedVaultModule": {
      "attestationGateAddress": "<ATTESTATION_GATE_ADDRESS>",
      "tokenAddress": "<TOKEN_ADDRESS>",
      "requiredSchemaUID": "<SCHEMA_UID>"
    }
  }'
```

## Complete Deployment (All at Once)

Alternatively, deploy all contracts in one go:

```bash
npx hardhat ignition deploy ignition/modules/CompleteDeployment.ts \
  --network rootstockTestnet \
  --parameters '{
    "CompleteDeploymentModule": {
      "easAddress": "0xc300aeEaDd60999933468738c9F5D7e9C0671e1c",
      "nftSchemaUID": "<SCHEMA_UID>",
      "vaultSchemaUID": "<SCHEMA_UID>",
      "tokenAddress": "<TOKEN_ADDRESS>"
    }
  }'
```

**Note**: Set `tokenAddress` to `"0x" + "0".repeat(64)` to skip vault deployment.

## Helper Scripts

### Check Deployment Status

```bash
# Set environment variables first
export ATTESTATION_GATE_ADDRESS=<address>
export NFT_MINTER_ADDRESS=<address>
export VAULT_ADDRESS=<address>

# Check status
npx hardhat run scripts/check-deployment.ts --network rootstockTestnet
```

### Get Deployment Instructions

```bash
npx hardhat run scripts/deploy.ts --network rootstockTestnet
```

### Get Verification Instructions

```bash
npx hardhat run scripts/verify.ts --network rootstockTestnet
```

## Contract Verification

### Using Hardhat Verify Plugin

```bash
# Verify AttestationGate
npx hardhat verify --network rootstockTestnet \
  <CONTRACT_ADDRESS> \
  <EAS_ADDRESS>

# Verify GatedNFTMinter
npx hardhat verify --network rootstockTestnet \
  <CONTRACT_ADDRESS> \
  <ATTESTATION_GATE_ADDRESS> \
  <SCHEMA_UID> \
  1000 \
  100000000000000000 \
  "Rootstock Attestation NFT" \
  "RANFT"

# Verify GatedVault
npx hardhat verify --network rootstockTestnet \
  <CONTRACT_ADDRESS> \
  <ATTESTATION_GATE_ADDRESS> \
  <TOKEN_ADDRESS> \
  <SCHEMA_UID>
```

### Manual Verification on Blockscout

1. Go to [Rootstock Blockscout](https://rootstock-testnet.blockscout.com) (testnet) or [Mainnet](https://rootstock.blockscout.com)
2. Navigate to your contract address
3. Click "Verify and Publish"
4. Select "Via Standard JSON Input"
5. Upload contract artifacts
6. Set compiler version: `0.8.28`
7. Set optimization: `Enabled`, `200 runs`
8. Enter constructor arguments

## Post-Deployment

1. **Update Environment Variables**
   - Save deployed contract addresses
   - Update backend configuration
   - Update frontend configuration

2. **Register AttestationGate in Backend**
   - Backend needs AttestationGate address to register attestations

3. **Test Contracts**
   - Issue test attestations
   - Test token-gated access
   - Verify all functionality

## Troubleshooting

### Common Issues

1. **Insufficient RBTC**
   - Get testnet RBTC from faucet
   - Check balance: `npx hardhat run scripts/check-deployment.ts`

2. **Invalid Schema UID**
   - Ensure schemas are registered before deployment
   - Verify schema UID format (64 hex characters)

3. **Contract Verification Fails**
   - Check compiler settings match deployment
   - Verify constructor arguments are correct
   - Try manual verification on Blockscout

4. **Network Connection Issues**
   - Check RPC URL is correct
   - Try alternative RPC endpoints
   - Verify network name in hardhat.config.ts

## Security Notes

- **Never commit `.env` file** with real private keys
- **Use testnet first** before mainnet deployment
- **Verify contracts** on Blockscout for transparency
- **Keep deployment addresses** secure and documented
- **Test thoroughly** before mainnet deployment

## Support

For issues or questions:
- Check [Rootstock Documentation](https://dev.rootstock.io/)
- Review [RAS Documentation](https://dev.rootstock.io/dev-tools/attestations/ras/)
- Check contract source code and tests

