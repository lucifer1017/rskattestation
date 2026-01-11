"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { formatAddress } from "@/lib/utils";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <div className="px-4 py-2 bg-rootstock-green text-black rounded-lg font-medium">
          {formatAddress(address)}
        </div>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 border border-white text-white rounded-lg hover:bg-white hover:text-black transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          disabled={isPending}
          className="px-6 py-2 bg-rootstock-green text-black rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPending ? "Connecting..." : `Connect ${connector.name}`}
        </button>
      ))}
    </div>
  );
}

