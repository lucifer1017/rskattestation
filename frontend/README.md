# Frontend - Rootstock Attestation Module

Next.js frontend application for interacting with Rootstock Attestation Service (RAS) and token-gated contracts.

## Overview

This frontend provides a user-friendly interface to:
- Connect Web3 wallets (MetaMask, WalletConnect)
- Request attestations for NFT gating or Vault access
- Check attestation status and validity
- Mint gated NFTs (requires valid attestation)
- View transaction history and explorer links

## Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- Backend service running (see `../backend/README.md`)
- Deployed smart contracts (see `../contracts/README.md`)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

On Linux, if you previously saw an error like:

- `error ... utf-8-validate: Command failed`
- `Error: spawn node-gyp ENOENT`

this repository now includes a local `node-gyp` devDependency, so a global `node-gyp` is no longer required.  
You still need a basic build toolchain (C/C++ compiler, Python) installed:

- **Debian/Ubuntu**: `sudo apt-get install build-essential python3`
- **Fedora**: `sudo dnf install @development-tools python3`

### 2. Configure Environment

Create a `.env.local` file in the `frontend/` directory (see `.env.example`):

```env
# Required: deployed contract addresses (Rootstock Testnet)
NEXT_PUBLIC_ATTESTATION_GATE_ADDRESS=0x_your_attestation_gate_address
NEXT_PUBLIC_GATED_NFT_MINTER_ADDRESS=0x_your_gated_nft_minter_address

# Optional overrides (defaults in code)
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_RSK_RPC_URL=https://public-node.testnet.rsk.co
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 4. Build for Production

```bash
npm run build
npm start
```

## Features

### Wallet Connection

- **MetaMask Integration**: Primary wallet connector with automatic detection
- **Connection Status**: Real-time wallet connection state
- **Address Display**: Formatted address display in header

### Request Attestation

- **Schema Selection**: Choose between NFT Gating or Vault Access
- **Custom Statements**: Optional statement field for attestation
- **Transaction Tracking**: View both attestation and registration transaction hashes
- **Explorer Links**: Direct links to Rootstock Explorer for transactions
- **Success Feedback**: Clear UI feedback on successful attestation

### Check Status

- **Auto-Check**: Automatically checks status when wallet connects
- **Schema-Specific**: Check status for NFT or Vault schemas
- **Real-Time Updates**: Refresh button to check latest status
- **Visual Indicators**: Clear valid/invalid status display

### Mint NFT

- **Attestation Validation**: Checks attestation before allowing mint
- **Supply Display**: Shows current supply vs max supply
- **Price Display**: Shows mint price in tRBTC
- **Mint Status**: Tracks if user has already minted
- **Balance Display**: Shows user's NFT balance
- **Auto-Refresh**: Automatically updates UI after successful mint

## Components

### WalletConnect

**Location:** `src/components/wallet-connect.tsx`

Handles wallet connection and disconnection. Prioritizes MetaMask if available, otherwise shows first available connector.

**Features:**
- Deduplicates connectors by ID and name
- Single "Connect MetaMask" button
- Displays connected address
- Disconnect functionality

### RequestAttestation

**Location:** `src/components/request-attestation.tsx`

Form component for requesting attestations from the backend.

**Features:**
- Schema type selection (NFT/Vault)
- Optional statement field
- Loading states
- Success/error handling
- Transaction hash display with explorer links
- Copy-to-clipboard for attestation UID

### CheckStatus

**Location:** `src/components/check-status.tsx`

Component for checking attestation validity.

**Features:**
- Auto-checks on wallet connection
- Schema type selection
- Manual refresh button
- Visual status indicators
- Error handling

### MintNFT

**Location:** `src/components/mint-nft.tsx`

Component for minting gated NFTs.

**Features:**
- Reads contract state (price, supply, hasMinted, balance)
- Validates attestation before minting
- Transaction handling with Wagmi hooks
- Auto-refresh after successful mint
- Supply and balance display
- Eligibility status

## How It Works

### Architecture

```
User Browser
    ↓
Next.js App (React)
    ↓
