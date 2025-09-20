'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Search, ChevronRight, ChevronDown, Loader2, AlertCircle, CheckCircle, ExternalLink, X } from 'lucide-react';
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

const LiquidSteakTokenSelectorEnhanced: React.FC<TokenSelectorProps> = ({ 
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
      // The wallet adapter will handle showing the wallet selection modal
      // We don't need to do anything here as the WalletMultiButton will handle it
      return;
    }

    setShowTransactionModal(true);
    clearError();

    try {
      await swapTokens(selectedToken, STEAKSOL_TOKEN, swapAmount);
    } catch (err) {
      console.error('Swap failed:', err);
    }
  };

  // Close token list
  const handleCloseTokenList = () => {
    setShowTokenList(false);
    setSearchTerm('');
  };

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`;
    } else if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`;
    }
    return num.toString();
  };


  return (
    <div className={`max-w-4xl mx-auto p-4 sm:p-6 ${className}`}>
      <div className="glass-card p-4 sm:p-6 lg:p-8 relative">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              {/* Empty div for spacing */}
            </div>
            
            <div className="text-right">
              {connected && (
                <>
                  <div className="text-sm text-gray-400">Connected:</div>
                  <div className="font-mono text-white text-sm">
                    {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Compact Swap Interface - Single Card */}
        {selectedToken && !showTokenList && (
          <div className="bg-input-card p-4 sm:p-6 rounded-xl mb-6 sm:mb-8">
            {/* Stake Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-300">Stake SOL</h3>
                <button
                  onClick={handleSearchClick}
                  className="px-4 py-2 text-sm font-medium text-white bg-sub-card rounded-lg transition-all duration-200 hover:bg-glass-bg-hover border border-purple-500/50 hover:border-purple-400 backdrop-blur-md hover:scale-105"
                >
                  ⚡ Change Token
                </button>
              </div>
              
              {/* Amount Input with Token Display */}
              <div className="mb-4">
                <div className="flex items-center justify-between gap-2">
                  <input
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    placeholder="0"
                    className="bg-transparent text-2xl sm:text-3xl lg:text-4xl font-bold text-white border-none outline-none placeholder:text-gray-500 focus:outline-none focus:ring-0 flex-1 min-w-0"
                    style={{ 
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      boxShadow: 'none'
                    }}
                  />
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    {selectedToken.logoUri ? (
                      <img 
                        src={selectedToken.logoUri} 
                        alt={selectedToken.symbol}
                        className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full bg-purple-500 flex items-center justify-center hidden">
                      <span className="text-white font-bold text-xs sm:text-sm">{selectedToken.symbol.slice(0, 1)}</span>
                    </div>
                    <span className="font-bold text-white text-xl sm:text-2xl lg:text-4xl whitespace-nowrap">{selectedToken.symbol}</span>
                  </div>
                </div>
                <div className="text-gray-400 text-sm mt-1">
                  {priceLoading ? (
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      Loading price...
                    </span>
                  ) : swapAmount && parseFloat(swapAmount) > 0 && selectedToken ? (
                    formatUSD(calculateUSDValue(
                      parseFloat(swapAmount), 
                      selectedToken.symbol === 'SOL' ? solPrice : (solPrice * (selectedToken.exchangeRate || 1))
                    ))
                  ) : (
                    '~$0'
                  )}
                </div>
              </div>
            </div>

            {/* Arrow Down */}
            <div className="flex justify-center mb-6">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Receive Section */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-300 mb-4">Receive</h3>
              
              {/* Amount Display with Token Display */}
              <div className="mb-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white flex-1 min-w-0">
                    {swapAmount && parseFloat(swapAmount) > 0 && selectedToken && solPrice && steaksolPrice
                      ? (() => {
                          const inputUSDValue = parseFloat(swapAmount) * (selectedToken.symbol === 'SOL' ? solPrice : (solPrice * (selectedToken.exchangeRate || 1)));
                          const steaksolAmount = (inputUSDValue * 0.98) / steaksolPrice; // 2% slippage buffer
                          return steaksolAmount.toFixed(6);
                        })()
                      : '0'
                    }
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    {STEAKSOL_TOKEN.logoUri ? (
                      <img 
                        src={STEAKSOL_TOKEN.logoUri} 
                        alt="STEAKSOL"
                        className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center hidden">
                      <span className="text-white font-bold text-xs sm:text-sm">🥩</span>
                    </div>
                    <span className="font-bold text-white text-xl sm:text-2xl lg:text-4xl whitespace-nowrap">STEAKSOL</span>
                  </div>
                </div>
                <div className="text-gray-400 text-sm mt-1">
                  {priceLoading ? (
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      Loading price...
                    </span>
                  ) : swapAmount && parseFloat(swapAmount) > 0 && selectedToken ? (
                    formatUSD(calculateUSDValue(
                      parseFloat(swapAmount) * 0.98, // 2% slippage buffer
                      steaksolPrice // Use STEAKSOL price for receive section
                    ))
                  ) : (
                    '~$0'
                  )}
                </div>
              </div>
            </div>

            {/* Connect Wallet / Swap Button */}
            {!connected ? (
              <div className="flex justify-center items-center w-full">
                <ClientOnly fallback={
                  <button className="w-full btn-primary py-4 px-6 text-lg">
                    Connect Wallet
                  </button>
                }>
                  <WalletMultiButton 
                    className="w-full !btn-primary !py-4 !px-6 !text-lg" 
                    startIcon={undefined}
                  >
                    Connect Wallet
                  </WalletMultiButton>
                </ClientOnly>
              </div>
            ) : (
              <button
                className={`w-full font-bold py-4 px-6 text-lg transition-all duration-200 ${
                  !swapAmount || parseFloat(swapAmount) <= 0 || isSwapping
                    ? 'bg-sub-card text-gray-300 cursor-not-allowed border border-gray-600/50 rounded-xl'
                    : 'btn-primary'
                }`}
                onClick={handleSwap}
                disabled={!swapAmount || parseFloat(swapAmount) <= 0 || isSwapping}
              >
                {isSwapping ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="loading-spinner w-5 h-5"></div>
                    Processing Swap...
                  </span>
                ) : !swapAmount || parseFloat(swapAmount) <= 0 ? (
                  'Enter amount to stake'
                ) : (
                  `Stake ${swapAmount} ${selectedToken.symbol}`
                )}
              </button>
            )}

            {/* Swap Error Display */}
            {swapError && (
              <div className="mt-4 p-4 bg-red-500 bg-opacity-20 rounded-lg border border-red-500">
                <div className="text-red-400 text-sm font-medium mb-2">Swap Error:</div>
                <div className="text-red-300 text-sm">{swapError}</div>
                <button
                  onClick={clearError}
                  className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                >
                  Clear Error
                </button>
              </div>
            )}
          </div>
        )}

        {/* Token list (shown when search is clicked or tokens are being browsed) */}
        {showTokenList && (
          <div className="mb-8 bg-input-card p-4 rounded-xl border border-purple-500/20 relative z-10 shadow-lg">
            {/* Search input with close button - Fixed at top */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="search-icon absolute" />
                <input
                  type="text"
                  placeholder="Search tokens by name or symbol..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field w-full"
                  autoFocus
                />
              </div>
              <button
                onClick={handleCloseTokenList}
                className="search-close-btn flex items-center justify-center text-white hover:text-gray-200 rounded-lg flex-shrink-0"
                style={{ width: '52px', height: '52px' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            

            {/* Token count - Fixed at top */}
            {!loading && !error && (
              <div className="mb-4 flex-shrink-0 border-b border-white/10 pb-2">
                <p className="text-gray-400 text-sm">
                  {filteredTokens.length} {filteredTokens.length === 1 ? 'token' : 'tokens'} available
                  {searchTerm && ` matching "${searchTerm}"`}
                </p>
              </div>
            )}

            {/* Scrollable Token list container */}
            <div className="token-list-container px-1" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {loading && (
                <div className="text-center py-8">
                  <div className="loading-spinner mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading available tokens...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-red-400 mb-4">Error Loading Tokens</h3>
                  <p className="text-gray-400 mb-6">{error}</p>
                  <button
                    onClick={fetchTokens}
                    className="btn-primary px-6 py-3 rounded-lg font-bold"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && (
                <div className="space-y-3 custom-scrollbar">
                  {filteredTokens.length === 0 ? (
                    <div className="text-center py-8">
                      <Search className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">
                        {searchTerm 
                          ? `No tokens found matching "${searchTerm}"` 
                          : 'No tokens available'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredTokens.map((token, index) => (
                      <div
                        key={`${token.mint}-${index}`}
                        className="flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 bg-sub-card border border-transparent hover:border-purple-500 hover:bg-purple-900/20 group mb-2"
                        onClick={() => handleTokenSelect(token)}
                      >
                        {/* Token icon */}
                        <div className="w-12 h-12 mr-4 flex-shrink-0">
                          {token.logoUri ? (
                            <img 
                              src={token.logoUri} 
                              alt={token.symbol}
                              className="w-12 h-12 rounded-full object-cover border border-gray-600"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/solana-logo-gray.svg';
                              }}
                            />
                          ) : (
                            <img 
                              src="/solana-logo-gray.svg" 
                              alt="placeholder"
                              className="w-12 h-12 rounded-full object-cover border border-gray-600"
                            />
                          )}
                        </div>

                        {/* Token info */}
                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-xl text-white truncate">
                              {token.symbol}
                            </h3>
                            <span className="text-gray-400 font-normal text-base truncate">
                              {token.name}
                            </span>
                            {token.symbol === 'SOL' && (
                              <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                Most Popular
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm mt-1">
                            {token.symbol === 'SOL' ? (
                              <div className="text-blue-400 font-medium">
                                Native Token • Direct Swap
                              </div>
                            ) : (
                              <>
                                {token.apy && token.apy > 0 && (
                                  <div className="text-green-400 font-medium">
                                    APY: {token.apy.toFixed(2)}%
                                  </div>
                                )}
                                {token.validatorCount && (
                                  <div className="text-gray-400">
                                    {token.validatorCount} validators
                                  </div>
                                )}
                                {token.exchangeRate && (
                                  <div className="text-gray-400">
                                    Rate: {token.exchangeRate.toFixed(4)}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Select arrow */}
                        <div className="ml-6 text-gray-400 group-hover:text-purple-400 transition-colors flex-shrink-0">
                          <ChevronRight className="w-6 h-6" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer - only show when NOT showing token list */}
        {!showTokenList && selectedToken && (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-400">
              Zero fees • Instant liquidity • Powered by Sanctum Protocol
            </p>
          </div>
        )}
        
        {/* Initial footer - only show when no token selected and no list showing */}
        {!showTokenList && !selectedToken && (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-400">
              Zero fees • Instant liquidity • Powered by Sanctum Protocol
            </p>
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
              <span>API: Sanctum Network</span>
              <span>•</span>
              <span>Destination: STEAKSOL</span>
              <span>•</span>
              <a 
                href="https://sanctum.so" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
              >
                Learn More <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Status Modal */}
      <TransactionStatusModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        transactionStatus={transactionStatus || { status: 'idle' }}
        fromToken={selectedToken?.symbol}
        toToken="STKSL"
        amount={swapAmount}
      />
    </div>
  );
};

export default LiquidSteakTokenSelectorEnhanced;