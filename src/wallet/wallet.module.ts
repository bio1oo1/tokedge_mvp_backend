import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletScoringService } from './wallet-scoring.service';
import { NansenService } from './nansen.service';
import { CoinGeckoService } from './coingecko.service';
import { CacheService } from '../common/cache.service';
import { DatabaseModule } from '../database/database.module';
import { InviteModule } from '../invite/invite.module';

@Module({
  imports: [DatabaseModule, InviteModule],
  controllers: [WalletController],
  providers: [
    WalletService,
    WalletScoringService,
    NansenService,
    CoinGeckoService,
    CacheService,
  ],
  exports: [WalletService],
})
export class WalletModule {}
