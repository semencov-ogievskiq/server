/**
 * Router chats API
 */
const router = require('express').Router()
const passport = require('passport')
const { query, body, param, validationResult } = require('express-validator')

router.get('/', passport.authenticate('jwt',{session: false}), [
    query('page').trim().exists({checkFalsy:true,checkNull:true}).toInt().isInt(),
    query('perPage').trim().exists({checkFalsy:true,checkNull:true}).toInt().isInt(),
    query('sortBy').trim().isString(),
    query('sortDesc').trim().toBoolean(),
    query('filter').trim().exists({checkFalsy:true,checkNull:true}).isString()
],async function(req,res){
    if( !validationResult( req ).isEmpty() ){
        res.status( 400 ).json( validationResult( req ) )
    }else{
        try{
            // Фильтр запроса
            let filter = JSON.parse(req.query.filter)
            // Сортировка
            let orderBy
            if( req.query.sortBy ){
                orderBy = " ORDER BY " + req.query.sortBy + " " + (( req.query.sortDesc )? "DESC" : "ASC")
            }

            // Пагинация
            let limit = (+req.query.page-1)*req.query.perPage + ',' + (+req.query.perPage)

            // Запрос на список чатов в которых состоит пользователь
            var [ list_chats ] = await mysql.execute( "SELECT * FROM list_chats WHERE client=? " + orderBy + " LIMIT " + limit, [req.user.id_user])

            // Запрашиваем списки пользователей этих чатов
            for( var i = 0; i < list_chats.length; i++ ){
                var [ users ] = await mysql.execute( "SELECT * FROM list_chat_users WHERE id_chat=?", [list_chats[i].id])
                list_chats[i].users = users
            }

            // Запрос общего колличество записей
            var [ count ] = await mysql.execute( "SELECT COUNT(*) count FROM list_chats WHERE client=? " + orderBy, [req.user.id_user])

            // Формируем ответ на запрос
            var data = {
                count: count[0]['count'],
                result: list_chats
            }

            res.status(200).json(data)
        }catch( err ){
            console.log(err)
            res.status(400).json( err )
        }
    }
})

/**
 * Запрос на добавление нового чата
 */
router.post('/', passport.authenticate('jwt',{session: false}), [
    body('type').trim().exists({checkFalsy:true,checkNull:true}).isString(),     // Тип чата ( 1 - обычный, 2 - груповой)
    body('name').trim().isString(),                                              // Название чата
    body('description').trim().isString()                                        // Описание
],async function(req,res){
    if( !validationResult( req ).isEmpty() ){
        res.status( 400 ).json( validationResult( req ) )
    }else{
        try{
            
            res.status(200).end()
            
        }catch( err ){
            console.log(err.message)
            res.status(400).json( err.message )
        }
    }
})

router.route('/:id')
    .all(passport.authenticate('jwt',{session: false}))
    .all([
        param('id').exists({checkFalsy:true,checkNull:true}).trim().isInt()
    ],async function(req, res,next){
        if(!validationResult(req).isEmpty()){
            res.status(404).end()
        }else{
            try{
                // Проверяем существование чата у текущего пользователя
                var [ chat ] = await mysql.execute( "SELECT * FROM list_chats WHERE id=? and client=?", [req.params.id,req.user.id_user])
                if( chat.length < 1 ) throw new Error('Чат с индентификатором ' + req.params.id + ' не существует')
                next()

            }catch( err ){
                console.log(err.message)
                res.status(400).json( err.message )
            }
        }
    })
    /**
     * Запрос возвращает данные о чате и о его пользователях
     */
    .get(async function(req,res){
        try{
            var [ chat ] = await mysql.execute( "SELECT * FROM list_chats WHERE id=? and client=?", [req.params.id, req.user.id_user])
            data = chat[0]
            
            var [ users ] = await mysql.execute( "SELECT * FROM list_chat_users WHERE id_chat=?", [req.params.id])
            data.users = users

            res.json(data)
        }catch( err ){
            console.log(err)
            res.status(400).json( err )
        }
    })

module.exports = router