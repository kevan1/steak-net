import { PriceData } from '@/src/types';

class PriceApiService {
  private baseUrl = 'https://lite-api.jup.ag/price/v3';
  private priceCache = new Map<string, { data: PriceData; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds

  private getCachedPrice(mint: string): PriceData | null {
    const cached = this.priceCache.get(mint);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedPrice(mint: string, data: PriceData) {
    this.priceCache.set(mint, {
      data,
      timestamp: Date.now(),
    });
  }

  async getSOLPrice(): Promise<number> {
    const solMint = 'So11111111111111111111111111111111111111112';
    const cached = this.getCachedPrice(solMint);
    if (cached) {
      return cached.price;
    }

    try {
      // Use Jupiter Price API v3 for SOL price
      const response = await fetch(`https://lite-api.jup.ag/price/v3?ids=${solMint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const price = data[solMint]?.usdPrice || 0;
      const change24h = data[solMint]?.priceChange24h || 0;

      const priceData: PriceData = {
        mint: solMint,
        price,
        change24h,
        timestamp: Date.now(),
      };

      this.setCachedPrice(solMint, priceData);
      return price;
    } catch (error) {
      console.error('Error fetching SOL price from Jupiter:', error);
      // Return cached price if available, otherwise return 0
      const cached = this.priceCache.get(solMint);
      return cached?.data.price || 0;
    }
  }

  async getSTEAKSOLPrice(): Promise<number> {
    const steaksolMint = 'sctmqBfQtZj76PaLmepQ7Xskpu8LNMyWsXqFYAuihML';
    const cached = this.getCachedPrice(steaksolMint);
    if (cached) {
      return cached.price;
    }

    try {
      // Use Jupiter Price API v3 lite version
      const jupiterResponse = await fetch(`https://lite-api.jup.ag/price/v3?ids=${steaksolMint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (jupiterResponse.ok) {
        const jupiterData = await jupiterResponse.json();
        const jupiterPrice = jupiterData[steaksolMint]?.usdPrice;
        
        if (typeof jupiterPrice === 'number' && jupiterPrice > 0) {
          const priceData: PriceData = {
            mint: steaksolMint,
            price: jupiterPrice,
            timestamp: Date.now(),
          };
          
          this.setCachedPrice(steaksolMint, priceData);
          return jupiterPrice;
        }
      }
    } catch (error) {
      console.warn('Jupiter v3 API unavailable:', error);
    }

    // Fallback: Calculate price based on SOL price and exchange rate
    try {
      const solPrice = await this.getSOLPrice();
      // STEAKSOL typically trades at a premium to SOL, use 1.07x multiplier
      const estimatedPrice = solPrice * 1.07;
      
      const priceData: PriceData = {
        mint: steaksolMint,
        price: estimatedPrice,
        timestamp: Date.now(),
      };
      
      this.setCachedPrice(steaksolMint, priceData);
      return estimatedPrice;
    } catch (error) {
      console.error('Error calculating STEAKSOL price from SOL:', error);
      
      // Final fallback: Use a reasonable static price
      const fallbackPrice = 250.0;
      
      const priceData: PriceData = {
        mint: steaksolMint,
        price: fallbackPrice,
        timestamp: Date.now(),
      };
      
      this.setCachedPrice(steaksolMint, priceData);
      return fallbackPrice;
    }
  }

  async getJupiterPrice(mint: string): Promise<number | null> {
    try {
      // Use Jupiter Price API v3 lite version for any token
      const response = await fetch(`https://lite-api.jup.ag/price/v3?ids=${mint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        const price = data[mint]?.usdPrice;
        
        if (typeof price === 'number' && price > 0) {
          return price;
        }
      }
    } catch (error) {
      console.warn(`Jupiter v3 API unavailable for ${mint}:`, error);
    }
    
    return null;
  }

  async getLSTPrice(mint: string, exchangeRate?: number): Promise<number> {
    const cached = this.getCachedPrice(mint);
    if (cached) {
      return cached.price;
    }

    try {
      // Special handling for STEAKSOL
      if (mint === 'sctmqBfQtZj76PaLmepQ7Xskpu8LNMyWsXqFYAuihML') {
        return await this.getSTEAKSOLPrice();
      }

      // Special handling for SOL
      if (mint === 'So11111111111111111111111111111111111111112') {
        return await this.getSOLPrice();
      }

      // Try to get price from Jupiter v3 first
      const jupiterPrice = await this.getJupiterPrice(mint);
      if (jupiterPrice !== null) {
        const priceData: PriceData = {
          mint,
          price: jupiterPrice,
          timestamp: Date.now(),
        };
        
        this.setCachedPrice(mint, priceData);
        return jupiterPrice;
      }

      // Fallback: Calculate based on SOL price and exchange rate
      const solPrice = await this.getSOLPrice();
      
      // If we have an exchange rate, use it to calculate LST price
      const lstPrice = exchangeRate ? solPrice * exchangeRate : solPrice;

      const priceData: PriceData = {
        mint,
        price: lstPrice,
        timestamp: Date.now(),
      };

      this.setCachedPrice(mint, priceData);
      return lstPrice;
    } catch (error) {
      console.error(`Error calculating LST price for ${mint}:`, error);
      return 0;
    }
  }

  formatUSD(amount: number, decimals: number = 2): string {
    if (amount === 0) return '$0.00';
    
    if (amount < 0.01) {
      return `$${amount.toFixed(6)}`;
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  }

  formatTokenAmount(amount: number, decimals: number = 4): string {
    if (amount === 0) return '0';
    
    if (amount < 0.0001) {
      return amount.toExponential(2);
    }
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(amount);
  }

  calculateUSDValue(tokenAmount: number, tokenPrice: number): number {
    return tokenAmount * tokenPrice;
  }
}

export const priceApi = new PriceApiService();
