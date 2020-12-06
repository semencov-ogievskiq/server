/**
 * Подключение библиотек
 */
const router = require('express').Router()

router.use('/groups', require('./groups'))

router.use('/sessions', require('./sessions'))

router.use('/', require('./users'))

/**
 * Экспортируем объект с параметрами:
 * path - Корневой каталог маршрута
 * router - Объект созданный с помощью express.Router()
 */
module.exports = { path: '/users', router: router}  