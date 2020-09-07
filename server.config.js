/**
 * Конфигурация сервера
 */
module.exports = {
    port: 80,
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