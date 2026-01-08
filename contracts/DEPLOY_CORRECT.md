# CORRECT Deployment Command

## The Issue
Hardhat Ignition's `--parameters` flag expects a **FILE PATH**, not inline JSON!

## The Solution

I've already created `deploy-params.json` with your parameters. Just run:

```powershell
cd contracts
npx hardhat ignition deploy ignition/modules/GatedNFTMinter.ts --network rskTestnet --parameters deploy-params.json
```

That's it! The file `deploy-params.json` contains:
```json
{
  "GatedNFTMinterModule": {
    "attestationGateAddress": "0xe022df9f57b611675B6b713307E7563D0c9abC74",
    "requiredSchemaUID": "0xf58b8b212ef75ee8cd7e8d803c37c03e0519890502d5e99ee2412aae1456cafe",
    "maxSupply": "1000",
    "mintPrice": "100000000000000000",
    "name": "Rootstock Attestation NFT",
    "symbol": "RANFT"
  }
}
```

## Why This Works
- Hardhat Ignition reads the JSON from the file
- No PowerShell parsing issues
- Clean and simple!

