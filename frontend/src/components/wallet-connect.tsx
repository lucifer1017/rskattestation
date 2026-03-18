"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { formatAddress } from "@/lib/utils";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-3 py-1.5 bg-rootstock-green/10 border border-rootstock-green/25 text-rootstock-green rounded-lg font-mono text-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-rootstock-green rounded-full"></span>
          {formatAddress(address)}
        </div>
        <button
          onClick={() => disconnect()}
          className="px-3 py-1.5 border border-white/10 text-white/50 rounded-lg text-sm font-medium hover:border-white/20 hover:text-white/80 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const uniqueConnectors = connectors.filter((connector) => {
    const id = connector.id;
    const name = connector.name?.toLowerCase() || "";
    
    if (seenIds.has(id) || (name && seenNames.has(name))) {
      return false;
    }
    
    seenIds.add(id);
    if (name) seenNames.add(name);
    return true;
  });

  const metaMaskConnector = uniqueConnectors.find(
    (c) =>
      c.id === "io.metamask" ||
      c.id === "metaMaskSDK" ||
      c.id === "injected" ||
      c.name?.toLowerCase().includes("metamask") ||
      c.name?.toLowerCase() === "metamask"
  );
  
  const connectorToUse = metaMaskConnector || uniqueConnectors[0];

  if (!connectorToUse) {
    return (
      <div className="px-6 py-2.5 bg-rootstock-gray-800 text-white/60 rounded-xl font-semibold">
        No wallet available
      </div>
    );
  }

  const buttonText = 
    metaMaskConnector || connectorToUse.name?.toLowerCase().includes("metamask")
      ? "Connect MetaMask"
      : `Connect ${connectorToUse.name || "Wallet"}`;

  return (
    <button
      onClick={() => connect({ connector: connectorToUse })}
      disabled={isPending}
      className="px-4 py-1.5 bg-rootstock-green hover:bg-rootstock-green-light text-black rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isPending ? "Connecting..." : buttonText}
    </button>
  );
}

