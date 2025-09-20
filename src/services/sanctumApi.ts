import { LSTToken, SwapQuote, SwapError, SANCTUM_API_BASE } from '@/src/types';

const SANCTUM_API_KEY = process.env.NEXT_PUBLIC_SANCTUM_API_KEY;

if (!SANCTUM_API_KEY) {
  throw new Error('NEXT_PUBLIC_SANCTUM_API_KEY environment variable is required');
}

class SanctumApiService {
  private baseUrl = SANCTUM_API_BASE;
  private apiKey = SANCTUM_API_KEY;

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}apiKey=${this.apiKey}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Sanctum API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          errorData
        });
        throw new SwapError(
          `API request failed: ${response.status} ${response.statusText} - ${errorData}`,
          response.status.toString(),
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof SwapError) {
        throw error;
      }
      throw new SwapError(
        `Network request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NETWORK_ERROR',
        error
      );
    }
  }

  async getAllLSTs(): Promise<LSTToken[]> {
    try {
      const response = await this.makeRequest<{ lsts: any[] }>('/lsts');
      
      return (response.lsts || []).map((lst: any) => ({
        name: lst.name || lst.lstName || 'Unknown',
        symbol: lst.symbol || lst.lstSymbol || 'Unknown',
        logoUri: lst.logoUri || lst.logo || '',
        mint: lst.mint || lst.lstMint || '',
        apy: lst.apy ? parseFloat(lst.apy) : undefined,
        validatorCount: lst.validatorCount,
        marketCap: lst.marketCap,
        exchangeRate: lst.exchangeRate ? parseFloat(lst.exchangeRate) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching LSTs:', error);
      throw new SwapError(
        'Failed to fetch available LST tokens',
        'FETCH_LSTS_ERROR',
        error
      );
    }
  }

  async getLSTDetails(mint: string): Promise<LSTToken> {
    try {
      const response = await this.makeRequest<any>(`/lsts/${mint}`);
      
      return {
        name: response.name || response.lstName || 'Unknown',
        symbol: response.symbol || response.lstSymbol || 'Unknown',
        logoUri: response.logoUri || response.logo || '',
        mint: response.mint || response.lstMint || mint,
        apy: response.apy ? parseFloat(response.apy) : undefined,
        validatorCount: response.validatorCount,
        marketCap: response.marketCap,
        exchangeRate: response.exchangeRate ? parseFloat(response.exchangeRate) : undefined,
      };
    } catch (error) {
      console.error(`Error fetching LST details for ${mint}:`, error);
      throw new SwapError(
        `Failed to fetch details for LST token ${mint}`,
        'FETCH_LST_DETAILS_ERROR',
        error
      );
    }
  }

  async getSwapQuote(
    inputMint: string,
    outputMint: string,
    amount: string,
    slippageBps: number = 50,
    swapSrc?: string[]
  ): Promise<SwapQuote> {
    try {
      // Try standard parameter names that Sanctum API expects
      const params = new URLSearchParams({
        inp: inputMint,
        out: outputMint,
        amt: amount,
        slippageBps: slippageBps.toString(),
      });
      
      // Add swapSrc parameters if provided (each as separate parameter)
      if (swapSrc && swapSrc.length > 0) {
        swapSrc.forEach(src => {
          params.append('swapSrc', src);
        });
      }
      
      // Also log individual parameters for debugging
      console.log('Individual parameters:', {
        inp: inputMint,
        out: outputMint, 
        amt: amount,
        slippageBps: slippageBps.toString(),
        'inp length': inputMint.length,
        'out length': outputMint.length
      });

      console.log('Sanctum API Request:', {
        endpoint: `/swap/token/order`,
        params: {
          inp: inputMint,
          out: outputMint,
          amt: amount,
          slippageBps: slippageBps,
          swapSrc: swapSrc
        },
        fullUrl: `${this.baseUrl}/swap/token/order?${params}&apiKey=${this.apiKey}`
      });

      const response = await this.makeRequest<SwapQuote>(
        `/swap/token/order?${params}`
      );

      return response;
    } catch (error) {
      console.error('Error getting swap quote:', error);
      throw new SwapError(
        'Failed to get swap quote',
        'SWAP_QUOTE_ERROR',
        error
      );
    }
  }


  async executeSwap(
    signedTx: string,
    orderResponse: SwapQuote
  ): Promise<{ signature: string }> {
    try {
      const response = await this.makeRequest<{ signature: string }>(
        '/swap/token/execute',
        {
          method: 'POST',
          body: JSON.stringify({
            signedTx,
            orderResponse
          }),
        }
      );

      return response;
    } catch (error) {
      console.error('Error executing swap:', error);
      throw new SwapError(
        'Failed to execute swap transaction',
        'SWAP_EXECUTE_ERROR',
        error
      );
    }
  }

  async getValidatorAPY(): Promise<{ [validatorVote: string]: number }> {
    try {
      const response = await this.makeRequest<{ [validatorVote: string]: number }>(
        '/validators/apy'
      );
      return response;
    } catch (error) {
      console.error('Error fetching validator APY:', error);
      return {};
    }
  }
}

export const sanctumApi = new SanctumApiService();