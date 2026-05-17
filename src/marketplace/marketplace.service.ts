import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing, ListingStatus } from '../entities/listing.entity';
import { Bid } from '../entities/bid.entity';
import { CreateListingDto, CreateBidDto } from './dto/marketplace.dto';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(Listing) private readonly listingRepo: Repository<Listing>,
    @InjectRepository(Bid) private readonly bidRepo: Repository<Bid>,
  ) {}

  // --- Listings ---

  createListing(dto: CreateListingDto): Promise<Listing> {
    return this.listingRepo.save(this.listingRepo.create(dto));
  }

  findAllListings(): Promise<Listing[]> {
    return this.listingRepo.find({ where: { status: ListingStatus.ACTIVE } });
  }

  async findListing(listingId: string): Promise<Listing> {
    const listing = await this.listingRepo.findOne({ where: { listingId } });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);
    return listing;
  }

  async cancelListing(listingId: string): Promise<Listing> {
    const listing = await this.findListing(listingId);
    listing.status = ListingStatus.CANCELLED;
    return this.listingRepo.save(listing);
  }

  async markSold(listingId: string): Promise<Listing> {
    const listing = await this.findListing(listingId);
    listing.status = ListingStatus.SOLD;
    return this.listingRepo.save(listing);
  }

  // --- Bids ---

  createBid(dto: CreateBidDto): Promise<Bid> {
    return this.bidRepo.save(this.bidRepo.create(dto));
  }

  findBidsByListing(listingId: string): Promise<Bid[]> {
    return this.bidRepo.find({ where: { listingId, active: true } });
  }

  async findBid(bidId: string): Promise<Bid> {
    const bid = await this.bidRepo.findOne({ where: { bidId } });
    if (!bid) throw new NotFoundException(`Bid ${bidId} not found`);
    return bid;
  }
}
