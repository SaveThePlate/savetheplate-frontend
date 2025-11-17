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

    // Add a Content Security Policy in report-only mode to start collecting
    // violations without breaking the site. Tune the policy and switch to
    // enforced `Content-Security-Policy` once verified.
    async headers() {
        const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://leftover-be.ccdev.space').replace(/\/$/, '');

        // A reasonably strict starting policy. We're using Report-Only so we
        // can observe violations first. Adjust sources as needed for external
        // CDNs, analytics, or map providers.
        const csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
            "style-src 'self' 'unsafe-inline' https:",
            "img-src 'self' data: blob: https:",
            `connect-src 'self' ${backendUrl} http://localhost:*/ https: ws: wss:`,
            "font-src 'self' data: https:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join('; ');

        return [
            {
                // apply to all routes
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy-Report-Only',
                        value: csp,
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
