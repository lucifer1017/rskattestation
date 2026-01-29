/**
 * API client for backend endpoints
 */

import { config } from "./config";

export type SchemaType = "nft" | "vault";

export interface IssueAttestationRequest {
  address: `0x${string}`;
  schemaType: SchemaType;
  statement?: string;
  /** Signature of buildAttestationMessage(address, timestamp) from the wallet owning address */
  signature: `0x${string}`;
  /** Unix timestamp in seconds used in the signed message (replay protection) */
  timestamp: number;
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

/** Thrown when the backend is unreachable (network error, not 4xx/5xx). */
export class BackendUnreachableError extends Error {
  constructor(message: string, public readonly url: string) {
    super(message);
    this.name = "BackendUnreachableError";
  }
}

async function fetchWithNetworkErrorHandling(
  url: string,
  options?: RequestInit
): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (err) {
    const isNetworkFailure =
      err instanceof TypeError ||
      (err instanceof Error &&
        (err.message.includes("fetch") || err.message === "Failed to fetch"));
    const msg = isNetworkFailure
      ? `Could not reach the backend at ${url}. Make sure the backend server is running.`
      : err instanceof Error
        ? err.message
        : "Network error";
    throw new BackendUnreachableError(msg, url);
  }
}

export async function issueAttestation(
  data: IssueAttestationRequest
): Promise<IssueAttestationResponse> {
  const url = `${config.backendUrl}/attestations/issue`;
  const response = await fetchWithNetworkErrorHandling(url, {
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

export async function getAttestationStatus(
  address: `0x${string}`,
  schemaType: SchemaType = "nft"
): Promise<AttestationStatusResponse> {
  const url = `${config.backendUrl}/attestations/${address}/status?schemaType=${schemaType}`;
  const response = await fetchWithNetworkErrorHandling(url);

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

