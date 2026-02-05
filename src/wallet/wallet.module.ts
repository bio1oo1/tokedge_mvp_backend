import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletScoringService } from './wallet-scoring.service';
import { DatabaseModule } from '../database/database.module';
import { InviteModule } from '../invite/invite.module';

@Module({
  imports: [DatabaseModule, InviteModule],
  controllers: [WalletController],
  providers: [WalletService, WalletScoringService],
  exports: [WalletService],
})
export class WalletModule {}
