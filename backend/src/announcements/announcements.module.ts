import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Announcement } from './entities/announcement.entity';
import { WatchlistItem } from '../watchlist/entities/watchlist-item.entity';
import { AsxScraperService } from './services/asx-scraper.service';

@Module({
  imports: [TypeOrmModule.forFeature([Announcement, WatchlistItem])],
  providers: [AsxScraperService],
  exports: [AsxScraperService],
})
export class AnnouncementsModule {}
