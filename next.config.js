/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  },
  // Amplify에서 정적 내보내기를 위한 설정
  trailingSlash: true,
  distDir: 'out',
  assetPrefix: '',
  basePath: '',
  skipTrailingSlashRedirect: false,
  generateEtags: true,
  poweredByHeader: false,
  compress: true,
  cleanDistDir: true,
  swcMinify: true
}

module.exports = nextConfig 