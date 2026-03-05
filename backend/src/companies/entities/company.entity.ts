import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Announcement } from '../../announcements/entities/announcement.entity';
import { WatchlistItem } from '../../watchlist/entities/watchlist-item.entity';

@Entity('companies')
export class Company {
  @PrimaryColumn({ length: 10 })
  ticker: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  sector: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  marketCap: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  lastPrice: number;

  @Column({ type: 'timestamp', nullable: true })
  lastPriceUpdatedAt: Date;

  @OneToMany(() => Announcement, (announcement) => announcement.company)
  announcements: Announcement[];

  @OneToMany(() => WatchlistItem, (watchlistItem) => watchlistItem.company)
  watchlistItems: WatchlistItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