├─→ Wagmi (Web3 Hooks)
│   └─→ MetaMask / WalletConnect
│       └─→ Rootstock Testnet
│
├─→ API Client (src/lib/api.ts)
│   └─→ Backend REST API
│       └─→ Issues Attestations
│
└─→ Contract Interactions (Wagmi)
    └─→ GatedNFTMinter Contract
        └─→ AttestationGate Contract
            └─→ Validates Attestations
```

### User Flow

```
1. User Connects Wallet
   └─→ Wagmi detects MetaMask
   └─→ Connects to Rootstock Testnet

2. User Requests Attestation
   └─→ Frontend prompts user to sign message (Request attestation for <address> at <timestamp>)
   └─→ Frontend → Backend API (address, schemaType, signature, timestamp)
   └─→ Backend verifies signature and timestamp, then issues attestation via RAS
   └─→ Backend registers on AttestationGate
   └─→ Frontend displays transaction hashes

3. User Checks Status
   └─→ Frontend → Backend API
   └─→ Backend queries AttestationGate contract
   └─→ Returns validity status

4. User Mints NFT
   └─→ Frontend checks attestation status
   └─→ Frontend reads contract state (price, supply)
   └─→ User approves transaction
   └─→ Contract validates attestation
   └─→ NFT minted if valid
   └─→ UI auto-refreshes
```

### State Management

- **Wagmi Hooks**: For Web3 state (account, connection, contract reads/writes)
- **React Query**: For API calls and caching (via Wagmi)
- **Local State**: Component-level state for forms and UI

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx             # Main page component
│   │   └── globals.css          # Global styles (Tailwind)
│   ├── components/
│   │   ├── wallet-connect.tsx    # Wallet connection UI
│   │   ├── request-attestation.tsx  # Attestation request form
│   │   ├── check-status.tsx     # Status checking component
│   │   ├── mint-nft.tsx         # NFT minting component
│   │   └── providers.tsx        # Wagmi & React Query providers
│   └── lib/
│       ├── api.ts               # Backend API client
│       ├── config.ts            # Configuration (contracts, URLs)
│       ├── contracts.ts         # Contract ABIs and addresses
│       ├── utils.ts             # Utility functions
│       └── wagmi.ts             # Wagmi configuration
├── public/                      # Static assets
├── .env.local                   # Environment variables
└── package.json
```

## Configuration

### Contract Addresses

Contract addresses are read from environment variables in `src/lib/config.ts`. Both are **required**; the app throws at startup if missing.

- `NEXT_PUBLIC_ATTESTATION_GATE_ADDRESS` — Deployed AttestationGate address
- `NEXT_PUBLIC_GATED_NFT_MINTER_ADDRESS` — Deployed GatedNFTMinter address

Copy from `contracts/ignition/deployments/chain-31/deployed_addresses.json` or your deployment output.

### Network Configuration

Rootstock Testnet is configured in `src/lib/wagmi.ts`:

- **Chain ID:** 31
- **RPC:** `https://public-node.testnet.rsk.co`
- **Explorer:** `https://explorer.testnet.rootstock.io`

Override RPC URL via `NEXT_PUBLIC_RSK_RPC_URL`.

### Backend URL

Default: `http://localhost:4000`

Override via `NEXT_PUBLIC_BACKEND_URL`.

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Tech Stack

- **Next.js 16**: React framework with App Router
- **React 19**: UI library
- **Wagmi 3**: React hooks for Ethereum
- **Viem**: Ethereum library for type-safe interactions
- **Tailwind CSS 4**: Utility-first CSS framework
- **TypeScript**: Type-safe JavaScript

### Key Libraries

- `@tanstack/react-query`: Data fetching and caching (via Wagmi)
- `@metamask/sdk`: MetaMask SDK integration
- `viem`: Ethereum utilities (formatting, parsing)

## Styling

The frontend uses Tailwind CSS with custom Rootstock theme colors:

- **Green**: `#00AA44` (Rootstock brand)
- **Orange**: `#FF6600` (Accent)
- **Dark**: `#000000` (Background)
- **Gray**: Various shades for cards and borders

