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
  PRIVATE_KEY: z
    .string()
    .min(1, "PRIVATE_KEY is required")
    .refine(
      (val) => {
        const withoutPrefix = val.startsWith("0x") ? val.slice(2) : val;
        return /^[a-fA-F0-9]{64}$/.test(withoutPrefix);
      },
      "PRIVATE_KEY must be 64 hex characters (with or without 0x prefix)"
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
  const getEnv = (key: string, required: boolean = true): string => {
    const value = process.env[key];
    if (!value) {
      if (required) {
        return "";
      }
      return "";
    }
    const trimmed = value.trim();
    const unquoted = trimmed.replace(/^["']|["']$/g, "");
    return unquoted;
  };

  const rawEnv = {
    PORT: process.env.PORT,
    RSK_RPC_URL:
      process.env.RSK_TESTNET_RPC_URL ??
      process.env.RSK_MAINNET_RPC_URL ??
      process.env.RSK_RPC_URL,
    EAS_CONTRACT_ADDRESS: getEnv("EAS_CONTRACT_ADDRESS", true),
    ATTESTATION_GATE_ADDRESS: getEnv("ATTESTATION_GATE_ADDRESS", true),
    PRIVATE_KEY: getEnv("PRIVATE_KEY", true),
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
    throw new Error(
      "Invalid environment configuration. Check .env: " +
      (typeof rawEnv.PRIVATE_KEY === "string" && rawEnv.PRIVATE_KEY.length > 0
        ? "PRIVATE_KEY must be 64 hex characters."
        : "PRIVATE_KEY is required.")
    );
  }

  const normalized = {
    ...parsed.data,
    PRIVATE_KEY: parsed.data.PRIVATE_KEY.startsWith("0x")
      ? parsed.data.PRIVATE_KEY
      : `0x${parsed.data.PRIVATE_KEY}`,
  };

  return normalized;
}
