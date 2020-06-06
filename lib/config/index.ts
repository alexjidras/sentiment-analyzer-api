export default {
    server: {
        port: process.env.PORT || 5000,
        key: process.env.KEY || 'some key',
        session: {
            key: 'sid'
        }
    },
    logger: {
        mode: process.env.NODE_ENV === 'development' ? 'dev' : 'tiny'
    },
    db: {
        uri: 'mongodb://heroku_t9lxrzdh:a1t7ns69d9g9ti5dc1h3g451oi@ds145486.mlab.com:45486/heroku_t9lxrzdh'
    }
}