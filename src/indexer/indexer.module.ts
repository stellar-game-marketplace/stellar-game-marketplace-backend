import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndexedEvent } from '../entities/indexed-event.entity';
import { IndexerService } from './indexer.service';
import { IndexerController } from './indexer.controller';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { NftModule } from '../nft/nft.module';

@Module({
  imports: [TypeOrmModule.forFeature([IndexedEvent]), MarketplaceModule, NftModule],
  providers: [IndexerService],
  controllers: [IndexerController],
})
export class IndexerModule {}
