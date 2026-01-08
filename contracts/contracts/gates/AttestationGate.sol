// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IEAS.sol";
import "../libraries/RASConstants.sol";

/**
 * @title AttestationGate
 * @notice Helper contract that maps user addresses to RAS attestation UIDs
 * @dev Provides token-gating functionality by checking RAS attestations
 */
contract AttestationGate is Ownable {
    IEAS public eas; // EAS/RAS contract instance
    address public easAddress; // EAS contract address

    // Mapping: user address => attestation UID
    mapping(address => bytes32) public userAttestations;

    // Mapping: user address => schema UID => attestation UID
    mapping(address => mapping(bytes32 => bytes32)) public userSchemaAttestations;

    // Events
    event AttestationRegistered(
        address indexed user,
        bytes32 indexed attestationUID,
        bytes32 indexed schema
    );
    event AttestationRemoved(address indexed user, bytes32 indexed attestationUID);

    /**
     * @notice Initialize AttestationGate with EAS contract address
     * @param _easAddress Address of EAS/RAS contract (use RASConstants for network-specific)
     */
    constructor(address _easAddress) Ownable(msg.sender) {
        require(_easAddress != address(0), "AttestationGate: invalid EAS address");
        easAddress = _easAddress;
        eas = IEAS(_easAddress);
    }

    /**
     * @notice Register an attestation UID for a user (called by backend after attestation issuance)
     * @dev If user already has an attestation for this schema, it will be overwritten with the new one.
     *      This is intentional - the new attestation is validated and will be more recent.
     *      Overwriting allows for attestation renewals/updates (e.g., KYC renewal).
     * @param user Address of the user
     * @param attestationUID UID of the attestation from RAS
     * @param schemaUID Schema UID of the attestation
     */
    function registerAttestation(
        address user,
        bytes32 attestationUID,
        bytes32 schemaUID
    ) external {
        require(user != address(0), "AttestationGate: invalid user");
        require(attestationUID != bytes32(0), "AttestationGate: invalid UID");

        // Verify attestation exists and is valid
        IEAS.Attestation memory attestation = eas.getAttestation(attestationUID);
        require(attestation.uid != bytes32(0), "AttestationGate: attestation does not exist");
        require(attestation.recipient == user, "AttestationGate: recipient mismatch");
        require(attestation.schema == schemaUID, "AttestationGate: schema mismatch");
        require(attestation.revocationTime == 0, "AttestationGate: attestation revoked");
        require(
            attestation.expirationTime == 0 || attestation.expirationTime > block.timestamp,
            "AttestationGate: attestation expired"
        );

        // Register attestation (overwrites existing if any - this is intentional for renewals)
        userAttestations[user] = attestationUID;
        userSchemaAttestations[user][schemaUID] = attestationUID;

        emit AttestationRegistered(user, attestationUID, schemaUID);
    }

    /**
     * @notice Remove attestation mapping (called when attestation is revoked/expired)
     * @param user Address of the user
     */
    function removeAttestation(address user) external {
        bytes32 uid = userAttestations[user];
        require(uid != bytes32(0), "AttestationGate: no attestation found");

        // Verify attestation is invalid
        IEAS.Attestation memory attestation = eas.getAttestation(uid);
        bool isInvalid =
            attestation.revocationTime != 0 ||
            (attestation.expirationTime != 0 && attestation.expirationTime <= block.timestamp);

        require(isInvalid, "AttestationGate: attestation still valid");

        delete userAttestations[user];
        delete userSchemaAttestations[user][attestation.schema];

        emit AttestationRemoved(user, uid);
    }

    /**
     * @notice Check if user has a valid attestation (any schema)
     * @dev Checks the most recently registered attestation for the user
     * @param user Address of the user
     * @return valid Whether user has valid attestation
     */
    function hasValidAttestation(address user) external view returns (bool valid) {
        bytes32 uid = userAttestations[user];
        if (uid == bytes32(0)) return false;

        return _isAttestationValid(uid);
    }

    /**
     * @notice Check if user has valid attestation of specific schema
     * @param user Address of the user
     * @param schemaUID Schema UID to check
     * @return valid Whether user has valid attestation of this schema
     */
    function hasValidAttestationOfSchema(
        address user,
        bytes32 schemaUID
    ) external view returns (bool valid) {
        bytes32 uid = userSchemaAttestations[user][schemaUID];
        if (uid == bytes32(0)) return false;

        return _isAttestationValid(uid);
    }

    /**
     * @notice Get attestation UID for a user
     * @param user Address of the user
     * @return uid Attestation UID (bytes32(0) if none)
     */
    function getUserAttestationUID(address user) external view returns (bytes32 uid) {
        return userAttestations[user];
    }

    /**
     * @notice Internal function to validate attestation
     * @param uid Attestation UID
     * @return valid Whether attestation is valid
     */
    function _isAttestationValid(bytes32 uid) internal view returns (bool valid) {
        IEAS.Attestation memory attestation = eas.getAttestation(uid);

        if (attestation.uid == bytes32(0)) return false;
        if (attestation.revocationTime != 0) return false;
        if (attestation.expirationTime != 0 && attestation.expirationTime <= block.timestamp) {
            return false;
        }

        return true;
    }
}

