'use client';

import { useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, VersionedTransaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { LSTToken, SwapQuote, TransactionStatus } from '@/src/types';
import { quoteComparison } from '@/src/services/quoteComparison';
import { sanctumApi } from '@/src/services/sanctumApi';

export interface UseSwapReturn {
  swapTokens: (fromToken: LSTToken, toToken: LSTToken, amount: string) => Promise<void>;
  getQuote: (fromToken: LSTToken, toToken: LSTToken, amount: string) => Promise<SwapQuote | null>;
  checkTokenBalance: (tokenMint: string, requiredAmount: string) => Promise<boolean>;
  transactionStatus: TransactionStatus;
  isSwapping: boolean;
  lastQuote: SwapQuote | null;
  quoteComparison: {
    bestQuote: SwapQuote | null;
    recommendation: string;
    allQuotes: any[];
  } | null;
  error: string | null;
  clearError: () => void;
  clearQuotes: () => void;
}

export function useSwap(): UseSwapReturn {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({ status: 'idle' });
  const [isSwapping, setIsSwapping] = useState(false);
  const [lastQuote, setLastQuote] = useState<SwapQuote | null>(null);
  const [quoteComparisonData, setQuoteComparisonData] = useState<{
    bestQuote: SwapQuote | null;
    recommendation: string;
    allQuotes: any[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearQuotes = useCallback(() => {
    setLastQuote(null);
    setQuoteComparisonData(null);
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
    try {
      clearError();
      
      // Validate inputs
      if (!fromToken.mint || !toToken.mint) {
        throw new Error('Invalid token mints');
      }
      
      if (parseFloat(amount) <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Compare quotes from multiple providers
      const comparisonResult = await quoteComparison.compareQuotes(
        fromToken,
        toToken,
        amount,
        100 // 1% slippage for better execution
      );

      // Store the comparison data for UI display
      setQuoteComparisonData(comparisonResult);
      
      // Store the best quote as the last quote
      const bestQuote = comparisonResult.bestQuote;
      setLastQuote(bestQuote);
      
      return bestQuote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get quote';
      setError(errorMessage);
      console.error('Error getting swap quote:', err);
      return null;
    }
  }, [clearError]);

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

      // Build transaction for the best quote
      setTransactionStatus({ status: 'preparing' });
      
      // Get transaction for the best quote (handles multiple providers)
      const swapTxResult = await quoteComparison.getSwapTransaction(quote, publicKey.toString());
      
      if (!swapTxResult) {
        throw new Error('Failed to build swap transaction');
      }
      
      console.log(`Using ${swapTxResult.provider} provider for swap execution`);
      
      const swapResponse = { swapTransaction: swapTxResult.swapTransaction };
      
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
    quoteComparison: quoteComparisonData,
    error,
    clearError,
    clearQuotes
  };
}