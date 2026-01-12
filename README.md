# 🚀 Rootstock Attestation Module

> **Token-Gated Access on Rootstock** — A complete full-stack solution for identity verification and access control using Rootstock Attestation Service (RAS).

[![Rootstock](https://img.shields.io/badge/Network-Rootstock%20Testnet-00AA44?style=flat-square)](https://rootstock.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-3-yellow?style=flat-square)](https://hardhat.org/)

## 🎯 What Is This?

A production-ready, end-to-end system that demonstrates **token-gated access** on Rootstock using on-chain attestations. Users can request attestations, verify their identity, and access gated features like NFT minting—all powered by the Rootstock Attestation Service.

### ✨ Key Features

- 🔐 **On-Chain Attestations** via RAS (Rootstock Attestation Service)
- 🎨 **Gated NFT Minting** — Mint NFTs only with valid attestations
- 🏦 **Gated Vault Access** — Token vaults requiring attestation verification
- 🔄 **Full-Stack Architecture** — Smart contracts, backend API, and modern frontend
- ⚡ **Real-Time Status** — Check attestation validity instantly
- 🔗 **Transaction Tracking** — View all on-chain transactions with explorer links

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Wallet Connect│  │ Request Attest│  │  Mint NFT     │   │
│  │              │  │              │  │              │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
└─────────┼──────────────────┼──────────────────┼───────────┘
          │                  │                  │
          │ HTTP/REST        │                  │ Web3 (Wagmi)
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼───────────┐
│                    Backend (Express.js)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Issue Attestation → RAS (EAS SDK)                   │  │
│  │  Register Attestation → AttestationGate Contract    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────┬───────────────────────────────────────────────────┘
          │
          │ On-Chain
          │
┌─────────▼───────────────────────────────────────────────────┐
│              Smart Contracts (Solidity)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │AttestationGate│  │GatedNFTMinter│  │ GatedVault   │    │
│  │              │  │              │  │              │    │
│  │ Validates    │  │ Requires     │  │ Requires     │    │
│  │ Attestations │  │ Attestation  │  │ Attestation  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Project Structure

```
attestationModule/
├── 📄 README.md          # This file
├── 📄 COPY.md           # Project overview & flow
│
├── 🔷 contracts/        # Smart Contracts (Hardhat)
│   ├── contracts/       # Solidity contracts
│   ├── ignition/        # Deployment modules
│   ├── scripts/         # Utility scripts
│   └── test/            # Contract tests
│
├── ⚙️  backend/          # Backend API (Express.js)
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── ras/         # RAS/EAS SDK integration
│   │   └── contracts/  # Contract clients
│   └── scripts/         # Schema registration
│
└── 🎨 frontend/         # Frontend App (Next.js)
    ├── src/
    │   ├── app/         # Next.js pages
    │   ├── components/  # React components
    │   └── lib/         # Utilities & config
    └── public/          # Static assets
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **MetaMask** or compatible Web3 wallet
- **tRBTC** for gas fees (get from [Rootstock Faucet](https://faucet.rsk.co/))

### 1️⃣ Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd attestationModule

# Install dependencies for all modules
cd contracts && npm install && cd ..
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2️⃣ Deploy Contracts

```bash
cd contracts

# Configure .env with your private key
# Deploy AttestationGate
npx hardhat ignition deploy ignition/modules/AttestationGate.ts \
  --network rskTestnet \
  --parameters '{"AttestationGateModule":{"easAddress":"0xc300aeEaDd60999933468738c9F5D7e9C0671e1c"}}'

# See contracts/README.md for full deployment guide
```

### 3️⃣ Setup Backend

```bash
cd backend

# Configure .env with contract addresses and private key
# Register schemas
npm run register-schemas

# Start backend server
npm run dev
# Server runs on http://localhost:4000
```

### 4️⃣ Start Frontend

```bash
cd frontend

# Configure .env.local with backend URL and contract addresses
# Start development server
npm run dev
# App runs on http://localhost:3000
```

### 5️⃣ Use the App

1. **Connect Wallet** — Click "Connect MetaMask" in the header
2. **Request Attestation** — Choose NFT or Vault schema and submit
3. **Check Status** — Verify your attestation is valid
4. **Mint NFT** — Mint a gated NFT (requires valid attestation)

## 🔄 How It Works

### User Flow

```
1. User connects wallet (MetaMask)
   ↓
2. User requests attestation via frontend
   ↓
3. Frontend → Backend API
   ↓
4. Backend issues attestation via RAS (EAS SDK)
   ↓
5. Backend registers attestation on AttestationGate contract
   ↓
6. User checks status → Valid ✓
   ↓
7. User mints NFT via frontend
   ↓
8. Contract validates attestation → Mint successful ✓
```

### Technical Flow

1. **Schema Registration** (one-time)
   - Backend registers schemas on Schema Registry
   - Generates deterministic Schema UIDs
   - Used for NFT and Vault gating

2. **Attestation Issuance**
   - User requests attestation with address and schema type
   - Backend uses EAS SDK to issue attestation on RAS
   - Backend extracts transaction hash and attestation UID
   - Backend calls `registerAttestation()` on AttestationGate

3. **Access Control**
   - Contracts query `hasValidAttestationOfSchema()` on AttestationGate
   - AttestationGate validates with RAS contract on-chain
   - Access granted if attestation is valid and not revoked

## 📚 Documentation

Each module has comprehensive documentation:

- **[📖 Backend README](./backend/README.md)** — API endpoints, schema registration, configuration
- **[📖 Contracts README](./contracts/README.md)** — Deployment guide, contract details, scripts
- **[📖 Frontend README](./frontend/README.md)** — Components, configuration, development guide

## 🛠️ Tech Stack

### Smart Contracts
- **Solidity** 0.8.28
- **Hardhat** 3+ with Viem
- **OpenZeppelin** Contracts (Ownable, ReentrancyGuard, ERC721)

### Backend
- **Node.js** + **TypeScript**
- **Express.js** REST API
- **EAS SDK** for RAS integration
- **Viem** for contract interactions

### Frontend
- **Next.js** 16 (App Router)
- **React** 19
- **Wagmi** 3 (Web3 hooks)
- **Tailwind CSS** 4
- **TypeScript**

## 🌐 Network Configuration

### Rootstock Testnet
- **Chain ID:** 31
- **RPC:** `https://public-node.testnet.rsk.co`
- **Explorer:** `https://explorer.testnet.rootstock.io`
- **RAS (EAS):** `0xc300aeEaDd60999933468738c9F5D7e9C0671e1c`
- **Schema Registry:** `0x679c62956cd2801ababf80e9d430f18859eea2d5`

### Deployed Contracts (Testnet)
- **AttestationGate:** `0xe022df9f57b611675B6b713307E7563D0c9abC74`
- **GatedNFTMinter:** `0x5e515B34A39c00Ba5C6203606CBc12bFf11fe010`

## 🎯 Use Cases

- **🎨 NFT Gating** — Mint exclusive NFTs only for verified users
- **🏦 DeFi Access** — Control access to token vaults and protocols
- **✅ KYC/Identity** — On-chain identity verification
- **🎫 Event Access** — Token-gated event tickets or memberships
- **🔒 Permission Systems** — Granular access control for dApps

## 🔐 Security

- **On-Chain Validation** — All attestations verified on-chain via RAS
- **Reentrancy Protection** — Contracts use OpenZeppelin's ReentrancyGuard
- **Ownership Control** — Critical functions restricted to contract owners
- **No Private Keys in Frontend** — All signing done via wallet extensions

## 🧪 Testing

```bash
# Test contracts
cd contracts
npx hardhat test

# Test backend (manual via API)
cd backend
npm run dev
# Use test-endpoints.ps1 or Postman
```

## 📝 Environment Variables

### Contracts
```env
PRIVATE_KEY=your_private_key
RSK_TESTNET_RPC_URL=https://public-node.testnet.rsk.co
```

### Backend
```env
PORT=4000
RSK_RPC_URL=https://public-node.testnet.rsk.co
EAS_CONTRACT_ADDRESS=0xc300aeEaDd60999933468738c9F5D7e9C0671e1c
ATTESTATION_GATE_ADDRESS=0xe022df9f57b611675B6b713307E7563D0c9abC74
BACKEND_PRIVATE_KEY=your_private_key
NFT_SCHEMA_UID=0x...
VAULT_SCHEMA_UID=0x...
```

### Frontend
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_RSK_RPC_URL=https://public-node.testnet.rsk.co
NEXT_PUBLIC_ATTESTATION_GATE_ADDRESS=0xe022df9f57b611675B6b713307E7563D0c9abC74
NEXT_PUBLIC_GATED_NFT_MINTER_ADDRESS=0x5e515B34A39c00Ba5C6203606CBc12bFf11fe010
```

## 🚧 Development

### Running All Services

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Contracts (when deploying)
cd contracts && npx hardhat ...
```

### Project Scripts

**Contracts:**
- `npm run compile` — Compile contracts
- `npm test` — Run tests
- `npx hardhat ignition deploy` — Deploy contracts

**Backend:**
- `npm run dev` — Start dev server (nodemon)
- `npm run build` — Build for production
- `npm run register-schemas` — Register schemas

**Frontend:**
- `npm run dev` — Start dev server
- `npm run build` — Build for production
- `npm start` — Start production server

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Rootstock** — For the amazing blockchain infrastructure
- **EAS (Ethereum Attestation Service)** — For the attestation protocol
- **OpenZeppelin** — For secure contract libraries
- **Wagmi** — For excellent Web3 React hooks

## 📞 Support

- **Documentation:** See individual README files in each module
- **Issues:** Open an issue on GitHub
- **Rootstock Docs:** [developers.rsk.co](https://developers.rsk.co)

---

**Built with ❤️ for the Rootstock ecosystem**

*Empowering decentralized identity and access control on Bitcoin's smart contract platform.*
