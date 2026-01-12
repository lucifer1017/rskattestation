import dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";

dotenv.config();

const privateKey = process.env.BACKEND_PRIVATE_KEY;
if (!privateKey) {
  console.error("❌ BACKEND_PRIVATE_KEY not found in .env");
  process.exit(1);
}

const normalizedKey = privateKey.startsWith("0x") 
  ? (privateKey as `0x${string}`)
  : (`0x${privateKey}` as `0x${string}`);

const account = privateKeyToAccount(normalizedKey);
console.log("✅ Backend wallet address:", account.address);
console.log("\nYou can use this address as your test address for attestations!");