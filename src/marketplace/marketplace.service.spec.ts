import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { Listing, ListingStatus } from '../entities/listing.entity';
import { Bid } from '../entities/bid.entity';

const mockListing: Listing = {
  id: 1,
  listingId: 'listing-1',
  seller: 'GABC123',
  nftContract: 'CXYZ',
  tokenId: 'token-1',
  price: '250',
  paymentToken: 'XLM',
  status: ListingStatus.ACTIVE,
  expiresAt: 9999999999,
  createdAt: new Date(),
};

const mockBid: Bid = {
  id: 1,
  bidId: 'bid-1',
  bidder: 'GDEF456',
  listingId: 'listing-1',
  amount: '200',
  expiresAt: 9999999999,
  active: true,
  createdAt: new Date(),
};

const listingRepo = {
  create: jest.fn((dto) => ({ ...dto })),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

const bidRepo = {
  create: jest.fn((dto) => ({ ...dto })),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

describe('MarketplaceService', () => {
  let service: MarketplaceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceService,
        { provide: getRepositoryToken(Listing), useValue: listingRepo },
        { provide: getRepositoryToken(Bid), useValue: bidRepo },
      ],
    }).compile();

    service = module.get<MarketplaceService>(MarketplaceService);
    jest.clearAllMocks();
  });

  // --- Listings ---

  it('creates a listing', async () => {
    listingRepo.save.mockResolvedValue(mockListing);
    const result = await service.createListing({
      listingId: 'listing-1',
      seller: 'GABC123',
      nftContract: 'CXYZ',
      tokenId: 'token-1',
      price: '250',
    });
    expect(result.listingId).toBe('listing-1');
  });

  it('returns active listings', async () => {
    listingRepo.find.mockResolvedValue([mockListing]);
    const result = await service.findAllListings();
    expect(result).toHaveLength(1);
  });

  it('finds a listing by listingId', async () => {
    listingRepo.findOne.mockResolvedValue(mockListing);
    const result = await service.findListing('listing-1');
    expect(result.seller).toBe('GABC123');
  });

  it('throws NotFoundException for missing listing', async () => {
    listingRepo.findOne.mockResolvedValue(null);
    await expect(service.findListing('missing')).rejects.toThrow(NotFoundException);
  });

  it('cancels a listing', async () => {
    listingRepo.findOne.mockResolvedValue({ ...mockListing });
    listingRepo.save.mockResolvedValue({ ...mockListing, status: ListingStatus.CANCELLED });
    const result = await service.cancelListing('listing-1');
    expect(result.status).toBe(ListingStatus.CANCELLED);
  });

  it('marks a listing as sold', async () => {
    listingRepo.findOne.mockResolvedValue({ ...mockListing });
    listingRepo.save.mockResolvedValue({ ...mockListing, status: ListingStatus.SOLD });
    const result = await service.markSold('listing-1');
    expect(result.status).toBe(ListingStatus.SOLD);
  });

  // --- Bids ---

  it('creates a bid', async () => {
    bidRepo.save.mockResolvedValue(mockBid);
    const result = await service.createBid({
      bidId: 'bid-1',
      bidder: 'GDEF456',
      listingId: 'listing-1',
      amount: '200',
    });
    expect(result.bidId).toBe('bid-1');
  });

  it('finds bids by listing', async () => {
    bidRepo.find.mockResolvedValue([mockBid]);
    const result = await service.findBidsByListing('listing-1');
    expect(result[0].bidder).toBe('GDEF456');
  });

  it('throws NotFoundException for missing bid', async () => {
    bidRepo.findOne.mockResolvedValue(null);
    await expect(service.findBid('missing')).rejects.toThrow(NotFoundException);
  });
});
