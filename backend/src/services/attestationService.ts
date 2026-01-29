import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import type { Address, Hex } from "viem";
import { getEAS } from "../ras/easClient";
import {
  registerAttestationOnChain,
  hasValidAttestationOfSchema,
} from "../contracts/attestationGateClient";
import { loadEnv } from "../config/env";
import { logger } from "../lib/logger";

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

  logger.debug("Sending attestation transaction...");
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

  let txHashAttest: string | null = null;

  if (tx && typeof tx === "object" && "receipt" in tx) {
    const receipt = (tx as { receipt?: { hash?: string } }).receipt;
    if (receipt?.hash && typeof receipt.hash === "string" && receipt.hash.startsWith("0x")) {
      txHashAttest = receipt.hash;
    }
  }
  if (!txHashAttest && tx && typeof tx === "object" && "hash" in tx) {
    const hashValue = (tx as { hash?: string }).hash;
    if (typeof hashValue === "string" && hashValue.startsWith("0x")) {
      txHashAttest = hashValue;
    }
  }

  logger.debug("Waiting for attestation transaction confirmation...");

  let uidResult: unknown;
  try {
    uidResult = await tx.wait();
  } catch (waitError) {
    const msg = waitError instanceof Error ? waitError.message : "Unknown error";
    logger.error("Attestation transaction confirmation failed:", msg);
    throw new Error(`Attestation transaction failed: ${msg}`);
  }

  if (!uidResult) {
    throw new Error("Attestation transaction failed - no receipt returned");
  }

  if (!txHashAttest) {
    if (typeof uidResult === "object" && uidResult !== null) {
      const receiptLike = uidResult as { transactionHash?: string; hash?: string };
      if (receiptLike.transactionHash) txHashAttest = receiptLike.transactionHash;
      else if (receiptLike.hash) txHashAttest = receiptLike.hash;
    }
    if (!txHashAttest && tx && typeof tx === "object" && "receipt" in tx) {
      const receipt = (tx as { receipt?: { hash?: string } }).receipt;
      if (receipt?.hash) txHashAttest = receipt.hash;
    }
  }

  if (!txHashAttest || !txHashAttest.startsWith("0x")) {
    logger.error("Failed to extract attestation transaction hash");
    throw new Error("Failed to extract attestation transaction hash");
  }

  logger.debug("Attestation transaction confirmed:", txHashAttest);

  const uid: string = typeof uidResult === "string" ? uidResult : toHexString(uidResult);

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
