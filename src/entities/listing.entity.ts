import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum ListingStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  SOLD = 'sold',
}

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  listingId: string; // on-chain listing ID

  @Column()
  seller: string;

  @Column()
  nftContract: string;

  @Column()
  tokenId: string;

  @Column('bigint')
  price: string;

  @Column({ nullable: true })
  paymentToken: string;

  @Column({ type: 'enum', enum: ListingStatus, default: ListingStatus.ACTIVE })
  status: ListingStatus;

  @Column({ type: 'bigint', nullable: true })
  expiresAt: number;

  @CreateDateColumn()
  createdAt: Date;
}
