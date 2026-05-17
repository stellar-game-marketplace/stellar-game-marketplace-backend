import { Controller, Get } from '@nestjs/common';
import { IndexerService } from './indexer.service';

@Controller('indexer')
export class IndexerController {
  constructor(private readonly indexerService: IndexerService) {}

  @Get('status')
  status() {
    return { lastLedger: (this.indexerService as any).lastLedger };
  }
}
