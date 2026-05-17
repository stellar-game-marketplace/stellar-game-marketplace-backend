import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { NftService } from './nft.service';
import { Nft } from '../entities/nft.entity';

const mockNft: Nft = {
  id: 1,
  tokenId: 'token-1',
  owner: 'GABC123',
  name: 'Dragon Sword',
  description: 'Legendary',
  imageUri: 'ipfs://Qm...',
  gameId: 'game-1',
  rarity: 'Legendary',
  contractAddress: 'CXYZ',
  createdAt: new Date(),
};

const mockRepo = {
  create: jest.fn((dto) => ({ ...dto })),
  save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
  find: jest.fn(),
  findOne: jest.fn(),
};

describe('NftService', () => {
  let service: NftService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NftService,
        { provide: getRepositoryToken(Nft), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<NftService>(NftService);
    jest.clearAllMocks();
  });

  it('creates an NFT', async () => {
    mockRepo.save.mockResolvedValue(mockNft);
    const result = await service.create({
      tokenId: 'token-1',
      owner: 'GABC123',
      name: 'Dragon Sword',
    });
    expect(result.tokenId).toBe('token-1');
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('returns all NFTs', async () => {
    mockRepo.find.mockResolvedValue([mockNft]);
    const result = await service.findAll();
    expect(result).toHaveLength(1);
  });

  it('finds NFT by tokenId', async () => {
    mockRepo.findOne.mockResolvedValue(mockNft);
    const result = await service.findOne('token-1');
    expect(result.owner).toBe('GABC123');
  });

  it('throws NotFoundException for missing NFT', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('finds NFTs by owner', async () => {
    mockRepo.find.mockResolvedValue([mockNft]);
    const result = await service.findByOwner('GABC123');
    expect(result[0].owner).toBe('GABC123');
  });

  it('updates NFT owner', async () => {
    mockRepo.findOne.mockResolvedValue({ ...mockNft });
    mockRepo.save.mockResolvedValue({ ...mockNft, owner: 'GNEW456' });
    const result = await service.updateOwner('token-1', 'GNEW456');
    expect(result.owner).toBe('GNEW456');
  });
});
