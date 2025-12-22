import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Asset } from './asset.entity';
import { User } from './user.entity';

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.portfolio)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Asset, (asset) => asset.portfolio)
  assets: Asset[];

  @Column({
    name: 'total_value',
    type: 'decimal',
    default: 0,
  })
  totalValue: number;

  @Column({
    name: ' total_gain_loss',
    type: 'decimal',
    default: 0,
  })
  totalGainLoss: number;

  @Column({
    name: 'total_return_percentage',
    type: 'decimal',
    default: 0,
  })
  totalReturnPercentage: number;

  @Column({ name: 'total_cost', type: 'decimal', default: 0 })
  totalCost: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Exclude()
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
