/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  productionBrowserSourceMaps: true,
  images: {
    remotePatterns: [{
      protocol: "https",
      hostname: "*", // Allow images from all domains
    },]
  },
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
