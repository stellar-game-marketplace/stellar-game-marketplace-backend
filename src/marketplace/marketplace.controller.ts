import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { CreateListingDto, CreateBidDto } from './dto/marketplace.dto';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly svc: MarketplaceService) {}

  @Post('listings')
  createListing(@Body() dto: CreateListingDto) {
    return this.svc.createListing(dto);
  }

  @Get('listings')
  findAllListings() {
    return this.svc.findAllListings();
  }

  @Get('listings/:listingId')
  findListing(@Param('listingId') listingId: string) {
    return this.svc.findListing(listingId);
  }

  @Patch('listings/:listingId/cancel')
  cancelListing(@Param('listingId') listingId: string) {
    return this.svc.cancelListing(listingId);
  }

  @Post('bids')
  createBid(@Body() dto: CreateBidDto) {
    return this.svc.createBid(dto);
  }

  @Get('listings/:listingId/bids')
  findBidsByListing(@Param('listingId') listingId: string) {
    return this.svc.findBidsByListing(listingId);
  }

  @Get('bids/:bidId')
  findBid(@Param('bidId') bidId: string) {
    return this.svc.findBid(bidId);
  }
}
