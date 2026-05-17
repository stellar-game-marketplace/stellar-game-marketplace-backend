# Backend Implementation Flow

This document describes what is implemented in the backend, how data moves through the system, and how each module connects.

---

## System Overview

```
Freighter Wallet
     │
     ▼
POST /auth/challenge  →  AuthService generates random hex challenge
POST /auth/verify     →  AuthService verifies Stellar Ed25519 sig  →  JWT issued
     │
     ▼
Frontend / Client (Bearer token)
     │
     ├──▶  GET/POST /nfts              →  NftService      →  PostgreSQL (nfts)
     ├──▶  GET/POST /marketplace/...   →  MarketplaceService  →  PostgreSQL (listings, bids)
     └──▶  GET /indexer/status         →  IndexerService  →  last indexed ledger
                  ▲
                  │  (every 10 seconds)
     Soroban RPC  ──▶  IndexerService  →  PostgreSQL (indexed_events)
                                       →  MarketplaceService (state sync)
```

---

## Auth Flow

```
1. Client sends:   POST /auth/challenge  { address: "GABC..." }
2. AuthService:    generates 32-byte random hex challenge
                   stores { challenge, expiresAt: now + 5min } in memory keyed by address
3. Server returns: { challenge: "a3f9..." }

4. Client signs the challenge string with Freighter (Ed25519)
5. Client sends:   POST /auth/verify  { address, challenge, signature (base64) }
6. AuthService:    looks up stored challenge for address
                   verifies expiry
                   calls Keypair.fromPublicKey(address).verify(challenge, sig)
                   deletes challenge from store
7. Server returns: { accessToken: "eyJ..." }  (JWT, 24h expiry)

8. Client attaches: Authorization: Bearer <token>
9. JwtStrategy:    validates token, injects { address } into req.user
10. GET /auth/me   returns { address: "GABC..." }
```

**Key files:**
- `src/auth/auth.service.ts` — challenge generation + signature verification
- `src/auth/jwt.strategy.ts` — Passport JWT strategy
- `src/auth/auth.controller.ts` — route handlers
- `src/auth/dto/auth.dto.ts` — request validation

---

## NFT Flow

```
Indexer (on-chain event)  ──▶  NftService.create()  ──▶  nfts table
                                      │
Manual POST /nfts ────────────────────┘

GET /nfts                 →  NftService.findAll()         →  all rows
GET /nfts/:tokenId        →  NftService.findOne()         →  single row (404 if missing)
GET /nfts/owner/:address  →  NftService.findByOwner()     →  filtered by owner column
POST /nfts                →  NftService.create()          →  insert row
```

**Entity:** `nfts` table
```
tokenId (unique)  owner  name  description  imageUri  gameId  rarity  contractAddress
```

**Key files:**
- `src/nft/nft.service.ts`
- `src/nft/nft.controller.ts`
- `src/entities/nft.entity.ts`

---

## Marketplace Flow

### Listings

```
Indexer (list event)   ──▶  MarketplaceService.createListing()  ──▶  listings table (status: active)
Indexer (cancel event) ──▶  MarketplaceService.cancelListing()  ──▶  listings table (status: cancelled)
Indexer (buy event)    ──▶  MarketplaceService.markSold()       ──▶  listings table (status: sold)

GET  /marketplace/listings          →  all active listings
GET  /marketplace/listings/:id      →  single listing (404 if missing)
POST /marketplace/listings          →  manual insert
PATCH /marketplace/listings/:id/cancel  →  set status = cancelled
```

### Bids

```
Indexer (bid event)  ──▶  MarketplaceService.createBid()  ──▶  bids table (active: true)

POST /marketplace/bids              →  manual insert
GET  /marketplace/listings/:id/bids →  all active bids for a listing
GET  /marketplace/bids/:bidId       →  single bid (404 if missing)
```

**Entities:**
```
listings  — listingId (unique)  seller  nftContract  tokenId  price  paymentToken  status  expiresAt
bids      — bidId (unique)      bidder  listingId    amount   expiresAt  active
```

**Key files:**
- `src/marketplace/marketplace.service.ts`
- `src/marketplace/marketplace.controller.ts`
- `src/entities/listing.entity.ts`
- `src/entities/bid.entity.ts`

---

## Indexer Flow

```
Every 10 seconds (cron):

1. IndexerService reads lastLedger from indexed_events table (on startup)
2. Calls Soroban RPC:
   server.getEvents({
     startLedger: lastLedger + 1,
     filters: [{ type: 'contract', contractIds: [MARKETPLACE_ID, SWAP_ID, ROYALTY_ID] }]
   })
3. For each event:
   a. Deduplicates by (txHash, topic)
   b. Inserts row into indexed_events (contractId, topic, payload, ledger, txHash)
   c. Updates lastLedger
   d. Dispatches to state sync:

      topic = "list"      →  MarketplaceService.createListing(payload)
      topic = "cancel"    →  MarketplaceService.cancelListing(payload.listing_id)
      topic = "buy"       →  MarketplaceService.markSold(payload.listing_id)
      topic = "bid"       →  MarketplaceService.createBid(payload)
      topic = "execute"   →  stored in indexed_events only
      topic = "distribute"→  stored in indexed_events only

GET /indexer/status  →  { lastLedger: <number> }
```

**Entity:** `indexed_events` table
```
contractId  topic  payload (jsonb)  ledger  txHash
```

**Key files:**
- `src/indexer/indexer.service.ts`
- `src/indexer/indexer.controller.ts`
- `src/entities/indexed-event.entity.ts`

---

## Database Tables

```
┌─────────────────────────────────────────────────────────────┐
│  nfts                                                       │
│  id · tokenId · owner · name · description · imageUri      │
│  gameId · rarity · contractAddress · createdAt             │
├─────────────────────────────────────────────────────────────┤
│  listings                                                   │
│  id · listingId · seller · nftContract · tokenId · price   │
│  paymentToken · status (active|cancelled|sold) · expiresAt │
│  createdAt                                                  │
├─────────────────────────────────────────────────────────────┤
│  bids                                                       │
│  id · bidId · bidder · listingId · amount · expiresAt      │
│  active · createdAt                                         │
├─────────────────────────────────────────────────────────────┤
│  indexed_events                                             │
│  id · contractId · topic · payload (jsonb) · ledger        │
│  txHash · createdAt                                         │
└─────────────────────────────────────────────────────────────┘
```

Schema is auto-synced via TypeORM `synchronize: true` in non-production environments.

---

## Test Coverage

| File | Tests | What is covered |
|---|---|---|
| `nft.service.spec.ts` | 6 | create, findAll, findOne, findByOwner, updateOwner, NotFoundException |
| `marketplace.service.spec.ts` | 9 | createListing, findAllListings, findListing, cancelListing, markSold, createBid, findBidsByListing, findBid, NotFoundException |
| **Total** | **15** | All service methods, all error paths |

All tests use mocked TypeORM repositories — no database connection required.

---

## What Is Not Yet Implemented (Phase 2)

| Feature | Notes |
|---|---|
| Analytics | Volume, fees collected, top assets by trade count |
| WebSocket updates | Real-time push on new listings / bids / sales |
| Fraud detection | Wash trading detection, wallet reputation scoring |
| Trade monitoring | Notifications on bid acceptance, listing expiry |
| NFT metadata cache | IPFS sync, image proxy, metadata refresh cron |
| Accept bid flow | Execute bid → atomic swap → mark listing sold |
| Auction engine | Time-based auctions, highest-bid settlement |
