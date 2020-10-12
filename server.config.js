/**
 * Конфигурация сервера
 */
module.exports = {
    port: 81,
    /**
     * Настройка идентификации.
     * Для настройки читайте документацию jsonwebtoken и passport_jwt
     */
    identification: {
        jwt_options: {
            issuer: 'server',
        },
        secret: 'secret'
    },
    
    jwt: {
        secretOrKey: "server_jwt_secret"
    },
    db: {
        mysql: {
            connectionLimit: 10,
            host: 'localhost',
            user: 'root',
            password: 'bebesh7291',
            database: 'server'
        }
    }
}