/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    images: {
        // Use remotePatterns (recommended) instead of the deprecated `domains`.
        // Allow backend storage URLs like http://localhost:/storage/... and
        // https://leftover-be.ccdev.space/storage/...
        remotePatterns: [
            { protocol: 'http', hostname: 'localhost', pathname: '/storage/**' },
            { protocol: 'https', hostname: 'leftover-be.ccdev.space', pathname: '/storage/**' },
        ],
      },
};

export default nextConfig;
