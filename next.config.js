/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  productionBrowserSourceMaps: true,
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
    };
    return config;
  },
}

module.exports = nextConfig
