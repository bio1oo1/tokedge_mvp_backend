import { Module } from '@nestjs/common';
import { InviteController } from './invite.controller';
import { InviteCodeService } from './invite-code.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [InviteController],
  providers: [InviteCodeService],
  exports: [InviteCodeService],
})
export class InviteModule {}
