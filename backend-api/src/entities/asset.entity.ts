import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Portfolio } from '../entities/portfolio.entity';
import { AssetType } from '../constants';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.assets)
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @Column()
  assetType: AssetType;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column({ type: 'decimal' })
  quantity: number;

  @Column({ name: 'price', type: 'decimal' })
  price: number;

  @Column({ name: 'purchase_date' })
  purchaseDate: Date;

  @Column({ name: 'current_price', type: 'decimal', default: 0 })
  currentPrice: number;

  @Column({ name: 'current value', type: 'decimal', default: 0 })
  currentValue: number;

  @Column({ name: 'gain_loss_percentage', type: 'decimal', default: 0 })
  gainLossPercentage: number;

  @Column({ name: 'gain_loss_amount', type: 'decimal', default: 0 })
  gainLossAmount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Exclude()
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
