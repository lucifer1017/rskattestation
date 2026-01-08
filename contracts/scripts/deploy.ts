import { network } from "hardhat";
import { parseEther } from "viem";

/**
 * @title Deployment Helper Script
 * @notice Helper script to deploy contracts using Hardhat Ignition
 * @usage npx hardhat run scripts/deploy.ts --network rootstockTestnet
 */
async function main() {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();

  console.log("Deploying contracts...");
  console.log("Network:", network.name);
  console.log("Deployer:", deployer.account.address);
  console.log("Balance:", await publicClient.getBalance({ address: deployer.account.address }));

  // Determine EAS address based on network
  let easAddress: string;
  if (network.name === "rootstockMainnet") {
    easAddress = "0x54C0726E9d2D57Bc37AD52c7E219A3229e0eE963";
    console.log("Using Rootstock Mainnet EAS address");
  } else {
    easAddress = "0xc300aeEaDd60999933468738c9F5D7e9C0671e1c";
    console.log("Using Rootstock Testnet EAS address");
  }

  console.log("\n=== Deployment Instructions ===");
  console.log("To deploy contracts, use Hardhat Ignition:");
  console.log("\n1. Deploy AttestationGate:");
  console.log(
    `   npx hardhat ignition deploy ignition/modules/AttestationGate.ts --network ${network.name} --parameters '{"AttestationGateModule":{"easAddress":"${easAddress}"}}'`
  );

  console.log("\n2. After AttestationGate is deployed, deploy GatedNFTMinter:");
  console.log(
    `   npx hardhat ignition deploy ignition/modules/GatedNFTMinter.ts --network ${network.name} --parameters '{"GatedNFTMinterModule":{"attestationGateAddress":"<ATTESTATION_GATE_ADDRESS>","requiredSchemaUID":"<SCHEMA_UID>"}}'`
  );

  console.log("\n3. (Optional) Deploy GatedVault:");
  console.log(
    `   npx hardhat ignition deploy ignition/modules/GatedVault.ts --network ${network.name} --parameters '{"GatedVaultModule":{"attestationGateAddress":"<ATTESTATION_GATE_ADDRESS>","tokenAddress":"<TOKEN_ADDRESS>","requiredSchemaUID":"<SCHEMA_UID>"}}'`
  );

  console.log("\n=== Or deploy all at once ===");
  console.log(
    `   npx hardhat ignition deploy ignition/modules/CompleteDeployment.ts --network ${network.name} --parameters '{"CompleteDeploymentModule":{"easAddress":"${easAddress}","nftSchemaUID":"<SCHEMA_UID>","vaultSchemaUID":"<SCHEMA_UID>","tokenAddress":"<TOKEN_ADDRESS>"}}'`
  );

  console.log("\n=== Important Notes ===");
  console.log("- Schema UIDs must be obtained after registering schemas on Schema Registry");
  console.log("- Token address is required only for GatedVault deployment");
  console.log("- Make sure you have RBTC in your deployer account for gas fees");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

