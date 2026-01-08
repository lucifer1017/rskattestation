import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { loadEnv } from "./config/env";
import { router as healthRouter } from "./routes/health";
import { router as attestationsRouter } from "./routes/attestations";

dotenv.config();
const env = loadEnv();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/attestations", attestationsRouter);

const port = env.PORT;

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});


