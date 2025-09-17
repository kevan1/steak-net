'use client';

import { useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, VersionedTransaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { LSTToken, SwapQuote, TransactionStatus } from '@/src/types';
import { sanctumApi } from '@/src/services/sanctumApi';

export interface UseSwapReturn {
  swapTokens: (fromToken: LSTToken, toToken: LSTToken, amount: string) => Promise<void>;
  getQuote: (fromToken: LSTToken, toToken: LSTToken, amount: string) => Promise<SwapQuote | null>;
  checkTokenBalance: (tokenMint: string, requiredAmount: string) => Promise<boolean>;
  transactionStatus: TransactionStatus;
  isSwapping: boolean;
  lastQuote: SwapQuote | null;
  error: string | null;
  clearError: () => void;
}

export function useSwap(): UseSwapReturn {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({ status: 'idle' });
  const [isSwapping, setIsSwapping] = useState(false);
  const [lastQuote, setLastQuote] = useState<SwapQuote | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check user's token balance
  const checkTokenBalance = useCallback(async (
    tokenMint: string,
    requiredAmount: string
  ): Promise<boolean> => {
    if (!publicKey || !connection) return false;
    
    try {
      if (tokenMint === 'So11111111111111111111111111111111111111112') {
        // SOL balance
        const balance = await connection.getBalance(publicKey);
        const requiredLamports = parseFloat(requiredAmount) * LAMPORTS_PER_SOL;
        const hasEnough = balance >= requiredLamports + 0.01 * LAMPORTS_PER_SOL; // Leave some for fees
        
        return hasEnough;
      } else {
        // SPL Token balance
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
          mint: new PublicKey(tokenMint)
        });
        
        if (tokenAccounts.value.length === 0) {
          return false;
        }
        
        const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
        const required = parseFloat(requiredAmount);
        const hasEnough = balance >= required;
        
        return hasEnough;
      }
    } catch (error) {
      console.error('Error checking balance:', error);
      return false; // Assume insufficient if we can't check
    }
  }, [publicKey, connection]);

  const getQuote = useCallback(async (
    fromToken: LSTToken,
    toToken: LSTToken,
    amount: string
  ): Promise<SwapQuote | null> => {
    if (!publicKey) {
      setError('Wallet not connected');
      return null;
    }

    try {
      clearError();
      
      // Convert amount to lamports/smallest unit (9 decimals for SOL/LST)
      const amountInLamports = Math.floor(parseFloat(amount) * 1_000_000_000).toString();
      
      // Validate inputs
      if (!fromToken.mint || !toToken.mint) {
        throw new Error('Invalid token mints');
      }
      
      if (parseFloat(amount) <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Prioritize Jupiter for reliable swap execution, fallback to others
      const quote = await sanctumApi.getSwapQuote(
        fromToken.mint,
        toToken.mint,
        amountInLamports,
        100, // 1% slippage for better execution
        ['Jup', 'SanctumRouter', 'Inf'] // Jupiter first for most reliable execution
      );

      setLastQuote(quote);
      return quote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get quote';
      setError(errorMessage);
      console.error('Error getting swap quote:', err);
      return null;
    }
  }, [publicKey, clearError]);

  const swapTokens = useCallback(async (
    fromToken: LSTToken,
    toToken: LSTToken,
    amount: string
  ) => {
    if (!publicKey || !signTransaction) {
      const errorMsg = 'Wallet not connected or does not support signing';
      setError(errorMsg);
      return;
    }

    try {
      setIsSwapping(true);
      clearError();
      setTransactionStatus({ status: 'preparing' });

      // Check balance before proceeding
      const hasEnoughBalance = await checkTokenBalance(fromToken.mint, amount);
      
      if (!hasEnoughBalance) {
        throw new Error(`Insufficient ${fromToken.symbol} balance. You need ${amount} ${fromToken.symbol} but don't have enough in your wallet.`);
      }

      // Get a fresh quote
      const quote = await getQuote(fromToken, toToken, amount);
      
      if (!quote) {
        throw new Error('Failed to get swap quote');
      }

      // Build the Jupiter transaction based on the Sanctum quote
      setTransactionStatus({ status: 'preparing' });
      
      // Check which swap source was used and handle accordingly
      const swapSrc = quote.swapSrcData?.swapSrc;
      const swapData = quote.swapSrcData?.data;
      
      if (!swapData) {
        throw new Error('No swap data found in quote');
      }
      
      let swapResponse;
      
      if (swapSrc === 'Jup') {
        // Jupiter swap - use Jupiter API
        setTransactionStatus({ status: 'preparing' });
        
        const jupiterResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            quoteResponse: swapData,
            userPublicKey: publicKey.toString(),
            wrapAndUnwrapSol: true,
            dynamicComputeUnitLimit: true,
            prioritizationFeeLamports: 'auto'
          })
        });
        
        if (!jupiterResponse.ok) {
          const errorText = await jupiterResponse.text();
          throw new Error(`Jupiter API error: ${jupiterResponse.status} - ${errorText}`);
        }
        
        swapResponse = await jupiterResponse.json();
        
      } else if (swapSrc === 'Inf') {
        // Infinite swap - try to use Jupiter as fallback since Infinite endpoint might not be available
        
        try {
          // Try to get a Jupiter quote directly
          const jupiterQuoteResponse = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${fromToken.mint}&outputMint=${toToken.mint}&amount=${Math.floor(parseFloat(amount) * 1_000_000_000)}&slippageBps=100`);
          
          if (!jupiterQuoteResponse.ok) {
            throw new Error(`Jupiter quote API error: ${jupiterQuoteResponse.status}`);
          }
          
          const jupiterQuote = await jupiterQuoteResponse.json();
          
          // Build Jupiter transaction
          const jupiterSwapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              quoteResponse: jupiterQuote,
              userPublicKey: publicKey.toString(),
              wrapAndUnwrapSol: true,
              dynamicComputeUnitLimit: true,
              prioritizationFeeLamports: 'auto'
            })
          });
          
          if (!jupiterSwapResponse.ok) {
            const errorText = await jupiterSwapResponse.text();
            throw new Error(`Jupiter swap API error: ${jupiterSwapResponse.status} - ${errorText}`);
          }
          
          swapResponse = await jupiterSwapResponse.json();
          
        } catch (fallbackError) {
          console.error('Jupiter fallback failed:', fallbackError);
          throw new Error(`Infinite swap not available and Jupiter fallback failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
        }
        
      } else if (swapSrc === 'SanctumRouter') {
        // Sanctum Router - might have transaction directly in the data
        
        if (swapData.transaction) {
          // Transaction is provided directly
          swapResponse = { swapTransaction: swapData.transaction };
        } else {
          // Need to build transaction or use different approach
          throw new Error(`Sanctum Router swap source not yet fully implemented. Data: ${JSON.stringify(swapData, null, 2)}`);
        }
      } else {
        throw new Error(`Unknown swap source: ${swapSrc}`);
      }
      
      // Deserialize and sign the transaction
      setTransactionStatus({ status: 'signing' });
      
      const transactionBuffer = Buffer.from(swapResponse.swapTransaction, 'base64');
      let transaction: Transaction | VersionedTransaction;
      
      try {
        // Try as VersionedTransaction first (Jupiter typically uses versioned transactions)
        transaction = VersionedTransaction.deserialize(transactionBuffer);
      } catch {
        // Fallback to legacy Transaction
        transaction = Transaction.from(transactionBuffer);
      }

      // Sign the transaction
      let signedTransaction;
      
      if (transaction instanceof VersionedTransaction) {
        signedTransaction = await signTransaction(transaction);
      } else {
        signedTransaction = await signTransaction(transaction);
      }

      if (!signedTransaction) {
        throw new Error('Transaction signing failed');
      }

      // Send the transaction with better error handling
      setTransactionStatus({ status: 'sending' });
      
      let signature: string;
      try {
        signature = await connection.sendRawTransaction(
          signedTransaction.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
            maxRetries: 3
          }
        );
      } catch (sendError: any) {
        // Handle specific Jupiter errors
        if (sendError.message.includes('0x1789')) {
          throw new Error('Swap failed due to slippage or insufficient liquidity. Please try with a smaller amount or higher slippage tolerance.');
        } else if (sendError.message.includes('0x1')) {
          throw new Error('Insufficient balance to complete this swap. Please check your token balance.');
        } else if (sendError.message.includes('Simulation failed')) {
          throw new Error('Transaction simulation failed. This might be due to insufficient balance, high slippage, or network congestion. Please try again with a smaller amount.');
        }
        
        throw new Error(`Transaction failed: ${sendError.message}`);
      }

      // Confirm the transaction
      setTransactionStatus({ 
        status: 'confirming',
        signature,
        explorerUrl: `https://explorer.solana.com/tx/${signature}`
      });

      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      // Success!
      setTransactionStatus({ 
        status: 'success',
        signature,
        explorerUrl: `https://explorer.solana.com/tx/${signature}`
      });

    } catch (err) {
      console.error('Swap failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Swap failed';
      setError(errorMessage);
      setTransactionStatus({ status: 'error', error: errorMessage });
    } finally {
      setIsSwapping(false);
    }
  }, [publicKey, signTransaction, connection, getQuote, clearError]);

  return {
    swapTokens,
    getQuote,
    checkTokenBalance,
    transactionStatus,
    isSwapping,
    lastQuote,
    error,
    clearError
  };
}