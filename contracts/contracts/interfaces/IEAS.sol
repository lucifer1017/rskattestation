// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IEAS
 * @notice Interface for Ethereum Attestation Service (EAS) / Rootstock Attestation Service (RAS)
 * @dev Based on EAS contract deployed on Rootstock
 * @dev Reference: https://dev.rootstock.io/dev-tools/attestations/ras/
 */
interface IEAS {
    struct Attestation {
        bytes32 uid;                    // Unique identifier
        bytes32 schema;                 // Schema UID
        uint64 time;                     // Timestamp when created
        uint64 expirationTime;           // Expiration timestamp (0 = no expiration)
        uint64 revocationTime;           // Revocation timestamp (0 = not revoked)
        bytes32 refUID;                  // Referenced attestation UID
        address recipient;              // Recipient address
        address attester;                // Attester address
        bool revocable;                  // Whether attestation is revocable
        bytes data;                      // Encoded attestation data
    }

    /**
     * @notice Get an attestation by UID
     * @param uid The attestation UID
     * @return The attestation data
     */
    function getAttestation(bytes32 uid) external view returns (Attestation memory);

    /**
     * @notice Check if an attestation is revoked (off-chain)
     * @param uid The attestation UID
     * @return Whether the attestation is revoked
     */
    function isRevokedOffchain(bytes32 uid) external view returns (bool);
}





