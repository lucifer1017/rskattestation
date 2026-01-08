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
  // For now, keep data minimal and generic; can be extended per schema
  statement?: string | undefined;
}

export interface IssueAttestationResult {
  uid: Hex;
  txHashAttest: string;
  txHashRegister: Hex;
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
      // Simple schema: string statement
      return {
        schemaUID: env.NFT_SCHEMA_UID as Hex,
        encoder: new SchemaEncoder("string statement"),
      };
    }
    case "vault": {
      if (!env.VAULT_SCHEMA_UID) {
        throw new Error("VAULT_SCHEMA_UID is not configured");
      }
      // Simple schema: string statement
      return {
        schemaUID: env.VAULT_SCHEMA_UID as Hex,
        encoder: new SchemaEncoder("string statement"),
      };
    }
    default:
      throw new Error(`Unsupported schema type: ${schemaType}`);
  }
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

  const expirationTime = BigInt(0); // no expiration by default; can be adjusted
  const revocable = true;

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

  const uidString = await tx.wait();
  const uid = uidString as Hex;

  const txHashRegister = await registerAttestationOnChain({
    user: params.address,
    attestationUID: uid,
    schemaUID,
  });

  return {
    uid,
    txHashAttest: tx as unknown as string,
    txHashRegister,
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


