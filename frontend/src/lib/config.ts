/**
 * Require an environment variable and throw if missing.
 * This ensures the app fails fast at startup if misconfigured.
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Please add it to your .env or .env.local file in the frontend directory.`
    );
  }
  return value;
}

export const config = {
  rskRpcUrl:
    process.env.NEXT_PUBLIC_RSK_RPC_URL ||
    "https://public-node.testnet.rsk.co",
  backendUrl:
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000",
  contracts: {
    attestationGate: requireEnv("NEXT_PUBLIC_ATTESTATION_GATE_ADDRESS") as `0x${string}`,
    gatedNFTMinter: requireEnv("NEXT_PUBLIC_GATED_NFT_MINTER_ADDRESS") as `0x${string}`,
  },
  schemas: {
    nft: process.env.NEXT_PUBLIC_NFT_SCHEMA_UID as `0x${string}` | undefined,
    vault: process.env.NEXT_PUBLIC_VAULT_SCHEMA_UID as
      | `0x${string}`
      | undefined,
  },
} as const;

