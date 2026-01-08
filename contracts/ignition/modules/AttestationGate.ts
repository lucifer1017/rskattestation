import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

/**
 * @title AttestationGate Deployment Module
 * @notice Deploys AttestationGate contract
 * @dev Requires EAS contract address (from RASConstants or environment)
 */
export default buildModule("AttestationGateModule", (m) => {
  // Get EAS address from environment or use testnet default
  // For testnet: 0xc300aeEaDd60999933468738c9F5D7e9C0671e1c
  // For mainnet: 0x54C0726E9d2D57Bc37AD52c7E219A3229e0eE963
  const easAddress = m.getParameter("easAddress", "0xc300aeEaDd60999933468738c9F5D7e9C0671e1c");

  const attestationGate = m.contract("AttestationGate", [easAddress]);

  return { attestationGate };
});

