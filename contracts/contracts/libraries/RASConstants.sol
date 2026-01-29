// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title RASConstants
 * @notice Library containing RAS (Rootstock Attestation Service) contract addresses
 * @dev RAS = EAS (Ethereum Attestation Service) deployed on Rootstock
 */
library RASConstants {
    address public constant EAS_MAINNET = 0x54C0726E9d2D57Bc37AD52c7E219A3229e0eE963;
    address public constant SCHEMA_REGISTRY_MAINNET = 0xeF29675d82CC5967069d6d9C17F2719f67728F5B;

    address public constant EAS_TESTNET = 0xc300aeEaDd60999933468738c9F5D7e9C0671e1c;
    address public constant SCHEMA_REGISTRY_TESTNET = 0x679c62956cD2801AbAbF80e9D430f18859Eea2d5;

    bytes32 public constant SCHEMA_KYC = bytes32(0);
    bytes32 public constant SCHEMA_AGE_VERIFICATION = bytes32(0);
    bytes32 public constant SCHEMA_DOCUMENT_OWNERSHIP = bytes32(0);
}

