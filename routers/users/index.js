/**
 * Подключение библиотек
 */
const router = require('express').Router()

router.get('/',function(req,res){
    console.log(req.app)
    res.end()
})

/**
 * Экспортируем объект с параметрами:
 * path - Корневой каталог маршрута
 * router - Объект созданный с помощью express.Router()
 */
module.exports = { path: '/users', router: router} 