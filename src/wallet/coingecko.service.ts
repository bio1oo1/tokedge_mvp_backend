import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

interface CoinGeckoPrice {
  [tokenId: string]: {
    usd: number;
  };
}

interface CoinGeckoHistoricalPrice {
  prices: Array<[number, number]>; // [timestamp, price]
  market_caps: Array<[number, number]>;
  total_volumes: Array<[number, number]>;
}

@Injectable()
export class CoinGeckoService {
  private readonly logger = new Logger(CoinGeckoService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly baseUrl = 'https://api.coingecko.com/api/v3';

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
    });
  }

  /**
   * Get current price for a token by contract address
   * @param contractAddress ERC20 token contract address
   * @returns Price in USD or null if not found
   */
  async getTokenPrice(contractAddress: string): Promise<number | null> {
    try {
      const response = await this.axiosInstance.get<CoinGeckoPrice>(
        `/simple/token_price/ethereum`,
        {
          params: {
            contract_addresses: contractAddress.toLowerCase(),
            vs_currencies: 'usd',
          },
        },
      );

      const priceData = response.data[contractAddress.toLowerCase()];
      return priceData?.usd || null;
    } catch (error: any) {
      this.logger.warn(
        `Error fetching price for token ${contractAddress}:`,
        error.response?.data || error.message,
      );
      return null;
    }
  }

  /**
   * Get historical price for a token at a specific timestamp
   * @param contractAddress ERC20 token contract address
   * @param timestamp Unix timestamp in milliseconds
   * @returns Price in USD or null if not found
   */
  async getHistoricalTokenPrice(
    contractAddress: string,
    timestamp: number,
  ): Promise<number | null> {
    try {
      // CoinGecko requires date in format YYYY-MM-DD
      const date = new Date(timestamp);
      const dateStr = date.toISOString().split('T')[0];

      const response = await this.axiosInstance.get<CoinGeckoHistoricalPrice>(
        `/coins/ethereum/contract/${contractAddress.toLowerCase()}/history`,
        {
          params: {
            date: dateStr,
            localization: false,
          },
        },
      );

      if (response.data.prices && response.data.prices.length > 0) {
        // Return the closest price to the requested timestamp
        const closest = response.data.prices.reduce((prev, curr) => {
          const prevDiff = Math.abs(prev[0] - timestamp);
          const currDiff = Math.abs(curr[0] - timestamp);
          return currDiff < prevDiff ? curr : prev;
        });
        return closest[1];
      }

      return null;
    } catch (error: any) {
      this.logger.warn(
        `Error fetching historical price for token ${contractAddress} at ${timestamp}:`,
        error.response?.data || error.message,
      );
      return null;
    }
  }

  /**
   * Batch get prices for multiple tokens
   * @param contractAddresses Array of ERC20 token contract addresses
   * @returns Map of address -> price in USD
   */
  async getBatchTokenPrices(
    contractAddresses: string[],
  ): Promise<Map<string, number>> {
    if (contractAddresses.length === 0) {
      return new Map();
    }

    try {
      const addresses = contractAddresses.map(addr => addr.toLowerCase()).join(',');
      const response = await this.axiosInstance.get<CoinGeckoPrice>(
        `/simple/token_price/ethereum`,
        {
          params: {
            contract_addresses: addresses,
            vs_currencies: 'usd',
          },
        },
      );

      const priceMap = new Map<string, number>();
      for (const [address, data] of Object.entries(response.data)) {
        if (data.usd) {
          priceMap.set(address.toLowerCase(), data.usd);
        }
      }

      return priceMap;
    } catch (error: any) {
      this.logger.warn(
        `Error fetching batch prices:`,
        error.response?.data || error.message,
      );
      return new Map();
    }
  }
}
