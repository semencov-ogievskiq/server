/**
 * Подключение библиотек
 */
const router = require('express').Router()
const moment = require('moment')

/**
 * Маршрут регистрации пользователя
 */
router.get('/signUp',function(req,res){
    console.log(moment(req.query.dt_birth, "DD.MM.YYYY").isValid())
    console.log(v.isDate(req.query.dt_birth))
    // проверяем что прешли обязательные поля
    console.log(req.query)
    res.end()
})

/**
 * Экспортируем объект с параметрами:
 * path - Корневой каталог маршрута
 * router - Объект созданный с помощью express.Router()
 */
module.exports = { path: '/', router: router} 