"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { formatAddress } from "@/lib/utils";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 bg-gradient-to-r from-rootstock-green to-rootstock-green-light text-black rounded-xl font-semibold shadow-lg shadow-rootstock-green/30 flex items-center gap-2">
          <span className="w-2 h-2 bg-black rounded-full"></span>
          {formatAddress(address)}
        </div>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 border border-white/10 text-white/80 rounded-xl font-medium hover:bg-rootstock-gray-800 hover:border-rootstock-orange/50 hover:text-white transition-all duration-200"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          disabled={isPending}
          className="px-6 py-2.5 bg-gradient-to-r from-rootstock-green to-rootstock-green-light text-black rounded-xl font-semibold hover:from-rootstock-green-light hover:to-rootstock-green shadow-lg shadow-rootstock-green/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
        >
          {isPending ? "Connecting..." : `Connect ${connector.name}`}
        </button>
      ))}
    </div>
  );
}

