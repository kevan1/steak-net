'use client';

import { useState, useEffect, useCallback } from 'react';
import { priceApi } from '@/src/services/priceApi';

export interface UseUSDPricesReturn {
  solPrice: number;
  steaksolPrice: number;
  loading: boolean;
  error: string | null;
  refreshPrices: () => Promise<void>;
  getLSTPrice: (mint: string, exchangeRate?: number) => Promise<number>;
  formatUSD: (amount: number, decimals?: number) => string;
  formatTokenAmount: (amount: number, decimals?: number) => string;
  calculateUSDValue: (tokenAmount: number, tokenPrice: number) => number;
}

export function useUSDPrices(): UseUSDPricesReturn {
  const [solPrice, setSolPrice] = useState<number>(0);
  const [steaksolPrice, setSteaksolPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both SOL and STEAKSOL prices concurrently
      const [solPriceResult, steaksolPriceResult] = await Promise.all([
        priceApi.getSOLPrice(),
        priceApi.getSTEAKSOLPrice()
      ]);
      
      setSolPrice(solPriceResult);
      setSteaksolPrice(steaksolPriceResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prices';
      setError(errorMessage);
      console.error('Error fetching prices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPrices = useCallback(async () => {
    await fetchPrices();
  }, [fetchPrices]);

  const getLSTPrice = useCallback(async (mint: string, exchangeRate?: number): Promise<number> => {
    try {
      return await priceApi.getLSTPrice(mint, exchangeRate);
    } catch (err) {
      console.error(`Error getting LST price for ${mint}:`, err);
      return 0;
    }
  }, []);

  const formatUSD = useCallback((amount: number, decimals: number = 2): string => {
    return priceApi.formatUSD(amount, decimals);
  }, []);

  const formatTokenAmount = useCallback((amount: number, decimals: number = 4): string => {
    return priceApi.formatTokenAmount(amount, decimals);
  }, []);

  const calculateUSDValue = useCallback((tokenAmount: number, tokenPrice: number): number => {
    return priceApi.calculateUSDValue(tokenAmount, tokenPrice);
  }, []);

  useEffect(() => {
    fetchPrices();
    
    // Refresh prices every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return {
    solPrice,
    steaksolPrice,
    loading,
    error,
    refreshPrices,
    getLSTPrice,
    formatUSD,
    formatTokenAmount,
    calculateUSDValue,
  };
}