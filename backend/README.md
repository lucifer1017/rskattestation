# Backend - Rootstock Attestation Service

Backend service for issuing and managing attestations on Rootstock using RAS (Rootstock Attestation Service).

## Overview

This backend service provides REST API endpoints to:
- Issue attestations via RAS (EAS SDK)
- Register attestations on the AttestationGate contract
- Check attestation validity for users
- Support NFT gating and Vault access schemas

## Prerequisites

- Node.js 18+ and npm
- Rootstock Testnet wallet with tRBTC for gas fees
- Deployed AttestationGate contract address

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=4000

# Rootstock Network
RSK_RPC_URL=https://public-node.testnet.rsk.co

# RAS (Rootstock Attestation Service) Contract
EAS_CONTRACT_ADDRESS=0xc300aeEaDd60999933468738c9F5D7e9C0671e1c

# AttestationGate Contract (deployed)
ATTESTATION_GATE_ADDRESS=0xe022df9f57b611675B6b713307E7563D0c9abC74

# Backend Wallet (for signing transactions)
PRIVATE_KEY=your_64_character_hex_private_key_here

# Schema UIDs (register first - see below)
NFT_SCHEMA_UID=0x...
VAULT_SCHEMA_UID=0x...
```

### 3. Register Schemas

Before using the backend, you need to register your attestation schemas on-chain to get Schema UIDs.

**Run the schema registration script:**

```bash
npm run register-schemas
```

This script will:
- Register NFT Gating Schema (`string statement`)
- Register Vault Gating Schema (`string statement`)
- Output the Schema UIDs to add to your `.env` file

**Example output:**
```
🎉 SUMMARY - Add these to your .env file:

NFT_SCHEMA_UID=0xf58b8b212ef75ee8cd7e8d803c37c03e0519890502d5e99ee2412aae1456cafe
VAULT_SCHEMA_UID=0xf58b8b212ef75ee8cd7e8d803c37c03e0519890502d5e99ee2412aae1456cafe
```

**Note:** Both schemas use the same definition (`string statement`), so they may have the same UID if registered with the same resolver and revocable settings.

### 4. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

The server will start on `http://localhost:4000` (or your configured PORT).

## API Endpoints

### Health Check

```http
GET /health
```

Returns server status and configuration check.

**Response:**
```json
{
  "status": "ok",
  "network": "development",
  "rskRpcUrl": "configured"
}
```

### Issue Attestation

```http
POST /attestations/issue
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "schemaType": "nft",
  "statement": "User is eligible for gated NFT" // optional
}
```

**Parameters:**
- `address` (required): Ethereum address to issue attestation for
- `schemaType` (required): `"nft"` or `"vault"`
- `statement` (optional): Custom statement string

**Response:**
```json
{
  "uid": "0xc1bdfb617604e86416e99f47803878c8ed7d0606e6b9d20d182afd8633aecc38",
  "txHashAttest": "0xfe82109a60f52d5fd16c2ff1aedc62a16853134d7ebdc42a990874cff4c9bfd2",
  "txHashRegister": "0x..."
}
```

**What happens:**
1. Issues attestation via RAS (EAS SDK)
2. Waits for transaction confirmation
3. Registers attestation on AttestationGate contract
4. Returns both transaction hashes and attestation UID

### Check Attestation Status

```http
GET /attestations/:address/status?schemaType=nft
```

**Parameters:**
- `address` (path): User's Ethereum address
- `schemaType` (query, optional): `"nft"` or `"vault"` (default: `"nft"`)

**Response:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "schemaType": "nft",
  "hasValid": true
}
```

## How It Works

### Architecture

```
Client Request
    ↓
Express Router (/attestations/issue)
    ↓
AttestationService (issueAttestationAndRegister)
    ↓
├─→ EAS Client (RAS SDK) → Issue attestation on-chain
│   └─→ Returns: Transaction hash + UID
│
└─→ AttestationGate Client → Register attestation
    └─→ Returns: Registration transaction hash
```

### Flow

1. **Schema Registration** (one-time setup):
   - Run `register-schemas` script
   - Registers schemas on Schema Registry contract
   - Generates deterministic Schema UIDs
   - Add UIDs to `.env` file

2. **Issuing Attestation**:
   - Client sends request with user address and schema type
   - Backend uses EAS SDK to issue attestation on RAS
   - Backend extracts transaction hash from receipt
   - Backend registers attestation on AttestationGate contract
   - Returns both transaction hashes and attestation UID

3. **Checking Status**:
   - Client requests status for an address
   - Backend queries AttestationGate contract
   - Returns boolean indicating validity

### Key Components

- **`src/services/attestationService.ts`**: Core business logic for issuing and checking attestations
- **`src/ras/easClient.ts`**: EAS SDK client for RAS integration
- **`src/contracts/attestationGateClient.ts`**: Contract interaction for AttestationGate
- **`src/routes/attestations.ts`**: Express routes for attestation endpoints
- **`src/config/env.ts`**: Environment variable validation and loading

## Scripts

### Register Schemas

```bash
npm run register-schemas
```

Registers NFT and Vault schemas on the Schema Registry. Automatically detects testnet/mainnet based on RPC URL.

**Requirements:**
- `PRIVATE_KEY` in `.env`
- Wallet must have tRBTC for gas fees
- Network must be accessible via `RSK_RPC_URL`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 4000) |
| `RSK_RPC_URL` | Yes | Rootstock RPC endpoint |
| `EAS_CONTRACT_ADDRESS` | Yes | RAS contract address (testnet: `0xc300aeEaDd60999933468738c9F5D7e9C0671e1c`) |
| `ATTESTATION_GATE_ADDRESS` | Yes | Deployed AttestationGate contract address |
| `PRIVATE_KEY` | Yes | 64 hex character private key (with or without 0x prefix) |
| `NFT_SCHEMA_UID` | Optional | Schema UID for NFT gating (register first) |
| `VAULT_SCHEMA_UID` | Optional | Schema UID for vault access (register first) |

## Troubleshooting

### "NFT_SCHEMA_UID is not configured"
- Run `npm run register-schemas` to register schemas
- Add the output Schema UIDs to your `.env` file

### "PRIVATE_KEY not found"
- Ensure `.env` file exists in `backend/` directory
- Private key must be 64 hex characters (with or without `0x` prefix)

### "Failed to extract attestation transaction hash"
- Check that the transaction was actually sent
- Verify RPC connection is working
- Check backend wallet has sufficient tRBTC for gas

### Transaction Failures
- Ensure backend wallet has tRBTC for gas fees
- Verify contract addresses are correct
- Check network connectivity via RPC URL

## Development

**Project Structure:**
```
backend/
├── src/
│   ├── config/        # Environment configuration
│   ├── contracts/      # Smart contract clients
│   ├── ras/           # RAS (EAS SDK) integration
│   ├── routes/        # Express route handlers
│   ├── services/      # Business logic
│   └── index.ts       # Server entry point
├── scripts/
│   └── registerSchemas.ts  # Schema registration script
└── .env              # Environment variables
```

## Network Configuration

**Rootstock Testnet:**
- Chain ID: 31
- RPC: `https://public-node.testnet.rsk.co`
- EAS: `0xc300aeEaDd60999933468738c9F5D7e9C0671e1c`
- Schema Registry: `0x679c62956cd2801ababf80e9d430f18859eea2d5`

**Rootstock Mainnet:**
- Chain ID: 30
- EAS: `0x54C0726E9d2D57Bc37AD52c7E219A3229e0eE963`
- Schema Registry: `0xef29675d82cc5967069d6d9c17f2719f67728f5b`
