# Backend Environment Variables Setup Guide

## Overview

This document explains all environment variables required by the backend service and how to configure them.

## Required Variables

### 1. `PORT` (Optional, defaults to 4000)
- **Purpose**: The port number on which the Express server will listen
- **Format**: Integer (e.g., `4000`)
- **Default**: `4000` if not provided
- **Example**: `PORT=4000`

### 2. `RSK_RPC_URL` (Required)
- **Purpose**: The RPC endpoint URL for connecting to the Rootstock network
- **Format**: HTTPS URL string
- **Public Testnet Endpoint**: `https://public-node.testnet.rsk.co`
- **Alternative Testnet**: `https://testnet.sovryn.app/rpc`
- **Mainnet Endpoint**: `https://public-node.rsk.co` (when ready for mainnet)
- **Example**: `RSK_RPC_URL=https://public-node.testnet.rsk.co`

### 3. `EAS_CONTRACT_ADDRESS` (Required)
- **Purpose**: The address of the deployed EAS (Ethereum Attestation Service) contract on Rootstock
- **Format**: Checksummed Ethereum address (0x-prefixed, 40 hex characters)
- **Testnet Address**: `0xc300aeEaDd60999933468738c9F5D7e9C0671e1c`
- **Mainnet Address**: `0x54C0726E9d2D57Bc37AD52c7E219A3229e0eE963`
- **Source**: These addresses are from the official RAS contracts deployment
- **Example**: `EAS_CONTRACT_ADDRESS=0xc300aeEaDd60999933468738c9F5D7e9C0671e1c`

### 4. `ATTESTATION_GATE_ADDRESS` (Required)
- **Purpose**: The address of your deployed `AttestationGate` contract
- **Format**: Checksummed Ethereum address (0x-prefixed, 40 hex characters)
- **How to Get**: This is the address returned when you deployed `AttestationGate` using Hardhat Ignition
- **Example**: `ATTESTATION_GATE_ADDRESS=0x1234567890123456789012345678901234567890`
- **Note**: Replace with your actual deployed contract address!

### 5. `BACKEND_PRIVATE_KEY` (Required)
- **Purpose**: The private key of the wallet that will:
  - Issue attestations via the EAS contract
  - Register attestations in the `AttestationGate` contract
- **Format**: 0x-prefixed 64-character hexadecimal string (no spaces)
- **Security**: ⚠️ **NEVER commit this to version control!** Keep it in `.env` only
- **Requirements**: 
  - The wallet must have RBTC (Rootstock's native token) for gas fees
  - For testnet, you can get testnet RBTC from a faucet
- **Example**: `BACKEND_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`
- **Note**: This should be a dedicated wallet for the backend service, not your personal wallet

## Optional Variables

### 6. `NFT_SCHEMA_UID` (Optional)
- **Purpose**: The schema UID for NFT gating attestations
- **Format**: 0x-prefixed 64-character hexadecimal string (bytes32)
- **When to Set**: After registering the NFT schema via EAS/RAS
- **How to Get**: 
  1. Register a schema using the EAS Schema Registry
  2. The schema UID will be returned
  3. Set this variable with that UID
- **Example**: `NFT_SCHEMA_UID=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab`

### 7. `VAULT_SCHEMA_UID` (Optional)
- **Purpose**: The schema UID for vault gating attestations
- **Format**: 0x-prefixed 64-character hexadecimal string (bytes32)
- **When to Set**: After registering the vault schema via EAS/RAS
- **How to Get**: Same as `NFT_SCHEMA_UID`
- **Example**: `VAULT_SCHEMA_UID=0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321`

## Quick Setup Steps

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Fill in the required values**:
   - Set `RSK_RPC_URL` to the testnet endpoint (already provided in example)
   - Set `EAS_CONTRACT_ADDRESS` to the testnet address (already provided)
   - Set `ATTESTATION_GATE_ADDRESS` to your deployed contract address
   - Set `BACKEND_PRIVATE_KEY` to your backend wallet's private key

3. **Get testnet RBTC** (if needed):
   - Visit a Rootstock testnet faucet to fund your backend wallet
   - Ensure the wallet has enough RBTC for gas fees

4. **Register schemas** (optional, for now):
   - Use the EAS/RAS interface to register schemas
   - Set `NFT_SCHEMA_UID` and `VAULT_SCHEMA_UID` after registration

## Validation

The backend will validate all environment variables on startup. If any required variable is missing or invalid, the server will fail to start with a clear error message.

## Security Notes

- ⚠️ **Never commit `.env` to version control**
- ✅ The `.env` file is already in `.gitignore`
- ✅ Use a dedicated wallet for the backend (not your personal wallet)
- ✅ Keep your private key secure and never share it
- ✅ For production, use environment variable injection from your hosting provider (not a `.env` file)

