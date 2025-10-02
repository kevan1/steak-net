'use client';

import { useState, useEffect, useCallback } from 'react';
import { priceApi } from '@/src/services/priceApi';

export interface UseUSDPricesReturn {
  solPrice: number;
  steaksolPrice: number;
  loading: boolean;
  refreshing: boolean;
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async (forceFresh = false) => {
    try {
      // Only show loading spinner on initial load, not on refreshes
      if (forceFresh && solPrice === 0 && steaksolPrice === 0) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      
      // Fetch both SOL and STEAKSOL prices concurrently
      const [solPriceResult, steaksolPriceResult] = await Promise.all([
        priceApi.getSOLPrice(forceFresh),
        priceApi.getSTEAKSOLPrice(forceFresh)
      ]);
      
      setSolPrice(solPriceResult);
      setSteaksolPrice(steaksolPriceResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prices';
      setError(errorMessage);
      console.error('Error fetching prices:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [solPrice, steaksolPrice]);

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
    // Force fresh prices on initial load to avoid jarring updates
    fetchPrices(true);
    
    // Refresh prices every 5 seconds (using cached data)
    const interval = setInterval(() => fetchPrices(false), 5000);
    
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return {
    solPrice,
    steaksolPrice,
    loading,
    refreshing,
    error,
    refreshPrices,
    getLSTPrice,
    formatUSD,
    formatTokenAmount,
    calculateUSDValue,
  };
}