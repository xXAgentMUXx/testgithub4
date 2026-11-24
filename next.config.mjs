/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/testgitub4',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
