import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('bids')
export class Bid {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  bidId: string; // on-chain bid ID

  @Column()
  bidder: string;

  @Column()
  listingId: string;

  @Column('bigint')
  amount: string;

  @Column({ type: 'bigint', nullable: true })
  expiresAt: number;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
