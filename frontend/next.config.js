// const path = require('path')
// const {parsed: localEnv} = require('dotenv-safe').config({
//     allowEmptyValues: false,
//     path: path.resolve(__dirname, `.env.local`),
// })


module.exports = {
    // env: localEnv,
    reactStrictMode: true,
    images: {
        domains: ['localhost', '0.0.0.0', 'moami.com.ua'],
    },
    i18n: {
        locales: [
            'uk',
            'ru',
            'en'
        ],
        defaultLocale: 'uk',
        localeDetection: false,
    }
};

