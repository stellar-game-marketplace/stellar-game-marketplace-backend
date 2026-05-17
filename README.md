# Stellar Game Marketplace — Backend

NestJS backend for the Stellar Game Marketplace. Handles contract event indexing, NFT and listing data, marketplace state, and Stellar wallet authentication.

Part of a three-repo monorepo:

```
stellar-game-marketplace/
├── contracts/   — Soroban smart contracts (Rust)
├── frontend/    — Next.js + Freighter wallet
└── backend/     — this repo
```

---

## Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 10 |
| Database | PostgreSQL + TypeORM |
| Auth | JWT + Stellar Ed25519 signature verification |
| Blockchain | Stellar Soroban RPC (`@stellar/stellar-sdk`) |
| Scheduler | `@nestjs/schedule` (cron-based event polling) |
| Testing | Jest + `@nestjs/testing` |

---

## Modules

### Auth (`/auth`)
Wallet-based authentication using Stellar keypair signatures. No passwords.

| Endpoint | Method | Description |
|---|---|---|
| `/auth/challenge` | POST | Returns a random hex challenge for a given Stellar address |
| `/auth/verify` | POST | Verifies Ed25519 signature of the challenge, returns JWT |
| `/auth/me` | GET | Returns the authenticated address (requires Bearer token) |

**Flow:**
```
POST /auth/challenge  { address: "GABC..." }
  → { challenge: "a3f9..." }

Sign challenge with Freighter wallet

POST /auth/verify  { address, challenge, signature }
  → { accessToken: "eyJ..." }
```

---

### NFT (`/nfts`)
Mirrors the on-chain `nft-contract` state. Populated by the indexer.

| Endpoint | Method | Description |
|---|---|---|
| `/nfts` | GET | List all indexed NFTs |
| `/nfts` | POST | Manually index an NFT record |
| `/nfts/:tokenId` | GET | Get NFT by token ID |
| `/nfts/owner/:address` | GET | Get all NFTs owned by a Stellar address |

---

### Marketplace (`/marketplace`)
Mirrors `marketplace-contract` listings and bids. Kept in sync by the indexer.

| Endpoint | Method | Description |
|---|---|---|
| `/marketplace/listings` | GET | All active listings |
| `/marketplace/listings` | POST | Manually create a listing record |
| `/marketplace/listings/:id` | GET | Get listing by on-chain listing ID |
| `/marketplace/listings/:id/cancel` | PATCH | Mark listing as cancelled |
| `/marketplace/bids` | POST | Record a bid |
| `/marketplace/listings/:id/bids` | GET | All active bids for a listing |
| `/marketplace/bids/:bidId` | GET | Get bid by on-chain bid ID |

---

### Indexer (`/indexer`)
Polls the Soroban RPC every 10 seconds for contract events and syncs state into PostgreSQL.

Tracked events:

| Topic | Contract | Action |
|---|---|---|
| `list` | marketplace-contract | Creates listing record |
| `cancel` | marketplace-contract | Marks listing cancelled |
| `buy` | marketplace-contract | Marks listing sold |
| `bid` | marketplace-contract | Creates bid record |
| `execute` | atomic-swap-contract | Recorded to event log |
| `distribute` | royalty-contract | Recorded to event log |

| Endpoint | Method | Description |
|---|---|---|
| `/indexer/status` | GET | Returns the last indexed ledger number |

---

## Database Schema

```
nfts              — tokenId, owner, name, description, imageUri, gameId, rarity, contractAddress
listings          — listingId, seller, nftContract, tokenId, price, paymentToken, status, expiresAt
bids              — bidId, bidder, listingId, amount, expiresAt, active
indexed_events    — contractId, topic, payload (jsonb), ledger, txHash
```

`synchronize: true` is enabled in non-production environments — schema is auto-migrated on startup.

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+

### Install

```bash
npm install
```

### Environment variables

```bash
# .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stellar_marketplace
JWT_SECRET=your-secret-here
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
MARKETPLACE_CONTRACT_ID=C...
SWAP_CONTRACT_ID=C...
ROYALTY_CONTRACT_ID=C...
PORT=3000
```

### Run

```bash
# development
npm run start:dev

# production build
npm run build
npm run start
```

### Test

```bash
npm test
```

15 unit tests across NFT and Marketplace services. All tests use mocked repositories — no database required.

---

## Project Structure

```
src/
├── app.module.ts
├── main.ts
├── entities/
│   ├── nft.entity.ts
│   ├── listing.entity.ts
│   ├── bid.entity.ts
│   └── indexed-event.entity.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── jwt.strategy.ts
│   └── dto/auth.dto.ts
├── nft/
│   ├── nft.module.ts
│   ├── nft.service.ts
│   ├── nft.controller.ts
│   ├── nft.service.spec.ts
│   └── dto/create-nft.dto.ts
├── marketplace/
│   ├── marketplace.module.ts
│   ├── marketplace.service.ts
│   ├── marketplace.controller.ts
│   ├── marketplace.service.spec.ts
│   └── dto/marketplace.dto.ts
└── indexer/
    ├── indexer.module.ts
    ├── indexer.service.ts
    └── indexer.controller.ts
```

---

## Roadmap

| Feature | Status |
|---|---|
| NFT indexing & REST API | ✅ Done |
| Marketplace listings & bids | ✅ Done |
| Soroban event indexer | ✅ Done |
| Stellar wallet auth (JWT) | ✅ Done |
| Analytics (volume, fees, top assets) | 🔜 Phase 2 |
| WebSocket real-time updates | 🔜 Phase 2 |
| Fraud detection | 🔜 Phase 2 |
| Trade monitoring & notifications | 🔜 Phase 2 |
| NFT metadata cache (IPFS sync) | 🔜 Phase 2 |
