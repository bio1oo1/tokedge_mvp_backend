import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { InviteCodeService } from './invite-code.service';
import { InviteStatsResponseDto } from './dto/invite-stats-response.dto';
// import { AdminGuard } from '../auth/admin.guard'; // TODO: Implement admin guard

@Controller('api/invite')
export class InviteController {
  constructor(private readonly inviteCodeService: InviteCodeService) {}

  @Get(':inviteCode/stats')
  // @UseGuards(AdminGuard) // TODO: Add admin guard
  async getInviteStats(
    @Param('inviteCode') inviteCode: string,
  ): Promise<InviteStatsResponseDto> {
    return this.inviteCodeService.getInviteStats(inviteCode.toUpperCase());
  }
}
