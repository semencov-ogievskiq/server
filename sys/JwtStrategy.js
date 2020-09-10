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
        let [ result ] = await mysql.query("SELECT * FROM sessions WHERE id=?",[jwt_payload.id])
        if(result.length==0){
            // если сессия не найдена возращаем ошибку
            next(null,false)
        }else{
            //если сессия найдена
            // ------------------------
            // тут проверяем что hash токена совпадает с тем что в базе

            // ------------------------
            let id_user = result[0].id_user
            // Запрашиваем данные о пользователе
            let [result] = await mysql.query("SELECT * FROM users WHERE id=?",[id_user])
            if(result.length==0){
                // если пользователь не найден возращаем ошибку
                next(null,false)
            }else{
                // если найден пользователь возвращаем его данные
                next(null, result[0])
            }
        }
    }
})