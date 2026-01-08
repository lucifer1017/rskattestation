import {
  createPublicClient,
  createWalletClient,
  http,
  type Hex,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { loadEnv } from "../config/env";

// Minimal ABI for AttestationGate
const ATTESTATION_GATE_ABI = [
  {
    type: "function",
    name: "registerAttestation",
    stateMutability: "nonpayable",
    inputs: [
      { name: "user", type: "address" },
      { name: "attestationUID", type: "bytes32" },
      { name: "schemaUID", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "hasValidAttestation",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "valid", type: "bool" }],
  },
  {
    type: "function",
    name: "hasValidAttestationOfSchema",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "schemaUID", type: "bytes32" },
    ],
    outputs: [{ name: "valid", type: "bool" }],
  },
  {
    type: "function",
    name: "getUserAttestationUID",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "uid", type: "bytes32" }],
  },
] as const;

const env = loadEnv();

const transport = http(env.RSK_RPC_URL);

const publicClient = createPublicClient({
  transport,
});

const account = privateKeyToAccount(env.BACKEND_PRIVATE_KEY as Hex);

const walletClient = createWalletClient({
  account,
  transport,
});

const attestationGateAddress = env.ATTESTATION_GATE_ADDRESS as Address;

export async function registerAttestationOnChain(params: {
  user: Address;
  attestationUID: Hex;
  schemaUID: Hex;
}): Promise<Hex> {
  const txHash = await walletClient.writeContract({
    address: attestationGateAddress,
    abi: ATTESTATION_GATE_ABI,
    functionName: "registerAttestation",
    args: [params.user, params.attestationUID, params.schemaUID],
  } as any);

  return txHash;
}

export async function hasValidAttestation(user: Address): Promise<boolean> {
  const result = await publicClient.readContract({
    address: attestationGateAddress,
    abi: ATTESTATION_GATE_ABI,
    functionName: "hasValidAttestation",
    args: [user],
  });
  return result as boolean;
}

export async function hasValidAttestationOfSchema(
  user: Address,
  schemaUID: Hex,
): Promise<boolean> {
  const result = await publicClient.readContract({
    address: attestationGateAddress,
    abi: ATTESTATION_GATE_ABI,
    functionName: "hasValidAttestationOfSchema",
    args: [user, schemaUID],
  });
  return result as boolean;
}

export async function getUserAttestationUID(user: Address): Promise<Hex> {
  const result = await publicClient.readContract({
    address: attestationGateAddress,
    abi: ATTESTATION_GATE_ABI,
    functionName: "getUserAttestationUID",
    args: [user],
  });
  return result as Hex;
}


