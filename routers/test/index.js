/**
 * Подключение библиотек
 */
const router = require('express').Router()
const {createToken} = require('../../sys/identification')

router.get('/',function(req,res){
    res.send(createToken('admin@mail.ru','1'))
})

/**
 * Экспортируем объект с параметрами:
 * path - Корневой каталог маршрута
 * router - Объект созданный с помощью express.Router()
 */
module.exports = { path: '/test', router: router}  