Custom colors are defined in `src/app/globals.css`.

## API Integration

### Backend Endpoints

The frontend calls these backend endpoints (via `src/lib/api.ts`):

**Issue Attestation:**
```typescript
POST /attestations/issue
Body: { address, schemaType, statement?, signature, timestamp }
```
The frontend signs the message `Request attestation for <address> at <timestamp>` (same address and Unix timestamp as in the body) and sends `signature` and `timestamp`. The backend verifies ownership and a 5-minute replay window. Response: `{ uid, txHashAttest, txHashRegister }`.

**Check Status:**
```typescript
GET /attestations/:address/status?schemaType=nft
Response: { address, schemaType, hasValid }
```

### Error Handling

- **Backend unreachable:** If the backend is not running or not reachable, the app shows a clear message and a retry option (e.g. on the mint page).
- Network errors and backend error messages are displayed in the UI.
- Transaction errors from contracts are handled by Wagmi.

## Contract Interactions

### Reading Contract State

Uses Wagmi's `useReadContract` hook:

```typescript
const { data: mintPrice } = useReadContract({
  address: CONTRACT_ADDRESSES.GatedNFTMinter,
  abi: GATED_NFT_MINTER_ABI,
  functionName: "mintPrice",
});
```

### Writing to Contracts

Uses Wagmi's `useWriteContract` and `useWaitForTransactionReceipt`:

```typescript
const { writeContract, data: hash } = useWriteContract();
const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

// Call mint function
writeContract({
  address: CONTRACT_ADDRESSES.GatedNFTMinter,
  abi: GATED_NFT_MINTER_ABI,
  functionName: "mint",
  value: mintPrice,
});
```

## Troubleshooting

### "Failed to fetch" / backend unreachable

- Ensure the backend is running (default `http://localhost:4000`). The app may show a banner when the backend is unreachable.
- Check `NEXT_PUBLIC_BACKEND_URL` if you use a different URL.
- Check the browser console for CORS or network errors.

### Wallet connection issues

- Ensure MetaMask is installed and unlocked
- Check MetaMask is connected to Rootstock Testnet (Chain ID 31)
- Try disconnecting and reconnecting wallet

### "Insufficient funds" when minting

- Ensure wallet has tRBTC for gas fees
- Check mint price is correct
- Verify wallet has enough balance for mint price + gas

### Contract read errors

- Verify contract addresses are correct
- Ensure contracts are deployed on Rootstock Testnet
- Check RPC URL is accessible

### Status not updating

- Click "Refresh Status" button
- Check backend is running and accessible
- Verify attestation was successfully registered

### NFT supply not updating after mint

- Wait a few seconds for blockchain confirmation
- Click "Refresh Status" button in MintNFT component
- Check transaction was successful on explorer

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_ATTESTATION_GATE_ADDRESS` | Yes | Deployed AttestationGate contract address |
| `NEXT_PUBLIC_GATED_NFT_MINTER_ADDRESS` | Yes | Deployed GatedNFTMinter contract address |
| `NEXT_PUBLIC_BACKEND_URL` | No | Backend API URL (default: `http://localhost:4000`) |
| `NEXT_PUBLIC_RSK_RPC_URL` | No | Rootstock RPC endpoint (default: public testnet node) |


All variables must be prefixed with `NEXT_PUBLIC_` to be available in the browser. Copy `.env.example` to `.env.local` and set the two required addresses.

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Brave
- Safari (with MetaMask extension)

## Security Considerations

- **Private Keys**: Never expose private keys in frontend code
- **Environment Variables**: Only use `NEXT_PUBLIC_*` for public values
- **API Keys**: Don't store sensitive API keys in frontend
- **Transaction Signing**: All transactions require user approval via wallet
- **Contract Validation**: Always verify contract addresses before deployment

## Next Steps

After setting up the frontend:

1. **Start Backend**: See `../backend/README.md`
2. **Deploy Contracts**: See `../contracts/README.md`
3. **Register Schemas**: Run backend schema registration script
4. **Test Flow**: Connect wallet → Request attestation → Mint NFT

