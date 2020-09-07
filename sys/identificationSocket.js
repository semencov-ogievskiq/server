/**
 * Модуль промежуточного обработчика, производящий идентификацию пользователя
 * при подключение к socket части сервера
 */

module.exports = function(socket, next){
    console.log(socket)
    next()
}