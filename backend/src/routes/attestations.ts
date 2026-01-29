import { Router } from "express";
import { z } from "zod";
import { isAddress, recoverMessageAddress } from "viem";
import {
  issueAttestationAndRegister,
  getSchemaAttestationStatus,
} from "../services/attestationService";
import { logger } from "../lib/logger";

export const router = Router();

/** Max age of the signed message (seconds). Prevents replay. */
const SIGNATURE_MAX_AGE_SEC = 300;

const issueSchema = z.object({
  address: z
    .string()
    .refine((addr) => isAddress(addr), "Invalid address")
    .transform((addr) => addr as `0x${string}`),
  schemaType: z.enum(["nft", "vault"]),
  statement: z.string().optional().or(z.literal(undefined)),
  signature: z.string().min(1, "Signature is required").refine(
    (s) => /^0x[a-fA-F0-9]+$/.test(s),
    "Invalid signature format"
  ),
  timestamp: z.number().int().positive("Timestamp is required"),
});

function buildAttestationMessage(address: string, timestamp: number): string {
  return `Request attestation for ${address} at ${timestamp}`;
}

router.post("/issue", async (req, res) => {
  try {
    const parsed = issueSchema.safeParse(req.body);
    if (!parsed.success) {
      const isProd = process.env.NODE_ENV === "production";
      return res.status(400).json({
        error: "Invalid request body",
        ...(isProd ? {} : { details: parsed.error.format() }),
      });
    }

    const { address, signature, timestamp, schemaType, statement } = parsed.data;

    // Replay protection: timestamp must be within last SIGNATURE_MAX_AGE_SEC
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - timestamp) > SIGNATURE_MAX_AGE_SEC) {
      logger.debug("Attestation request rejected: timestamp out of window", {
        timestamp,
        nowSec,
        maxAge: SIGNATURE_MAX_AGE_SEC,
      });
      return res.status(401).json({ error: "Invalid or expired signature" });
    }

    const message = buildAttestationMessage(address, timestamp);
    let recovered: `0x${string}`;
    try {
      recovered = await recoverMessageAddress({
        message,
        signature: signature as `0x${string}`,
      });
    } catch (e) {
      logger.debug("Attestation request rejected: signature recovery failed", e);
      return res.status(401).json({ error: "Invalid signature" });
    }

    if (recovered.toLowerCase() !== address.toLowerCase()) {
      logger.debug("Attestation request rejected: signer mismatch", {
        recovered: recovered.toLowerCase(),
        requested: address.toLowerCase(),
      });
      return res.status(401).json({ error: "Invalid signature" });
    }

    const result = await issueAttestationAndRegister({
      address,
      schemaType,
      statement,
    });

    res.status(201).json({
      uid: result.uid,
      txHashAttest: result.txHashAttest,
      txHashRegister: result.txHashRegister,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error issuing attestation:", err.message);
    if (process.env.NODE_ENV !== "production") {
      logger.debug("Stack:", err.stack);
    }
    res.status(500).json({
      error: "Failed to issue attestation",
      details: err.message,
    });
  }
});

const statusQuerySchema = z.object({
  schemaType: z.enum(["nft", "vault"]).default("nft"),
});

router.get("/:address/status", async (req, res) => {
  try {
    const address = req.params.address;
    if (!isAddress(address)) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const queryParsed = statusQuerySchema.safeParse(req.query);
    if (!queryParsed.success) {
      return res.status(400).json({
        error: "Invalid query parameters",
        details: queryParsed.error.format(),
      });
    }

    const { schemaType } = queryParsed.data;

    const status = await getSchemaAttestationStatus({
      address: address as `0x${string}`,
      schemaType,
    });

    res.json({
      address,
      schemaType,
      hasValid: status.hasValid,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error fetching attestation status:", err.message);
    res.status(500).json({
      error: "Failed to fetch attestation status",
      details: err.message,
    });
  }
});
