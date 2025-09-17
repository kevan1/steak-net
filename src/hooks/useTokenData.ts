'use client';

import { useState, useEffect, useCallback } from 'react';
import { LSTToken, SOL_TOKEN } from '@/src/types';
import { sanctumApi } from '@/src/services/sanctumApi';

export interface UseTokenDataReturn {
  tokens: LSTToken[];
  loading: boolean;
  error: string | null;
  refreshTokens: () => Promise<void>;
  selectedToken: LSTToken | null;
  setSelectedToken: (token: LSTToken | null) => void;
}

export function useTokenData(): UseTokenDataReturn {
  const [tokens, setTokens] = useState<LSTToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<LSTToken | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const lstTokens = await sanctumApi.getAllLSTs();
      
      // Sort LST tokens by APY (highest first), then by name
      const sortedLSTTokens = lstTokens.sort((a, b) => {
        if (a.apy && b.apy) {
          return b.apy - a.apy;
        }
        if (a.apy && !b.apy) return -1;
        if (!a.apy && b.apy) return 1;
        return a.name.localeCompare(b.name);
      });

      // Add SOL as the first token option (most common swap source)
      const allTokens = [SOL_TOKEN, ...sortedLSTTokens];
      
      setTokens(allTokens);
      
      // Auto-select SOL as the default token if none is selected
      if (!selectedToken) {
        setSelectedToken(SOL_TOKEN);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tokens';
      setError(errorMessage);
      console.error('Error fetching tokens:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedToken]);

  const refreshTokens = useCallback(async () => {
    await fetchTokens();
  }, [fetchTokens]);

  useEffect(() => {
    fetchTokens();
  }, []);

  return {
    tokens,
    loading,
    error,
    refreshTokens,
    selectedToken,
    setSelectedToken,
  };
}