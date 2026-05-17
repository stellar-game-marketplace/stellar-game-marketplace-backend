import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nft } from '../entities/nft.entity';
import { CreateNftDto } from './dto/create-nft.dto';

@Injectable()
export class NftService {
  constructor(@InjectRepository(Nft) private readonly repo: Repository<Nft>) {}

  create(dto: CreateNftDto): Promise<Nft> {
    return this.repo.save(this.repo.create(dto));
  }

  findAll(): Promise<Nft[]> {
    return this.repo.find();
  }

  async findByOwner(owner: string): Promise<Nft[]> {
    return this.repo.find({ where: { owner } });
  }

  async findOne(tokenId: string): Promise<Nft> {
    const nft = await this.repo.findOne({ where: { tokenId } });
    if (!nft) throw new NotFoundException(`NFT ${tokenId} not found`);
    return nft;
  }

  async updateOwner(tokenId: string, newOwner: string): Promise<Nft> {
    const nft = await this.findOne(tokenId);
    nft.owner = newOwner;
    return this.repo.save(nft);
  }
}
