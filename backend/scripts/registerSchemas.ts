import * as dotenv from "dotenv";
dotenv.config();

import { SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { JsonRpcProvider, Wallet, getAddress, solidityPackedKeccak256 } from "ethers";
import { loadEnv } from "../src/config/env";

function computeSchemaUID(schema: string, resolver: string, revocable: boolean): string {
  return solidityPackedKeccak256(
    ["string", "address", "bool"],
    [schema, resolver, revocable]
  );
}

async function registerSchemas() {
  const env = loadEnv();

  const provider = new JsonRpcProvider(env.RSK_RPC_URL);
  const wallet = new Wallet(env.BACKEND_PRIVATE_KEY, provider);

  const SCHEMA_REGISTRY_TESTNET = getAddress("0x679c62956cd2801ababf80e9d430f18859eea2d5");
  const SCHEMA_REGISTRY_MAINNET = getAddress("0xef29675d82cc5967069d6d9c17f2719f67728f5b");

  const isMainnet = env.RSK_RPC_URL.includes("mainnet") || env.RSK_RPC_URL.includes("rskmain");
  const schemaRegistryAddress = isMainnet ? SCHEMA_REGISTRY_MAINNET : SCHEMA_REGISTRY_TESTNET;

  const resolverAddress = getAddress("0x0000000000000000000000000000000000000000");

  console.log(`\n📝 Schema Registry: ${schemaRegistryAddress}`);
  console.log(`🔗 RPC: ${env.RSK_RPC_URL}`);
  console.log(`👤 Wallet: ${wallet.address}`);
  console.log(`🔧 Resolver: ${resolverAddress}\n`);

  const schemaRegistry = new SchemaRegistry(schemaRegistryAddress);
  schemaRegistry.connect(wallet);

  const schemaDefinition = "string statement";
  const schemas = [
    { name: "NFT Gating Schema", envVar: "NFT_SCHEMA_UID" },
    { name: "Vault Gating Schema", envVar: "VAULT_SCHEMA_UID" },
  ];

  const results: Array<{ name: string; uid: string; envVar: string }> = [];

  for (const schema of schemas) {
    console.log(`\n📋 ${schema.name}`);
    console.log(`   Definition: "${schemaDefinition}"`);

    const expectedUID = computeSchemaUID(schemaDefinition, resolverAddress, true);
    console.log(`   Expected UID: ${expectedUID}`);

    try {
      try {
        const existing = await schemaRegistry.getSchema({ uid: expectedUID });
        if (existing && existing.uid) {
          console.log(`   ✅ Schema already registered!`);
          console.log(`   📌 UID: ${existing.uid}`);
          results.push({ name: schema.name, uid: existing.uid, envVar: schema.envVar });
          continue;
        }
      } catch (e: any) {
        if (!e.message?.includes("NotFound") && !e.message?.includes("not found")) {
          console.log(`   ⚠️  Could not check existing schema: ${e.message}`);
        }
      }

      console.log(`   ⏳ Registering...`);
      const tx = await schemaRegistry.register({
        schema: schemaDefinition,
        resolverAddress,
        revocable: true,
      });

      console.log(`   ⏳ Waiting for confirmation...`);
      const uid = await tx.wait();

      console.log(`   ✅ Registered!`);
      console.log(`   📌 UID: ${uid}`);

      results.push({ name: schema.name, uid, envVar: schema.envVar });
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      const errorData = error.data || error.reason || "";
      
      console.error(`   ❌ Error: ${errorMsg}`);
      
      if (
        errorMsg.includes("AlreadyExists") ||
        errorMsg.includes("already exists") ||
        errorMsg.includes("0x23369fa6") || // SchemaAlreadyExists error selector
        errorData.includes("AlreadyExists")
      ) {
        console.log(`   ℹ️  Schema already exists - using computed UID`);
        results.push({ name: schema.name, uid: expectedUID, envVar: schema.envVar });
      } else if (errorMsg.includes("CALL_EXCEPTION") || errorMsg.includes("execution reverted")) {
        console.log(`   ⚠️  Transaction would revert - schema may already exist`);
        console.log(`   💡 Trying to use computed UID: ${expectedUID}`);
        results.push({ name: schema.name, uid: expectedUID, envVar: schema.envVar });
      } else {
        console.error(`   ❌ Unexpected error - check the error details above`);
        throw error;
      }
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`\n🎉 SUMMARY - Add these to your .env file:\n`);
  for (const r of results) {
    console.log(`${r.envVar}=${r.uid}`);
  }
  console.log(`\n${"=".repeat(60)}\n`);
}

registerSchemas().catch((error) => {
  console.error("\n❌ Fatal error:", error.message || error);
  process.exit(1);
});
