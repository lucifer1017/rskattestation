"use client";

import { WalletConnect } from "@/components/wallet-connect";
import { RequestAttestation } from "@/components/request-attestation";
import { CheckStatus } from "@/components/check-status";
import { MintNFT } from "@/components/mint-nft";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-card-border bg-rootstock-gray-900/50 backdrop-blur-sm sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-rootstock-green to-rootstock-green-light bg-clip-text text-transparent">
              Rootstock Attestation Module
            </h1>
            <p className="text-sm text-white/60 mt-0.5">
              Identity & Attestation Service for Rootstock
            </p>
          </div>
          <WalletConnect />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {!isConnected ? (
          <div className="text-center py-20">
            <div className="inline-block mb-6 p-4 rounded-2xl bg-gradient-to-br from-rootstock-green/20 to-rootstock-orange/20 border border-rootstock-green/30">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-rootstock-green to-rootstock-orange rounded-xl"></div>
            </div>
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-rootstock-green via-rootstock-green-light to-rootstock-orange bg-clip-text text-transparent">
              Connect Your Wallet
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Use the connect button in the header above to get started with attestations on Rootstock
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="relative bg-card-bg border border-card-border rounded-2xl p-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rootstock-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Welcome to Rootstock Attestation Module
                </h2>
                <p className="text-white/80 text-lg max-w-3xl">
                  Request attestations, check your status, and interact with
                  token-gated contracts on the Rootstock network.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 relative bg-card-bg border border-card-border rounded-2xl p-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-48 h-48 bg-rootstock-green/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
                <div className="relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-rootstock-green to-rootstock-green-light rounded-xl flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-rootstock-green/30">
                      1
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        Request Attestation
                      </h3>
                      <p className="text-sm text-white/60">
                        Get attested for NFT gating or Vault access
                      </p>
                    </div>
                  </div>
                  <RequestAttestation />
                </div>
              </div>

              <div className="space-y-6">
                <div className="group relative bg-card-bg border border-card-border rounded-2xl p-6 transition-all duration-300 hover:border-rootstock-orange/50 hover:shadow-[0_0_30px_rgba(255,102,0,0.15)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-rootstock-orange/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-rootstock-orange to-rootstock-orange-light rounded-lg flex items-center justify-center text-black font-bold shadow-lg shadow-rootstock-orange/30">
                        2
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        Check Status
                      </h3>
                    </div>
                    <p className="text-white/60 text-sm mb-4 leading-relaxed">
                      View your attestation status and validity
                    </p>
                    <CheckStatus />
                  </div>
                </div>

                <div className="group relative bg-card-bg border border-card-border rounded-2xl p-6 transition-all duration-300 hover:border-rootstock-green/50 hover:shadow-[0_0_30px_rgba(0,170,68,0.15)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-rootstock-green/5 to-rootstock-orange/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-rootstock-green via-rootstock-green-light to-rootstock-orange rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-rootstock-green/30">
                        3
                      </div>
                      <h3 className="text-lg font-bold text-white">Mint NFT</h3>
                    </div>
                    <p className="text-white/60 text-sm mb-4 leading-relaxed">
                      Mint a gated NFT (requires valid attestation)
                    </p>
                    <MintNFT />
                  </div>
                </div>

                <div className="bg-card-bg border border-card-border rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rootstock-gray-800 flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-rootstock-green"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        Backend Required
                      </p>
                      <p className="text-xs text-white/50 truncate">
                        localhost:4000
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-rootstock-green rounded-full animate-pulse"></div>
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
