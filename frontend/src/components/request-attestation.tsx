"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  issueAttestation,
  type SchemaType,
  type IssueAttestationResponse,
} from "@/lib/api";
import { formatBytes32 } from "@/lib/utils";

type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: IssueAttestationResponse }
  | { status: "error"; message: string };

interface RequestAttestationProps {
  onSuccess?: (data: IssueAttestationResponse) => void;
}

export function RequestAttestation({ onSuccess }: RequestAttestationProps) {
  const { address, isConnected } = useAccount();
  const [schemaType, setSchemaType] = useState<SchemaType>("nft");
  const [statement, setStatement] = useState("");
  const [requestState, setRequestState] = useState<RequestState>({
    status: "idle",
  });
  const [copied, setCopied] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!address) {
        setRequestState({
          status: "error",
          message: "Wallet not connected",
        });
        return;
      }

      setRequestState({ status: "loading" });

      try {
        const result = await issueAttestation({
          address,
          schemaType,
          statement: statement.trim() || undefined,
        });

        setRequestState({ status: "success", data: result });
        onSuccess?.(result);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to request attestation";
        setRequestState({ status: "error", message });
      }
    },
    [address, schemaType, statement, onSuccess]
  );

  const resetForm = useCallback(() => {
    setRequestState({ status: "idle" });
    setStatement("");
    setCopied(false);
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, []);

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="text-white/60">Connect your wallet to request an attestation</p>
      </div>
    );
  }

  if (requestState.status === "success") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
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
          <div>
            <h4 className="text-lg font-semibold text-white">
              Attestation Issued!
            </h4>
            <p className="text-sm text-white/60">
              Your attestation has been successfully registered on-chain.
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-rootstock-gray-800/50 rounded-xl p-4 border border-rootstock-gray-700">
          <div className="flex justify-between items-center gap-3">
            <span className="text-sm text-white/60 shrink-0">Attestation UID</span>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <code className="text-sm text-rootstock-green-light font-mono bg-black/30 px-2 py-1 rounded truncate flex-1">
                {formatBytes32(requestState.data.uid)}
              </code>
              <button
                onClick={() => copyToClipboard(requestState.data.uid)}
                className="shrink-0 px-2 py-1 bg-rootstock-gray-700 hover:bg-rootstock-gray-600 border border-rootstock-gray-600 rounded text-white/80 hover:text-white transition-colors text-xs font-medium"
                title="Copy to clipboard"
              >
                {copied ? (
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5 text-rootstock-green"
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
                    Copied!
                  </span>
                ) : (
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/60">Attest TX</span>
            {requestState.data.txHashAttest && requestState.data.txHashAttest !== "0x0" ? (
              <a
                href={`https://explorer.testnet.rootstock.io/tx/${requestState.data.txHashAttest}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-rootstock-orange hover:text-rootstock-orange-light transition-colors font-mono"
              >
                View →
              </a>
            ) : (
              <span className="text-sm text-white/40 font-mono">N/A</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/60">Register TX</span>
            <a
              href={`https://explorer.testnet.rootstock.io/tx/${requestState.data.txHashRegister}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-rootstock-orange hover:text-rootstock-orange-light transition-colors font-mono"
            >
              View →
            </a>
          </div>
        </div>

        <button
          onClick={resetForm}
          className="w-full py-3 px-4 bg-rootstock-gray-800 hover:bg-rootstock-gray-700 text-white rounded-xl font-medium transition-colors border border-rootstock-gray-700"
        >
          Request Another Attestation
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/80">
          Wallet Address
        </label>
        <div className="px-4 py-3 bg-rootstock-gray-800/50 border border-rootstock-gray-700 rounded-xl text-white/60 font-mono text-sm truncate">
          {address}
        </div>
      </div>

      {/* Schema Type Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/80">
          Attestation Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSchemaType("nft")}
            disabled={requestState.status === "loading"}
            className={`py-3 px-4 rounded-xl font-medium transition-all border ${
              schemaType === "nft"
                ? "bg-rootstock-green/20 border-rootstock-green text-rootstock-green-light"
                : "bg-rootstock-gray-800/50 border-rootstock-gray-700 text-white/60 hover:border-rootstock-gray-600"
            } disabled:opacity-50`}
          >
            <div className="flex items-center justify-center gap-2">
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              NFT Gating
            </div>
          </button>
          <button
            type="button"
            onClick={() => setSchemaType("vault")}
            disabled={requestState.status === "loading"}
            className={`py-3 px-4 rounded-xl font-medium transition-all border ${
              schemaType === "vault"
                ? "bg-rootstock-orange/20 border-rootstock-orange text-rootstock-orange-light"
                : "bg-rootstock-gray-800/50 border-rootstock-gray-700 text-white/60 hover:border-rootstock-gray-600"
            } disabled:opacity-50`}
          >
            <div className="flex items-center justify-center gap-2">
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Vault Access
            </div>
          </button>
        </div>
        <p className="text-xs text-white/50">
          {schemaType === "nft"
            ? "Enables minting of gated NFTs"
            : "Enables access to token-gated vaults"}
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/80">
          Statement{" "}
          <span className="text-white/40 font-normal">(optional)</span>
        </label>
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          disabled={requestState.status === "loading"}
          placeholder="Add a custom statement for your attestation..."
          rows={3}
          className="w-full px-4 py-3 bg-rootstock-gray-800/50 border border-rootstock-gray-700 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-rootstock-green/50 focus:ring-1 focus:ring-rootstock-green/50 transition-all resize-none disabled:opacity-50"
        />
      </div>

      {/* Error Message */}
      {requestState.status === "error" && (
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
            <p className="text-sm font-medium text-red-400">Request Failed</p>
            <p className="text-sm text-red-400/80 mt-1">
              {requestState.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRequestState({ status: "idle" })}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={requestState.status === "loading"}
  className="w-full py-3.5 px-4 bg-linear-to-r from-rootstock-green to-rootstock-green-light text-black rounded-xl font-semibold hover:from-rootstock-green-light hover:to-rootstock-green shadow-lg shadow-rootstock-green/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
      >
        {requestState.status === "loading" ? (
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
            Issuing Attestation...
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Request Attestation
          </>
        )}
      </button>

      <p className="text-xs text-white/40 text-center">
        This will issue an attestation via the backend and register it on-chain.
        <br />
        Two transactions will be executed (attestation + registration).
      </p>
    </form>
  );
}
