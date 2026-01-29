// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AttestationGate.sol";

/**
 * @title GatedVault
 * @notice DeFi vault that requires valid RAS attestation to deposit/withdraw
 * @dev Demonstrates token-gated DeFi access using Rootstock Attestation Service
 */
contract GatedVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    AttestationGate public attestationGate;
    bytes32 public requiredSchemaUID;
    IERC20 public token;
    mapping(address => uint256) public deposits;
    mapping(address => bool) public hadValidAttestationAtDeposit;
    uint256 public totalDeposits;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event EmergencyWithdrawn(address indexed user, uint256 amount, address indexed admin);
    event RequiredSchemaUpdated(bytes32 newSchemaUID);

    /**
     * @notice Initialize GatedVault
     * @param _attestationGate Address of AttestationGate contract
     * @param _token Address of ERC20 token to accept
     * @param _requiredSchemaUID Schema UID required for access
     */
    constructor(
        address _attestationGate,
        address _token,
        bytes32 _requiredSchemaUID
    ) Ownable(msg.sender) {
        require(_attestationGate != address(0), "GatedVault: invalid gate address");
        require(_token != address(0), "GatedVault: invalid token address");
        require(_requiredSchemaUID != bytes32(0), "GatedVault: invalid schema");

        attestationGate = AttestationGate(_attestationGate);
        token = IERC20(_token);
        requiredSchemaUID = _requiredSchemaUID;
    }

    /**
     * @notice Deposit tokens - requires valid attestation from RAS
     * @param amount Amount of tokens to deposit
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "GatedVault: amount must be greater than 0");
        require(
            attestationGate.hasValidAttestationOfSchema(msg.sender, requiredSchemaUID),
            "GatedVault: valid attestation required"
        );

        token.safeTransferFrom(msg.sender, address(this), amount);

        deposits[msg.sender] += amount;
        totalDeposits += amount;
        // Track that user had valid attestation at deposit time (for grandfathered withdrawals)
        hadValidAttestationAtDeposit[msg.sender] = true;

        emit Deposited(msg.sender, amount);
    }

    /**
     * @notice Withdraw tokens - requires valid attestation OR had valid attestation at deposit time
     * @dev Allows withdrawal even if attestation expired (grandfathered) to prevent fund lock
     * @param amount Amount of tokens to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "GatedVault: amount must be greater than 0");
        require(deposits[msg.sender] >= amount, "GatedVault: insufficient balance");

        bool hasCurrentValid = attestationGate.hasValidAttestationOfSchema(msg.sender, requiredSchemaUID);
        bool hadValidAtDeposit = hadValidAttestationAtDeposit[msg.sender];
        require(
            hasCurrentValid || hadValidAtDeposit,
            "GatedVault: valid attestation required"
        );

        deposits[msg.sender] -= amount;
        totalDeposits -= amount;

        token.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Set required schema UID
     * @param _newSchemaUID New schema UID required for access
     */
    function setRequiredSchema(bytes32 _newSchemaUID) external onlyOwner {
        require(_newSchemaUID != requiredSchemaUID, "GatedVault: same schema");
        require(_newSchemaUID != bytes32(0), "GatedVault: invalid schema");
        requiredSchemaUID = _newSchemaUID;
        emit RequiredSchemaUpdated(_newSchemaUID);
    }

    /**
     * @notice Get user's deposit balance
     * @param user Address of the user
     * @return balance User's deposit balance
     */
    function getDepositBalance(address user) external view returns (uint256 balance) {
        return deposits[user];
    }

    /**
     * @notice Emergency withdrawal function for admin (owner only)
     * @dev Allows owner to withdraw funds for a user in edge cases (e.g., attestation system issues)
     * @param user Address of the user to withdraw for
     * @param amount Amount of tokens to withdraw
     */
    function emergencyWithdraw(address user, uint256 amount) external onlyOwner nonReentrant {
        require(user != address(0), "GatedVault: invalid user address");
        require(amount > 0, "GatedVault: amount must be greater than 0");
        require(deposits[user] >= amount, "GatedVault: insufficient balance");

        deposits[user] -= amount;
        totalDeposits -= amount;

        token.safeTransfer(user, amount);

        emit EmergencyWithdrawn(user, amount, msg.sender);
    }
}

