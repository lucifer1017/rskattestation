import { http, createConfig } from "wagmi";
import { defineChain } from "viem";
import { injected, walletConnect } from "wagmi/connectors";

const rootstockTestnetConfig = defineChain({
  id: 31,
  name: "Rootstock Testnet",
  nativeCurrency: {
    name: "Rootstock Bitcoin",
    symbol: "tRBTC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_RSK_RPC_URL ||
          "https://public-node.testnet.rsk.co",
      ],
    },
    public: {
      http: [
        process.env.NEXT_PUBLIC_RSK_RPC_URL ||
          "https://public-node.testnet.rsk.co",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Rootstock Explorer",
      url: "https://explorer.testnet.rootstock.io",
    },
  },
});

export const wagmiConfig = createConfig({
  chains: [rootstockTestnetConfig],
  connectors: [
    injected({
      target: "metaMask",
    }),
    ...(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
      ? [
          walletConnect({
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
          }),
        ]
      : []),
  ],
  transports: {
    [rootstockTestnetConfig.id]: http(),
  },
  ssr: true,
});

