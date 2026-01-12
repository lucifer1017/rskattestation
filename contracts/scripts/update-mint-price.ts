import { network } from "hardhat";
import { parseEther, getAddress } from "viem";

/**
 * @title Update Mint Price
 * @notice Updates the mint price for GatedNFTMinter contract
 * @usage npx hardhat run scripts/update-mint-price.ts --network rskTestnet
 */
async function main() {
  const { viem } = await network.connect();
  const [deployer] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();

  // Contract address (deployed GatedNFTMinter)
  const nftMinterAddress = getAddress(
    process.env.NFT_MINTER_ADDRESS || "0x5e515B34A39c00Ba5C6203606CBc12bFf11fe010"
  );

  // New mint price: 0.0001 tRBTC (100000000000000 wei)
  // You can adjust this value if needed
  const newMintPrice = parseEther("0.0001"); // 0.0001 tRBTC

  console.log("=== Update Mint Price ===\n");
  console.log("Network:", network.name);
  console.log("Deployer:", deployer.account.address);
  console.log("Contract:", nftMinterAddress);
  console.log("New Mint Price:", "0.0001 tRBTC");
  console.log("New Mint Price (wei):", newMintPrice.toString());

  // Check current price
  try {
    const currentPrice = await publicClient.readContract({
      address: nftMinterAddress,
      abi: [
        {
          inputs: [],
          name: "mintPrice",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "mintPrice",
    });
    console.log("\nCurrent Mint Price (wei):", currentPrice.toString());
    console.log(
      "Current Mint Price (tRBTC):",
      (Number(currentPrice) / 1e18).toString()
    );
  } catch (error) {
    console.log("\n⚠️  Could not read current price");
  }

  // Update mint price
  console.log("\n📝 Updating mint price...");
  try {
    const hash = await deployer.writeContract({
      address: nftMinterAddress,
      abi: [
        {
          inputs: [
            {
              internalType: "uint256",
              name: "_newPrice",
              type: "uint256",
            },
          ],
          name: "setMintPrice",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
      functionName: "setMintPrice",
      args: [newMintPrice],
    });

    console.log("Transaction hash:", hash);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("✅ Transaction confirmed!");
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    // Verify new price
    const updatedPrice = await publicClient.readContract({
      address: nftMinterAddress,
      abi: [
        {
          inputs: [],
          name: "mintPrice",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "mintPrice",
    });

    console.log("\n✅ Mint price updated successfully!");
    console.log("New Mint Price (wei):", updatedPrice.toString());
    console.log(
      "New Mint Price (tRBTC):",
      (Number(updatedPrice) / 1e18).toString()
    );
    console.log(
      "\n🔗 View transaction: https://explorer.testnet.rootstock.io/tx/" +
        hash
    );
  } catch (error: any) {
    console.error("\n❌ Error updating mint price:");
    if (error.message) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
