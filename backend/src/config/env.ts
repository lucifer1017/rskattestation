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
    .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid BACKEND_PRIVATE_KEY"),
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
  const parsed = envSchema.safeParse({
    PORT: process.env.PORT,
    RSK_RPC_URL:
      process.env.RSK_TESTNET_RPC_URL ??
      process.env.RSK_MAINNET_RPC_URL ??
      process.env.RSK_RPC_URL,
    EAS_CONTRACT_ADDRESS: process.env.EAS_CONTRACT_ADDRESS,
    ATTESTATION_GATE_ADDRESS: process.env.ATTESTATION_GATE_ADDRESS,
    BACKEND_PRIVATE_KEY: process.env.BACKEND_PRIVATE_KEY,
    NFT_SCHEMA_UID: process.env.NFT_SCHEMA_UID,
    VAULT_SCHEMA_UID: process.env.VAULT_SCHEMA_UID,
  });

  if (!parsed.success) {
    console.error("Invalid environment configuration:", parsed.error.format());
    throw new Error("Invalid environment configuration");
  }

  return parsed.data;
}


