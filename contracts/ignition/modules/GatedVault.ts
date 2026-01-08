import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @title GatedVault Deployment Module
 * @notice Deploys GatedVault contract
 * @dev Requires AttestationGate address, token address, and schema UID
 */
export default buildModule("GatedVaultModule", (m) => {
  const attestationGateAddress = m.getParameter(
    "attestationGateAddress",
    "0x0000000000000000000000000000000000000000"
  );
  const tokenAddress = m.getParameter(
    "tokenAddress",
    "0x0000000000000000000000000000000000000000" // Must be set to actual ERC20 token address
  );
  const requiredSchemaUID = m.getParameter(
    "requiredSchemaUID",
    "0x" + "0".repeat(64) // Must be set to actual schema UID
  );

  const vault = m.contract("GatedVault", [
    attestationGateAddress,
    tokenAddress,
    requiredSchemaUID,
  ]);

  return { vault };
});

