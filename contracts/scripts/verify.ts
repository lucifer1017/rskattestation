import { network } from "hardhat";

/**
 * @title Contract Verification Helper Script
 * @notice Helper script to verify contracts on Blockscout
 * @usage npx hardhat run scripts/verify.ts --network rootstockTestnet
 */
async function main() {
  const networkName = network.name;

  console.log("=== Contract Verification Instructions ===");
  console.log(`Network: ${networkName}\n`);

  if (networkName === "rootstockTestnet" || networkName === "rootstockMainnet") {
    const explorerBase =
      networkName === "rootstockMainnet"
        ? "https://rootstock.blockscout.com"
        : "https://rootstock-testnet.blockscout.com";

    console.log(`Blockscout Explorer: ${explorerBase}\n`);

    console.log("To verify contracts, use Hardhat verify plugin:");
    console.log("\n1. Verify AttestationGate:");
    console.log(
      `   npx hardhat verify --network ${networkName} <CONTRACT_ADDRESS> <EAS_ADDRESS>`
    );

    console.log("\n2. Verify GatedNFTMinter:");
    console.log(
      `   npx hardhat verify --network ${networkName} <CONTRACT_ADDRESS> <ATTESTATION_GATE_ADDRESS> <SCHEMA_UID> <MAX_SUPPLY> <MINT_PRICE> "<NAME>" "<SYMBOL>"`
    );

    console.log("\n3. Verify GatedVault:");
    console.log(
      `   npx hardhat verify --network ${networkName} <CONTRACT_ADDRESS> <ATTESTATION_GATE_ADDRESS> <TOKEN_ADDRESS> <SCHEMA_UID>`
    );

    console.log("\n=== Alternative: Manual Verification ===");
    console.log(`1. Go to ${explorerBase}`);
    console.log("2. Navigate to your contract address");
    console.log("3. Click 'Verify and Publish'");
    console.log("4. Paste your contract source code");
    console.log("5. Select compiler version: 0.8.28");
    console.log("6. Set optimization: Enabled, 200 runs");
    console.log("7. Enter constructor arguments");
  } else {
    console.log("Verification is only available for Rootstock networks");
    console.log("Please use rootstockTestnet or rootstockMainnet");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

