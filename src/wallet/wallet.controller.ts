import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AnalyzeWalletDto } from './dto/analyze-wallet.dto';
import { AnalyzeWalletResponseDto } from './dto/analyze-wallet-response.dto';
import { PortfolioResponseDto } from './dto/portfolio-response.dto';

@Controller('api/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  async analyzeWallet(
    @Body() analyzeDto: AnalyzeWalletDto,
  ): Promise<AnalyzeWalletResponseDto> {
    return this.walletService.analyzeWallet(
      analyzeDto.walletAddress,
      analyzeDto.inviteCode,
      analyzeDto.utm,
      analyzeDto.clientMeta,
    );
  }

  @Get('portfolio')
  async getPortfolio(@Query('userId') userId: string): Promise<PortfolioResponseDto> {
    if (!userId) {
      throw new Error('userId query parameter is required');
    }
    return this.walletService.getPortfolio(userId);
  }
}
