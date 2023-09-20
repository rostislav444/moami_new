const {i18n} = require('./next-i18next.config.js')

module.exports = {
    async rewrites() {
        return [
            {
                source: '/p-:slug',
                destination: '/product/:slug',
            },
        ]
    },

    reactStrictMode: true,
    images: {
        domains: ['localhost', '0.0.0.0', 'moami.com.ua'],
    },
    i18n,
};

