import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Company } from '../../companies/entities/company.entity';

@Entity('watchlist_items')
@Unique(['userId', 'ticker'])
export class WatchlistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ length: 10 })
  ticker: string;

  @Column({ default: true })
  alertsEnabled: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  targetPriceHigh: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  targetPriceLow: number;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => User, (user) => user.watchlistItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Company, (company) => company.watchlistItems)
  @JoinColumn({ name: 'ticker', referencedColumnName: 'ticker' })
  company: Company;

  @CreateDateColumn()
  createdAt: Date;
}
