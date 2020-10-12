/**
 * Подключение библиотек
 */
const router = require('express').Router()
const { query, body, validationResult } = require('express-validator')
const passport = require('passport')

/**
 * Список пользователей
 */
router.get('/', passport.authenticate('jwt',{session: false}), async function(req,res){
    let [users] = await mysql.query('SELECT id, f, i, o, mail, dt_birth FROM users')
    res.json(users)
})

/**
 * Экспортируем объект с параметрами:
 * path - Корневой каталог маршрута
 * router - Объект созданный с помощью express.Router()
 */
module.exports = { path: '/users', router: router} 