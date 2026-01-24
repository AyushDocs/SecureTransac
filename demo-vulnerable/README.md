# SecureTransac NPM Package Demo

This project demonstrates how to use the `@securetransac/contracts` NPM package to secure a smart contract.

## vulnerability
The `VulnerableBank.sol` contract allows anyone to withdraw funds, leading to potential exploits (e.g. reentrancy or just unauthorized withdrawals).

## The Solution
The `SecureBank.sol` contract imports `Guardian` from our NPM package:

```solidity
import "secure-transac-contracts/contracts/Guardian.sol";

contract SecureBank is Guardian {
    constructor(address _registry) Guardian(_registry, 800) {}
    // ...
}
```

By inheriting `Guardian`, the `withdraw` function is protected by the `onlyTrusted` modifier. Only users with a Trust Score > 800 (AI verified) can withdraw.

## Running the Demo

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile contracts (uses the NPM package):
   ```bash
   npx truffle compile
   ```

3. Run tests to verify protection:
   ```bash
   npx truffle test
   ```

## Package Structure
The `secure-transac-contracts` package exports:
- `Guardian.sol`: Access control layer
- `TrustRegistry.sol`: Interface to the Trust Score system
- `IdentityVault.sol`: Secure identity management
