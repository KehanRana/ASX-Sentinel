import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnnouncementsModule } from './announcements/announcements.module';
import { CompaniesModule } from './companies/companies.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { AlertsModule } from './alerts/alerts.module';
import { PriceModule } from './price/price.module';

@Module({
  imports: [AnnouncementsModule, CompaniesModule, AuthModule, UsersModule, WatchlistModule, AlertsModule, PriceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
