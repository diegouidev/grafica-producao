/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  
  eslint: {
    
    ignoreDuringBuilds: true,
  },
  typescript: {
    
    ignoreBuildErrors: true,
  },
  

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**', 
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**', 
      },
      {
        protocol: 'http',
        hostname: '92.112.176.145', 
        port: '',
        pathname: '/media/**', 
      },
    ],
  },
};

module.exports = nextConfig;