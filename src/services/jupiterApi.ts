import { SwapQuote, SwapError } from '@/src/types';

export interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: {
    amount: string;
    feeBps: number;
  };
  priceImpactPct: string;
  routePlan: any[];
}

export interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight?: number;
  prioritizationFeeLamports?: number;
}

class JupiterApiService {
  private baseUrl = 'https://lite-api.jup.ag/swap/v1';

  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: string,
    slippageBps: number = 50
  ): Promise<JupiterQuote | null> {
    try {
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount,
        slippageBps: slippageBps.toString(),
        onlyDirectRoutes: 'false',
        asLegacyTransaction: 'false'
      });

      console.log('Jupiter Quote Request:', {
        endpoint: `${this.baseUrl}/quote`,
        params: {
          inputMint,
          outputMint,
          amount,
          slippageBps
        }
      });

      const response = await fetch(`${this.baseUrl}/quote?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Jupiter Quote API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        return null;
      }

      const quote = await response.json() as JupiterQuote;
      
      console.log('Jupiter Quote Response:', {
        inputAmount: quote.inAmount,
        outputAmount: quote.outAmount,
        priceImpact: quote.priceImpactPct,
        routes: quote.routePlan?.length || 0
      });

      return quote;
    } catch (error) {
      console.error('Error fetching Jupiter quote:', error);
      return null;
    }
  }

  async getSwapTransaction(
    quote: JupiterQuote,
    userPublicKey: string
  ): Promise<JupiterSwapResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Jupiter Swap API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        return null;
      }

      return await response.json() as JupiterSwapResponse;
    } catch (error) {
      console.error('Error getting Jupiter swap transaction:', error);
      return null;
    }
  }

  // Convert Jupiter quote to our SwapQuote format for comparison
  convertToSwapQuote(jupiterQuote: JupiterQuote): SwapQuote {
    return {
      mode: 'exact-in',
      inp: jupiterQuote.inputMint,
      out: jupiterQuote.outputMint,
      inpAmt: jupiterQuote.inAmount,
      outAmt: jupiterQuote.outAmount,
      swapSrcData: {
        swapSrc: 'Jupiter',
        data: {
          fees: jupiterQuote.platformFee ? [{
            amount: jupiterQuote.platformFee.amount,
            mint: jupiterQuote.outputMint,
            pct: jupiterQuote.platformFee.feeBps / 10000
          }] : [],
          priceImpact: parseFloat(jupiterQuote.priceImpactPct),
          quote: jupiterQuote
        }
      }
    };
  }
}

export const jupiterApi = new JupiterApiService();