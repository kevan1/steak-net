'use client';

import React from 'react';
import LiquidSteakTokenSelectorEnhanced from '@/src/components/LiquidSteakTokenSelectorEnhanced';
import ClientOnly from '@/src/components/ClientOnly';

export default function SteakNetPage() {
  const handleTokenSelected = (token: any) => {
    // Token selected
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header Section */}
      <div className="text-center py-20 px-4">
        <h1 
          className="text-6xl md:text-8xl mb-1 font-steak text-white"
          style={{
            fontSize: "clamp(3rem, 8vw, 6rem)",
            letterSpacing: "-0.02em",
            WebkitTextStroke: "9px #3a2020",
            WebkitTextFillColor: "currentColor",
            paintOrder: "stroke fill",
          }}
          aria-label="STEAK.NET"
        >
          🥩 <span className="text-[#ee444d] font-inherit align-baseline">STEAK.NET</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-2 text-pretty font-poppins">
          Liquid Staking • Real Swaps • Solana Mainnet
        </p>
        <p className="text-sm md:text-base text-muted-foreground mb-8 text-pretty font-poppins">
          Swap SOL and LST tokens with real Sanctum & Jupiter integration
        </p>
      </div>

      {/* Main STEAK.NET Component */}
      <ClientOnly fallback={
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <div className="glass-card p-8 text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-400">Loading STEAK.NET...</p>
          </div>
        </div>
      }>
        <LiquidSteakTokenSelectorEnhanced 
          onTokenSelected={handleTokenSelected}
          className="mb-16"
        />
      </ClientOnly>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-2 font-poppins">Real Swaps</h3>
            <p className="text-gray-400 font-poppins">
              Execute real token swaps on Solana Mainnet using Sanctum and Jupiter APIs
            </p>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-bold text-white mb-2 font-poppins">Wallet Integration</h3>
            <p className="text-gray-400 font-poppins">
              Connect Phantom, Solflare, and other Solana wallets for seamless transactions
            </p>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-white mb-2 font-poppins">Live Prices</h3>
            <p className="text-gray-400 font-poppins">
              Real-time pricing from CoinGecko and Jupiter with automatic updates
            </p>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="border-t border-white/10 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400 mb-4 font-poppins">
            STEAK.NET Integration • Powered by Sanctum Protocol & Jupiter Aggregator
          </p>
          <div className="flex justify-center items-center gap-6 text-sm text-gray-500 font-poppins">
            <span>Solana Mainnet</span>
            <span>•</span>
            <span>Real API Integration</span>
            <span>•</span>
            <span>Live Trading</span>
          </div>
        </div>
      </div>
    </div>
  );
}