/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: [
      'raw.githubusercontent.com',
      'cdn.jsdelivr.net',
      'arweave.net',
      'shdw-drive.genesysgo.net',
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Solana Web3.js polyfills for browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: 'crypto-browserify',
        stream: 'stream-browserify',
        assert: 'assert',
        http: 'stream-http',
        https: 'https-browserify',
        os: 'os-browserify/browser',
        url: 'url',
        zlib: 'browserify-zlib',
        // Exclude pino-pretty from client bundle (Node.js only)
        'pino-pretty': false,
      };
    }

    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    return config;
  },
}

export default nextConfig
