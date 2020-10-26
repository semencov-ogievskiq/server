/**
 * Подключение библиотек
 */
const router = require('express').Router()
const { query, body, param, validationResult } = require('express-validator')
const passport = require('passport')
const f = require("./functions") // Набор функций для взаимодействия с данными пользователей

/**
 * Список пользователей
 */
router.get('/', passport.authenticate('jwt',{session: false}),[
    query('page').exists({checkFalsy:true,checkNull:true}).trim().isInt(),
    query('perPage').exists({checkFalsy:true,checkNull:true}).trim().isInt(),
], async function(req,res){
    if(!validationResult(req).isEmpty()){
        // Если валидация вернула false, отправляем ответ с ошибкой
        res.json([])
    }else{
        // Запрашиваем список пользователей
        const data = await f.getUsers(req.query.page,req.query.perPage)
        res.json(data)
    }
})

/**
 * Список групп пользователей
 */
router.get('/groups',[
    query('page').trim().toInt(),
    query('perPage').trim().toInt(),
], async function(req,res){
    if(!validationResult(req).isEmpty()){
        // Если валидация вернула false, отправляем ответ с ошибкой
        res.json({})
    }else{
        //Запрашиваем список пользователей
        const data = await f.getGroups(req.query.page,req.query.perPage)
        res.json(data)
    }
})

/**
 * Маршруты пользователя
 */
router.route('/:id')
    // Только для авторизованных пользователей
    .all(passport.authenticate('jwt',{session: false}))
    // Валидация индентификация пользователя
    .all([
        param('id').exists({checkFalsy:true,checkNull:true}).trim().isInt()
    ],function(req, res,next){
        if(!validationResult(req).isEmpty()){
            res.status(404).end()
        }else{
            next()
        }
    })
    // Запрос данных пользователя
    .get(async function(req,res){
        let data =  {user:null}
        data.user = await f.getUser(req.params.id)
        if(data.user){
            res.json(data)
        }else{
            res.status(404).end()
        }
    });
    // Редактирование данных пользователя
    // .put(function(req,res){})


/**
 * Экспортируем объект с параметрами:
 * path - Корневой каталог маршрута
 * router - Объект созданный с помощью express.Router()
 */
module.exports = router