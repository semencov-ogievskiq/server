// --------------------------------------------------
// Маршрутизатор администрирования сайта.
// --------------------------------------------------

// --------------------------------------------------
// Подключение библиотек и внешних модулей
// --------------------------------------------------
const router = require('express').Router()
const passport = require('passport')
const { body, validationResult } = require('express-validator')

router.route('/signIn')
    .get(function(req, res){
        res.render('signIn',{ title: "Авторизация" })
    })
    .post(
        [
            body('email').exists({checkFalsy:true,checkNull:true}).trim().isEmail(),
            body('password').exists({checkFalsy:true,checkNull:true}).trim().isString()
        ],async function(req, res){
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
        }
    )


router.get('/', passport.authenticate('jwt', { failureRedirect: '/admin/signIn' }), function(req,res){
    res.send('test')
})

/**
 * Экспортируем объект с параметрами:
 * path - Корневой каталог маршрута
 * router - Объект созданный с помощью express.Router()
 */
module.exports = { path: '/admin', router: router}  