# Rootstock Attestation Module

Token-gated access on Rootstock using the Rootstock Attestation Service (RAS). Full-stack: smart contracts, backend API, Next.js frontend.

**Features:** On-chain attestations via RAS · Gated NFT minting · Gated vault (optional) · Signature-verified attestation requests · Real-time status checks

## Architecture

```
Frontend (Next.js)  →  Backend (Express)  →  RAS + AttestationGate
       ↓                      ↓
   Wallet Connect      Issue / register attestations
   Mint NFT            (signature + timestamp verified)
   Request attestation
```

**Contracts:** AttestationGate (registry) · GatedNFTMinter (ERC721) · GatedVault (optional)

## Project Structure

```
attestationModule/
├── contracts/   # Solidity + Hardhat (deploy, test, scripts)
├── backend/     # Express API (RAS/EAS SDK, attestation routes)
└── frontend/    # Next.js app (Wagmi, mint, request attestation)
```

See each folder’s **README** for setup and details.

## Quick Start

**Prerequisites:** Node.js 18+, MetaMask (or compatible wallet), tRBTC for gas ([faucet](https://faucet.rsk.co/)).

1. **Contracts** — `cd contracts && npm install`. Set `.env` (e.g. `PRIVATE_KEY`, `RSK_TESTNET_RPC_URL`). Deploy AttestationGate, then GatedNFTMinter (edit `ignition/params-gated-nft-minter.json`). See [contracts/README.md](https://github.com/lucifer1017/rskattestation/blob/main/contracts/README.md).
2. **Backend** — `cd backend && npm install`. Set `.env` (e.g. `PRIVATE_KEY`, `ATTESTATION_GATE_ADDRESS`, `EAS_CONTRACT_ADDRESS`). Run `npm run register-schemas`, then `npm run dev`. See [backend/README.md](https://github.com/lucifer1017/rskattestation/blob/main/backend/README.md).
3. **Frontend** — `cd frontend && npm install`. Set `.env.local` with `NEXT_PUBLIC_ATTESTATION_GATE_ADDRESS` and `NEXT_PUBLIC_GATED_NFT_MINTER_ADDRESS`. Run `npm run dev`. See [frontend/README.md](https://github.com/lucifer1017/rskattestation/blob/main/frontend/README.md).

**Flow:** Connect wallet → Request attestation (sign message) → Backend verifies & issues → Mint NFT (contract checks attestation).

## Documentation

- **[contracts/README.md](https://github.com/lucifer1017/rskattestation/blob/main/contracts/README.md)** — Deployment (AttestationGate, GatedNFTMinter, params file), env vars, scripts.
- **[backend/README.md](https://github.com/lucifer1017/rskattestation/blob/main/backend/README.md)** — API (`/attestations/issue` with signature + timestamp), schema registration, `PRIVATE_KEY`.
- **[frontend/README.md](https://github.com/lucifer1017/rskattestation/blob/main/frontend/README.md)** — Env (two required addresses), components, API usage.

## Environment (summary)

| Module    | Required / key vars |
|----------|---------------------|
| Contracts | `PRIVATE_KEY`, `RSK_TESTNET_RPC_URL` (or mainnet) |
| Backend   | `PRIVATE_KEY`, `ATTESTATION_GATE_ADDRESS`, `EAS_CONTRACT_ADDRESS`; then `NFT_SCHEMA_UID` / `VAULT_SCHEMA_UID` after `register-schemas` |
| Frontend  | `NEXT_PUBLIC_ATTESTATION_GATE_ADDRESS`, `NEXT_PUBLIC_GATED_NFT_MINTER_ADDRESS` |

Use each module’s `.env.example` and README for full lists.

## Tech Stack

**Contracts:** Solidity 0.8.28, Hardhat 3, OpenZeppelin · **Backend:** Node, Express, EAS SDK, Viem · **Frontend:** Next.js, React, Wagmi, Tailwind, TypeScript

## Network (Testnet)

- **Chain ID:** 31 · **RPC:** https://public-node.testnet.rsk.co · **RAS (EAS):** `0xc300aeEaDd60999933468738c9F5D7e9C0671e1c`

## License

MIT.
