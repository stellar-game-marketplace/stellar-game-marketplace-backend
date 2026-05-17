import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nft } from '../entities/nft.entity';
import { NftService } from './nft.service';
import { NftController } from './nft.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Nft])],
  providers: [NftService],
  controllers: [NftController],
  exports: [NftService],
})
export class NftModule {}
