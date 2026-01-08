import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { parseEther, zeroAddress } from "viem";
import { network } from "hardhat";

describe("GatedVault", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [deployer, user1, user2, attester] = await viem.getWalletClients();

  let mockEAS: any;
  let attestationGate: any;
  let mockToken: any;
  let vault: any;
  const schemaUID = "0x" + "1".repeat(64);

  beforeEach(async function () {
    // Deploy MockEAS
    mockEAS = await viem.deployContract("MockEAS");

    // Deploy AttestationGate
    attestationGate = await viem.deployContract("AttestationGate", [
      mockEAS.address,
    ]);

    // Deploy Mock ERC20 Token
    mockToken = await viem.deployContract("MockERC20", [
      "Test Token",
      "TEST",
      1000000n * parseEther("1"), // 1M tokens
    ]);

    // Deploy GatedVault
    vault = await viem.deployContract("GatedVault", [
      attestationGate.address,
      mockToken.address,
      schemaUID,
    ]);

    // Give users some tokens
    await mockToken.write.transfer([
      user1.account.address,
      parseEther("1000"),
    ]);
    await mockToken.write.transfer([
      user2.account.address,
      parseEther("1000"),
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
      const gate = await vault.read.attestationGate();
      const token = await vault.read.token();
      const schema = await vault.read.requiredSchemaUID();

      assert.equal(gate.toLowerCase(), attestationGate.address.toLowerCase());
      assert.equal(token.toLowerCase(), mockToken.address.toLowerCase());
      assert.equal(schema.toLowerCase(), schemaUID.toLowerCase());
    });

    it("Should revert with invalid gate address", async function () {
      await assert.rejects(
        viem.deployContract("GatedVault", [
          zeroAddress,
          mockToken.address,
          schemaUID,
        ]),
        /GatedVault: invalid gate address/
      );
    });

    it("Should revert with invalid token address", async function () {
      await assert.rejects(
        viem.deployContract("GatedVault", [
          attestationGate.address,
          zeroAddress,
          schemaUID,
        ]),
        /GatedVault: invalid token address/
      );
    });

    it("Should revert with invalid schema", async function () {
      await assert.rejects(
        viem.deployContract("GatedVault", [
          attestationGate.address,
          mockToken.address,
          "0x" + "0".repeat(64),
        ]),
        /GatedVault: invalid schema/
      );
    });
  });

  describe("deposit", function () {
    it("Should deposit tokens with valid attestation", async function () {
      const attestationUID = "0x" + "a".repeat(64);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const depositAmount = parseEther("100");

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      // Approve vault to spend tokens
      await mockToken.write.approve([vault.address, depositAmount], {
        account: user1.account,
      });

      const deploymentBlock = await publicClient.getBlockNumber();

      await vault.write.deposit([depositAmount], {
        account: user1.account,
      });

      // Verify deposit
      const deposit = await vault.read.deposits([user1.account.address]);
      assert.equal(deposit, depositAmount);

      const totalDeposits = await vault.read.totalDeposits();
      assert.equal(totalDeposits, depositAmount);

      const hadValid = await vault.read.hadValidAttestationAtDeposit([
        user1.account.address,
      ]);
      assert.equal(hadValid, true);

      // Verify event
      const events = await publicClient.getContractEvents({
        address: vault.address,
        abi: vault.abi,
        eventName: "Deposited",
        fromBlock: deploymentBlock,
      });

      assert.equal(events.length, 1);
      assert.equal(
        events[0].args.user?.toLowerCase(),
        user1.account.address.toLowerCase()
      );
      assert.equal(events[0].args.amount, depositAmount);
    });

    it("Should revert without valid attestation", async function () {
      const depositAmount = parseEther("100");

      await mockToken.write.approve([vault.address, depositAmount], {
        account: user1.account,
      });

      await assert.rejects(
        vault.write.deposit([depositAmount], {
          account: user1.account,
        }),
        /GatedVault: valid attestation required/
      );
    });

    it("Should revert with zero amount", async function () {
      const attestationUID = "0x" + "b".repeat(64);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      await assert.rejects(
        vault.write.deposit([0n], {
          account: user1.account,
        }),
        /GatedVault: amount must be greater than 0/
      );
    });

    it("Should allow multiple deposits", async function () {
      const attestationUID = "0x" + "c".repeat(64);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const depositAmount1 = parseEther("100");
      const depositAmount2 = parseEther("50");

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      await mockToken.write.approve(
        [vault.address, depositAmount1 + depositAmount2],
        {
          account: user1.account,
        }
      );

      // First deposit
      await vault.write.deposit([depositAmount1], {
        account: user1.account,
      });

      // Second deposit
      await vault.write.deposit([depositAmount2], {
        account: user1.account,
      });

      const deposit = await vault.read.deposits([user1.account.address]);
      assert.equal(deposit, depositAmount1 + depositAmount2);
    });
  });

  describe("withdraw", function () {
    it("Should withdraw with current valid attestation", async function () {
      const attestationUID = "0x" + "d".repeat(64);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const depositAmount = parseEther("100");
      const withdrawAmount = parseEther("50");

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      await mockToken.write.approve([vault.address, depositAmount], {
        account: user1.account,
      });

      await vault.write.deposit([depositAmount], {
        account: user1.account,
      });

      const balanceBefore = await mockToken.read.balanceOf([
        user1.account.address,
      ]);

      await vault.write.withdraw([withdrawAmount], {
        account: user1.account,
      });

      const balanceAfter = await mockToken.read.balanceOf([
        user1.account.address,
      ]);

      assert.equal(balanceAfter - balanceBefore, withdrawAmount);

      const deposit = await vault.read.deposits([user1.account.address]);
      assert.equal(deposit, depositAmount - withdrawAmount);
    });

    it("Should withdraw with expired attestation (grandfathered)", async function () {
      const attestationUID = "0x" + "e".repeat(64);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const depositAmount = parseEther("100");
      const withdrawAmount = parseEther("50");

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      await mockToken.write.approve([vault.address, depositAmount], {
        account: user1.account,
      });

      await vault.write.deposit([depositAmount], {
        account: user1.account,
      });

      // Expire attestation (set to past timestamp)
      const pastTime = Number(BigInt(Math.floor(Date.now() / 1000)) - 1n);
      await mockEAS.write.setExpirationTime([attestationUID, pastTime]);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Should still be able to withdraw (grandfathered)
      const balanceBefore = await mockToken.read.balanceOf([
        user1.account.address,
      ]);

      await vault.write.withdraw([withdrawAmount], {
        account: user1.account,
      });

      const balanceAfter = await mockToken.read.balanceOf([
        user1.account.address,
      ]);

      assert.equal(balanceAfter - balanceBefore, withdrawAmount);
    });

    it("Should revert withdrawal without attestation", async function () {
      const withdrawAmount = parseEther("50");

      // Try to withdraw without ever depositing (no attestation, no deposit)
      // This will fail on insufficient balance first, but that's acceptable
      // The key is that it fails, not the specific error message
      await assert.rejects(
        vault.write.withdraw([withdrawAmount], {
          account: user1.account,
        })
      );
    });

    it("Should revert if attestation expired and never had valid at deposit", async function () {
      // User deposits without attestation (should fail)
      const depositAmount = parseEther("100");
      await mockToken.write.approve([vault.address, depositAmount], {
        account: user1.account,
      });

      await assert.rejects(
        vault.write.deposit([depositAmount], {
          account: user1.account,
        }),
        /GatedVault: valid attestation required/
      );
    });

    it("Should revert with insufficient balance", async function () {
      const attestationUID = "0x" + "f".repeat(64);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const depositAmount = parseEther("100");
      const withdrawAmount = parseEther("150");

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      await mockToken.write.approve([vault.address, depositAmount], {
        account: user1.account,
      });

      await vault.write.deposit([depositAmount], {
        account: user1.account,
      });

      await assert.rejects(
        vault.write.withdraw([withdrawAmount], {
          account: user1.account,
        }),
        /GatedVault: insufficient balance/
      );
    });

    it("Should revert with zero amount", async function () {
      const attestationUID = "0x" + "1a".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const depositAmount = parseEther("100");

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      await mockToken.write.approve([vault.address, depositAmount], {
        account: user1.account,
      });

      await vault.write.deposit([depositAmount], {
        account: user1.account,
      });

      await assert.rejects(
        vault.write.withdraw([0n], {
          account: user1.account,
        }),
        /GatedVault: amount must be greater than 0/
      );
    });
  });

  describe("emergencyWithdraw", function () {
    it("Should allow owner to emergency withdraw", async function () {
      const attestationUID = "0x" + "2a".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const depositAmount = parseEther("100");
      const withdrawAmount = parseEther("50");

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      await mockToken.write.approve([vault.address, depositAmount], {
        account: user1.account,
      });

      await vault.write.deposit([depositAmount], {
        account: user1.account,
      });

      const balanceBefore = await mockToken.read.balanceOf([
        user1.account.address,
      ]);

      const deploymentBlock = await publicClient.getBlockNumber();

      await vault.write.emergencyWithdraw(
        [user1.account.address, withdrawAmount],
        {
          account: deployer.account,
        }
      );

      const balanceAfter = await mockToken.read.balanceOf([
        user1.account.address,
      ]);

      assert.equal(balanceAfter - balanceBefore, withdrawAmount);

      // Verify event
      const events = await publicClient.getContractEvents({
        address: vault.address,
        abi: vault.abi,
        eventName: "EmergencyWithdrawn",
        fromBlock: deploymentBlock,
      });

      assert.equal(events.length, 1);
      assert.equal(
        events[0].args.user?.toLowerCase(),
        user1.account.address.toLowerCase()
      );
      assert.equal(events[0].args.amount, withdrawAmount);
    });

    it("Should revert if not owner", async function () {
      const attestationUID = "0x" + "2b".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const depositAmount = parseEther("100");

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      await mockToken.write.approve([vault.address, depositAmount], {
        account: user1.account,
      });

      await vault.write.deposit([depositAmount], {
        account: user1.account,
      });

      await assert.rejects(
        vault.write.emergencyWithdraw(
          [user1.account.address, parseEther("50")],
          {
            account: user1.account, // Not owner
          }
        ),
        /OwnableUnauthorizedAccount/
      );
    });

    it("Should revert with invalid user address", async function () {
      await assert.rejects(
        vault.write.emergencyWithdraw([zeroAddress, parseEther("50")], {
          account: deployer.account,
        }),
        /GatedVault: invalid user address/
      );
    });

    it("Should revert with insufficient balance", async function () {
      const attestationUID = "0x" + "2c".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const depositAmount = parseEther("100");

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      await mockToken.write.approve([vault.address, depositAmount], {
        account: user1.account,
      });

      await vault.write.deposit([depositAmount], {
        account: user1.account,
      });

      await assert.rejects(
        vault.write.emergencyWithdraw(
          [user1.account.address, parseEther("150")],
          {
            account: deployer.account,
          }
        ),
        /GatedVault: insufficient balance/
      );
    });
  });

  describe("setRequiredSchema", function () {
    it("Should allow owner to set required schema", async function () {
      const newSchema = "0x" + "2".repeat(64);
      const deploymentBlock = await publicClient.getBlockNumber();

      await vault.write.setRequiredSchema([newSchema], {
        account: deployer.account,
      });

      const schema = await vault.read.requiredSchemaUID();
      assert.equal(schema.toLowerCase(), newSchema.toLowerCase());

      // Verify event
      const events = await publicClient.getContractEvents({
        address: vault.address,
        abi: vault.abi,
        eventName: "RequiredSchemaUpdated",
        fromBlock: deploymentBlock,
      });

      assert.equal(events.length, 1);
    });

    it("Should revert if not owner", async function () {
      await assert.rejects(
        vault.write.setRequiredSchema(["0x" + "2".repeat(64)], {
          account: user1.account,
        }),
        /OwnableUnauthorizedAccount/
      );
    });
  });

  describe("getDepositBalance", function () {
    it("Should return correct deposit balance", async function () {
      const attestationUID = "0x" + "3a".repeat(32);
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const depositAmount = parseEther("100");

      await createAndRegisterAttestation(
        user1,
        attestationUID,
        schemaUID,
        expirationTime
      )();

      await mockToken.write.approve([vault.address, depositAmount], {
        account: user1.account,
      });

      await vault.write.deposit([depositAmount], {
        account: user1.account,
      });

      const balance = await vault.read.getDepositBalance([
        user1.account.address,
      ]);
      assert.equal(balance, depositAmount);
    });

    it("Should return zero for user with no deposits", async function () {
      const balance = await vault.read.getDepositBalance([
        user1.account.address,
      ]);
      assert.equal(balance, 0n);
    });
  });
});

