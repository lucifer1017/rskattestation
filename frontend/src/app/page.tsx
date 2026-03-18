"use client";

import { useState, useCallback } from "react";
import { WalletConnect } from "@/components/wallet-connect";
import { RequestAttestation } from "@/components/request-attestation";
import { CheckStatus } from "@/components/check-status";
import { MintNFT } from "@/components/mint-nft";
import { useAccount } from "wagmi";
import type { IssueAttestationResponse } from "@/lib/api";

export default function Home() {
  const { isConnected } = useAccount();
  const [refreshToken, setRefreshToken] = useState(0);

  const handleAttestationSuccess = useCallback(
    (_data: IssueAttestationResponse) => {
      [0, 3000, 7000, 12000, 20000].forEach((delay) => {
        setTimeout(() => setRefreshToken((x) => x + 1), delay);
      });
    },
    []
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-[#0a0a0a] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white tracking-tight">
              Rootstock Attestation
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-rootstock-orange/15 text-rootstock-orange border border-rootstock-orange/30 rounded">
              TESTNET
            </span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="https://explorer.testnet.rootstock.io/ras"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              RAS Explorer
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
            <div className="w-14 h-14 rounded-xl bg-rootstock-green/10 border border-rootstock-green/20 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-rootstock-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Connect Your Wallet
              </h2>
              <p className="text-sm text-white/40 max-w-sm">
                Connect your wallet to request attestations and interact with
                gated contracts on Rootstock testnet.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-5">
              <h2 className="text-base font-semibold text-white">
                Attestation Module
              </h2>
              <p className="text-sm text-white/40 mt-0.5">
                Request attestations, verify status, and mint gated NFTs on
                Rootstock testnet.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-card-bg border border-card-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-rootstock-green/10 border border-rootstock-green/25 flex items-center justify-center text-sm font-bold text-rootstock-green">
                    1
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Request Attestation
                    </h3>
                    <p className="text-xs text-white/40 mt-0.5">
                      Get attested for NFT gating or Vault access
                    </p>
                  </div>
                </div>
                <RequestAttestation onSuccess={handleAttestationSuccess} />
              </div>

              <div className="space-y-5">
                <div className="bg-card-bg border border-card-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-rootstock-orange/10 border border-rootstock-orange/25 flex items-center justify-center text-sm font-bold text-rootstock-orange">
                      2
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Check Status
                      </h3>
                      <p className="text-xs text-white/40 mt-0.5">
                        Verify attestation validity
                      </p>
                    </div>
                  </div>
                  <CheckStatus refreshToken={refreshToken} />
                </div>

                <div className="bg-card-bg border border-card-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-rootstock-green/10 border border-rootstock-green/25 flex items-center justify-center text-sm font-bold text-rootstock-green">
                      3
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Mint NFT
                      </h3>
                      <p className="text-xs text-white/40 mt-0.5">
                        Mint a gated NFT (requires attestation)
                      </p>
                    </div>
                  </div>
                  <MintNFT refreshToken={refreshToken} />
                </div>

                <div className="bg-card-bg border border-card-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-rootstock-green rounded-full animate-pulse shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/50">
                        Backend{" "}
                        <span className="font-mono text-white/30">
                          localhost:4000
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
