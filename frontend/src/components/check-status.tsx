"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount } from "wagmi";
import { getAttestationStatus, type SchemaType } from "@/lib/api";

type StatusState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; hasValid: boolean; schemaType: SchemaType }
  | { status: "error"; message: string };

interface CheckStatusProps {
  refreshToken?: number;
}

export function CheckStatus({ refreshToken }: CheckStatusProps) {
  const { address, isConnected } = useAccount();
  const [schemaType, setSchemaType] = useState<SchemaType>("nft");
  const [statusState, setStatusState] = useState<StatusState>({
    status: "idle",
  });

  const checkStatus = useCallback(async () => {
    if (!address) {
      setStatusState({
        status: "error",
        message: "Wallet not connected",
      });
      return;
    }

    setStatusState({ status: "loading" });

    try {
      const result = await getAttestationStatus(address, schemaType);
      setStatusState({
        status: "success",
        hasValid: result.hasValid,
        schemaType: result.schemaType,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to check attestation status";
      setStatusState({ status: "error", message });
    }
  }, [address, schemaType]);

  useEffect(() => {
    if (isConnected && address) {
      checkStatus();
    } else {
      setStatusState({ status: "idle" });
    }
  }, [isConnected, address, schemaType, checkStatus, refreshToken]);

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="text-white/60">Connect your wallet to check status</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/80">
          Attestation Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSchemaType("nft")}
            disabled={statusState.status === "loading"}
            className={`py-2.5 px-4 rounded-xl font-medium transition-all border text-sm ${
              schemaType === "nft"
                ? "bg-rootstock-green/15 border-rootstock-green/40 text-rootstock-green-light"
                : "bg-card-bg border-card-border text-white/60 hover:border-white/20"
            } disabled:opacity-50`}
          >
            NFT Gating
          </button>
          <button
            type="button"
            onClick={() => setSchemaType("vault")}
            disabled={statusState.status === "loading"}
            className={`py-2.5 px-4 rounded-xl font-medium transition-all border text-sm ${
              schemaType === "vault"
                ? "bg-rootstock-orange/15 border-rootstock-orange/40 text-rootstock-orange-light"
                : "bg-card-bg border-card-border text-white/60 hover:border-white/20"
            } disabled:opacity-50`}
          >
            Vault Access
          </button>
        </div>
      </div>

      {statusState.status === "loading" && (
        <div className="flex items-center justify-center gap-3 py-8">
          <svg
            className="w-5 h-5 animate-spin text-rootstock-orange"
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
          <span className="text-white/60">Checking status...</span>
        </div>
      )}

      {statusState.status === "success" && (
        <div className="space-y-4">
          <div
            className={`p-6 rounded-xl border ${
              statusState.hasValid
                ? "bg-rootstock-green/10 border-rootstock-green/30"
                : "bg-card-bg border-card-border"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  statusState.hasValid
                    ? "bg-rootstock-green/20"
                    : "bg-black/20 border border-white/10"
                }`}
              >
                {statusState.hasValid ? (
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
                ) : (
                  <svg
                    className="w-6 h-6 text-white/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-white mb-1">
                  {statusState.hasValid
                    ? "Valid Attestation"
                    : "No Valid Attestation"}
                </h4>
                <p className="text-sm text-white/60">
                  {statusState.hasValid
                    ? `You have a valid ${statusState.schemaType.toUpperCase()} attestation and can access gated features.`
                    : `You don't have a valid ${statusState.schemaType.toUpperCase()} attestation. Request one to access gated features.`}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={checkStatus}
            className="w-full py-2.5 px-4 bg-black/20 hover:bg-black/35 text-white/80 hover:text-white rounded-xl font-medium transition-colors border border-white/10 text-sm"
          >
            Refresh Status
          </button>
        </div>
      )}

      {statusState.status === "error" && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
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
            <p className="text-sm font-medium text-red-400">Error</p>
            <p className="text-sm text-red-400/80 mt-1">
              {statusState.message}
            </p>
          </div>
          <button
            type="button"
            onClick={checkStatus}
            className="text-red-400 hover:text-red-300 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {statusState.status === "idle" && (
        <div className="text-center py-8">
          <p className="text-white/60 text-sm">
            Click "Refresh Status" to check your attestation status
          </p>
        </div>
      )}
    </div>
  );
}
