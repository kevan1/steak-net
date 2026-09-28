'use client';

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
// Import wallet adapters individually to avoid pulling in unused dependencies
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { LedgerWalletAdapter } from '@solana/wallet-adapter-ledger';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

const WalletContextProvider: FC<Props> = ({ children }) => {
  // Network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Mainnet;

  // RPC endpoint - use server-side proxy with full URL for build time
  const endpoint = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/rpc`;
    }
    // During SSR/build, use a placeholder that will be replaced at runtime
    // The ConnectionProvider validates the URL format, so we need a valid URL
    return 'https://placeholder-for-build.local/api/rpc';
  }, []);

  const wallets = useMemo(
    () => {
      const walletAdapters = [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter({ network }),
        new LedgerWalletAdapter(),
        // Removed adapters that cause deprecation warnings:
        // - TorusWalletAdapter uses deprecated @toruslabs/solana-embed
        // - Coin98WalletAdapter and MathWalletAdapter may have deprecated deps
        // - BackpackWalletAdapter is temporarily disabled as mentioned in the master prompt
      ];
      
      // Deduplicate wallets by name to prevent React key conflicts
      const uniqueWallets = walletAdapters.reduce((acc, wallet) => {
        const existingWallet = acc.find(w => w.name === wallet.name);
        if (!existingWallet) {
          acc.push(wallet);
        } else {
          // Log duplicate wallet detection for debugging
          console.warn(`Duplicate wallet detected: ${wallet.name}, skipping duplicate`);
        }
        return acc;
      }, [] as typeof walletAdapters);
      
      // Additional check for any remaining duplicates and log them
      const walletNames = uniqueWallets.map(w => w.name);
      const duplicateNames = walletNames.filter((name, index) => walletNames.indexOf(name) !== index);
      if (duplicateNames.length > 0) {
        console.warn('Remaining duplicate wallet names after deduplication:', duplicateNames);
      }
      
      return uniqueWallets;
    },
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={true}
        onError={(error) => {
          console.warn('Wallet connection error:', error);
        }}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletContextProvider;