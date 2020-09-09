// --------------------------------------------------
// Подключение библиотек
// --------------------------------------------------
const passportJWT = require('passport-jwt')
const ExtractJwt = passportJWT.ExtractJwt
const JwtStrategy = passportJWT.Strategy
const config = require('../server.config')

/**
 * Указываем что токен нужно искать в заголовке Authorization с типом Bearer 
 */
config.jwt.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()

/**
 * Объявлем стратегию и экспортируем
 */
module.exports = new JwtStrategy(config.jwt, async function(jwt_payload, next){
    // jwt_payload должен хранить id сессии пользователя
    if(!jwt_payload.id){
        // если в токене нет id сессии выдаем ошибку
        next(null,false)
    }else{
        // если в токене есть id сессии запрашиваем ее и проверяем токен
        //let  [session] 
    }
})