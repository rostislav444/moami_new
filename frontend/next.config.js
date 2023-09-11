const { i18n } = require('./next-i18next.config.js')

module.exports = {
    reactStrictMode: true,
    images: {
        domains: ['localhost', '0.0.0.0', 'moami.com.ua'],
    },
    i18n,
};

