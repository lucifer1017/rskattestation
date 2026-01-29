const attestationGateAddress = process.env.NEXT_PUBLIC_ATTESTATION_GATE_ADDRESS;
const gatedNFTMinterAddress = process.env.NEXT_PUBLIC_GATED_NFT_MINTER_ADDRESS;

if (!attestationGateAddress) {
  throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_ATTESTATION_GATE_ADDRESS. " +
    "Please add it to your .env or .env.local file in the frontend directory."
  );
}

if (!gatedNFTMinterAddress) {
  throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_GATED_NFT_MINTER_ADDRESS. " +
    "Please add it to your .env or .env.local file in the frontend directory."
  );
}

export const config = {
  rskRpcUrl:
    process.env.NEXT_PUBLIC_RSK_RPC_URL ||
    "https://public-node.testnet.rsk.co",
  backendUrl:
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000",
  contracts: {
    attestationGate: attestationGateAddress as `0x${string}`,
    gatedNFTMinter: gatedNFTMinterAddress as `0x${string}`,
  },
} as const;

