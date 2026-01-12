export const config = {
  rskRpcUrl:
    process.env.NEXT_PUBLIC_RSK_RPC_URL ||
    "https://public-node.testnet.rsk.co",
  backendUrl:
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000",
  contracts: {
    attestationGate:
      (process.env.NEXT_PUBLIC_ATTESTATION_GATE_ADDRESS as `0x${string}`) ||
      "0xe022df9f57b611675B6b713307E7563D0c9abC74",
    gatedNFTMinter:
      (process.env.NEXT_PUBLIC_GATED_NFT_MINTER_ADDRESS as `0x${string}`) ||
      "0x5e515B34A39c00Ba5C6203606CBc12bFf11fe010",
  },
  schemas: {
    nft: process.env.NEXT_PUBLIC_NFT_SCHEMA_UID as `0x${string}` | undefined,
    vault: process.env.NEXT_PUBLIC_VAULT_SCHEMA_UID as
      | `0x${string}`
      | undefined,
  },
} as const;

