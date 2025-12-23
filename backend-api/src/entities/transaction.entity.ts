import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  DeleteDateColumn,
  JoinColumn,
} from 'typeorm';

import { User } from './user.entity';
import { AssetType, TransactionType } from '../constants';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'asset_code' })
  assetCode: string;

  @Column({ name: 'asset_name' })
  assetName: string;

  @Column({ name: 'asset_type' })
  assetType: AssetType;

  @Column({ type: 'decimal' })
  quantity: number;

  @Column({ type: 'decimal' })
  price: number;

  @Column({ name: 'total_amount', type: 'decimal' })
  totalAmount: number;

  @Column({ name: 'transaction_type' })
  transactionType: TransactionType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
