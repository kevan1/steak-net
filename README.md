# STEAKNET Website 🥩

A liquid staking platform for Solana, allowing users to stake SOL and receive STEAKSOL tokens while earning STEAK rewards.

## Features

- **Liquid Staking**: Stake SOL → Receive STEAKSOL (liquid stake tokens)
- **Real Swaps**: Integration with Sanctum and Jupiter for token swaps
- **Live Pricing**: Real-time pricing from CoinGecko and Jupiter APIs
- **Wallet Integration**: Support for Phantom, Solflare, and other Solana wallets
- **Transaction Tracking**: Real-time transaction status and confirmation

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Blockchain**: Solana Web3.js, Wallet Adapter
- **APIs**: Sanctum Protocol, Jupiter Aggregator, CoinGecko
- **UI**: Lucide React Icons, Custom Glass-morphism Design

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Solana wallet (Phantom, Solflare, etc.)
- Basic understanding of Solana and DeFi

## Environment Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd steaknet-website
npm install
```

### 2. Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

```bash
# Required: Sanctum API Key
NEXT_PUBLIC_SANCTUM_API_KEY=your_sanctum_api_key

# Recommended: Premium Solana RPC for better performance
NEXT_PUBLIC_SOLANA_RPC_URL=your_rpc_endpoint

# Optional: CoinGecko API Key for higher rate limits
COINGECKO_API_KEY=your_coingecko_api_key
```

### 3. Get API Keys

**Sanctum API Key:**
- Visit [Sanctum.so](https://sanctum.so/)
- Sign up and get your API key
- Or use the default for testing: `REDACTED`

**Premium Solana RPC (Recommended):**
- [Helius](https://www.helius.dev/) - Free tier available
- [QuickNode](https://www.quicknode.com/) - Solana endpoint
- [Alchemy](https://www.alchemy.com/) - Solana support
- Default (slower): `https://api.mainnet-beta.solana.com`

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
steaknet-website/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage with staking interface
│   └── steak/page.tsx     # Enhanced steak interface
├── src/
│   ├── components/        # React components
│   │   ├── LiquidSteakTokenSelectorCompact.tsx
│   │   ├── LiquidSteakTokenSelectorEnhanced.tsx
│   │   ├── WalletContextProvider.tsx
│   │   └── TransactionStatusModal.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useSwap.ts    # Swap functionality
│   │   ├── useUSDPrices.ts
│   │   └── useTokenData.ts
│   ├── services/         # API services
│   │   ├── sanctumApi.ts # Sanctum protocol integration
│   │   └── priceApi.ts   # Price fetching services
│   └── types/            # TypeScript type definitions
└── .env.local.example    # Environment variables template
```

## Deployment

### Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Set Environment Variables**:
   - In Vercel Dashboard: **Settings** → **Environment Variables**
   - Add each variable from `.env.local.example`:
   
   | Variable | Value | Environment |
   |----------|-------|-------------|
   | `NEXT_PUBLIC_SANCTUM_API_KEY` | Your Sanctum API key | Production, Preview, Development |
   | `NEXT_PUBLIC_SOLANA_RPC_URL` | Your RPC endpoint | Production, Preview, Development |
   | `COINGECKO_API_KEY` | Your CoinGecko key (optional) | Production, Preview, Development |

4. **Deploy**:
   - Click **Deploy**
   - Vercel will build and deploy automatically
   - Each push to `main` triggers a new deployment

### Environment Variable Security

🔒 **Security Best Practices**:

- **NEXT_PUBLIC_*** variables are exposed to the browser
- Never put private keys in `NEXT_PUBLIC_*` variables
- Use server-only variables for sensitive data
- Different values for development/production
- Keep `.env.local` out of version control

## Development

### Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with your values

# Start development server
npm run dev
```

### Building for Production

```bash
npm run build
npm run start
```

## API Integration

### Sanctum Protocol
- **LST Token Data**: Fetches available liquid staking tokens
- **Swap Quotes**: Gets swap pricing and routing
- **Transaction Building**: Constructs swap transactions

### Jupiter Aggregator  
- **Price Data**: Real-time token pricing
- **Swap Execution**: Alternative swap routing
- **Transaction Processing**: Swap transaction handling

### CoinGecko
- **SOL Price**: Real-time SOL/USD pricing
- **Market Data**: 24h price changes and market info

## Troubleshooting

### Common Issues

**Wallet Connection Issues:**
```bash
# Clear browser cache and cookies
# Try different wallet (Phantom vs Solflare)
# Check browser console for errors
```

**API Rate Limits:**
```bash
# Get premium RPC endpoint
# Add CoinGecko API key
# Check environment variables are set
```

**Build/Deploy Errors:**
```bash
# Verify all environment variables in Vercel
# Check build logs in Vercel dashboard
# Ensure TypeScript types are correct
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test locally
4. Commit changes: `git commit -m 'Add feature'`
5. Push to branch: `git push origin feature-name`
6. Open a Pull Request

## Learn More

### Solana Development
- [Solana Cookbook](https://solanacookbook.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)

### DeFi Protocols
- [Sanctum Documentation](https://docs.sanctum.so/)
- [Jupiter Documentation](https://docs.jup.ag/)
- [Liquid Staking Guide](https://solana.com/developers/guides/advanced/liquid-staking)

### Next.js
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js GitHub Repository](https://github.com/vercel/next.js)
- [Next.js Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying)
