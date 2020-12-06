/**
 * Модуль формирует набор методов и маршрутов, реализующих систему идентификации пользователя.
 */
const router = require('express').Router()

const jwt = require('jsonwebtoken')
const crypto = require('crypto-js')
const passport = require('passport')
const passportJWT = require('passport-jwt')
const ExtractJwt = passportJWT.ExtractJwt
const JwtStrategy = passportJWT.Strategy
const { body, validationResult } = require('express-validator')
const config = require('../server.config').identification
const { getUser } = require('../routers/users/functions')

/**
 * Функция проверки jwt_payload токена
 * 
 * @param {Object} jwt_payload 
 * @returns {(Object|Boolean)} Вернет либо объект с данными пользователя, либо false если ошибка 
 */
async function identification(jwt_payload){
    // Проверяем заполнение данных токена
    if(!jwt_payload.aud || !jwt_payload.jti){
        // Ошибка, токен не содержит требуемых данных
        return false
    }else{
        // если в токене есть id сессии запрашиваем ее и проверяем токен
        let [ session ] = await mysql.query("SELECT id_user FROM sessions WHERE id=? and CURRENT_TIMESTAMP() < exp",[jwt_payload.jti])
        if(session.length==0){
            // если сессия не найдена возращаем ошибку
            return false
        }else{
            session = session[0]
            // Проверяем что пользователь указанный в токене совпадает с пользователем которому выдавался токен
            if( jwt_payload.aud != session.id_user ){
                // Ошибка, пользователь в токене не соответствует пользователю которому выдавался токен
                return false
            }else{
                // Запрашиваем данные пользователя
                let user = await getUser(jwt_payload.aud)
                if(user){
                    return {...user, jti: jwt_payload.jti}
                }else{  
                    return false
                }
            }
        }
    }
}

// Стратегия проверки passport js
passport.use(
    new JwtStrategy(
        { 
            secretOrKey: config.secret, 
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            issuer: config.jwt_options.issuer
        },
        async function(jwt_payload, next){
            let user = await identification(jwt_payload)
            if(typeof user === "object"){
                next(null, user)
            }else{
                next(null, false)
            }
        }
    )
)

// Стратегия проверки socket.io
const identSocket = async function(socket, next){
    // Получаем токен переданный в query запроса
    const token = socket.handshake.query.token
    if(typeof token ==="string"){
        // Читаем токен и получаем jwt_payload токена
        let jwt_payload = jwt.verify(token, config.secret, config.jwt_options)
        
        let user = await identification(jwt_payload)
        if(typeof user === "object"){
            if( !socket.server.clients[user.id] ) socket.server.clients[user.id] = []
            socket.server.clients[user.id].push(socket.id)

            socket.server.emit('changedStateUser',user.id) // Сообщаем об изменение состояния подключения пользователя
            socket.on('disconnect', ()=>{
                socket.server.emit('changedStateUser',user.id) // Сообщаем об изменение состояния подключения пользователя
                
                var index = socket.server.clients[user.id].indexOf(socket.id)
                if( index != -1 ){
                    if( socket.server.clients[user.id].length > 1 ){
                        socket.server.clients[user.id].splice(index,1)
                    }else{
                        delete socket.server.clients[user.id]
                    } 
                }
            })
            next()
        }else{
            next(new Error("Unauthorized"))
            //console.log(socket)
            //socket.to(socket.id).emit('unauthorized')
            //socket.disconnect(true)
        }
    }else{ 
        next(new Error("Unauthorized"))
        //socket.to(socket.id).emit('unauthorized')
        //socket.disconnect(true) 
    }
}

// --------------------------------------------------
// Объявление методов модуля
// --------------------------------------------------

/**
 * Метод формирования токена.
 * 
 * @param {String} _audience Email пользователя в БД
 * @param {String} _jwtid Идентификатор токена в БД
 * @returns {String} Сформированный JWT
 */
const createToken = function(_audience, _jwtid){
    let options = { 
        ...config.jwt_options,
        audience: _audience,
        jwtid: _jwtid
    }
    return jwt.sign({},config.secret,options)
}

// --------------------------------------------------
// Объявление маршрутов модуля
// --------------------------------------------------

/**
 * Маршрут авторизации пользователя
 */
router.post('/login', [
    body('username').exists({checkFalsy:true,checkNull:true}).trim().isEmail(),
    body('password').exists({checkFalsy:true,checkNull:true}).trim().isString(),
], async function(req, res){
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
        let hash_password = crypto.SHA512(req.body.password)
        var [row] = await mysql.query("SELECT id FROM users WHERE mail=? and hash_password=?",[req.body.username,hash_password.toString()])
        if(!row.length){
            // Если пользователь не найден
            res.status(400).json({
                status: false,
                msg: 'User not found'
            })
        }else{
            // Если Пользователь найден
            // Получаем данные пользователя
            let id_user = row[0].id.toString()
            let browser = req.useragent.browser
            let os = req.useragent.os
            let platform = req.useragent.platform
            let ip = req.ip
            try{
                // Добавляем новую сессию
                let [result] =  await mysql.query(
                    "INSERT INTO sessions(id_user,browser,os,platform,ip,iat,exp) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP(), DATE_ADD(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR))",
                    [ id_user, browser, os, platform, ip ]
                )
                let idSession = result.insertId.toString()
                if(!idSession){
                    // Если результат запроса не добавил запись, отправляем ответ с ошибкой
                    res.status(400).json({
                        status: false,
                        err: 'Failed to create user session'
                    })
                }else{
                    // Если удалось добавить сессию 
                    res.status(200).json({
                        status: true,
                        msg: 'User found',
                        token: createToken( id_user , idSession )
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
    }
})

/**
 * Промежуточный обработчик продления сессии авторизованных пользователей
 */
router.use(async function(req, res, next){
    // Вызываем custom проверку авторизации
    await passport.authenticate('jwt',async function(err, user, info) {
        // Если появляеться ошибка отправляем ее
        if(err){ 
            return next(err) 
        }

        if(!user){ 
            // Если пользователь не авторизован, пропускаем
            return next() 
        }else{
            // Если пользователь авторизован продляем его сессиию от текущего момента на час
            await mysql.query("UPDATE sessions SET exp = DATE_ADD(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR) WHERE id=?",[ user.jti ])
            return next() 
        }
      })(req, res, next);
})

/**
 * Маршрут получения данных текущего пользователя
 * # Только для авторизованных пользователей
 */
router.get('/client', passport.authenticate('jwt',{session: false}), async function(req, res){
    res.json({user: req.user})
})

module.exports = {
    router: router,             // Маршруты авторизации/идентитификации
    passport: passport,         // Настроенный passport.js
    identSocket: identSocket,   // Стратегия идентитификации sockrt.io
}