/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "style-src-elem 'self' 'unsafe-inline'",
              "connect-src 'self' https://fullnode.mainnet.sui.io/ https://fullnode.testnet.sui.io/ https://fullnode.devnet.sui.io/",
              "font-src 'self'",
              "img-src 'self' data: https:",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'"
            ].join('; ')
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig 