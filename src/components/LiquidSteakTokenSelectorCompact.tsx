'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Search, ChevronRight, ArrowUpDown, AlertCircle, X } from 'lucide-react';
import { useSwap } from '@/src/hooks/useSwap';
import { useUSDPrices } from '@/src/hooks/useUSDPrices';
import { STEAKSOL_MINT } from '@/src/types';
import ClientOnly from './ClientOnly';
import TransactionStatusModal from './TransactionStatusModal';

// Types
interface LSTToken {
  name: string;
  symbol: string;
  logoUri: string;
  mint: string;
  apy?: number;
  validatorCount?: number;
  marketCap?: number;
  exchangeRate?: number;
  balance?: string;
  decimals?: number;
}

interface TokenSelectorProps {
  onTokenSelected?: (token: LSTToken) => void;
  className?: string;
}

import { SANCTUM_API_BASE } from '@/src/types';

const API_KEY = process.env.NEXT_PUBLIC_SANCTUM_API_KEY;

if (!API_KEY) {
  throw new Error('NEXT_PUBLIC_SANCTUM_API_KEY environment variable is required');
}

const LiquidSteakTokenSelectorCompact: React.FC<TokenSelectorProps> = ({ 
  onTokenSelected, 
  className = "" 
}) => {
  const { connected, publicKey } = useWallet();
  
  // State management
  const [tokens, setTokens] = useState<LSTToken[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<LSTToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToken, setSelectedToken] = useState<LSTToken | null>(null);
  const [showTokenList, setShowTokenList] = useState(false);
  const [swapAmount, setSwapAmount] = useState<string>('');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [isReversed, setIsReversed] = useState(false);
  const [tokenBalances, setTokenBalances] = useState<{[key: string]: number}>({});

  // Swap functionality
  const { 
    swapTokens, 
    transactionStatus, 
    isSwapping, 
    error: swapError, 
    clearError 
  } = useSwap();

  // Price functionality
  const {
    solPrice,
    steaksolPrice,
    loading: priceLoading,
    formatUSD,
    calculateUSDValue
  } = useUSDPrices();

  // STEAKSOL destination token
  const STEAKSOL_TOKEN: LSTToken = {
    mint: STEAKSOL_MINT,
    symbol: 'STKSL',
    name: 'STEAKSOL',
    logoUri: 'https://vg2375odczoslu5xk6xumcgzf73dxyb4lwjzgbvdzbbrkezojyia.arweave.net/qbW_9cMWXSXTt1evRgjZL_Y74Dxdk5MGo8hDFRMuThA',
    decimals: 9,
    balance: '0',
    exchangeRate: 1
  };

  // Fetch tokens from Sanctum API
  const fetchTokens = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${SANCTUM_API_BASE}/lsts?apiKey=${API_KEY}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle different response formats
      let tokenList = data;
      if (Array.isArray(data)) {
        tokenList = data;
      } else if (data.tokens && Array.isArray(data.tokens)) {
        tokenList = data.tokens;
      } else if (data.data && Array.isArray(data.data)) {
        tokenList = data.data;
      }

      // Add SOL as the first token (most popular choice)
      const solToken: LSTToken = {
        name: 'Solana',
        symbol: 'SOL',
        logoUri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        mint: 'So11111111111111111111111111111111111111112',
        apy: 0,
        exchangeRate: 1,
        decimals: 9,
        balance: '0'
      };

      // Sort tokens alphabetically by name and filter out Sanctum Automated tokens
      const sortedTokens = [
        solToken,
        ...tokenList
          .filter((token: LSTToken) => token.symbol !== 'SOL') // Remove any duplicate SOL
          .filter((token: LSTToken) => !token.name.includes('(Sanctum Automated)')) // Remove Sanctum Automated tokens
          .sort((a: LSTToken, b: LSTToken) => a.name.localeCompare(b.name))
      ];

      setTokens(sortedTokens);
      setFilteredTokens(sortedTokens);
      
      // Pre-select SOL token if no token is already selected
      if (!selectedToken) {
        setSelectedToken(solToken);
        
        if (onTokenSelected) {
          onTokenSelected(solToken);
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tokens';
      setError(errorMessage);
      console.error('❌ Error fetching tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter tokens based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTokens(tokens);
    } else {
      const filtered = tokens.filter(token =>
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTokens(filtered);
    }
  }, [searchTerm, tokens]);

  // Pre-select SOL token on component mount
  useEffect(() => {
    // Create SOL token object
    const solToken: LSTToken = {
      name: 'Solana',
      symbol: 'SOL',
      logoUri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
      mint: 'So11111111111111111111111111111111111111112',
      apy: 0,
      exchangeRate: 1,
      decimals: 9,
      balance: '0'
    };

    // Pre-select SOL token immediately
    if (!selectedToken) {
      setSelectedToken(solToken);
      
      if (onTokenSelected) {
        onTokenSelected(solToken);
      }
    }
  }, []); // Empty dependency array means this runs once on mount

  // Handle search input click - show token list
  const handleSearchClick = () => {
    if (!showTokenList) {
      setShowTokenList(true);
      if (tokens.length === 0) {
        fetchTokens();
      }
    }
  };

  // Handle token selection
  const handleTokenSelect = (token: LSTToken) => {
    setSelectedToken(token);
    setShowTokenList(false);
    setSearchTerm('');
    
    if (onTokenSelected) {
      onTokenSelected(token);
    }
  };

  // Handle swap execution
  const handleSwap = async () => {
    if (!selectedToken || !swapAmount) return;

    // If wallet is not connected, trigger wallet connection
    if (!connected) {
      return;
    }

    setShowTransactionModal(true);
    clearError();

    try {
      // Determine from and to tokens based on swap direction
      const fromToken = isReversed ? STEAKSOL_TOKEN : selectedToken;
      const toToken = isReversed ? selectedToken : STEAKSOL_TOKEN;
      
      await swapTokens(fromToken, toToken, swapAmount);
    } catch (err) {
      console.error('Swap failed:', err);
    }
  };

  // Close token list
  const handleCloseTokenList = () => {
    setShowTokenList(false);
    setSearchTerm('');
  };

  // Handle swap direction toggle
  const handleSwapDirection = () => {
    setIsReversed(!isReversed);
    setSwapAmount(''); // Clear amount when swapping direction
  };

  // Fetch token balances
  const fetchTokenBalance = async (tokenMint: string) => {
    if (!publicKey || !connected) return 0;
    
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    
    try {
      // For SOL balance
      if (tokenMint === 'So11111111111111111111111111111111111111112') {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getBalance',
            params: [publicKey.toString()]
          })
        });
        
        const data = await response.json();
        if (data.result && data.result.value !== undefined) {
          const balance = data.result.value / 1000000000; // Convert lamports to SOL
          return balance;
        }
      } else {
        // For SPL tokens
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getTokenAccountsByOwner',
            params: [
              publicKey.toString(),
              {
                mint: tokenMint
              },
              {
                encoding: 'jsonParsed'
              }
            ]
          })
        });
        
        const data = await response.json();
        if (data.result && data.result.value && data.result.value.length > 0) {
          const balance = data.result.value[0].account.data.parsed.info.tokenAmount.uiAmount;
          return balance || 0;
        }
      }
      
      return 0;
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return 0;
    }
  };

  // Update balances when wallet connects or selected token changes
  useEffect(() => {
    const updateBalances = async () => {
      if (!connected || !publicKey || !selectedToken) return;
      
      const balance = await fetchTokenBalance(selectedToken.mint);
      const steaksolBalance = await fetchTokenBalance(STEAKSOL_TOKEN.mint);
      
      setTokenBalances({
        [selectedToken.mint]: balance,
        [STEAKSOL_TOKEN.mint]: steaksolBalance
      });
    };
    
    updateBalances();
  }, [connected, publicKey, selectedToken]);

  // Get current token balance
  const getCurrentTokenBalance = () => {
    const currentToken = isReversed ? STEAKSOL_TOKEN : selectedToken;
    if (!currentToken || !connected) return 0;
    return tokenBalances[currentToken.mint] || 0;
  };

  // Format balance display
  const formatBalance = (balance: number, symbol: string) => {
    if (balance === 0) return `0.00 ${symbol}`;
    if (balance < 0.000001) return `${balance.toExponential(3)} ${symbol}`;
    if (balance < 1) return `${balance.toFixed(4)} ${symbol}`;
    if (balance < 1000) return `${balance.toFixed(4)} ${symbol}`;
    return `${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${symbol}`;
  };

  return (
    <div className={`${className}`}>
      <div className="glass-card rounded-2xl p-5 bg-card/50 backdrop-blur-sm py-5 px-5 my-11">
        {/* Token list overlay */}
        {showTokenList && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 rounded-2xl">
            <div className="glass-card rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white font-poppins">Select Token</h3>
                <button
                  onClick={handleCloseTokenList}
                  className="text-white hover:text-gray-200 p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                  autoFocus
                />
              </div>
              
              {/* Token list */}
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {loading && (
                  <div className="text-center py-8">
                    <div className="loading-spinner mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading tokens...</p>
                  </div>
                )}
                
                {error && (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-400 mb-4">{error}</p>
                    <button onClick={fetchTokens} className="btn-primary px-4 py-2">
                      Try Again
                    </button>
                  </div>
                )}
                
                {!loading && !error && filteredTokens.map((token, index) => (
                  <div
                    key={`${token.mint}-${index}`}
                    className="flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 bg-sub-card hover:bg-primary/20 mb-2"
                    onClick={() => handleTokenSelect(token)}
                  >
                    <img 
                      src={token.logoUri} 
                      alt={token.symbol}
                      className="w-8 h-8 rounded-full mr-3"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/solana-logo-gray.svg';
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-white">{token.symbol}</div>
                      <div className="text-sm text-gray-400">{token.name}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="space-y-3">
          {/* From Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground font-medium font-poppins">
                {isReversed ? 'Unstake SOL' : 'Stake SOL'}
              </label>
            </div>
            <div className="bg-background/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <input
                  placeholder="0"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  className="bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground border-none outline-none w-full font-poppins"
                />
                <button
                  onClick={!isReversed ? handleSearchClick : undefined}
                  className={`flex items-center gap-3 bg-primary/10 rounded-xl px-3 py-2 ${!isReversed ? 'hover:bg-primary/20 cursor-pointer transition-colors' : 'cursor-default'}`}
                  disabled={isReversed}
                >
                  <img 
                    src={isReversed ? STEAKSOL_TOKEN.logoUri : selectedToken?.logoUri} 
                    alt={isReversed ? 'STEAKSOL' : selectedToken?.symbol}
                    className="w-6 h-6 rounded-full flex-shrink-0"
                  />
                  <span className="text-foreground font-medium font-poppins whitespace-nowrap">
                    {isReversed ? 'STEAKSOL' : (selectedToken?.symbol || 'SOL')}
                  </span>
                </button>
              </div>
              <div className="text-sm text-muted-foreground font-poppins">
                <div className="flex items-center justify-between">
                  <div>
                    {priceLoading ? (
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        Loading price...
                      </span>
                    ) : swapAmount && parseFloat(swapAmount) > 0 && selectedToken ? (
                      formatUSD(calculateUSDValue(
                        parseFloat(swapAmount), 
                        isReversed ? steaksolPrice : (selectedToken.symbol === 'SOL' ? solPrice : (solPrice * (selectedToken.exchangeRate || 1)))
                      ))
                    ) : (
                      '~$0'
                    )}
                  </div>
                  {connected && (
                    <div className="flex items-center gap-2">
                      <span>{formatBalance(getCurrentTokenBalance(), isReversed ? 'STEAKSOL' : (selectedToken?.symbol || 'SOL'))}</span>
                      <button
                        onClick={() => setSwapAmount(getCurrentTokenBalance().toString())}
                        className="text-xs text-primary hover:text-primary/80 transition-colors bg-primary/10 px-2 py-1 rounded"
                        disabled={getCurrentTokenBalance() === 0}
                      >
                        MAX
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Arrow/Divider */}
          <div className="flex justify-center py-1">
            <button 
              onClick={handleSwapDirection}
              className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center hover:bg-primary/20 hover:border-primary/30 transition-all duration-200 cursor-pointer"
            >
              <ArrowUpDown className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
            </button>
          </div>

          {/* To Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground font-medium font-poppins">
                Receive
              </label>
            </div>
            <div className="bg-background/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-foreground font-poppins">
                  {swapAmount && parseFloat(swapAmount) > 0 && selectedToken && solPrice && steaksolPrice
                    ? (() => {
                        if (isReversed) {
                          // STEAKSOL → Selected Token
                          const inputUSDValue = parseFloat(swapAmount) * steaksolPrice;
                          const outputAmount = (inputUSDValue * 0.98) / (selectedToken.symbol === 'SOL' ? solPrice : (solPrice * (selectedToken.exchangeRate || 1)));
                          return outputAmount.toFixed(6);
                        } else {
                          // Selected Token → STEAKSOL
                          const inputUSDValue = parseFloat(swapAmount) * (selectedToken.symbol === 'SOL' ? solPrice : (solPrice * (selectedToken.exchangeRate || 1)));
                          const steaksolAmount = (inputUSDValue * 0.98) / steaksolPrice;
                          return steaksolAmount.toFixed(6);
                        }
                      })()
                    : '0'
                  }
                </div>
                <button
                  onClick={isReversed ? handleSearchClick : undefined}
                  className={`flex items-center gap-3 bg-primary/10 rounded-xl px-3 py-2 ${isReversed ? 'hover:bg-primary/20 cursor-pointer transition-colors' : 'cursor-default'}`}
                  disabled={!isReversed}
                >
                  <img 
                    src={isReversed ? selectedToken?.logoUri : STEAKSOL_TOKEN.logoUri} 
                    alt={isReversed ? selectedToken?.symbol : 'STEAKSOL'}
                    className="w-6 h-6 rounded-full flex-shrink-0"
                  />
                  <span className="text-foreground font-medium font-poppins whitespace-nowrap">
                    {isReversed ? (selectedToken?.symbol || 'SOL') : 'STEAKSOL'}
                  </span>
                </button>
              </div>
              <div className="text-sm text-muted-foreground font-poppins">
                {priceLoading ? (
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    Loading price...
                  </span>
                ) : swapAmount && parseFloat(swapAmount) > 0 && selectedToken ? (
                  formatUSD(calculateUSDValue(
                    parseFloat(swapAmount) * 0.98,
                    isReversed ? (selectedToken.symbol === 'SOL' ? solPrice : (solPrice * (selectedToken.exchangeRate || 1))) : steaksolPrice
                  ))
                ) : (
                  '~$0'
                )}
              </div>
            </div>
          </div>

          {/* Connect Wallet / Swap Button */}
          <div className="flex justify-center">
            {!connected ? (
              <ClientOnly fallback={
                <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-5 text-lg font-medium rounded-xl font-poppins flex items-center justify-center">
                  Connect Wallet
                </button>
              }>
                <div className="w-full flex justify-center">
                  <WalletMultiButton 
                    className="!w-full !bg-primary !hover:bg-primary/90 !text-primary-foreground !py-5 !text-lg !font-medium !rounded-xl !font-poppins !flex !items-center !justify-center !min-h-[60px]" 
                    startIcon={undefined}
                  >
                    Connect Wallet
                  </WalletMultiButton>
                </div>
              </ClientOnly>
            ) : (
              <button
                className={`w-full font-medium py-5 text-lg transition-all duration-200 rounded-xl font-poppins flex items-center justify-center min-h-[60px] ${
                  !swapAmount || parseFloat(swapAmount) <= 0 || isSwapping
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
                onClick={handleSwap}
                disabled={!swapAmount || parseFloat(swapAmount) <= 0 || isSwapping}
              >
                {isSwapping ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="loading-spinner w-5 h-5"></div>
                    Swapping...
                  </span>
                ) : !swapAmount || parseFloat(swapAmount) <= 0 ? (
                  'Enter amount'
                ) : (
                  `Swap ${isReversed ? 'STEAKSOL' : selectedToken?.symbol} → ${isReversed ? selectedToken?.symbol : 'STEAKSOL'}`
                )}
              </button>
            )}
          </div>

          {/* Swap Error Display */}
          {swapError && (
            <div className="mt-3 p-3 bg-red-500/20 rounded-lg border border-red-500">
              <div className="text-red-400 text-sm font-medium mb-1">Error:</div>
              <div className="text-red-300 text-sm">{swapError}</div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Status Modal */}
      <TransactionStatusModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        transactionStatus={transactionStatus || { status: 'idle' }}
        fromToken={isReversed ? 'STEAKSOL' : selectedToken?.symbol}
        toToken={isReversed ? selectedToken?.symbol : 'STEAKSOL'}
        amount={swapAmount}
      />
    </div>
  );
};

export default LiquidSteakTokenSelectorCompact;