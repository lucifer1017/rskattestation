import { network } from "hardhat";
import { getAddress } from "viem";

/**
 * @title Set Authorized Attester Script
 * @notice Authorizes a backend wallet address to be an attester on AttestationGate
 * @usage npx hardhat run scripts/set-authorized-attester.ts --network rskTestnet
 * 
 * Required environment variables:
 * - ATTESTATION_GATE_ADDRESS: The deployed AttestationGate contract address
 * - ATTESTER_ADDRESS: The backend wallet address that signs EAS attestations
 */
async function main() {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();

  // Get addresses from environment
  const attestationGateAddress = process.env.ATTESTATION_GATE_ADDRESS;
  const attesterAddress = process.env.ATTESTER_ADDRESS;

  if (!attestationGateAddress) {
    console.error("❌ ATTESTATION_GATE_ADDRESS environment variable is required");
    console.log("\nUsage:");
    console.log("  $env:ATTESTATION_GATE_ADDRESS='0x...'");
    console.log("  $env:ATTESTER_ADDRESS='0x...'");
    console.log("  npx hardhat run scripts/set-authorized-attester.ts --network rskTestnet");
    process.exit(1);
  }

  if (!attesterAddress) {
    console.error("❌ ATTESTER_ADDRESS environment variable is required");
    console.log("\nThis should be the address of the backend wallet that signs EAS attestations.");
    console.log("(The address derived from PRIVATE_KEY in your backend/.env)");
    process.exit(1);
  }

  console.log("=== Set Authorized Attester ===\n");
  console.log("Network:", network.name);
  console.log("Deployer (owner):", deployer.account.address);
  console.log("AttestationGate:", attestationGateAddress);
  console.log("Attester to authorize:", attesterAddress);

  // Verify AttestationGate contract exists
  const code = await publicClient.getBytecode({ address: getAddress(attestationGateAddress) });
  if (!code || code === "0x") {
    console.error("\n❌ No contract found at", attestationGateAddress);
    process.exit(1);
  }
  console.log("\n✅ AttestationGate contract found");

  // Check if already authorized
  const isAlreadyAuthorized = await publicClient.readContract({
    address: getAddress(attestationGateAddress),
    abi: [
      {
        inputs: [{ name: "attester", type: "address" }],
        name: "authorizedAttesters",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "authorizedAttesters",
    args: [getAddress(attesterAddress)],
  });

  if (isAlreadyAuthorized) {
    console.log("\n✅ Attester is already authorized!");
    return;
  }

  console.log("\n📝 Sending setAuthorizedAttester transaction...");

  const txHash = await deployer.writeContract({
    address: getAddress(attestationGateAddress),
    abi: [
      {
        inputs: [
          { name: "attester", type: "address" },
          { name: "authorized", type: "bool" },
        ],
        name: "setAuthorizedAttester",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    functionName: "setAuthorizedAttester",
    args: [getAddress(attesterAddress), true],
  });

  console.log("Transaction hash:", txHash);
  console.log("Waiting for confirmation...");

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  
  if (receipt.status === "success") {
    console.log("\n✅ Attester authorized successfully!");
    console.log("Block:", receipt.blockNumber);
  } else {
    console.error("\n❌ Transaction failed");
    process.exit(1);
  }

  // Verify
  const isNowAuthorized = await publicClient.readContract({
    address: getAddress(attestationGateAddress),
    abi: [
      {
        inputs: [{ name: "attester", type: "address" }],
        name: "authorizedAttesters",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "authorizedAttesters",
    args: [getAddress(attesterAddress)],
  });

  console.log("\n=== Verification ===");
  console.log("Attester authorized:", isNowAuthorized ? "✅ Yes" : "❌ No");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
