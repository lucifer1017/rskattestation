import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

/**
 * @title GatedNFTMinter Deployment Module
 * @notice Deploys GatedNFTMinter contract
 * @dev Requires AttestationGate address and schema UID
 */
export default buildModule("GatedNFTMinterModule", (m) => {
  const attestationGateAddress = m.getParameter(
    "attestationGateAddress",
    "0x0000000000000000000000000000000000000000"
  );
  const requiredSchemaUID = m.getParameter(
    "requiredSchemaUID",
    "0x" + "0".repeat(64) // Must be set to actual schema UID
  );
  const maxSupply = m.getParameter("maxSupply", 1000n);
  const mintPrice = m.getParameter("mintPrice", parseEther("0.1"));
  const name = m.getParameter("name", "Gated NFT Collection");
  const symbol = m.getParameter("symbol", "GNFT");

  const nftMinter = m.contract("GatedNFTMinter", [
    attestationGateAddress,
    requiredSchemaUID,
    maxSupply,
    mintPrice,
    name,
    symbol,
  ]);

  return { nftMinter };
});

