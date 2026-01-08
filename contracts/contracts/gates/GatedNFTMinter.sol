// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AttestationGate.sol";

/**
 * @title GatedNFTMinter
 * @notice NFT contract that requires valid RAS attestation to mint
 * @dev Demonstrates token-gated access using Rootstock Attestation Service
 */
contract GatedNFTMinter is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    AttestationGate public attestationGate;
    bytes32 public requiredSchemaUID; // Schema UID required for minting
    uint256 public maxSupply;
    uint256 public currentSupply;
    uint256 public mintPrice;
    mapping(address => bool) public hasMinted;

    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, address indexed minter);
    event MintPriceUpdated(uint256 newPrice);
    event RequiredSchemaUpdated(bytes32 newSchemaUID);

    /**
     * @notice Initialize GatedNFTMinter
     * @param _attestationGate Address of AttestationGate contract
     * @param _requiredSchemaUID Schema UID required for minting
     * @param _maxSupply Maximum number of NFTs that can be minted
     * @param _mintPrice Price to mint an NFT (in wei)
     * @param name NFT collection name
     * @param symbol NFT collection symbol
     */
    constructor(
        address _attestationGate,
        bytes32 _requiredSchemaUID,
        uint256 _maxSupply,
        uint256 _mintPrice,
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(msg.sender) {
        require(_attestationGate != address(0), "GatedNFTMinter: invalid gate address");
        require(_maxSupply > 0, "GatedNFTMinter: invalid max supply");
        
        attestationGate = AttestationGate(_attestationGate);
        requiredSchemaUID = _requiredSchemaUID;
        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
        currentSupply = 0;
    }

    /**
     * @notice Mint an NFT - requires valid attestation from RAS
     * @dev Mints NFT to msg.sender (caller must have valid attestation)
     */
    function mint() external payable nonReentrant {
        require(currentSupply < maxSupply, "GatedNFTMinter: max supply reached");
        require(msg.value >= mintPrice, "GatedNFTMinter: insufficient payment");
        require(!hasMinted[msg.sender], "GatedNFTMinter: already minted");

        // Check attestation via AttestationGate
        require(
            attestationGate.hasValidAttestationOfSchema(msg.sender, requiredSchemaUID),
            "GatedNFTMinter: valid attestation required"
        );

        uint256 tokenId = currentSupply + 1;
        _safeMint(msg.sender, tokenId);
        currentSupply++;
        hasMinted[msg.sender] = true;

        emit NFTMinted(msg.sender, tokenId, msg.sender);

        // Refund excess payment
        if (msg.value > mintPrice) {
            payable(msg.sender).transfer(msg.value - mintPrice);
        }
    }

    /**
     * @notice Set token URI for a token
     * @param tokenId Token ID
     * @param _tokenURI Token URI
     */
    function setTokenURI(uint256 tokenId, string memory _tokenURI) external onlyOwner {
        require(tokenId > 0 && tokenId <= currentSupply, "GatedNFTMinter: token does not exist");
        _setTokenURI(tokenId, _tokenURI);
    }

    /**
     * @notice Withdraw contract balance
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "GatedNFTMinter: no balance to withdraw");
        payable(owner()).transfer(balance);
    }

    /**
     * @notice Set mint price
     * @param _newPrice New mint price in wei
     */
    function setMintPrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice != mintPrice, "GatedNFTMinter: same price");
        mintPrice = _newPrice;
        emit MintPriceUpdated(_newPrice);
    }

    /**
     * @notice Set required schema UID
     * @param _newSchemaUID New schema UID required for minting
     */
    function setRequiredSchema(bytes32 _newSchemaUID) external onlyOwner {
        require(_newSchemaUID != requiredSchemaUID, "GatedNFTMinter: same schema");
        require(_newSchemaUID != bytes32(0), "GatedNFTMinter: invalid schema");
        requiredSchemaUID = _newSchemaUID;
        emit RequiredSchemaUpdated(_newSchemaUID);
    }

    // Override required by Solidity
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

