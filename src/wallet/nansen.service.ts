import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface NansenTransaction {
  chain: string;
  method: string;
  tokens_sent: Array<{
    token_symbol: string;
    token_amount: number;
    price_usd: number;
    value_usd: number;
    token_address: string;
    from_address: string;
    to_address: string;
    block_timestamp: string;
  }>;
  tokens_received: Array<{
    token_symbol: string;
    token_amount: number;
    price_usd: number;
    value_usd: number;
    token_address: string;
    from_address: string;
    to_address: string;
    block_timestamp: string;
  }>;
  volume_usd: number;
  block_timestamp: string;
  transaction_hash: string;
  source_type: string;
}

interface NansenPnlSummary {
  realized_pnl_usd: number;
  realized_pnl_percent: number;
  win_rate: number;
  traded_times: number;
  traded_token_count: number;
  top5_tokens: Array<{
    token_address: string;
    token_symbol: string;
    realized_pnl: number;
    realized_roi: number;
  }>;
}

interface NansenPnl {
  token_address: string;
  token_symbol: string;
  pnl_usd_realised: number;
  roi_percent_realised: number;
  bought_amount: number;
  bought_usd: number;
  sold_amount: number;
  sold_usd: number;
  avg_sold_price_usd: number;
  holding_amount: number;
  holding_usd: number;
  nof_buys: string;
  nof_sells: string;
  max_balance_held: number;
  max_balance_held_usd: number;
}

interface NansenBalance {
  chain: string;
  token_address: string;
  token_symbol: string;
  token_name: string;
  token_amount: number;
  price_usd: number;
  value_usd: number;
}

export interface WalletData {
  address: string;
  transactions: NansenTransaction[];
  pnlSummary: NansenPnlSummary | null;
  pnlDetails: NansenPnl[];
  balances: NansenBalance[];
  walletAge: number; // days since first transaction
  firstTransactionDate: Date | null;
  distinctAssets: number;
  swaps: NansenTransaction[];
  closedPositions: NansenPnl[];
}

