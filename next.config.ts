import buildAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  output: 'export',
  productionBrowserSourceMaps: false,
  trailingSlash: true,
};

export default buildAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
})(nextConfig);
