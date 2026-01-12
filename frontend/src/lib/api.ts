/**
 * API client for backend endpoints
 */

import { config } from "./config";

export type SchemaType = "nft" | "vault";

export interface IssueAttestationRequest {
  address: `0x${string}`;
  schemaType: SchemaType;
  statement?: string;
}

export interface IssueAttestationResponse {
  uid: string;
  txHashAttest: string;
  txHashRegister: string;
}

export interface AttestationStatusResponse {
  address: string;
  schemaType: SchemaType;
  hasValid: boolean;
}

/**
 * Issue an attestation via backend
 */
export async function issueAttestation(
  data: IssueAttestationRequest
): Promise<IssueAttestationResponse> {
  const response = await fetch(`${config.backendUrl}/attestations/issue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Failed to issue attestation",
    }));
    // Include both error and details for better debugging
    const errorMessage = error.details 
      ? `${error.error || "Failed to issue attestation"}: ${error.details}`
      : error.error || error.details || "Failed to issue attestation";
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Get attestation status for an address
 */
export async function getAttestationStatus(
  address: `0x${string}`,
  schemaType: SchemaType = "nft"
): Promise<AttestationStatusResponse> {
  const response = await fetch(
    `${config.backendUrl}/attestations/${address}/status?schemaType=${schemaType}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Failed to fetch attestation status",
    }));
    throw new Error(
      error.error || error.details || "Failed to fetch attestation status"
    );
  }

  return response.json();
}

