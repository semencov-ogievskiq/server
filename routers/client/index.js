/**
 * Подключение библиотек
 */
const router = require('express').Router()
const moment = require('moment')
const { query, validationResult } = require('express-validator')
const crypto = require('crypto-js')
const jwt = require('jsonwebtoken')
const config = require('../../server.config')

/**
 * Маршрут авторизации пользователя
 */
router.get('/signIn',[
    query('mail').exists({checkFalsy:true,checkNull:true}).trim().isEmail(),
    query('password').exists({checkFalsy:true,checkNull:true}).trim().isString(),
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
        let [row] = await mysql.query("SELECT id FROM users WHERE mail=? and hash_password=?",[req.query.mail,hash_password.toString()])
        if(row.length>0){
            // Если Пользователь найден
            try{
                // Добавляем новую сессию
                let [result] =  await mysql.query("INSERT INTO sessions(id_user) VALUES(?)",[row[0].id])
                let idSession = result.insertId
                if(!idSession){
                    // Если результат запроса не добавил запись, отправляем ответ с ошибкой
                    res.status(400).json({
                        status: false,
                        err: 'User not found'
                    })
                }else{
                    
                    // Если удалось добавить сессию 
                    // Формируем токен
                    let token = jwt.sign( { id: idSession }, config.jwt.secretOrKey)
                    // Формируем hash всего токена
                    let hash_token = crypto.SHA512(token).toString()
                    // Добавляем в сессию значение hash токена
                    let [result] =  await mysql.query("UPDATE sessions SET hash_jwt=? WHERE id=?",[ hash_token, idSession ])
                    if(result.affectedRows==0){
                        // Если не удалось записать hash_token
                        res.status(400).json({
                            status: false,
                            msg: 'User not found'
                        })
                    }else{
                        // Если удалось записать hash_token
                        res.status(200).json({
                            status: true,
                            msg: 'User found',
                            token: token
                        })
                    }
                }
            }catch(err){
                console.log(err)
                // Если при выполнение запроса произошла ошибка
                res.status(400).json({
                    status: false,
                    err: 'Error MySQL: ' + err.code
                })
            }
        }else{
            // Если пользователь не найден
            res.status(400).json({
                status: false,
                msg: 'User not found'
            })
        }
    }
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