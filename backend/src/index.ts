import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import { loadEnv } from "./config/env";
import { logger } from "./lib/logger";
import { router as healthRouter } from "./routes/health";
import { router as attestationsRouter } from "./routes/attestations";

const env = loadEnv();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/attestations", attestationsRouter);

const port = env.PORT;

app.listen(port, () => {
  logger.info(`Backend listening on port ${port}`);
});
