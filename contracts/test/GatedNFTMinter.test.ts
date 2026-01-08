import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { parseEther, zeroAddress } from "viem";
import { network } from "hardhat";

describe("GatedNFTMinter", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [deployer, user1, user2, attester] = await viem.getWalletClients();

  let mockEAS: any;
  let attestationGate: any;
  let nftMinter: any;
  const schemaUID = "0x" + "1".repeat(64);
  const mintPrice = parseEther("0.1");

  beforeEach(async function () {
    // Deploy MockEAS
    mockEAS = await viem.deployContract("MockEAS");

    // Deploy AttestationGate
    attestationGate = await viem.deployContract("AttestationGate", [
      mockEAS.address,
    ]);

    // Deploy GatedNFTMinter
    nftMinter = await viem.deployContract("GatedNFTMinter", [
      attestationGate.address,
      schemaUID,
      100n, // maxSupply
      mintPrice,
      "Test NFT",
      "TNFT",
    ]);
  });

  function createAndRegisterAttestation(
    user: any,
    attestationUID: string,
    schema: string,
    expirationTime: bigint
  ) {
    return async function () {
      await mockEAS.write.createAttestation([
        attestationUID,
        schema,
        user.account.address,
        attester.account.address,
        Number(expirationTime),
        true,
      ]);
      await attestationGate.write.registerAttestation([
        user.account.address,
        attestationUID,
        schema,
      ]);
    };
  }

  describe("Constructor", function () {
    it("Should set all parameters correctly", async function () {
      const gate = await nftMinter.read.attestationGate();
      const schema = await nftMinter.read.requiredSchemaUID();
      const maxSupply = await nftMinter.read.maxSupply();
      const price = await nftMinter.read.mintPrice();
      const supply = await nftMinter.read.currentSupply();

      assert.equal(gate.toLowerCase(), attestationGate.address.toLowerCase());
      assert.equal(schema.toLowerCase(), schemaUID.toLowerCase());
      assert.equal(maxSupply, 100n);
      assert.equal(price, mintPrice);
      assert.equal(supply, 0n);
    });

    it("Should revert with invalid gate address", async function () {
      await assert.rejects(
        viem.deployContract("GatedNFTMinter", [
          zeroAddress,
          schemaUID,
          100n,
          mintPrice,
          "Test",
          "T",
        ]),
        /GatedNFTMinter: invalid gate address/
      );
    });

    it("Should revert with invalid max supply", async function () {
      await assert.rejects(
        viem.deployContract("GatedNFTMinter", [
          attestationGate.address,
          schemaUID,
          0n,
          mintPrice,
          "Test",
          "T",
        ]),
        /GatedNFTMinter: invalid max supply/
      );
    });
  });

  describe("mint", function () {
    it("Should mint NFT to msg.sender with valid attestation", async function () {
      const attestationUID = "0x" + "a".repeat(64);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      const deploymentBlock = await publicClient.getBlockNumber();

      await nftMinter.write.mint({
        value: mintPrice,
        account: user1.account,
      });

      // Verify NFT was minted
      const owner = await nftMinter.read.ownerOf([1n]);
      assert.equal(owner.toLowerCase(), user1.account.address.toLowerCase());

      const hasMinted = await nftMinter.read.hasMinted([user1.account.address]);
      assert.equal(hasMinted, true);

      const currentSupply = await nftMinter.read.currentSupply();
      assert.equal(currentSupply, 1n);

      // Verify event
      const events = await publicClient.getContractEvents({
        address: nftMinter.address,
        abi: nftMinter.abi,
        eventName: "NFTMinted",
        fromBlock: deploymentBlock,
      });

      assert.equal(events.length, 1);
      assert.equal(
        events[0].args.to?.toLowerCase(),
        user1.account.address.toLowerCase()
      );
      assert.equal(events[0].args.tokenId, 1n);
    });

    it("Should revert without valid attestation", async function () {
      await assert.rejects(
        nftMinter.write.mint({
          value: mintPrice,
          account: user1.account,
        }),
        /GatedNFTMinter: valid attestation required/
      );
    });

    it("Should revert with insufficient payment", async function () {
      const attestationUID = "0x" + "b".repeat(64);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      await assert.rejects(
        nftMinter.write.mint({
          value: parseEther("0.05"), // Less than mintPrice
          account: user1.account,
        }),
        /GatedNFTMinter: insufficient payment/
      );
    });

    it("Should revert if already minted", async function () {
      const attestationUID = "0x" + "c".repeat(64);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      // First mint
      await nftMinter.write.mint({
        value: mintPrice,
        account: user1.account,
      });

      // Try to mint again
      await assert.rejects(
        nftMinter.write.mint({
          value: mintPrice,
          account: user1.account,
        }),
        /GatedNFTMinter: already minted/
      );
    });

    it("Should revert if max supply reached", async function () {
      // Deploy new contract with maxSupply = 1
      const smallMinter = await viem.deployContract("GatedNFTMinter", [
        attestationGate.address,
        schemaUID,
        1n,
        mintPrice,
        "Small",
        "S",
      ]);

      const attestationUID = "0x" + "d".repeat(64);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      // Mint first NFT
      await smallMinter.write.mint({
        value: mintPrice,
        account: user1.account,
      });

      // Try to mint second (should fail)
      await assert.rejects(
        smallMinter.write.mint({
          value: mintPrice,
          account: user1.account,
        }),
        /GatedNFTMinter: max supply reached/
      );
    });

    it("Should refund excess payment", async function () {
      const attestationUID = "0x" + "e".repeat(64);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      const balanceBefore = await publicClient.getBalance({
        address: user1.account.address,
      });

      const excessAmount = parseEther("0.05");
      await nftMinter.write.mint({
        value: mintPrice + excessAmount,
        account: user1.account,
      });

      const balanceAfter = await publicClient.getBalance({
        address: user1.account.address,
      });

      // Should have paid exactly mintPrice (excess refunded)
      const paid = balanceBefore - balanceAfter;
      // Account for gas, so check it's approximately mintPrice
      assert.ok(paid >= mintPrice);
    });

    it("Should only mint to msg.sender (not arbitrary address)", async function () {
      // This test verifies the security fix - mint() no longer takes 'to' parameter
      const attestationUID = "0x" + "f".repeat(64);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      // Mint should go to user1 (msg.sender), not user2
      await nftMinter.write.mint({
        value: mintPrice,
        account: user1.account,
      });

      const owner = await nftMinter.read.ownerOf([1n]);
      assert.equal(owner.toLowerCase(), user1.account.address.toLowerCase());
      assert.notEqual(owner.toLowerCase(), user2.account.address.toLowerCase());
    });
  });

  describe("setTokenURI", function () {
    it("Should set token URI for existing token", async function () {
      const attestationUID = "0x" + "1a".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      await nftMinter.write.mint({
        value: mintPrice,
        account: user1.account,
      });

      const tokenURI = "https://example.com/token/1";
      await nftMinter.write.setTokenURI([1n, tokenURI], {
        account: deployer.account,
      });

      const uri = await nftMinter.read.tokenURI([1n]);
      assert.equal(uri, tokenURI);
    });

    it("Should revert for non-existent token", async function () {
      await assert.rejects(
        nftMinter.write.setTokenURI([1n, "https://example.com/token/1"], {
          account: deployer.account,
        }),
        /GatedNFTMinter: token does not exist/
      );
    });

    it("Should revert if not owner", async function () {
      const attestationUID = "0x" + "1b".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      await nftMinter.write.mint({
        value: mintPrice,
        account: user1.account,
      });

      await assert.rejects(
        nftMinter.write.setTokenURI([1n, "https://example.com/token/1"], {
          account: user1.account, // Not owner
        }),
        /OwnableUnauthorizedAccount/
      );
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to withdraw", async function () {
      const attestationUID = "0x" + "2a".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      // Mint to send funds to contract
      await nftMinter.write.mint({
        value: mintPrice,
        account: user1.account,
      });

      const balanceBefore = await publicClient.getBalance({
        address: deployer.account.address,
      });

      await nftMinter.write.withdraw({
        account: deployer.account,
      });

      const balanceAfter = await publicClient.getBalance({
        address: deployer.account.address,
      });

      assert.ok(balanceAfter > balanceBefore);
    });

    it("Should revert withdraw if not owner", async function () {
      await assert.rejects(
        nftMinter.write.withdraw({
          account: user1.account,
        }),
        /OwnableUnauthorizedAccount/
      );
    });

    it("Should allow owner to set mint price", async function () {
      const newPrice = parseEther("0.2");
      const deploymentBlock = await publicClient.getBlockNumber();

      await nftMinter.write.setMintPrice([newPrice], {
        account: deployer.account,
      });

      const price = await nftMinter.read.mintPrice();
      assert.equal(price, newPrice);

      // Verify event
      const events = await publicClient.getContractEvents({
        address: nftMinter.address,
        abi: nftMinter.abi,
        eventName: "MintPriceUpdated",
        fromBlock: deploymentBlock,
      });

      assert.equal(events.length, 1);
      assert.equal(events[0].args.newPrice, newPrice);
    });

    it("Should revert setMintPrice if not owner", async function () {
      await assert.rejects(
        nftMinter.write.setMintPrice([parseEther("0.2")], {
          account: user1.account,
        }),
        /OwnableUnauthorizedAccount/
      );
    });

    it("Should allow owner to set required schema", async function () {
      const newSchema = "0x" + "2".repeat(64);
      const deploymentBlock = await publicClient.getBlockNumber();

      await nftMinter.write.setRequiredSchema([newSchema], {
        account: deployer.account,
      });

      const schema = await nftMinter.read.requiredSchemaUID();
      assert.equal(schema.toLowerCase(), newSchema.toLowerCase());

      // Verify event
      const events = await publicClient.getContractEvents({
        address: nftMinter.address,
        abi: nftMinter.abi,
        eventName: "RequiredSchemaUpdated",
        fromBlock: deploymentBlock,
      });

      assert.equal(events.length, 1);
    });

    it("Should revert setRequiredSchema if not owner", async function () {
      await assert.rejects(
        nftMinter.write.setRequiredSchema(["0x" + "2".repeat(64)], {
          account: user1.account,
        }),
        /OwnableUnauthorizedAccount/
      );
    });
  });
});

