import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ALLOWED_RPC_METHODS = [
  'getLatestBlockhash',
  'getBalance',
  'getTokenAccountsByOwner',
  'getParsedTokenAccountsByOwner',
  'getAccountInfo',
  'getMultipleAccounts',
  'sendTransaction',
  'sendRawTransaction',
  'simulateTransaction',
  'getSignatureStatuses',
  'getTransaction',
  'getBlockHeight',
  'getSlot',
  'getMinimumBalanceForRentExemption',
  'getFeeForMessage',
  'getRecentPrioritizationFees',
  'getEpochInfo',
  'getVersion',
  'getGenesisHash',
  'confirmTransaction'
];

function isOriginAllowed(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];

  if (host) {
    allowedOrigins.push(`https://${host}`);
    allowedOrigins.push(`http://${host}`);
  }

  if (!origin && !referer) {
    return false;
  }

  const requestOrigin = origin || (referer ? new URL(referer).origin : null);
  
  if (!requestOrigin) {
    return false;
  }

  return allowedOrigins.some(allowed => 
    requestOrigin === allowed || 
    requestOrigin.startsWith(allowed)
  );
}

function createJsonRpcError(id: any, code: number, message: string) {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message
    }
  };
}

export async function POST(request: NextRequest) {
  if (!isOriginAllowed(request)) {
    return NextResponse.json(
      createJsonRpcError(null, -32600, 'Origin not allowed'),
      { status: 403 }
    );
  }

  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

  let requestBody;
  try {
    requestBody = await request.json();
  } catch (e) {
    return NextResponse.json(
      createJsonRpcError(null, -32700, 'Parse error: Invalid JSON'),
      { status: 400 }
    );
  }

  const isBatch = Array.isArray(requestBody);
  const requests = isBatch ? requestBody : [requestBody];

  for (const req of requests) {
    if (!req.method || typeof req.method !== 'string') {
      return NextResponse.json(
        createJsonRpcError(req.id || null, -32600, 'Invalid Request: method is required'),
        { status: 400 }
      );
    }

    if (!ALLOWED_RPC_METHODS.includes(req.method)) {
      return NextResponse.json(
        createJsonRpcError(
          req.id || null,
          -32601,
          `Method not allowed: ${req.method}. This RPC proxy only allows: ${ALLOWED_RPC_METHODS.join(', ')}`
        ),
        { status: 403 }
      );
    }
  }

  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('RPC proxy error:', error);
    return NextResponse.json(
      createJsonRpcError(
        null,
        -32603,
        'Internal error: Failed to proxy request to Solana RPC'
      ),
      { status: 500 }
    );
  }
}
