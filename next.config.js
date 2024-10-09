/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  productionBrowserSourceMaps: true,
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
    };
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/i,
      use: { loader: 'worker-loader', options: { inline: true } },
    });
    return config;
  },
}

module.exports = nextConfig
