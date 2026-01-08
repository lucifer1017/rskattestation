import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { getAddress, zeroAddress } from "viem";
import { network } from "hardhat";

describe("AttestationGate", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [deployer, user1, user2, attester] = await viem.getWalletClients();

  let mockEAS: any;
  let attestationGate: any;
  const schemaUID = "0x" + "1".repeat(64);
  const schemaUID2 = "0x" + "2".repeat(64);

  beforeEach(async function () {
    // Deploy MockEAS
    mockEAS = await viem.deployContract("MockEAS");

    // Deploy AttestationGate
    attestationGate = await viem.deployContract("AttestationGate", [
      mockEAS.address,
    ]);
  });

  describe("Constructor", function () {
    it("Should set EAS address correctly", async function () {
      const easAddress = await attestationGate.read.easAddress();
      assert.equal(easAddress.toLowerCase(), mockEAS.address.toLowerCase());
    });

    it("Should revert with zero address", async function () {
      await assert.rejects(
        viem.deployContract("AttestationGate", [zeroAddress]),
        /AttestationGate: invalid EAS address/
      );
    });
  });

  describe("registerAttestation", function () {
    it("Should register a valid attestation", async function () {
      const attestationUID = "0x" + "a".repeat(64);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

      // Create attestation in MockEAS
      await mockEAS.write.createAttestation([
        attestationUID,
        schemaUID,
        user1.account.address,
        attester.account.address,
        Number(expirationTime),
        true,
      ]);

      // Register attestation
      await attestationGate.write.registerAttestation([
        user1.account.address,
        attestationUID,
        schemaUID,
      ]);

      // Verify registration
      const registeredUID = await attestationGate.read.userAttestations([
        user1.account.address,
      ]);
      assert.equal(registeredUID.toLowerCase(), attestationUID.toLowerCase());

      const schemaUID_registered = await attestationGate.read.userSchemaAttestations([
        user1.account.address,
        schemaUID,
      ]);
      assert.equal(schemaUID_registered.toLowerCase(), attestationUID.toLowerCase());
    });

    it("Should emit AttestationRegistered event", async function () {
      const attestationUID = "0x" + "b".repeat(64);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await mockEAS.write.createAttestation([
        attestationUID,
        schemaUID,
        user1.account.address,
        attester.account.address,
        Number(expirationTime),
        true,
      ]);

      const deploymentBlock = await publicClient.getBlockNumber();

      await attestationGate.write.registerAttestation([
        user1.account.address,
        attestationUID,
        schemaUID,
      ]);

      const events = await publicClient.getContractEvents({
        address: attestationGate.address,
        abi: attestationGate.abi,
        eventName: "AttestationRegistered",
        fromBlock: deploymentBlock,
      });

      assert.equal(events.length, 1);
      assert.equal(
        events[0].args.user?.toLowerCase(),
        user1.account.address.toLowerCase()
      );
      assert.equal(
        events[0].args.attestationUID?.toLowerCase(),
        attestationUID.toLowerCase()
      );
    });

    it("Should overwrite existing attestation for same schema", async function () {
      const attestationUID1 = "0x" + "c".repeat(64);
      const attestationUID2 = "0x" + "d".repeat(64);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      // Register first attestation
      await mockEAS.write.createAttestation([
        attestationUID1,
        schemaUID,
        user1.account.address,
        attester.account.address,
        Number(expirationTime),
        true,
      ]);
      await attestationGate.write.registerAttestation([
        user1.account.address,
        attestationUID1,
        schemaUID,
      ]);

      // Register second attestation (should overwrite)
      await mockEAS.write.createAttestation([
        attestationUID2,
        schemaUID,
        user1.account.address,
        attester.account.address,
        Number(expirationTime),
        true,
      ]);
      await attestationGate.write.registerAttestation([
        user1.account.address,
        attestationUID2,
        schemaUID,
      ]);

      // Verify second attestation is registered
      const registeredUID = await attestationGate.read.userSchemaAttestations([
        user1.account.address,
        schemaUID,
      ]);
      assert.equal(registeredUID.toLowerCase(), attestationUID2.toLowerCase());
    });

    it("Should revert with invalid user address", async function () {
      const attestationUID = "0x" + "e".repeat(64);
      await assert.rejects(
        attestationGate.write.registerAttestation([
          zeroAddress,
          attestationUID,
          schemaUID,
        ]),
        /AttestationGate: invalid user/
      );
    });

    it("Should revert with invalid UID", async function () {
      await assert.rejects(
        attestationGate.write.registerAttestation([
          user1.account.address,
          "0x" + "0".repeat(64),
          schemaUID,
        ]),
        /AttestationGate: invalid UID/
      );
    });

    it("Should revert if attestation does not exist", async function () {
      const attestationUID = "0x" + "f".repeat(64);
      await assert.rejects(
        attestationGate.write.registerAttestation([
          user1.account.address,
          attestationUID,
          schemaUID,
        ]),
        /AttestationGate: attestation does not exist/
      );
    });

    it("Should revert if recipient mismatch", async function () {
      const attestationUID = "0x" + "1a".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await mockEAS.write.createAttestation([
        attestationUID,
        schemaUID,
        user2.account.address, // Different recipient
        attester.account.address,
        Number(expirationTime),
        true,
      ]);

      await assert.rejects(
        attestationGate.write.registerAttestation([
          user1.account.address, // Trying to register for user1
          attestationUID,
          schemaUID,
        ]),
        /AttestationGate: recipient mismatch/
      );
    });

    it("Should revert if schema mismatch", async function () {
      const attestationUID = "0x" + "1b".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await mockEAS.write.createAttestation([
        attestationUID,
        schemaUID, // Different schema
        user1.account.address,
        attester.account.address,
        Number(expirationTime),
        true,
      ]);

      await assert.rejects(
        attestationGate.write.registerAttestation([
          user1.account.address,
          attestationUID,
          schemaUID2, // Wrong schema
        ]),
        /AttestationGate: schema mismatch/
      );
    });

    it("Should revert if attestation is revoked", async function () {
      const attestationUID = "0x" + "1c".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await mockEAS.write.createAttestation([
        attestationUID,
        schemaUID,
        user1.account.address,
        attester.account.address,
        Number(expirationTime),
        true,
      ]);

      // Revoke attestation
      await mockEAS.write.revokeAttestation([attestationUID]);

      await assert.rejects(
        attestationGate.write.registerAttestation([
          user1.account.address,
          attestationUID,
          schemaUID,
        ]),
        /AttestationGate: attestation revoked/
      );
    });

    it("Should revert if attestation is expired", async function () {
      const attestationUID = "0x" + "1d".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) - 3600); // Expired

      await mockEAS.write.createAttestation([
        attestationUID,
        schemaUID,
        user1.account.address,
        attester.account.address,
        Number(expirationTime),
        true,
      ]);

      await assert.rejects(
        attestationGate.write.registerAttestation([
          user1.account.address,
          attestationUID,
          schemaUID,
        ]),
        /AttestationGate: attestation expired/
      );
    });
  });

  describe("removeAttestation", function () {
    it("Should remove revoked attestation", async function () {
      const attestationUID = "0x" + "2a".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      // Register attestation
      await mockEAS.write.createAttestation([
        attestationUID,
        schemaUID,
        user1.account.address,
        attester.account.address,
        Number(expirationTime),
        true,
      ]);
      await attestationGate.write.registerAttestation([
        user1.account.address,
        attestationUID,
        schemaUID,
      ]);

      // Revoke attestation
      await mockEAS.write.revokeAttestation([attestationUID]);

      // Remove attestation
      await attestationGate.write.removeAttestation([user1.account.address]);

      // Verify removal
      const registeredUID = await attestationGate.read.userAttestations([
        user1.account.address,
      ]);
      assert.equal(registeredUID, "0x" + "0".repeat(64));
    });

    it("Should remove expired attestation", async function () {
      const attestationUID = "0x" + "2b".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      // Register attestation
      await mockEAS.write.createAttestation([
        attestationUID,
        schemaUID,
        user1.account.address,
        attester.account.address,
        Number(expirationTime),
        true,
      ]);
      await attestationGate.write.registerAttestation([
        user1.account.address,
        attestationUID,
        schemaUID,
      ]);

      // Expire attestation (set to past timestamp)
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      const pastTime = Number(currentTime - 1n);
      await mockEAS.write.setExpirationTime([attestationUID, pastTime]);

      // Wait a bit for block timestamp to advance
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Remove attestation
      await attestationGate.write.removeAttestation([user1.account.address]);

      // Verify removal
      const registeredUID = await attestationGate.read.userAttestations([
        user1.account.address,
      ]);
      assert.equal(registeredUID, "0x" + "0".repeat(64));
    });

    it("Should revert if no attestation found", async function () {
      await assert.rejects(
        attestationGate.write.removeAttestation([user1.account.address]),
        /AttestationGate: no attestation found/
      );
    });

    it("Should revert if attestation still valid", async function () {
      const attestationUID = "0x" + "2c".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await mockEAS.write.createAttestation([
        attestationUID,
        schemaUID,
        user1.account.address,
        attester.account.address,
        Number(expirationTime),
        true,
      ]);
      await attestationGate.write.registerAttestation([
        user1.account.address,
        attestationUID,
        schemaUID,
      ]);

      await assert.rejects(
        attestationGate.write.removeAttestation([user1.account.address]),
        /AttestationGate: attestation still valid/
      );
    });
  });

  describe("hasValidAttestation", function () {
    it("Should return true for valid attestation", async function () {
      const attestationUID = "0x" + "3a".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await mockEAS.write.createAttestation([
        attestationUID,
        schemaUID,
        user1.account.address,
        attester.account.address,
        Number(expirationTime),
        true,
      ]);
      await attestationGate.write.registerAttestation([
        user1.account.address,
        attestationUID,
        schemaUID,
      ]);

      const isValid = await attestationGate.read.hasValidAttestation([
        user1.account.address,
      ]);
      assert.equal(isValid, true);
    });

    it("Should return false if no attestation", async function () {
      const isValid = await attestationGate.read.hasValidAttestation([
        user1.account.address,
      ]);
      assert.equal(isValid, false);
    });

    it("Should return false for revoked attestation", async function () {
      const attestationUID = "0x" + "3b".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await mockEAS.write.createAttestation([
        attestationUID,
        schemaUID,
        user1.account.address,
        attester.account.address,
        Number(expirationTime),
        true,
      ]);
      await attestationGate.write.registerAttestation([
        user1.account.address,
        attestationUID,
        schemaUID,
      ]);

      await mockEAS.write.revokeAttestation([attestationUID]);

      const isValid = await attestationGate.read.hasValidAttestation([
        user1.account.address,
      ]);
      assert.equal(isValid, false);
    });

    it("Should return false for expired attestation", async function () {
      const attestationUID = "0x" + "3c".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600); // Valid expiry

      // Create and register attestation with valid expiry
      await mockEAS.write.createAttestation([
        attestationUID,
        schemaUID,
        user1.account.address,
        attester.account.address,
        Number(expirationTime),
        true,
      ]);
      await attestationGate.write.registerAttestation([
        user1.account.address,
        attestationUID,
        schemaUID,
      ]);

      // Expire the attestation by setting expiration time to past
      const pastTime = Number(BigInt(Math.floor(Date.now() / 1000)) - 1n);
      await mockEAS.write.setExpirationTime([attestationUID, pastTime]);

      // Wait a bit for block timestamp to advance
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Now check - should return false because attestation is expired
      const isValid = await attestationGate.read.hasValidAttestation([
        user1.account.address,
      ]);
      assert.equal(isValid, false);
    });
  });

  describe("hasValidAttestationOfSchema", function () {
    it("Should return true for valid schema attestation", async function () {
      const attestationUID = "0x" + "4a".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await mockEAS.write.createAttestation([
        attestationUID,
        schemaUID,
        user1.account.address,
        attester.account.address,
        Number(expirationTime),
        true,
      ]);
      await attestationGate.write.registerAttestation([
        user1.account.address,
        attestationUID,
        schemaUID,
      ]);

      const isValid = await attestationGate.read.hasValidAttestationOfSchema([
        user1.account.address,
        schemaUID,
      ]);
      assert.equal(isValid, true);
    });

    it("Should return false for wrong schema", async function () {
      const attestationUID = "0x" + "4b".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await mockEAS.write.createAttestation([
        attestationUID,
        schemaUID,
        user1.account.address,
        attester.account.address,
        Number(expirationTime),
        true,
      ]);
      await attestationGate.write.registerAttestation([
        user1.account.address,
        attestationUID,
        schemaUID,
      ]);

      const isValid = await attestationGate.read.hasValidAttestationOfSchema([
        user1.account.address,
        schemaUID2, // Different schema
      ]);
      assert.equal(isValid, false);
    });

    it("Should return false if no attestation for schema", async function () {
      const isValid = await attestationGate.read.hasValidAttestationOfSchema([
        user1.account.address,
        schemaUID,
      ]);
      assert.equal(isValid, false);
    });
  });

  describe("getUserAttestationUID", function () {
    it("Should return correct UID", async function () {
      const attestationUID = "0x" + "5a".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await mockEAS.write.createAttestation([
        attestationUID,
        schemaUID,
        user1.account.address,
        attester.account.address,
        Number(expirationTime),
        true,
      ]);
      await attestationGate.write.registerAttestation([
        user1.account.address,
        attestationUID,
        schemaUID,
      ]);

      const uid = await attestationGate.read.getUserAttestationUID([
        user1.account.address,
      ]);
      assert.equal(uid.toLowerCase(), attestationUID.toLowerCase());
    });

    it("Should return zero address if no attestation", async function () {
      const uid = await attestationGate.read.getUserAttestationUID([
        user1.account.address,
      ]);
      assert.equal(uid, "0x" + "0".repeat(64));
    });
  });
});

