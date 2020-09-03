/**
 * Подключение библиотек
 */
const router = require('express').Router()
const Router = require('express').Router;

router.get('/',function(req,res){
    res.send('test')
    console.log(typeof router == 'function')
    //console.log(fs)
    
    //console.log(req.app.db)
    // var con = req.app.db.mysql
    // console.log(await con.query('SELECT 1'));
    // console.log(req.ip)
    // console.log(req.method)
    // console.log(req.path)
    // console.log(req.protocol)
    // console.log(req.useragent)
    // console.log(req.app)
    res.end()
})

/**
 * Экспортируем объект с параметрами:
 * path - Корневой каталог маршрута
 * router - Объект созданный с помощью express.Router()
 */
module.exports = { path: '/', router: router}  