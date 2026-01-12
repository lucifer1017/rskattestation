import { Router } from "express";
import { z } from "zod";
import { isAddress } from "viem";
import {
  issueAttestationAndRegister,
  getSchemaAttestationStatus,
} from "../services/attestationService";

export const router = Router();

const issueSchema = z.object({
  address: z
    .string()
    .refine((addr) => isAddress(addr), "Invalid address")
    .transform((addr) => addr as `0x${string}`),
  schemaType: z.enum(["nft", "vault"]),
  statement: z.string().optional().or(z.literal(undefined)),
});

router.post("/issue", async (req, res) => {
  try {
    const parsed = issueSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.format(),
      });
    }

    const result = await issueAttestationAndRegister(parsed.data);

    res.status(201).json({
      uid: result.uid,
      txHashAttest: result.txHashAttest,
      txHashRegister: result.txHashRegister,
    });
  } catch (error: any) {
    console.error("Error issuing attestation:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    res.status(500).json({
      error: "Failed to issue attestation",
      details: error.message ?? String(error),
      ...(error.code && { code: error.code }),
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
  } catch (error: any) {
    console.error("Error fetching attestation status:", error);
    res.status(500).json({
      error: "Failed to fetch attestation status",
      details: error.message ?? String(error),
    });
  }
});
