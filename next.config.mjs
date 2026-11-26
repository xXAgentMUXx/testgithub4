/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/testgithub4',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

