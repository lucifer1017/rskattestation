import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import type { Address, Hex } from "viem";
import { getEAS } from "../ras/easClient";
import {
  registerAttestationOnChain,
  hasValidAttestationOfSchema,
} from "../contracts/attestationGateClient";
import { loadEnv } from "../config/env";

type SchemaType = "nft" | "vault";

export interface IssueAttestationParams {
  address: Address;
  schemaType: SchemaType;
  statement?: string | undefined;
}

export interface IssueAttestationResult {
  uid: string;
  txHashAttest: string;
  txHashRegister: string;
}

const env = loadEnv();

function getSchemaInfo(schemaType: SchemaType): {
  schemaUID: Hex;
  encoder: SchemaEncoder;
} {
  switch (schemaType) {
    case "nft": {
      if (!env.NFT_SCHEMA_UID) {
        throw new Error("NFT_SCHEMA_UID is not configured");
      }
      return {
        schemaUID: env.NFT_SCHEMA_UID as Hex,
        encoder: new SchemaEncoder("string statement"),
      };
    }
    case "vault": {
      if (!env.VAULT_SCHEMA_UID) {
        throw new Error("VAULT_SCHEMA_UID is not configured");
      }
      return {
        schemaUID: env.VAULT_SCHEMA_UID as Hex,
        encoder: new SchemaEncoder("string statement"),
      };
    }
    default:
      throw new Error(`Unsupported schema type: ${schemaType}`);
  }
}

function toHexString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "bigint") {
    return `0x${value.toString(16).padStart(64, "0")}`;
  }
  return String(value);
}

export async function issueAttestationAndRegister(
  params: IssueAttestationParams,
): Promise<IssueAttestationResult> {
  const eas = getEAS();
  const { schemaUID, encoder } = getSchemaInfo(params.schemaType);

  const encodedData = encoder.encodeData([
    {
      name: "statement",
      value:
        params.statement ??
        (params.schemaType === "nft"
          ? "User is eligible for gated NFT"
          : "User is eligible for gated vault"),
      type: "string",
    },
  ]);

  const expirationTime = BigInt(0);
  const revocable = true;

  // Send attestation transaction
  console.log("Sending attestation transaction...");
  const tx = await eas.attest({
    schema: schemaUID,
    data: {
      recipient: params.address,
      expirationTime,
      revocable,
      refUID: "0x".padEnd(66, "0") as Hex,
      data: encodedData,
    },
  });

  console.log("Transaction object received, type:", typeof tx);
  console.log("Transaction object keys:", Object.keys(tx));
  
  // Extract transaction hash from receipt
  let txHashAttest: string | null = null;
  
  // Check tx.receipt.hash (EAS SDK structure)
  if (tx && typeof tx === "object" && "receipt" in tx) {
    const receipt = (tx as any).receipt;
    if (receipt && typeof receipt === "object" && "hash" in receipt) {
      const hashValue = receipt.hash;
      if (typeof hashValue === "string" && hashValue.startsWith("0x")) {
        txHashAttest = hashValue;
        console.log("Got transaction hash from tx.receipt.hash:", txHashAttest);
      }
    }
  }
  
  // Fallback: check tx.hash directly
  if (!txHashAttest && tx && typeof tx === "object" && "hash" in tx) {
    const hashValue = (tx as any).hash;
    if (typeof hashValue === "string" && hashValue.startsWith("0x")) {
      txHashAttest = hashValue;
      console.log("Got transaction hash from tx.hash:", txHashAttest);
    }
  }
  
  if (!txHashAttest) {
    console.log("No hash found yet, will extract after confirmation");
  }

  console.log("Waiting for attestation transaction confirmation...");
  
  // Wait for confirmation and get the receipt with UID
  let uidResult: any;
  try {
    uidResult = await tx.wait();
  } catch (waitError) {
    console.error("Error waiting for attestation transaction confirmation:", waitError);
    throw new Error(`Attestation transaction failed: ${waitError instanceof Error ? waitError.message : "Unknown error"}`);
  }

  if (!uidResult) {
    throw new Error("Attestation transaction failed - no receipt returned");
  }

  console.log("Wait result type:", typeof uidResult);
  console.log("Wait result:", uidResult);

  // If we still don't have the hash, try to extract from wait result or receipt
  if (!txHashAttest) {
    // Try common receipt patterns
    if (typeof uidResult === "object" && uidResult !== null) {
      const receiptLike = uidResult as any;
      if ("transactionHash" in receiptLike && receiptLike.transactionHash) {
        txHashAttest = receiptLike.transactionHash;
      } else if ("hash" in receiptLike && receiptLike.hash) {
        txHashAttest = receiptLike.hash;
      }
    }
    
    // Final attempt: check tx.receipt again after wait
    if (!txHashAttest && tx && typeof tx === "object" && "receipt" in tx) {
      const receipt = (tx as any).receipt;
      if (receipt && typeof receipt === "object" && "hash" in receipt) {
        txHashAttest = receipt.hash;
      }
    }
  }

  if (!txHashAttest || !txHashAttest.startsWith("0x")) {
    console.error("Failed to extract transaction hash after all attempts");
    console.error("TX object structure:", JSON.stringify({
      hasTx: !!tx,
      txKeys: tx ? Object.keys(tx) : [],
      hasReceipt: tx && "receipt" in tx,
      receiptKeys: (tx && "receipt" in tx && (tx as any).receipt) ? Object.keys((tx as any).receipt) : []
    }, null, 2));
    throw new Error("Failed to extract attestation transaction hash - check logs for details");
  }

  console.log("Attestation transaction confirmed with hash:", txHashAttest);

  // Extract UID - EAS SDK returns UID as string from wait()
  const uid: string = typeof uidResult === "string" ? uidResult : toHexString(uidResult);
  console.log("Extracted attestation UID:", uid);

  // Register attestation on-chain
  const txHashRegister = await registerAttestationOnChain({
    user: params.address,
    attestationUID: uid as Hex,
    schemaUID,
  });

  return {
    uid,
    txHashAttest,
    txHashRegister: String(txHashRegister),
  };
}

export async function getSchemaAttestationStatus(params: {
  address: Address;
  schemaType: SchemaType;
}): Promise<{ hasValid: boolean }> {
  const { schemaUID } = getSchemaInfo(params.schemaType);
  const hasValid = await hasValidAttestationOfSchema(
    params.address,
    schemaUID,
  );
  return { hasValid };
}
