import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import * as pdfParse from 'pdf-parse';
import { Announcement } from '../entities/announcement.entity';
import { WatchlistItem } from '../../watchlist/entities/watchlist-item.entity';

interface AsxAnnouncementResponse {
  data: AsxAnnouncement[];
}

interface AsxAnnouncement {
  id: string;
  document_title: string;
  document_date: string;
  url: string;
  header: string;
  market_sensitive: boolean;
  number_of_pages: number;
  size: string;
  legacy_announcement: boolean;
}

const MAX_TEXT_LENGTH = 50000;
const RATE_LIMIT_DELAY_MS = 200;

@Injectable()
export class AsxScraperService {
  private readonly logger = new Logger(AsxScraperService.name);
  private readonly asxBaseUrl = 'https://www.asx.com.au/asx/1/company';

  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepository: Repository<Announcement>,
    @InjectRepository(WatchlistItem)
    private readonly watchlistItemRepository: Repository<WatchlistItem>,
  ) {}

  /**
   * Poll ASX announcements every 15 minutes during ASX trading hours
   * Mon-Fri, 10am-4pm Sydney time (UTC+10/+11)
   */
  @Cron('0 */15 0-6 * * 1-5', {
    name: 'asx-poller',
    timeZone: 'Australia/Sydney',
  })
  async pollAsxAnnouncements(): Promise<void> {
    this.logger.log('Starting ASX announcements poll...');

    try {
      // Get unique tickers from all users' watchlists
      const watchedTickers = await this.getWatchedTickers();

      if (watchedTickers.length === 0) {
        this.logger.log('No tickers in any watchlist, skipping poll');
        return;
      }

      this.logger.log(
        `Polling announcements for ${watchedTickers.length} tickers`,
      );

      for (const ticker of watchedTickers) {
        try {
          await this.fetchAnnouncementsForTicker(ticker);
          // Rate limit: wait between requests to respect ASX limits
          await this.delay(RATE_LIMIT_DELAY_MS);
        } catch (error) {
          this.logger.error(
            `Error fetching announcements for ${ticker}:`,
            error,
          );
        }
      }

      this.logger.log('ASX announcements poll completed');
    } catch (error) {
      this.logger.error('Error during ASX poll:', error);
    }
  }

  /**
   * Get all unique tickers from users' watchlists
   */
  private async getWatchedTickers(): Promise<string[]> {
    const watchlistItems = await this.watchlistItemRepository
      .createQueryBuilder('item')
      .select('DISTINCT item.ticker', 'ticker')
      .getRawMany<{ ticker: string }>();

    return watchlistItems.map((item) => item.ticker);
  }

  /**
   * Fetch announcements for a specific ticker from ASX API
   */
  async fetchAnnouncementsForTicker(ticker: string): Promise<void> {
    const url = `${this.asxBaseUrl}/${ticker}/announcements?count=20`;

    try {
      const response = await axios.get<AsxAnnouncementResponse>(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'ASX-Sentinel/1.0',
          Accept: 'application/json',
        },
      });

      const announcements = response.data?.data || [];
      this.logger.debug(
        `Found ${announcements.length} announcements for ${ticker}`,
      );

      for (const announcement of announcements) {
        await this.processAnnouncement(ticker, announcement);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `ASX API error for ${ticker}: ${error.response?.status} - ${error.message}`,
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * Process a single announcement - check for duplicates and save
   */
  private async processAnnouncement(
    ticker: string,
    asxAnnouncement: AsxAnnouncement,
  ): Promise<void> {
    const title = asxAnnouncement.document_title || asxAnnouncement.header;

    // Check for existing record (deduplicate by ticker + title)
    const existing = await this.announcementRepository.findOne({
      where: { ticker, title },
    });

    if (existing) {
      this.logger.debug(`Announcement already exists: ${ticker} - ${title}`);
      return;
    }

    // Build PDF URL
    const pdfUrl = asxAnnouncement.url
      ? `https://www.asx.com.au${asxAnnouncement.url}`
      : null;

    // Extract PDF text if URL available
    let extractedText: string | null = null;
    if (pdfUrl) {
      try {
        extractedText = await this.extractPdfText(pdfUrl);
      } catch (error) {
        this.logger.warn(`Failed to extract PDF for ${ticker}: ${error}`);
      }
    }

    // Create announcement record - save unprocessed even on AI failure
    const announcement = this.announcementRepository.create({
      ticker,
      title,
      pdfUrl: pdfUrl ?? undefined,
      announcementDate: new Date(asxAnnouncement.document_date),
      announcementType: this.categorizeAnnouncement(title),
      summary: extractedText ?? undefined,
      isProcessed: false, // Mark as unprocessed for AI analysis
    });

    try {
      await this.announcementRepository.save(announcement);
      this.logger.log(`Saved new announcement: ${ticker} - ${title}`);
    } catch (error) {
      this.logger.error(
        `Failed to save announcement: ${ticker} - ${title}`,
        error,
      );
    }
  }

  /**
   * Extract text content from a PDF URL
   */
  async extractPdfText(url: string): Promise<string> {
    this.logger.debug(`Extracting PDF from: ${url}`);

    const response = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'ASX-Sentinel/1.0',
      },
    });

    const pdfParseFunc = pdfParse as unknown as (
      buffer: Buffer,
      options?: { max?: number },
    ) => Promise<{ text: string }>;

    const pdfData = await pdfParseFunc(Buffer.from(response.data), {
      max: 10, // Parse max 10 pages for cost control
    });

    let text: string = pdfData.text || '';

    // Cap extracted text at MAX_TEXT_LENGTH chars
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.substring(0, MAX_TEXT_LENGTH);
      this.logger.debug(`Truncated PDF text to ${MAX_TEXT_LENGTH} chars`);
    }

    return text;
  }

  /**
   * Categorize announcement based on title keywords
   */
  private categorizeAnnouncement(title: string): string {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('quarterly') || titleLower.includes('4c')) {
      return 'quarterly_report';
    }
    if (titleLower.includes('annual') || titleLower.includes('yearly')) {
      return 'annual_report';
    }
    if (titleLower.includes('half year') || titleLower.includes('half-year')) {
      return 'half_year_report';
    }
    if (titleLower.includes('dividend')) {
      return 'dividend';
    }
    if (
      titleLower.includes('trading halt') ||
      titleLower.includes('trading update')
    ) {
      return 'trading_update';
    }
    if (titleLower.includes('acquisition') || titleLower.includes('merger')) {
      return 'acquisition';
    }
    if (
      titleLower.includes('capital raising') ||
      titleLower.includes('placement')
    ) {
      return 'capital_raising';
    }
    if (titleLower.includes('director') || titleLower.includes('appointment')) {
      return 'director_change';
    }
    if (titleLower.includes('agm') || titleLower.includes('meeting')) {
      return 'meeting';
    }
    if (
      titleLower.includes('asx query') ||
      titleLower.includes('aware letter')
    ) {
      return 'asx_query';
    }

    return 'other';
  }

  /**
   * Utility delay function for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Manual trigger for fetching announcements (for testing/admin)
   */
  async manualPoll(
    tickers?: string[],
  ): Promise<{ processed: number; errors: number }> {
    const tickersToProcess = tickers || (await this.getWatchedTickers());
    let processed = 0;
    let errors = 0;

    for (const ticker of tickersToProcess) {
      try {
        await this.fetchAnnouncementsForTicker(ticker);
        processed++;
        await this.delay(RATE_LIMIT_DELAY_MS);
      } catch {
        errors++;
      }
    }

    return { processed, errors };
  }

  /**
   * Get unprocessed announcements for AI analysis
   */
  async getUnprocessedAnnouncements(limit = 10): Promise<Announcement[]> {
    return this.announcementRepository.find({
      where: { isProcessed: false },
      order: { announcementDate: 'DESC' },
      take: limit,
    });
  }

  /**
   * Mark announcement as processed (after AI analysis)
   */
  async markAsProcessed(
    announcementId: string,
    aiSummary?: string,
    sentimentScore?: number,
    aiAnalysisRaw?: Record<string, any>,
  ): Promise<void> {
    await this.announcementRepository.update(announcementId, {
      isProcessed: true,
      aiSummary,
      sentimentScore,
      aiAnalysisRaw,
    });
  }
}