@Injectable()
export class NansenService {
  private readonly logger = new Logger(NansenService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.nansen.ai/api/v1';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('NANSEN_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('NANSEN_API_KEY not configured. Nansen API calls will fail.');
    }

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'apiKey': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async fetchWalletData(address: string): Promise<WalletData> {
    const now = new Date();
    const days180Ago = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const days365Ago = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    try {
      // Fetch transactions (last 180 days for scoring)
      const transactions = await this.fetchTransactions(address, days180Ago, now);
      
      // Fetch PnL summary (last 180 days)
      const pnlSummary = await this.fetchPnlSummary(address, days180Ago, now);
      
      // Fetch detailed PnL (last 180 days)
      const pnlDetails = await this.fetchPnl(address, days180Ago, now);
      
      // Fetch current balances
      const balances = await this.fetchBalances(address);

      // Calculate wallet age (from first transaction in last 365 days)
      const allTransactions = await this.fetchTransactions(address, days365Ago, now);
      const firstTransactionDate = allTransactions.length > 0
        ? new Date(Math.min(...allTransactions.map(t => new Date(t.block_timestamp).getTime())))
        : null;
      
      const walletAge = firstTransactionDate
        ? Math.floor((now.getTime() - firstTransactionDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Extract swaps (DEX trades)
      const swaps = transactions.filter(t => 
        t.source_type?.toLowerCase().includes('dex') || 
        t.source_type?.toLowerCase().includes('swap') ||
        (t.tokens_sent.length > 0 && t.tokens_received.length > 0)
      );

      // Get distinct assets
      const assetSet = new Set<string>();
      transactions.forEach(t => {
        t.tokens_sent.forEach(token => assetSet.add(token.token_address.toLowerCase()));
        t.tokens_received.forEach(token => assetSet.add(token.token_address.toLowerCase()));
      });
      const distinctAssets = assetSet.size;

      return {
        address: address.toLowerCase(),
        transactions,
        pnlSummary,
        pnlDetails,
        balances,
        walletAge,
        firstTransactionDate,
        distinctAssets,
        swaps,
        closedPositions: pnlDetails.filter(p => p.sold_amount > 0),
      };
    } catch (error) {
      this.logger.error(`Error fetching wallet data for ${address}:`, error);
      throw error;
    }
  }

  private async fetchTransactions(
    address: string,
    from: Date,
    to: Date,
  ): Promise<NansenTransaction[]> {
    try {
      const response = await this.axiosInstance.post<{
        data: NansenTransaction[];
        pagination: { page: number; per_page: number; is_last_page: boolean };
      }>('/profiler/address/transactions', {
        address,
        chain: 'ethereum',
        date: {
          from: from.toISOString(),
          to: to.toISOString(),
        },
        hide_spam_token: true,
        pagination: {
          page: 1,
          per_page: 100,
        },
      });

      let allTransactions = response.data.data || [];
      let currentPage = 1;
      const maxPages = 10; // Limit to prevent excessive API calls

      // Paginate if needed
      while (!response.data.pagination.is_last_page && currentPage < maxPages) {
        currentPage++;
        const nextResponse = await this.axiosInstance.post<{
          data: NansenTransaction[];
          pagination: { page: number; per_page: number; is_last_page: boolean };
        }>('/profiler/address/transactions', {
          address,
          chain: 'ethereum',
          date: {
            from: from.toISOString(),
            to: to.toISOString(),
          },
          hide_spam_token: true,
          pagination: {
            page: currentPage,
            per_page: 100,
          },
        });
        allTransactions = allTransactions.concat(nextResponse.data.data || []);
        if (nextResponse.data.pagination.is_last_page) break;
      }

      return allTransactions;
    } catch (error: any) {
      this.logger.error(`Error fetching transactions:`, error.response?.data || error.message);
      return [];
    }
  }

  private async fetchPnlSummary(
    address: string,
    from: Date,
    to: Date,
  ): Promise<NansenPnlSummary | null> {
    try {
      const response = await this.axiosInstance.post<{
        realized_pnl_usd: number;
        realized_pnl_percent: number;
        win_rate: number;
        traded_times: number;
        traded_token_count: number;
        top5_tokens: Array<{
          token_address: string;
          token_symbol: string;
          realized_pnl: number;
          realized_roi: number;
        }>;
      }>('/profiler/address/pnl-summary', {
        address,
        chain: 'ethereum',
        date: {
          from: from.toISOString(),
          to: to.toISOString(),
        },
      });

      return response.data;
    } catch (error: any) {
      this.logger.error(`Error fetching PnL summary:`, error.response?.data || error.message);
      return null;
    }
  }

  private async fetchPnl(
    address: string,
    from: Date,
    to: Date,
  ): Promise<NansenPnl[]> {
    try {
      const response = await this.axiosInstance.post<{
        data: NansenPnl[];
        pagination: { page: number; per_page: number; is_last_page: boolean };
      }>('/profiler/address/pnl', {
        address,
        chain: 'ethereum',
        date: {
          from: from.toISOString().split('T')[0],
          to: to.toISOString().split('T')[0],
        },
        pagination: {
          page: 1,
          per_page: 100,
        },
      });

      let allPnl = response.data.data || [];
      let currentPage = 1;
      const maxPages = 10;

      while (!response.data.pagination.is_last_page && currentPage < maxPages) {
        currentPage++;
        const nextResponse = await this.axiosInstance.post<{
          data: NansenPnl[];
          pagination: { page: number; per_page: number; is_last_page: boolean };
        }>('/profiler/address/pnl', {
          address,
          chain: 'ethereum',
          date: {
            from: from.toISOString().split('T')[0],
            to: to.toISOString().split('T')[0],
          },
          pagination: {
            page: currentPage,
            per_page: 100,
          },
        });
        allPnl = allPnl.concat(nextResponse.data.data || []);
        if (nextResponse.data.pagination.is_last_page) break;
      }

      return allPnl;
    } catch (error: any) {
      this.logger.error(`Error fetching PnL:`, error.response?.data || error.message);
      return [];
    }
  }

  private async fetchBalances(address: string): Promise<NansenBalance[]> {
    try {
      const response = await this.axiosInstance.post<{
        data: NansenBalance[];
        pagination: { page: number; per_page: number; is_last_page: boolean };
      }>('/profiler/address/current-balance', {
        address,
        chain: 'ethereum',
        hide_spam_token: true,
        pagination: {
          page: 1,
          per_page: 100,
        },
      });

      let allBalances = response.data.data || [];
      let currentPage = 1;
      const maxPages = 5;

      while (!response.data.pagination.is_last_page && currentPage < maxPages) {
        currentPage++;
        const nextResponse = await this.axiosInstance.post<{
          data: NansenBalance[];
          pagination: { page: number; per_page: number; is_last_page: boolean };
        }>('/profiler/address/current-balance', {
          address,
          chain: 'ethereum',
          hide_spam_token: true,
          pagination: {
            page: currentPage,
            per_page: 100,
          },
        });
        allBalances = allBalances.concat(nextResponse.data.data || []);
        if (nextResponse.data.pagination.is_last_page) break;
      }

      return allBalances;
    } catch (error: any) {
      this.logger.error(`Error fetching balances:`, error.response?.data || error.message);
      return [];
    }
  }
}
