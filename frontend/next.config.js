const {i18n} = require('./next-i18next.config.js')

module.exports = {
    async rewrites() {
        return [
            {
                source: '/p-:slug',
                destination: '/product/:slug',
            },
            {
                source: '/lp-:slug',
                destination: '/product_landing/:slug',
            },

        ]
    },

    reactStrictMode: true,
    images: {
        domains: ['localhost', '0.0.0.0', 'moami.com.ua'],
    },
    i18n,
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

