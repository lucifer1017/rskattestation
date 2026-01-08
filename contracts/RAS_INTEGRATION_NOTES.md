# RAS Integration Notes

## RAS = EAS on Rootstock

**RAS (Rootstock Attestation Service)** is the **EAS (Ethereum Attestation Service)** framework deployed on Rootstock.

- Same contracts, same SDK, same architecture
- We use **EAS SDK** (`@ethereum-attestation-service/eas-sdk`) to interact with RAS
- We reference **RAS** in documentation/user-facing content
- We use **RAS contract addresses** from Rootstock documentation

## Why This Matters

1. **No Custom Attestation Registry Needed**: RAS already handles attestation storage, verification, expiry, revocation
2. **Use EAS SDK**: Standard tooling works with RAS contracts
3. **Leverage Existing Infrastructure**: Schema Registry, Indexer, Explorer all available
4. **Compatibility**: Same patterns as Ethereum EAS, adapted for Rootstock

## Contract Addresses Reference

### Mainnet
- **EAS Contract**: `0x54c0726E9D2D57Bc37aD52C7E219a3229E0ee963`
- **Schema Registry**: `0xef29675d82Cc5967069D6D9c17F2719F67728F5b`
- **Indexer**: `0x4c0Ac010c2eC50Fc1FF3e7E35dADA06A7F26073F`

### Testnet
- **EAS Contract**: `0xc300aeEadd60999933468738c9F5d7e9c0671e1C`
- **Schema Registry**: `0x679c62956cD2801ABaBF80e9D430F18859eea2D5`
- **Indexer**: `0x4352e5b2567551986E21eD65D5ad3052A09e3717`

## Resources

- **RAS Documentation**: https://dev.rootstock.io/dev-tools/attestations/ras/
- **RAS Explorer**: https://explorer.rootstock.io/ras
- **EAS SDK**: https://www.npmjs.com/package/@ethereum-attestation-service/eas-sdk
- **EAS Contracts**: https://github.com/ethereum-attestation-service/eas-contracts
- **RAS Contracts**: https://github.com/rsksmart/eas-contracts

## Backend Dependencies (For Future Reference)

When building the backend, you'll need:

```bash
npm install @ethereum-attestation-service/eas-sdk ethers
```

## Key Concepts

1. **Schema**: Defines structure of attestation data (registered on Schema Registry)
2. **Attestation**: A claim issued to a recipient (stored on EAS contract)
3. **UID**: Unique identifier for each attestation
4. **Recipient**: Address receiving the attestation
5. **Attester**: Address issuing the attestation

## Integration Pattern

```
User Request → Backend Validation → EAS SDK Issue → Get UID → Register in AttestationGate → Token-Gated Access
```





