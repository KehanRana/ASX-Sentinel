import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 10 })
  ticker: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ nullable: true })
  pdfUrl: string;

  @Column({ type: 'timestamp' })
  announcementDate: Date;

  @Column({ nullable: true })
  announcementType: string;

  @Column({ type: 'decimal', precision: 4, scale: 3, nullable: true })
  sentimentScore: number;

  @Column({ type: 'jsonb', nullable: true })
  aiAnalysisRaw: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  aiSummary: string;

  @Column({ default: false })
  isProcessed: boolean;

  @ManyToOne(() => Company, (c) => c.announcements)
  @JoinColumn({ name: 'ticker', referencedColumnName: 'ticker' })
  company: Company;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
