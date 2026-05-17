import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Nft } from './entities/nft.entity';
import { Listing } from './entities/listing.entity';
import { Bid } from './entities/bid.entity';
import { IndexedEvent } from './entities/indexed-event.entity';
import { NftModule } from './nft/nft.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { IndexerModule } from './indexer/indexer.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/stellar_marketplace',
      entities: [Nft, Listing, Bid, IndexedEvent],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    NftModule,
    MarketplaceModule,
    IndexerModule,
    AuthModule,
  ],
})
export class AppModule {}
