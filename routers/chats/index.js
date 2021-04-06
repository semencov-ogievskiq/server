/**
 * Подключение библиотек
 */
const router = require('express').Router()

// Запросы к данным чатов
router.use('/', require('./chats'))

// Запросы к данным сообщений чатов
router.use('/messages', require('./messages'))

/**
 * Экспортируем объект с параметрами:
 * path - Корневой каталог маршрута
 * router - Объект созданный с помощью express.Router()
 */
module.exports = { path: '/chats', router: router}  