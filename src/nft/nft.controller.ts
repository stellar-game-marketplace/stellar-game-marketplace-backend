import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { NftService } from './nft.service';
import { CreateNftDto } from './dto/create-nft.dto';

@Controller('nfts')
export class NftController {
  constructor(private readonly nftService: NftService) {}

  @Post()
  create(@Body() dto: CreateNftDto) {
    return this.nftService.create(dto);
  }

  @Get()
  findAll() {
    return this.nftService.findAll();
  }

  @Get('owner/:address')
  findByOwner(@Param('address') address: string) {
    return this.nftService.findByOwner(address);
  }

  @Get(':tokenId')
  findOne(@Param('tokenId') tokenId: string) {
    return this.nftService.findOne(tokenId);
  }
}
