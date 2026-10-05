import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SANCTUM_API_BASE = 'https://sanctum-api.ironforge.network';

const ALLOWED_PATHS = [
  '/lsts',
  '/swap/token/order',
  '/swap/token/execute',
  '/validators/apy'
];

const ALLOWED_METHODS: Record<string, string[]> = {
  '/lsts': ['GET'],
  '/swap/token/order': ['GET'],
  '/swap/token/execute': ['POST'],
  '/validators/apy': ['GET']
};

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'POST');
}

async function handleRequest(
  request: NextRequest,
  { path }: { path: string[] },
  method: string
) {
  const apiKey = process.env.SANCTUM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'SANCTUM_API_KEY is not configured on the server. Please set it in your environment variables.' },
      { status: 500 }
    );
  }

  const pathString = `/${path.join('/')}`;

  if (!ALLOWED_PATHS.includes(pathString)) {
    return NextResponse.json(
      { error: `Path not allowed: ${pathString}` },
      { status: 403 }
    );
  }

  const allowedMethods = ALLOWED_METHODS[pathString] || [];
  if (!allowedMethods.includes(method)) {
    return NextResponse.json(
      { error: `Method ${method} not allowed for ${pathString}` },
      { status: 405 }
    );
  }

  try {
    const url = new URL(`${SANCTUM_API_BASE}${pathString}`);
    
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
    
    url.searchParams.set('apiKey', apiKey);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    let body: string | undefined;
    if (method === 'POST') {
      try {
        const requestBody = await request.json();
        body = JSON.stringify(requestBody);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid JSON body' },
          { status: 400 }
        );
      }
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body,
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Sanctum API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request to Sanctum API' },
      { status: 500 }
    );
  }
}
