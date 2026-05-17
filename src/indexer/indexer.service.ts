import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IndexedEvent } from '../entities/indexed-event.entity';
import { MarketplaceService } from '../marketplace/marketplace.service';
import { NftService } from '../nft/nft.service';

const RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const CONTRACT_IDS = [
  process.env.MARKETPLACE_CONTRACT_ID,
  process.env.SWAP_CONTRACT_ID,
  process.env.ROYALTY_CONTRACT_ID,
].filter(Boolean) as string[];

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);
  private lastLedger = 0;

  constructor(
    @InjectRepository(IndexedEvent) private readonly eventRepo: Repository<IndexedEvent>,
    private readonly marketplaceSvc: MarketplaceService,
    private readonly nftSvc: NftService,
  ) {}

  async onModuleInit() {
    // Start from the latest stored ledger
    const latest = await this.eventRepo
      .createQueryBuilder('e')
      .select('MAX(e.ledger)', 'max')
      .getRawOne();
    this.lastLedger = latest?.max ?? 0;
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async pollEvents() {
    if (!CONTRACT_IDS.length) return;

    let SorobanRpc: any;
    try {
      const sdk = await import('@stellar/stellar-sdk');
      SorobanRpc = (sdk as any).SorobanRpc ?? (sdk as any).rpc;
      if (!SorobanRpc?.Server) throw new Error('SorobanRpc not found');
    } catch {
      this.logger.warn('Stellar SDK RPC module not available');
      return;
    }

    const server = new SorobanRpc.Server(RPC_URL);
    const startLedger = this.lastLedger > 0 ? this.lastLedger + 1 : undefined;

    let response: any;
    try {
      response = await server.getEvents({
        ...(startLedger ? { startLedger } : {}),
        filters: [{ type: 'contract', contractIds: CONTRACT_IDS }],
      });
    } catch (err) {
      this.logger.warn(`Failed to fetch events: ${err.message}`);
      return;
    }

    for (const event of response.events ?? []) {
      await this.processEvent(event);
    }
  }

  private async processEvent(event: any) {
    const topic = event.topic?.[0]?.value ?? '';
    const contractId = event.contractId ?? '';
    const ledger = event.ledger ?? 0;
    const txHash = event.txHash ?? '';

    // Deduplicate
    const exists = await this.eventRepo.findOne({ where: { txHash, topic } });
    if (exists) return;

    const payload = event.value ?? {};

    await this.eventRepo.save(
      this.eventRepo.create({ contractId, topic, payload, ledger, txHash }),
    );

    if (ledger > this.lastLedger) this.lastLedger = ledger;

    // Sync state based on event topic
    try {
      if (topic === 'list') {
        await this.marketplaceSvc.createListing({
          listingId: payload.listing_id?.toString(),
          seller: payload.seller,
          nftContract: payload.nft_contract,
          tokenId: payload.token_id?.toString(),
          price: payload.price?.toString(),
          paymentToken: payload.payment_token,
          expiresAt: payload.expires_at,
        });
      } else if (topic === 'cancel') {
        if (payload.listing_id) await this.marketplaceSvc.cancelListing(payload.listing_id.toString());
      } else if (topic === 'buy') {
        if (payload.listing_id) await this.marketplaceSvc.markSold(payload.listing_id.toString());
      } else if (topic === 'bid') {
        await this.marketplaceSvc.createBid({
          bidId: payload.bid_id?.toString(),
          bidder: payload.bidder,
          listingId: payload.listing_id?.toString(),
          amount: payload.amount?.toString(),
          expiresAt: payload.expires_at,
        });
      }
    } catch (err) {
      this.logger.warn(`State sync failed for topic ${topic}: ${err.message}`);
    }
  }
}
