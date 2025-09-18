'use client';

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  Coin98WalletAdapter,
  MathWalletAdapter,
} from '@solana/wallet-adapter-wallets';
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

  // RPC endpoint - use premium endpoint from environment variables
  const endpoint = useMemo(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    return rpcUrl || clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(
    () => {
      const walletAdapters = [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter({ network }),
        // Exclude Torus adapter as it might be including MetaMask detection
        // new TorusWalletAdapter(),
        new LedgerWalletAdapter(),
        new Coin98WalletAdapter(),
        new MathWalletAdapter(),
        // BackpackWalletAdapter is temporarily disabled as mentioned in the master prompt
        // new BackpackWalletAdapter(),
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