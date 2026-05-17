import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('nfts')
export class Nft {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  tokenId: string;

  @Column()
  owner: string; // Stellar address

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUri: string;

  @Column({ nullable: true })
  gameId: string;

  @Column({ nullable: true })
  rarity: string;

  @Column({ nullable: true })
  contractAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}
