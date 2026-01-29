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
        bytes32 uid;
        bytes32 schema;
        uint64 time;
        uint64 expirationTime;
        uint64 revocationTime;
        bytes32 refUID;
        address recipient;
        address attester;
        bool revocable;
        bytes data;
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





