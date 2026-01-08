import { Router } from "express";
import { loadEnv } from "../config/env";

export const router = Router();

router.get("/", async (_req, res) => {
  try {
    const env = loadEnv();
    res.json({
      status: "ok",
      network: process.env.NODE_ENV ?? "development",
      rskRpcUrl: env.RSK_RPC_URL ? "configured" : "missing",
    });
  } catch (error) {
    res.status(500).json({ status: "error", error: "Invalid configuration" });
  }
});


