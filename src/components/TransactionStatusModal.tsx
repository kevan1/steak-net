'use client';

import React from 'react';
import { TransactionStatus } from '@/src/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactionStatus: TransactionStatus;
  fromToken?: string;
  toToken?: string;
  amount?: string;
}

const TransactionStatusModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  transactionStatus, 
  fromToken = '',
  toToken = '',
  amount = ''
}) => {
  if (!isOpen) {
    return null;
  }

  const getStatusIcon = () => {
    switch (transactionStatus.status) {
      case 'preparing':
        return <div className="loading-spinner w-8 h-8"></div>;
      case 'signing':
        return <div className="text-4xl">✋</div>;
      case 'sending':
        return <div className="loading-spinner w-8 h-8"></div>;
      case 'confirming':
        return <div className="loading-spinner w-8 h-8"></div>;
      case 'success':
        return <div className="text-4xl text-green-400">✅</div>;
      case 'error':
        return <div className="text-4xl text-red-500">❌</div>;
      default:
        return null;
    }
  };

  const getStatusTitle = () => {
    switch (transactionStatus.status) {
      case 'preparing':
        return 'Preparing Swap...';
      case 'signing':
        return 'Sign Transaction';
      case 'sending':
        return 'Broadcasting Transaction...';
      case 'confirming':
        return 'Confirming Transaction...';
      case 'success':
        return 'Swap Successful! 🎉';
      case 'error':
        return 'Swap Failed';
      default:
        return 'Processing...';
    }
  };

  const getStatusMessage = () => {
    switch (transactionStatus.status) {
      case 'preparing':
        return 'Getting quote and building transaction...';
      case 'signing':
        return 'Please sign the transaction in your wallet to continue';
      case 'sending':
        return 'Broadcasting your swap to the Solana network...';
      case 'confirming':
        return 'Waiting for network confirmation...';
      case 'success':
        return `Successfully swapped ${amount} ${fromToken} to ${toToken}!`;
      case 'error':
        return transactionStatus.error || 'An unexpected error occurred';
      default:
        return '';
    }
  };

  const canClose = transactionStatus.status === 'success' || transactionStatus.status === 'error';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="glass-card p-8 max-w-md w-full text-center">
        {/* Status Icon */}
        <div className="mb-6 flex justify-center">
          {getStatusIcon()}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-4">
          {getStatusTitle()}
        </h2>

        {/* Message */}
        <p className="text-gray-300 mb-6">
          {getStatusMessage()}
        </p>

        {/* Transaction Details */}
        {amount && fromToken && toToken && (
          <div className="bg-sub-card p-4 rounded-lg mb-6">
            <div className="text-sm text-gray-400 mb-2">Swap Details</div>
            <div className="text-white font-medium">
              {amount} {fromToken} → {toToken}
            </div>
          </div>
        )}

        {/* Transaction Signature */}
        {transactionStatus.signature && (
          <div className="bg-input-card p-4 rounded-lg mb-6">
            <div className="text-sm text-gray-400 mb-2">Transaction</div>
            <div className="text-xs font-mono text-white break-all">
              {transactionStatus.signature}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          {transactionStatus.explorerUrl && (
            <a
              href={transactionStatus.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-4 py-2 rounded-lg"
            >
              View on Explorer
            </a>
          )}
          
          {canClose && (
            <button
              onClick={onClose}
              className="btn-primary px-6 py-2 rounded-lg"
            >
              {transactionStatus.status === 'success' ? 'Done' : 'Close'}
            </button>
          )}
        </div>

        {/* Loading states info */}
        {(transactionStatus.status === 'signing') && (
          <div className="mt-4 text-xs text-gray-400">
            Check your wallet for the signature request
          </div>
        )}

        {(transactionStatus.status === 'confirming') && (
          <div className="mt-4 text-xs text-gray-400">
            This usually takes 10-30 seconds
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionStatusModal;