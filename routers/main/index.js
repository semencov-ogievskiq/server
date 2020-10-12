/**
 * Подключение библиотек
 */
const router = require('express').Router()
const moment = require('moment')
const { query, body, validationResult } = require('express-validator')
const crypto = require('crypto-js')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const config = require('../../server.config')



/**
 * Маршрут авторизации пользователя
 */
router.get('/clientData', passport.authenticate('jwt',{session: false}), async function(req,res){
    console.log(req.user)
    res.send('d')
})

/**
 * Маршрут регистрации пользователя
 */
router.get('/signUp',[
    query('mail').exists({checkFalsy:true,checkNull:true}).trim().isEmail(),
    query('password').exists({checkFalsy:true,checkNull:true}).trim().isString(),
    query('repeat_password').exists({checkFalsy:true,checkNull:true}).trim().isString().custom((value, { req })=> value === req.query.password ),
    query('f').exists({checkFalsy:true,checkNull:true}).trim().isString(),
    query('i').exists({checkFalsy:true,checkNull:true}).trim().isString(),
    query('o').optional({checkFalsy:true,checkNull:true}).trim().isString(),
    query('dt_birth').exists({checkFalsy:true,checkNull:true}).trim().isString()
],async function(req,res){
    // Проверяем валидацию данных
    if(!validationResult(req).isEmpty()){
        // Если валидация вернула false, отправляем ответ с ошибкой
        res.status(400).json({
            status: false,
            err: 'Required data is not provided or is in an incorrect format'
        })
    }else{
        // Если валидация вернула true
        // Создаем hesh пароля
        let hash_password = crypto.SHA512(req.query.password) 
        try{
            let [result] =  await mysql.query("INSERT INTO users(mail,hash_password,f,i,o, dt_birth) VALUES(?,?,?,?,?,STR_TO_DATE(?,'%d.%m.%Y'))",[
                req.query.mail, hash_password.toString(), req.query.f, req.query.i, req.query.o, req.query.dt_birth
            ])
            if(!result.insertId){
                // Если результат запроса не добавил запись, отправляем ответ с ошибкой
                res.status(400).json({
                    status: false,
                    err: 'User not registered please try again'
                })
            }else{
                // Если результат запроса добавил запись
                res.status(200).json({
                    status: true,
                    msg: 'User registered'
                })
            }
        }catch(err){
            // Если при выполнение запроса произошла ошибка
            res.status(400).json({
                status: false,
                err: 'Error MySQL: ' + err.code
            })
        }
    }
})

/**
 * Экспортируем объект с параметрами:
 * path - Корневой каталог маршрута
 * router - Объект созданный с помощью express.Router()
 */
module.exports = { path: '/', router: router} 