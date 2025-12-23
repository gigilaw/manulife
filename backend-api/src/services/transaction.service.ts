import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';
import { TransactionDto } from '../dto/transaction.dto';
import { TransactionType } from '../constants';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // Record a transaction
  async recordTransaction(
    userId: number,
    data: TransactionDto,
  ): Promise<Transaction> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const transaction = this.transactionRepo.create({
      ...data,
      totalAmount: data.quantity * data.price,
      user,
    });

    return await this.transactionRepo.save(transaction);
  }

  // Get all transactions by user
  async getUserTransactionsInfo(userId: number): Promise<{
    transactions: Transaction[];
    totals: {
      count: number;
      totalBuyAmount: number;
      totalSellAmount: number;
    };
  }> {
    const transactions = await this.transactionRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    // Calculate totals
    let totalBuyAmount = 0;
    let totalSellAmount = 0;

    transactions.forEach((transaction) => {
      if (transaction.transactionType === TransactionType.BUY) {
        totalBuyAmount += Number(transaction.totalAmount);
      } else {
        totalSellAmount += Number(transaction.totalAmount);
      }
    });

    return {
      transactions,
      totals: {
        count: transactions.length,
        totalBuyAmount,
        totalSellAmount,
      },
    };
  }
}
