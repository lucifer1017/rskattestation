import { network } from "hardhat";
import { getAddress } from "viem";

/**
 * @title Deployment Status Checker
 * @notice Checks deployment status of contracts
 * @usage npx hardhat run scripts/check-deployment.ts --network rootstockTestnet
 */
async function main() {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  console.log("=== Deployment Status Check ===\n");
  console.log("Network:", network.name);
  console.log("Chain ID:", await publicClient.getChainId());
  console.log("Block Number:", await publicClient.getBlockNumber());

  // Get contract addresses from environment or parameters
  const attestationGateAddress = process.env.ATTESTATION_GATE_ADDRESS;
  const nftMinterAddress = process.env.NFT_MINTER_ADDRESS;
  const vaultAddress = process.env.VAULT_ADDRESS;

  if (attestationGateAddress) {
    console.log("\n=== AttestationGate ===");
    console.log("Address:", attestationGateAddress);
    try {
      const code = await publicClient.getBytecode({ address: getAddress(attestationGateAddress) });
      if (code && code !== "0x") {
        console.log("Status: ✅ Deployed");
        // Try to read contract state
        try {
          const easAddress = await publicClient.readContract({
            address: getAddress(attestationGateAddress),
            abi: [
              {
                inputs: [],
                name: "easAddress",
                outputs: [{ internalType: "address", name: "", type: "address" }],
                stateMutability: "view",
                type: "function",
              },
            ],
            functionName: "easAddress",
          });
          console.log("EAS Address:", easAddress);
        } catch (e) {
          console.log("Could not read contract state");
        }
      } else {
        console.log("Status: ❌ Not deployed or invalid address");
      }
    } catch (e) {
      console.log("Status: ❌ Error checking contract");
    }
  }

  if (nftMinterAddress) {
    console.log("\n=== GatedNFTMinter ===");
    console.log("Address:", nftMinterAddress);
    try {
      const code = await publicClient.getBytecode({ address: getAddress(nftMinterAddress) });
      if (code && code !== "0x") {
        console.log("Status: ✅ Deployed");
      } else {
        console.log("Status: ❌ Not deployed or invalid address");
      }
    } catch (e) {
      console.log("Status: ❌ Error checking contract");
    }
  }

  if (vaultAddress) {
    console.log("\n=== GatedVault ===");
    console.log("Address:", vaultAddress);
    try {
      const code = await publicClient.getBytecode({ address: getAddress(vaultAddress) });
      if (code && code !== "0x") {
        console.log("Status: ✅ Deployed");
      } else {
        console.log("Status: ❌ Not deployed or invalid address");
      }
    } catch (e) {
      console.log("Status: ❌ Error checking contract");
    }
  }

  if (!attestationGateAddress && !nftMinterAddress && !vaultAddress) {
    console.log("\n⚠️  No contract addresses found in environment variables");
    console.log("Set ATTESTATION_GATE_ADDRESS, NFT_MINTER_ADDRESS, or VAULT_ADDRESS");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

