import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: { unoptimized: true },
  reactCompiler: true,
  reactStrictMode: true,
  poweredByHeader: false,
  agentRules: false,
  allowedDevOrigins: ['127.0.0.1'],
}

export default nextConfig
