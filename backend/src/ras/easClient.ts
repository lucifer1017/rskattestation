import { EAS } from "@ethereum-attestation-service/eas-sdk";
import { JsonRpcProvider, Wallet } from "ethers";
import { loadEnv } from "../config/env";

let easInstance: EAS | null = null;

export function getEAS(): EAS {
  if (easInstance) {
    return easInstance;
  }

  const env = loadEnv();

  const provider = new JsonRpcProvider(env.RSK_RPC_URL);
  const wallet = new Wallet(env.BACKEND_PRIVATE_KEY, provider);

  const eas = new EAS(env.EAS_CONTRACT_ADDRESS);
  eas.connect(wallet);

  easInstance = eas;
  return easInstance;
}
