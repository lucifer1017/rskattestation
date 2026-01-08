import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

/**
 * @title Complete Deployment Module
 * @notice Deploys all contracts in the correct order
 * @dev Deployment order:
 *      1. AttestationGate (requires EAS address)
 *      2. GatedNFTMinter (requires AttestationGate + schema UID)
 *      3. GatedVault (requires AttestationGate + token address + schema UID)
 */
export default buildModule("CompleteDeploymentModule", (m) => {
  // ============================================
  // Step 1: Deploy AttestationGate
  // ============================================
  // EAS address - use testnet default, override via parameter for mainnet
  const easAddress = m.getParameter("easAddress", "0xc300aeEaDd60999933468738c9F5D7e9C0671e1c");

  const attestationGate = m.contract("AttestationGate", [easAddress]);

  // ============================================
  // Step 2: Deploy GatedNFTMinter
  // ============================================
  // Schema UID - MUST be set after schema registration via backend
  const nftSchemaUID = m.getParameter(
    "nftSchemaUID",
    "0x" + "0".repeat(64) // TODO: Replace with actual schema UID after registration
  );

  const nftMinter = m.contract("GatedNFTMinter", [
    attestationGate,
    nftSchemaUID,
    1000n, // maxSupply
    parseEther("0.1"), // mintPrice
    "Rootstock Attestation NFT", // name
    "RANFT", // symbol
  ]);

  // ============================================
  // Step 3: Deploy GatedVault (optional - requires token address)
  // ============================================
  // Token address - set to actual ERC20 token address, or skip if not deploying vault
  const tokenAddress = m.getParameter(
    "tokenAddress",
    "0x" + "0".repeat(64) // TODO: Replace with actual token address or skip deployment
  );

  const vaultSchemaUID = m.getParameter(
    "vaultSchemaUID",
    "0x" + "0".repeat(64) // TODO: Replace with actual schema UID after registration
  );

  // Only deploy vault if token address is provided (not zero address)
  let vault;
  if (tokenAddress !== "0x" + "0".repeat(64)) {
    vault = m.contract("GatedVault", [attestationGate, tokenAddress, vaultSchemaUID]);
  }

  return {
    attestationGate,
    nftMinter,
    ...(vault && { vault }),
  };
});

