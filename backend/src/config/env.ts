import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  RSK_RPC_URL: z.string().min(1, "RSK_RPC_URL is required"),
  EAS_CONTRACT_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EAS_CONTRACT_ADDRESS"),
  ATTESTATION_GATE_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid ATTESTATION_GATE_ADDRESS"),
  BACKEND_PRIVATE_KEY: z
    .string()
    .min(1, "BACKEND_PRIVATE_KEY is required")
    .refine(
      (val) => {
        // Accept: 64 hex chars (no 0x) OR 66 chars (0x + 64 hex)
        const withoutPrefix = val.startsWith("0x") ? val.slice(2) : val;
        return /^[a-fA-F0-9]{64}$/.test(withoutPrefix);
      },
      "BACKEND_PRIVATE_KEY must be 64 hex characters (with or without 0x prefix)"
    ),
  NFT_SCHEMA_UID: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid NFT_SCHEMA_UID")
    .optional(),
  VAULT_SCHEMA_UID: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid VAULT_SCHEMA_UID")
    .optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  // Helper to safely get and trim env var (returns empty string if missing, for Zod validation)
  const getEnv = (key: string, required: boolean = true): string => {
    const value = process.env[key];
    if (!value) {
      if (required) {
        return ""; // Return empty string so Zod can validate and show proper error
      }
      return "";
    }
    const trimmed = value.trim();
    // Remove quotes if present (common .env mistake)
    const unquoted = trimmed.replace(/^["']|["']$/g, "");
    return unquoted;
  };

  // Debug: Check for common variable name variations
  const privateKeyVariations = [
    "BACKEND_PRIVATE_KEY",
    "PRIVATE_KEY",
    "WALLET_PRIVATE_KEY",
    "DEPLOYER_PRIVATE_KEY",
  ];
  const foundPrivateKeyVar = privateKeyVariations.find((key) => process.env[key]);
  if (!process.env.BACKEND_PRIVATE_KEY && foundPrivateKeyVar) {
    console.warn(
      `⚠️  Found ${foundPrivateKeyVar} but expected BACKEND_PRIVATE_KEY. Please rename it to BACKEND_PRIVATE_KEY in your .env file.`
    );
  }

  // Convert empty strings to undefined for optional fields
  const rawEnv = {
    PORT: process.env.PORT,
    RSK_RPC_URL:
      process.env.RSK_TESTNET_RPC_URL ??
      process.env.RSK_MAINNET_RPC_URL ??
      process.env.RSK_RPC_URL,
    EAS_CONTRACT_ADDRESS: getEnv("EAS_CONTRACT_ADDRESS", true),
    ATTESTATION_GATE_ADDRESS: getEnv("ATTESTATION_GATE_ADDRESS", true),
    BACKEND_PRIVATE_KEY: getEnv("BACKEND_PRIVATE_KEY", true),
    NFT_SCHEMA_UID: (() => {
      const val = getEnv("NFT_SCHEMA_UID", false);
      return val === "" ? undefined : val;
    })(),
    VAULT_SCHEMA_UID: (() => {
      const val = getEnv("VAULT_SCHEMA_UID", false);
      return val === "" ? undefined : val;
    })(),
  };

  const parsed = envSchema.safeParse(rawEnv);

  if (!parsed.success) {
    console.error("Invalid environment configuration:", parsed.error.format());
    
    // Add helpful debug info for BACKEND_PRIVATE_KEY
    const privateKeyValue = rawEnv.BACKEND_PRIVATE_KEY;
    if (!privateKeyValue) {
      console.error("\n❌ BACKEND_PRIVATE_KEY is missing or empty in .env file");
      console.error("   Make sure you have: BACKEND_PRIVATE_KEY=... (64 hex chars, with or without 0x prefix)");
    } else {
      const preview = privateKeyValue.length > 10 
        ? `${privateKeyValue.substring(0, 10)}...` 
        : privateKeyValue;
      console.error(`\n❌ BACKEND_PRIVATE_KEY value preview: ${preview}`);
      console.error(`   Length: ${privateKeyValue.length} (expected: 64 or 66)`);
      const withoutPrefix = privateKeyValue.startsWith("0x") ? privateKeyValue.slice(2) : privateKeyValue;
      console.error(`   Hex chars (without 0x): ${withoutPrefix.length} (expected: 64)`);
    }
    
    throw new Error("Invalid environment configuration");
  }

  // Normalize private key to always have 0x prefix
  const normalized = {
    ...parsed.data,
    BACKEND_PRIVATE_KEY: parsed.data.BACKEND_PRIVATE_KEY.startsWith("0x")
      ? parsed.data.BACKEND_PRIVATE_KEY
      : `0x${parsed.data.BACKEND_PRIVATE_KEY}`,
  };

  return normalized;
}


