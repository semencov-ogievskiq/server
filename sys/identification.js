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
const moment = require('moment')

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
                let user = await dbAPI.getUser(jwt_payload.aud)
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
            if( !socket.server.clients[user.id_user] ) socket.server.clients[user.id_user] = []
            socket.server.clients[user.id_user].push(socket.id)

            socket.server.emit('changedStateUser',user.id_user) // Сообщаем об изменение состояния подключения пользователя
            socket.on('disconnect', ()=>{
                socket.server.emit('changedStateUser',user.id_user) // Сообщаем об изменение состояния подключения пользователя
                
                var index = socket.server.clients[user.id_user].indexOf(socket.id)
                if( index != -1 ){
                    if( socket.server.clients[user.id_user].length > 1 ){
                        socket.server.clients[user.id_user].splice(index,1)
                    }else{
                        delete socket.server.clients[user.id_user]
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
 * Для облегчения проверки авторизации на клеенте, добавлены следующие типы ошибок - 
 * 1 - некоректные переданные данные,
 * 2 - пользователь не найден
 * 3 - не удалось открыть сессию
 * 4 - ошибка mysql
 */
router.post('/login', [
    body('username').exists({checkFalsy:true,checkNull:true}).trim().isEmail(),
    body('password').exists({checkFalsy:true,checkNull:true}).trim().isString(),
], async function(req, res){
    if(!validationResult(req).isEmpty()){
        res.status(400).json({
            status: false,
            typeErr: 1,
            err: 'Не корректно переданы данные'
        })
    }else{
        let hash_password = crypto.SHA512(req.body.password)
        var [row] = await mysql.query("SELECT id FROM users WHERE mail=? and hash_password=?",[req.body.username,hash_password.toString()])
        if(!row.length){
            res.status(400).json({
                status: false,
                typeErr: 2,
                err: 'Пользователь не найден'
            })
        }else{
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
                    res.status(400).json({
                        status: false,
                        typeErr: 3,
                        err: 'Не удалось открыть сессию'
                    })
                }else{
                    res.status(200).json({
                        status: true,
                        token: createToken( id_user , idSession )
                    })
                }
            }catch(err){
                res.status(400).json({
                    status: false,
                    typeErr: 4,
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
    try{
        res.status(200).json( {user: await dbAPI.getUser( req.user.id_user )} )
    }catch( err ){
        console.log(err)
        res.status(400).json( err )
    }
})

/**
 * Маршрут регистрации нового пользователя
 */
router.post('/registration',[
    body("mail").exists({checkFalsy:true,checkNull:true}).trim().isEmail(),
    body("password").exists({checkFalsy:true,checkNull:true}).trim().isString().custom( (value,{req})=>{ if( value==req.body.repeatPassword ) return value; else throw new Error("Passwords dont match");}),
    body("f").exists({checkFalsy:true,checkNull:true}).trim().isString(),
    body("i").exists({checkFalsy:true,checkNull:true}).trim().isString(),
    body("dt_birth").exists({checkFalsy:true,checkNull:true}).trim().isString()
], async function(req,res){
    if(!validationResult(req).isEmpty() || !moment(req.body.dt_birth, 'DD.MM.YYYY').isValid()){
        res.status(400).json({
            err: validationResult(req)
        })
    }else{       
        try{
            // var data = {
            //     mail: req.body.mail,
            //     password: req.body.password,
            //     repeatPassword: req.body.repeatPassword,
            //     f: req.body.f,
            //     i: req.body.i,
            //     dt_birth: req.body.dt_birth,
            //     groups: [3]
            // }
            // let idUser = await addUser( data )
            let idUser = await dbAPI.addUser( req.body.mail, req.body.password, req.body.f, req.body.i, req.body.dt_birth )

            if( !idUser ) throw new Error('Неудалось создать пользователя')
            
            req.app.io.emit( 'addUser', idUser )
            res.status(200).json({id: idUser})
        }catch( err ){   
            res.status(400).json({
                err: err.message
            })
        }
    }
})

module.exports = {
    router: router,             // Маршруты авторизации/идентитификации
    passport: passport,         // Настроенный passport.js
    identSocket: identSocket,   // Стратегия идентитификации sockrt.io
}