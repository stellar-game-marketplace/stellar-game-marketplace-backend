import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('indexed_events')
export class IndexedEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contractId: string;

  @Column()
  topic: string; // list | cancel | buy | bid | execute | distribute

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column()
  ledger: number;

  @Column()
  txHash: string;

  @CreateDateColumn()
  createdAt: Date;
}
