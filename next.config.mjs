/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    images: {
        domains: ['localhost', 'leftover-be.ccdev.space'], 
      },
};

export default nextConfig;
