// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IEAS.sol";

/**
 * @title MockEAS
 * @notice Mock implementation of EAS contract for testing
 * @dev Simulates RAS/EAS behavior in tests
 */
contract MockEAS is IEAS {
    mapping(bytes32 => Attestation) private _attestations;
    mapping(bytes32 => bool) private _revokedOffchain;

    /**
     * @notice Create a mock attestation
     * @param uid Attestation UID
     * @param schema Schema UID
     * @param recipient Recipient address
     * @param attester Attester address
     * @param expirationTime Expiration timestamp (0 = no expiration)
     * @param revocable Whether attestation is revocable
     */
    function createAttestation(
        bytes32 uid,
        bytes32 schema,
        address recipient,
        address attester,
        uint64 expirationTime,
        bool revocable
    ) external {
        _attestations[uid] = Attestation({
            uid: uid,
            schema: schema,
            time: uint64(block.timestamp),
            expirationTime: expirationTime,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: recipient,
            attester: attester,
            revocable: revocable,
            data: ""
        });
    }

    /**
     * @notice Revoke an attestation
     * @param uid Attestation UID
     */
    function revokeAttestation(bytes32 uid) external {
        require(_attestations[uid].uid != bytes32(0), "MockEAS: attestation does not exist");
        require(_attestations[uid].revocable, "MockEAS: attestation not revocable");
        _attestations[uid].revocationTime = uint64(block.timestamp);
    }

    /**
     * @notice Revoke attestation off-chain (for testing)
     * @param uid Attestation UID
     */
    function revokeOffchain(bytes32 uid) external {
        _revokedOffchain[uid] = true;
    }

    /**
     * @notice Get an attestation by UID
     */
    function getAttestation(bytes32 uid) external view override returns (Attestation memory) {
        return _attestations[uid];
    }

    /**
     * @notice Check if an attestation is revoked off-chain
     */
    function isRevokedOffchain(bytes32 uid) external view override returns (bool) {
        return _revokedOffchain[uid];
    }

    /**
     * @notice Set expiration time for an attestation (for testing)
     * @param uid Attestation UID
     * @param expirationTime New expiration time
     */
    function setExpirationTime(bytes32 uid, uint64 expirationTime) external {
        require(_attestations[uid].uid != bytes32(0), "MockEAS: attestation does not exist");
        _attestations[uid].expirationTime = expirationTime;
    }
}





