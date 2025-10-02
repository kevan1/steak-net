import { PublicKey } from '@solana/web3.js';

export interface LSTToken {
  name: string;
  symbol: string;
  logoUri: string;
  mint: string;
  apy?: number;
  validatorCount?: number;
  marketCap?: number;
  price?: number;
  exchangeRate?: number;
  balance?: string;
  decimals?: number;
}

export interface SwapQuote {
  mode: string;
  inp: string;
  out: string;
  inpAmt: string;
  outAmt: string;
  swapSrcData: {
    swapSrc: string;
    data: { 
      fees: SwapFee[]; 
      priceImpact?: number;
      transaction?: string;
    } | any; // Allow any shape for different swap sources
  };
}

export interface SwapFee {
  amount: string;
  mint: string;
  pct: number;
}

export interface DepositQuote {
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  depositFee: number;
  exchangeRate: number;
  route: 'sanctum' | 'jupiter' | 'fallback';
}

export interface TransactionStatus {
  status: 'idle' | 'preparing' | 'signing' | 'sending' | 'confirming' | 'success' | 'error';
  signature?: string;
  error?: string;
  explorerUrl?: string;
}

export interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: number;
}

export interface PriceData {
  mint: string;
  price: number;
  change24h?: number;
  timestamp: number;
}

export class SwapError extends Error {
  constructor(
    message: string, 
    public code?: string, 
    public details?: any
  ) {
    super(message);
    this.name = 'SwapError';
  }
}

export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const STEAKSOL_MINT = 'sctmqBfQtZj76PaLmepQ7Xskpu8LNMyWsXqFYAuihML';

// SOL Token definition for consistency with LST tokens
export const SOL_TOKEN: LSTToken = {
  name: 'Solana',
  symbol: 'SOL',
  logoUri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  mint: SOL_MINT,
  apy: 0, // SOL doesn't have inherent APY
  validatorCount: undefined,
  marketCap: undefined,
  exchangeRate: 1, // 1:1 for SOL
};

// STEAKSOL Token definition as fallback if not found in Sanctum API
export const STEAKSOL_TOKEN: LSTToken = {
  name: 'Liquid Steak',
  symbol: 'STKSL',
  logoUri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/sctmqBfQtZj76PaLmepQ7Xskpu8LNMyWsXqFYAuihML/logo.png',
  mint: STEAKSOL_MINT,
  apy: 8.5, // Approximate APY for liquid staking
  validatorCount: undefined,
  marketCap: undefined,
  exchangeRate: 1.05, // Slightly above 1:1 for staking rewards
};

export const SANCTUM_API_BASE = 'https://sanctum-api.ironforge.network';