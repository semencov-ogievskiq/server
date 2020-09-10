/**
 * Подключение библиотек
 */
const router = require('express').Router()
const Router = require('express').Router;

router.get('/test',function(req,res){
    res.send('test2fdfds')
    res.end()
})

/**
 * Экспортируем объект с параметрами:
 * path - Корневой каталог маршрута
 * router - Объект созданный с помощью express.Router()
 */
module.exports = { path: '/', router: router}  