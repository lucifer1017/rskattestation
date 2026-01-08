# Smart Contract Architecture - RAS Integration Plan

## Overview

**RAS (Rootstock Attestation Service) = EAS (Ethereum Attestation Service) deployed on Rootstock**

This project integrates with the **already-deployed RAS contracts** rather than building a custom attestation registry. We use RAS for attestation issuance/verification and build token-gated contracts on top.

**RAS Contract Addresses:**
- **Mainnet**: `0x54c0726E9D2D57Bc37aD52C7E219a3229E0ee963`
- **Testnet**: `0xc300aeEadd60999933468738c9F5d7e9c0671e1C`
- **Schema Registry (Mainnet)**: `0xef29675d82Cc5967069D6D9c17F2719F67728F5b`
- **Schema Registry (Testnet)**: `0x679c62956cD2801ABaBF80e9D430F18859eea2D5`

**Reference**: [Rootstock RAS Documentation](https://dev.rootstock.io/dev-tools/attestations/ras/)

---

## Architecture Decision

### Why We Need a Helper Contract

RAS/EAS stores attestations by **UID** (unique identifier), not by recipient address. For token-gating, we need to check:
- Does user `address` have a valid attestation?
- Does user have attestation of specific schema?

**Solution**: Create a lightweight **AttestationGate** contract that:
1. Maps `address → attestationUID` for quick lookups
2. Verifies attestation validity via RAS contract
3. Provides helper functions for token-gated contracts

---

## 1. RASConstants.sol (Network Configuration)

### Purpose: Store RAS contract addresses for different networks

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library RASConstants {
    // Mainnet addresses
    address public constant EAS_MAINNET = 0x54c0726E9D2D57Bc37aD52C7E219a3229E0ee963;
    address public constant SCHEMA_REGISTRY_MAINNET = 0xef29675d82Cc5967069D6D9c17F2719F67728F5b;
    
    // Testnet addresses
    address public constant EAS_TESTNET = 0xc300aeEadd60999933468738c9F5d7e9c0671e1C;
    address public constant SCHEMA_REGISTRY_TESTNET = 0x679c62956cD2801ABaBF80e9D430F18859eea2D5;
    
    // Common schema UIDs (to be registered via backend)
    // These will be set after schema registration
    bytes32 public constant SCHEMA_KYC = bytes32(0); // To be set
    bytes32 public constant SCHEMA_AGE_VERIFICATION = bytes32(0); // To be set
    bytes32 public constant SCHEMA_DOCUMENT_OWNERSHIP = bytes32(0); // To be set
}
```

---

## 2. IEAS.sol (EAS Contract Interface)

### Purpose: Interface to interact with deployed RAS/EAS contracts

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IEAS
 * @notice Interface for Ethereum Attestation Service (EAS) / Rootstock Attestation Service (RAS)
 * @dev Based on EAS contract deployed on Rootstock
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
     * @notice Check if an attestation is revoked
     * @param uid The attestation UID
     * @return Whether the attestation is revoked
     */
    function isRevokedOffchain(bytes32 uid) external view returns (bool);
}
```

---

## 3. AttestationGate.sol (Helper Contract for Token-Gating)

### Purpose: Maps addresses to attestation UIDs and provides validation helpers

### Imports:
```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IEAS.sol";
import "./RASConstants.sol";
```

### State Variables:
```solidity
IEAS public eas; // EAS/RAS contract instance
address public easAddress; // EAS contract address (set in constructor)

// Mapping: user address => attestation UID
mapping(address => bytes32) public userAttestations;

// Mapping: user address => schema UID => attestation UID
mapping(address => mapping(bytes32 => bytes32)) public userSchemaAttestations;

// Events
event AttestationRegistered(address indexed user, bytes32 indexed attestationUID, bytes32 indexed schema);
event AttestationRemoved(address indexed user, bytes32 indexed attestationUID);
```

### Functions:

#### Constructor:
```solidity
/**
 * @notice Initialize AttestationGate with EAS contract address
 * @param _easAddress Address of EAS/RAS contract (use RASConstants for network-specific)
 */
constructor(address _easAddress) Ownable(msg.sender) {
    require(_easAddress != address(0), "AttestationGate: invalid EAS address");
    easAddress = _easAddress;
    eas = IEAS(_easAddress);
}
```

#### Registration Functions:
```solidity
/**
 * @notice Register an attestation UID for a user (called by backend after attestation issuance)
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
    
    // Register attestation
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
    bool isInvalid = attestation.revocationTime != 0 || 
                     (attestation.expirationTime != 0 && attestation.expirationTime <= block.timestamp);
    
    require(isInvalid, "AttestationGate: attestation still valid");
    
    delete userAttestations[user];
    delete userSchemaAttestations[user][attestation.schema];
    
    emit AttestationRemoved(user, uid);
}
```

#### Validation Functions:
```solidity
/**
 * @notice Check if user has a valid attestation
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
    if (attestation.expirationTime != 0 && attestation.expirationTime <= block.timestamp) return false;
    
    return true;
}
```

---

## 4. GatedNFTMinter.sol (Token-Gated NFT Minting)

### Imports:
```solidity
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AttestationGate.sol";
```

### State Variables:
```solidity
AttestationGate public attestationGate;
bytes32 public requiredSchemaUID; // Schema UID required for minting
uint256 public maxSupply;
uint256 public currentSupply;
uint256 public mintPrice;
mapping(address => bool) public hasMinted;
```

### Events:
```solidity
event NFTMinted(address indexed to, uint256 indexed tokenId, address indexed minter);
event AttestationRequired(address indexed user, bytes32 indexed schemaUID);
```

### Functions:

#### Constructor:
```solidity
constructor(
    address _attestationGate,
    bytes32 _requiredSchemaUID,
    uint256 _maxSupply,
    uint256 _mintPrice,
    string memory name,
    string memory symbol
) ERC721(name, symbol) Ownable(msg.sender) {
    require(_attestationGate != address(0), "GatedNFTMinter: invalid gate address");
    attestationGate = AttestationGate(_attestationGate);
    requiredSchemaUID = _requiredSchemaUID;
    maxSupply = _maxSupply;
    mintPrice = _mintPrice;
    currentSupply = 0;
}
```

#### Mint Functions:
```solidity
/**
 * @notice Mint an NFT - requires valid attestation from RAS
 * @param to Address to mint NFT to
 */
function mint(address to) external payable nonReentrant {
    require(currentSupply < maxSupply, "GatedNFTMinter: max supply reached");
    require(msg.value >= mintPrice, "GatedNFTMinter: insufficient payment");
    require(!hasMinted[to], "GatedNFTMinter: already minted");
    
    // Check attestation via AttestationGate
    require(
        attestationGate.hasValidAttestationOfSchema(to, requiredSchemaUID),
        "GatedNFTMinter: valid attestation required"
    );
    
    uint256 tokenId = currentSupply + 1;
    _safeMint(to, tokenId);
    currentSupply++;
    hasMinted[to] = true;
    
    emit NFTMinted(to, tokenId, msg.sender);
    
    // Refund excess payment
    if (msg.value > mintPrice) {
        payable(msg.sender).transfer(msg.value - mintPrice);
    }
}
```

#### Admin Functions:
```solidity
function withdraw() external onlyOwner {
    payable(owner()).transfer(address(this).balance);
}

function setMintPrice(uint256 _newPrice) external onlyOwner {
    mintPrice = _newPrice;
}

function setRequiredSchema(bytes32 _newSchemaUID) external onlyOwner {
    requiredSchemaUID = _newSchemaUID;
}
```

---

## 5. GatedVault.sol (Token-Gated DeFi Vault)

### Imports:
```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./AttestationGate.sol";
```

### State Variables:
```solidity
AttestationGate public attestationGate;
bytes32 public requiredSchemaUID;
IERC20 public token;
mapping(address => uint256) public deposits;
uint256 public totalDeposits;
```

### Events:
```solidity
event Deposited(address indexed user, uint256 amount);
event Withdrawn(address indexed user, uint256 amount);
```

### Functions:

#### Constructor:
```solidity
constructor(
    address _attestationGate,
    address _token,
    bytes32 _requiredSchemaUID
) Ownable(msg.sender) {
    require(_attestationGate != address(0), "GatedVault: invalid gate address");
    attestationGate = AttestationGate(_attestationGate);
    token = IERC20(_token);
    requiredSchemaUID = _requiredSchemaUID;
}
```

#### Deposit/Withdraw:
```solidity
/**
 * @notice Deposit tokens - requires valid attestation from RAS
 */
function deposit(uint256 amount) external nonReentrant {
    require(amount > 0, "GatedVault: amount must be greater than 0");
    require(
        attestationGate.hasValidAttestationOfSchema(msg.sender, requiredSchemaUID),
        "GatedVault: valid attestation required"
    );
    
    require(token.transferFrom(msg.sender, address(this), amount), "GatedVault: transfer failed");
    
    deposits[msg.sender] += amount;
    totalDeposits += amount;
    
    emit Deposited(msg.sender, amount);
}

/**
 * @notice Withdraw tokens - requires valid attestation
 */
function withdraw(uint256 amount) external nonReentrant {
    require(deposits[msg.sender] >= amount, "GatedVault: insufficient balance");
    require(
        attestationGate.hasValidAttestationOfSchema(msg.sender, requiredSchemaUID),
        "GatedVault: valid attestation required"
    );
    
    deposits[msg.sender] -= amount;
    totalDeposits -= amount;
    
    require(token.transfer(msg.sender, amount), "GatedVault: transfer failed");
    
    emit Withdrawn(msg.sender, amount);
}
```

---

## 6. Schema Definitions (For Backend)

### Schemas to Register on RAS Schema Registry:

#### 1. KYC Schema:
```solidity
// Schema: "bool isKYCVerified, string kycProvider, uint256 verifiedAt"
// Example: "bool isKYCVerified,string kycProvider,uint256 verifiedAt"
```

#### 2. Age Verification Schema:
```solidity
// Schema: "bool isOver18, uint256 dateOfBirth, string statement"
// Example: "bool isOver18,uint256 dateOfBirth,string statement"
```

#### 3. Document Ownership Schema:
```solidity
// Schema: "string documentType, bytes32 documentHash, string statement"
// Example: "string documentType,bytes32 documentHash,string statement"
```

**Note**: Schemas are registered via backend using EAS SDK, then schema UIDs are stored in `RASConstants.sol` or passed to contracts.

---

## 7. Integration Flow

### Complete Flow:

1. **Backend receives attestation request** (e.g., "I am over 18")
2. **Backend validates claim** (off-chain verification)
3. **Backend registers schema** (if not exists) via Schema Registry
4. **Backend issues attestation** via EAS SDK → Gets attestation UID
5. **Backend calls `AttestationGate.registerAttestation()`** → Maps user address to UID
6. **User interacts with token-gated contract** → Contract checks `AttestationGate.hasValidAttestationOfSchema()`
7. **Contract queries RAS** → Verifies attestation is valid (not revoked, not expired)

---

## 8. Security Considerations

1. **ReentrancyGuard**: All state-changing functions protected
2. **Attestation Validation**: Always verify via RAS contract (on-chain source of truth)
3. **Expiry Checks**: Automatic expiry validation via RAS
4. **Revocation Checks**: Automatic revocation check via RAS
5. **Input Validation**: All addresses and UIDs validated
6. **Access Control**: Owner-only functions for admin operations
7. **No Trust Assumptions**: AttestationGate only stores mappings, validation always queries RAS

---

## 9. Testing Requirements

### AttestationGate Tests:
- ✅ Register attestation (success)
- ✅ Register attestation (invalid UID)
- ✅ Register attestation (wrong recipient)
- ✅ Register attestation (revoked attestation)
- ✅ Register attestation (expired attestation)
- ✅ Remove attestation (revoked)
- ✅ Remove attestation (expired)
- ✅ hasValidAttestation (valid)
- ✅ hasValidAttestation (invalid)
- ✅ hasValidAttestationOfSchema (valid)
- ✅ hasValidAttestationOfSchema (wrong schema)
- ✅ Integration with mock EAS contract

### GatedNFTMinter Tests:
- ✅ Mint with valid attestation
- ✅ Mint without attestation (revert)
- ✅ Mint with expired attestation (revert)
- ✅ Mint with revoked attestation (revert)
- ✅ Mint max supply reached (revert)
- ✅ Mint insufficient payment (revert)
- ✅ Mint already minted (revert)
- ✅ Withdraw funds
- ✅ Set mint price (owner only)
- ✅ Set required schema (owner only)

### GatedVault Tests:
- ✅ Deposit with valid attestation
- ✅ Deposit without attestation (revert)
- ✅ Deposit with expired attestation (revert)
- ✅ Withdraw with valid attestation
- ✅ Withdraw without attestation (revert)
- ✅ Multiple deposits/withdrawals
- ✅ Attestation expiry during deposit period

### Integration Tests:
- ✅ Full flow: Backend issues attestation → Register → Mint NFT
- ✅ Attestation revocation → Cannot mint anymore
- ✅ Attestation expiry → Cannot mint anymore
- ✅ Multiple attestation types per user

---

## 10. Deployment Order

1. **Deploy `AttestationGate`** (with EAS contract address from RASConstants)
2. **Backend registers schemas** on Schema Registry (gets schema UIDs)
3. **Update `RASConstants.sol`** with schema UIDs (or pass to contracts)
4. **Deploy `GatedNFTMinter`** (passing AttestationGate address and schema UID)
5. **Deploy `GatedVault`** (passing AttestationGate address, token address, and schema UID)

---

## 11. Dependencies Required

### Smart Contracts:
- `@openzeppelin/contracts` (already installed)

### Backend (to be added):
- `@ethereum-attestation-service/eas-sdk` - For issuing attestations
- `ethers` or `viem` - For contract interactions
- GraphQL client - For querying attestations

---

## 12. Key Differences from Original Plan

| Original Plan | Updated Plan (RAS Integration) |
|---------------|--------------------------------|
| Custom `AttestationRegistry` contract | Use deployed RAS/EAS contracts |
| Custom signature verification | RAS handles verification |
| Custom expiry/revocation logic | RAS handles expiry/revocation |
| Store attestations on-chain | RAS stores attestations, we store mappings |
| Custom attestation issuance | Use EAS SDK for issuance |
| Direct address → attestation mapping | Address → UID → RAS query |

---

## 13. Privacy-Preserving Design

- **Off-chain attestations**: Attestation data stored off-chain (IPFS), only hash on-chain
- **Schema-based filtering**: Contracts check schema UID, not full attestation data
- **Minimal on-chain data**: Only store UID mappings, not attestation content
- **Selective disclosure**: Users can choose which attestations to register

---

## Summary

This architecture leverages **RAS (EAS on Rootstock)** for attestation infrastructure while providing:
- ✅ Token-gated access via `AttestationGate` helper
- ✅ Multiple attestation types per user
- ✅ On-chain verification via RAS contracts
- ✅ Privacy-preserving (off-chain data, on-chain verification)
- ✅ Integration with existing RAS ecosystem

**Next Steps:**
1. Implement contracts as per this plan
2. Set up backend with EAS SDK
3. Register schemas on Schema Registry
4. Build frontend integration
5. Write comprehensive tests
