# SecureTransac - Archived

## Status: ARCHIVED (November 2026)

This repository is **archived** and no longer actively maintained.

### Why Archived

SecureTransac combines several existing blockchain patterns (custodian wallet management, upgradeable smart contracts, on-chain AI risk scoring) without a clear enough differentiation to justify the complexity for production use. The project was archived after review identified significant feasibility concerns:

1. **Data scope limitation**: The AI model only considers transactions logged via the `TransactionLogged` event (contract-explicit activity), missing most on-chain activity (ETH transfers, DEX swaps, ERC20 trades).

2. **Sybil resistance unproven**: "Guilt by association" social graph features can be gamed with self-transactions.

3. **Privacy vs utility trade-off**: Paillier-encrypted on-chain scores require the server to hold the private key, creating a single point of failure.

4. **No custodial functionality**: The system observes and scores risk but does not hold, move, or manage user funds — yet combines patterns that *look* custodial from a distance.

### What Worked Well

- **Paillier-encrypted on-chain score storage** — legitimate privacy-preserving pattern
- **`Request` struct with `uint96` timestamp** — deliberate storage layout optimization
- **Automatic `bool` packing** in `ScoreUpdateRecord` — standard Solidity behavior working as expected
- **Frontend `Map`-based score caching** — achieves ~90% RPC load reduction for repeated lookups
- **Admin override of encrypted scores** — well-designed governance pattern

### Technical Debt / Known Issues

- Server-side `node-cache` (simulated Redis) defined in `cacheService.js` but never connected to the main pipeline
- No decentralized inference layer — single-server architecture
- Feature extraction from limited event subset (only `TransactionLogged`, not full on-chain activity)
- No sybil-resistance mechanism for the social-graph features

### Re-use Opportunities

If any individual component is worth reviving:

- **Privacy-preserving score computation** — the Paillier encryption + on-chain score pattern could be repurposed for GDPR-compliant systems
- **Struct packing patterns** — the `Request` struct (`address + uint96`) and `ScoreUpdateRecord` (`bool` at end) are solid examples of Solidity storage optimization
- **Event-driven vs storage-driven data patterns** — the `VerificationRegistry.sol` event-only approach is a valid gas optimization strategy

### Contact

This project was developed by Ayush Docs. Questions about the archival decision can be directed to the original repository maintainer.

---

*Archived November 2026. This repository is read-only.*