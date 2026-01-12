"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ADDRESSES, GATED_NFT_MINTER_ABI } from "@/lib/contracts";
import { getAttestationStatus } from "@/lib/api";

type MintState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "ready"; hasAttestation: boolean; hasMinted: boolean }
  | { status: "minting" }
  | { status: "success"; txHash: string; tokenId?: bigint }
  | { status: "error"; message: string };

export function MintNFT() {
  const { address, isConnected } = useAccount();
  const [mintState, setMintState] = useState<MintState>({ status: "idle" });
  const [attestationStatus, setAttestationStatus] = useState<{
    hasValid: boolean;
    loading: boolean;
  }>({ hasValid: false, loading: true });

  // Read contract data
  const { data: mintPrice, isLoading: priceLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.GatedNFTMinter,
    abi: GATED_NFT_MINTER_ABI,
    functionName: "mintPrice",
  });

  const { data: hasMinted, isLoading: mintedLoading, refetch: refetchHasMinted } = useReadContract({
    address: CONTRACT_ADDRESSES.GatedNFTMinter,
    abi: GATED_NFT_MINTER_ABI,
    functionName: "hasMinted",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: nftBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.GatedNFTMinter,
    abi: GATED_NFT_MINTER_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: currentSupply, isLoading: supplyLoading, refetch: refetchSupply } = useReadContract({
    address: CONTRACT_ADDRESSES.GatedNFTMinter,
    abi: GATED_NFT_MINTER_ABI,
    functionName: "currentSupply",
  });

  const { data: maxSupply } = useReadContract({
    address: CONTRACT_ADDRESSES.GatedNFTMinter,
    abi: GATED_NFT_MINTER_ABI,
    functionName: "maxSupply",
  });

  // Write contract (mint)
  const {
    writeContract,
    data: hash,
    isPending: isMintPending,
    error: mintError,
  } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Check attestation status
  const checkAttestation = useCallback(async () => {
    if (!address) {
      setAttestationStatus({ hasValid: false, loading: false });
      return;
    }

    setAttestationStatus({ hasValid: false, loading: true });
    try {
      const result = await getAttestationStatus(address, "nft");
      setAttestationStatus({ hasValid: result.hasValid, loading: false });
    } catch (error) {
      console.error("Error checking attestation:", error);
      setAttestationStatus({ hasValid: false, loading: false });
    }
  }, [address]);

  // Update mint state based on data
  useEffect(() => {
    if (!isConnected || !address) {
      setMintState({ status: "idle" });
      return;
    }

    if (
      priceLoading ||
      mintedLoading ||
      supplyLoading ||
      attestationStatus.loading
    ) {
      setMintState({ status: "checking" });
      return;
    }

    const hasMintedBool = hasMinted === true;
    const hasAttestation = attestationStatus.hasValid;

    setMintState({
      status: "ready",
      hasAttestation,
      hasMinted: hasMintedBool,
    });
  }, [
    isConnected,
    address,
    priceLoading,
    mintedLoading,
    supplyLoading,
    attestationStatus.loading,
    hasMinted,
    attestationStatus.hasValid,
  ]);

  // Check attestation on mount and when address changes
  useEffect(() => {
    if (isConnected && address) {
      checkAttestation();
    }
  }, [isConnected, address, checkAttestation]);

  // Handle mint transaction states
  useEffect(() => {
    if (isMintPending || isConfirming) {
      setMintState({ status: "minting" });
    } else if (isConfirmed && hash) {
      setMintState({ status: "success", txHash: hash });
      // Refresh all contract data after success
      setTimeout(() => {
        refetchSupply();
        refetchHasMinted();
        checkAttestation();
      }, 2000);
    } else if (mintError) {
      setMintState({
        status: "error",
        message:
          mintError.message || "Failed to mint NFT. Please try again.",
      });
    }
  }, [isMintPending, isConfirming, isConfirmed, hash, mintError, checkAttestation, refetchSupply, refetchHasMinted, refetchBalance]);

  const handleMint = useCallback(() => {
    if (!address || !mintPrice) {
      setMintState({
        status: "error",
        message: "Missing required information",
      });
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.GatedNFTMinter,
        abi: GATED_NFT_MINTER_ABI,
        functionName: "mint",
        value: mintPrice,
      });
    } catch (error) {
      setMintState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to initiate mint transaction",
      });
    }
  }, [address, mintPrice, writeContract]);

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="text-white/60">Connect your wallet to mint an NFT</p>
      </div>
    );
  }

  // Loading state
  if (mintState.status === "checking" || mintState.status === "idle") {
    return (
      <div className="flex items-center justify-center gap-3 py-8">
        <svg
          className="w-5 h-5 animate-spin text-rootstock-green"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-white/60">Loading NFT information...</span>
      </div>
    );
  }

  // Ready state
  if (mintState.status === "ready") {
    const canMint = mintState.hasAttestation && !mintState.hasMinted;
    const isSoldOut = maxSupply && currentSupply && currentSupply >= maxSupply;

    return (
      <div className="space-y-4">
        {/* NFT Info */}
        <div className="p-4 bg-rootstock-gray-800/50 rounded-xl border border-rootstock-gray-700 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/60">Mint Price</span>
            <span className="text-white font-mono">
              {mintPrice ? formatEther(mintPrice) : "0"} tRBTC
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/60">Supply</span>
            <span className="text-white font-mono">
              {currentSupply?.toString() || "0"} / {maxSupply?.toString() || "0"}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/60">Your Status</span>
            <span
              className={`font-medium ${
                mintState.hasMinted
                  ? "text-rootstock-green"
                  : mintState.hasAttestation
                    ? "text-rootstock-orange"
                    : "text-red-400"
              }`}
            >
              {mintState.hasMinted
                ? "Already Minted"
                : mintState.hasAttestation
                  ? "Eligible"
                  : "No Attestation"}
            </span>
          </div>
          {nftBalance !== undefined && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/60">Your NFTs</span>
              <span className="text-white font-mono">
                {nftBalance?.toString() || "0"}
              </span>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {!mintState.hasAttestation && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-400 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">
                  Attestation Required
                </p>
                <p className="text-sm text-red-400/80 mt-1">
                  You need a valid NFT attestation to mint. Request one in the
                  "Request Attestation" section above.
                </p>
              </div>
            </div>
          </div>
        )}

        {mintState.hasMinted && (
          <div className="p-4 bg-rootstock-green/10 border border-rootstock-green/30 rounded-xl">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-rootstock-green shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-rootstock-green">
                  Already Minted
                </p>
                <p className="text-sm text-rootstock-green/80 mt-1">
                  You have already minted your NFT. Each address can only mint
                  once.
                </p>
              </div>
            </div>
          </div>
        )}

        {isSoldOut && (
          <div className="p-4 bg-rootstock-orange/10 border border-rootstock-orange/30 rounded-xl">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-rootstock-orange shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-rootstock-orange">
                  Sold Out
                </p>
                <p className="text-sm text-rootstock-orange/80 mt-1">
                  All NFTs have been minted. Maximum supply reached.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mint Button */}
        <button
          onClick={handleMint}
          disabled={!canMint || isSoldOut || isMintPending || isConfirming}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-rootstock-green to-rootstock-green-light text-black rounded-xl font-semibold hover:from-rootstock-green-light hover:to-rootstock-green shadow-lg shadow-rootstock-green/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isMintPending || isConfirming ? (
            <>
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {isConfirming ? "Confirming..." : "Minting..."}
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Mint NFT
            </>
          )}
        </button>

        <button
          onClick={() => {
            refetchSupply();
            refetchHasMinted();
            refetchBalance();
            checkAttestation();
          }}
          className="w-full py-2 px-4 bg-rootstock-gray-800 hover:bg-rootstock-gray-700 text-white rounded-xl font-medium transition-colors border border-rootstock-gray-700 text-sm"
        >
          Refresh Status
        </button>
      </div>
    );
  }

  // Minting state
  if (mintState.status === "minting") {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-rootstock-green/10 border border-rootstock-green/30 rounded-xl">
          <div className="flex items-center gap-4">
            <svg
              className="w-8 h-8 text-rootstock-green animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-white mb-1">
                Minting NFT...
              </h4>
              <p className="text-sm text-white/60">
                {isConfirming
                  ? "Waiting for transaction confirmation..."
                  : "Please confirm the transaction in your wallet"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (mintState.status === "success") {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-rootstock-green/10 border border-rootstock-green/30 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rootstock-green/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-rootstock-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-white mb-1">
                NFT Minted Successfully!
              </h4>
              <p className="text-sm text-white/60">
                Your NFT has been minted and is now in your wallet.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-rootstock-gray-800/50 rounded-xl border border-rootstock-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/60">Transaction</span>
            <a
              href={`https://explorer.testnet.rootstock.io/tx/${mintState.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-rootstock-orange hover:text-rootstock-orange-light transition-colors font-mono"
            >
              View on Explorer →
            </a>
          </div>
        </div>

        <button
          onClick={() => {
            setMintState({ status: "idle" });
            refetchSupply();
            refetchHasMinted();
            refetchBalance();
            checkAttestation();
          }}
          className="w-full py-2.5 px-4 bg-rootstock-gray-800 hover:bg-rootstock-gray-700 text-white rounded-xl font-medium transition-colors border border-rootstock-gray-700 text-sm"
        >
          Mint Another (if eligible)
        </button>
      </div>
    );
  }

  // Error state
  if (mintState.status === "error") {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-400 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-400">Mint Failed</p>
              <p className="text-sm text-red-400/80 mt-1">
                {mintState.message}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setMintState({ status: "idle" });
            refetchSupply();
            refetchHasMinted();
            refetchBalance();
            checkAttestation();
          }}
          className="w-full py-2.5 px-4 bg-rootstock-gray-800 hover:bg-rootstock-gray-700 text-white rounded-xl font-medium transition-colors border border-rootstock-gray-700 text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return null;
}
