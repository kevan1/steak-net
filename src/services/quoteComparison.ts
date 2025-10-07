import { SwapQuote, LSTToken } from '@/src/types';
import { sanctumApi } from './sanctumApi';
import { jupiterApi, JupiterQuote } from './jupiterApi';

export interface QuoteComparison {
  bestQuote: SwapQuote;
  allQuotes: {
    provider: 'Sanctum' | 'Jupiter';
    quote: SwapQuote;
    outputAmount: number;
    priceImpact?: number;
    error?: string;
  }[];
  recommendation: string;
}

class QuoteComparisonService {
  async compareQuotes(
    fromToken: LSTToken,
    toToken: LSTToken,
    amount: string,
    slippageBps: number = 50
  ): Promise<QuoteComparison> {
    const amountInLamports = Math.floor(parseFloat(amount) * 1_000_000_000).toString();
    const allQuotes: QuoteComparison['allQuotes'] = [];
    let bestQuote: SwapQuote | null = null;
    let bestOutputAmount = 0;

    console.log('🔄 Fetching quotes from multiple providers...', {
      fromToken: fromToken.symbol,
      toToken: toToken.symbol,
      amount,
      amountInLamports
    });

    // Fetch Sanctum quote
    try {
      const sanctumQuote = await sanctumApi.getSwapQuote(
        fromToken.mint,
        toToken.mint,
        amountInLamports,
        slippageBps,
        ['Jup', 'SanctumRouter', 'Inf']
      );

      if (sanctumQuote) {
        const outputAmount = parseFloat(sanctumQuote.outAmt) / 1_000_000_000;
        allQuotes.push({
          provider: 'Sanctum',
          quote: sanctumQuote,
          outputAmount,
          priceImpact: sanctumQuote.swapSrcData?.data?.priceImpact
        });

        if (outputAmount > bestOutputAmount) {
          bestQuote = sanctumQuote;
          bestOutputAmount = outputAmount;
        }

        console.log('✅ Sanctum quote received:', {
          outputAmount,
          priceImpact: sanctumQuote.swapSrcData?.data?.priceImpact,
          swapSrc: sanctumQuote.swapSrcData?.swapSrc
        });
      }
    } catch (error) {
      console.error('❌ Sanctum quote failed:', error);
      allQuotes.push({
        provider: 'Sanctum',
        quote: {} as SwapQuote,
        outputAmount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Fetch Jupiter quote directly
    try {
      const jupiterQuote = await jupiterApi.getQuote(
        fromToken.mint,
        toToken.mint,
        amountInLamports,
        slippageBps
      );

      if (jupiterQuote) {
        const convertedQuote = jupiterApi.convertToSwapQuote(jupiterQuote);
        const outputAmount = parseFloat(jupiterQuote.outAmount) / 1_000_000_000;
        
        allQuotes.push({
          provider: 'Jupiter',
          quote: convertedQuote,
          outputAmount,
          priceImpact: parseFloat(jupiterQuote.priceImpactPct)
        });

        if (outputAmount > bestOutputAmount) {
          bestQuote = convertedQuote;
          bestOutputAmount = outputAmount;
        }

        console.log('✅ Jupiter quote received:', {
          outputAmount,
          priceImpact: jupiterQuote.priceImpactPct,
          routes: jupiterQuote.routePlan?.length || 0
        });
      }
    } catch (error) {
      console.error('❌ Jupiter quote failed:', error);
      allQuotes.push({
        provider: 'Jupiter',
        quote: {} as SwapQuote,
        outputAmount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Determine recommendation
    let recommendation = '';
    if (allQuotes.length === 0 || !bestQuote) {
      recommendation = 'No quotes available';
    } else {
      const bestProvider = allQuotes.find(q => q.quote === bestQuote)?.provider;
      const difference = this.calculateDifference(allQuotes);
      
      if (difference.percentDifference > 0.1) { // More than 0.1% difference
        recommendation = `💡 ${bestProvider} offers ${difference.percentDifference.toFixed(2)}% more ${toToken.symbol} (${difference.absoluteDifference.toFixed(6)} tokens)`;
      } else {
        recommendation = `Both providers offer similar rates`;
      }
    }

    console.log('📊 Quote comparison complete:', {
      bestProvider: allQuotes.find(q => q.quote === bestQuote)?.provider,
      bestOutputAmount,
      recommendation
    });

    return {
      bestQuote: bestQuote!,
      allQuotes,
      recommendation
    };
  }

  private calculateDifference(quotes: QuoteComparison['allQuotes']) {
    const validQuotes = quotes.filter(q => q.outputAmount > 0);
    
    if (validQuotes.length < 2) {
      return { percentDifference: 0, absoluteDifference: 0 };
    }

    const sortedQuotes = validQuotes.sort((a, b) => b.outputAmount - a.outputAmount);
    const best = sortedQuotes[0].outputAmount;
    const second = sortedQuotes[1].outputAmount;
    
    const absoluteDifference = best - second;
    const percentDifference = (absoluteDifference / second) * 100;

    return { percentDifference, absoluteDifference };
  }

  // Get swap transaction for the best quote
  async getSwapTransaction(
    bestQuote: SwapQuote,
    userPublicKey: string
  ): Promise<{ swapTransaction: string; provider: string } | null> {
    const provider = bestQuote.swapSrcData?.swapSrc;

    if (provider === 'Jupiter') {
      // Use Jupiter API directly
      const jupiterQuote = bestQuote.swapSrcData?.data?.quote as JupiterQuote;
      
      if (jupiterQuote) {
        const swapResponse = await jupiterApi.getSwapTransaction(jupiterQuote, userPublicKey);
        
        if (swapResponse) {
          return {
            swapTransaction: swapResponse.swapTransaction,
            provider: 'Jupiter'
          };
        }
      }
    } else {
      // Use Sanctum routing (could be Jupiter, SanctumRouter, or Infinite)
      const swapData = bestQuote.swapSrcData?.data;
      
      if (swapData?.transaction) {
        return {
          swapTransaction: swapData.transaction,
          provider: `Sanctum (${provider})`
        };
      }
      
      // If it's a Jupiter quote through Sanctum, handle it appropriately
      if (provider === 'Jup' && swapData) {
        try {
          // Ensure the quote has the proper structure for Jupiter API
          const jupiterQuote = { ...swapData };
          
          // Fix platformFee structure if it exists but is malformed
          if (jupiterQuote.platformFee && !jupiterQuote.platformFee.amount) {
            // Remove malformed platformFee rather than send incomplete data
            delete jupiterQuote.platformFee;
          }
          
          const jupiterSwapResponse = await fetch('https://lite-api.jup.ag/swap/v1/swap', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              quoteResponse: jupiterQuote,
              userPublicKey,
              wrapAndUnwrapSol: true,
              dynamicComputeUnitLimit: true,
              prioritizationFeeLamports: 'auto'
            })
          });
          
          if (jupiterSwapResponse.ok) {
            const response = await jupiterSwapResponse.json();
            return {
              swapTransaction: response.swapTransaction,
              provider: 'Sanctum (Jupiter)'
            };
          }
        } catch (error) {
          console.error('Error building Jupiter transaction through Sanctum:', error);
        }
      }
    }

    return null;
  }
}

export const quoteComparison = new QuoteComparisonService();