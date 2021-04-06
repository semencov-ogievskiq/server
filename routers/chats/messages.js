/**
 * Router messages API
 */
const router = require('express').Router()
const passport = require('passport')
const { query, body, param, validationResult } = require('express-validator')

/**
 * Запрос списка сообщений указанного чата
 */
router.get('/:id_chat', passport.authenticate('jwt',{session: false}), [
    param('id_chat').exists({checkFalsy:true,checkNull:true}).trim().isInt(),   // id чата
    query('last_id_message').trim().toInt(),                                    // ранее отпраленный последний id
    query('limit').trim().toInt(),                                              // ограничение по колличеству
],async function(req,res){
    if(!validationResult(req).isEmpty()){
        res.status(404).end()
    }else{
        try{
            // Проверяем существование чата 
            var [ chat ] = await mysql.execute( "SELECT id FROM chats WHERE id=?", [req.params.id_chat])
            if( chat.length < 1 ) throw new Error('Чат с индентификатором #' + req.query.id_chat + ' не существует')

            // Собираем условия
            let where = []
            let limit = ( req.query.limit )? 'LIMIT ' + req.query.limit : ''
            
            if( req.query.last_id ){
                where.push( 'id_message < ' + mysql.escape(req.query.last_id))
            }

            // Подготовка условия к вставки в запрос
            where = ( where.length > 0 )? ' and ' + where.join(' and ') : ''   

            // Запрашиваем сообщения чата
            var [ messages ] = await mysql.execute( "SELECT * FROM list_chat_messages WHERE  id_chat=? and client=? and deleted IS NULL " + where + limit, [req.params.id_chat,req.user.id_user] )

            // Отправляем ответ
            res.status(200).json( messages )
        }catch(err){
            res.status(400).json( err.message )
        }
    }
})

/**
 * Запрос на добавление сообщения
 */
router.post('/:id_chat', passport.authenticate('jwt',{session: false}), [
    param('id_chat').exists({checkFalsy:true,checkNull:true}).trim().isInt(),   // id чата
    body('body').trim().exists({checkFalsy:true,checkNull:true}).isString()     // тело сообщения
],async function(req,res){
    if( !validationResult( req ).isEmpty() ){
        res.status( 400 ).json( validationResult( req ) )
    }else{
        try{
            // Проверяем существование чата 
            var [ chat ] = await mysql.execute( "SELECT id FROM chats WHERE id=?", [req.params.id_chat])
            if( chat.length < 1 ) throw new Error('Чат с индентификатором ' + req.params.id_chat + ' не существует')

            var [ result ] = await mysql.query( "INSERT INTO user_messages(id_chat,id_user,body) VALUES(?,?,?)", [req.params.id_chat, req.user.id_user, req.body.body] )

            if(result.affectedRows != 1) throw new Error("Не удалось добавить сообщение")       
            
            let data = {
                id_chat: req.params.id_chat,
                id_message: result.insertId
            }
            // Запрашиваем id всех пользователей текущего чата
            var [ chatUsers ] = await mysql.query( "SELECT id_user FROM list_chat_users WHERE id_chat=?", [req.params.id_chat] )
            let clients = []
            for( let row of chatUsers){
                clients.push(row.id_user)
            }

            // Отправляем событие отправки сообщения 
            req.app.io.emitMany('sendMessage', clients, data)
            
            res.status(200).end()
            
        }catch( err ){
            console.log(err.message)
            res.status(400).json( err.message )
        }
    }
})

/**
 * Маршрутизация для манипуляции с определенными сообщениями
 */
router.route('/:id_chat/:id')
    .all(passport.authenticate('jwt',{session: false}))
    .all([
        param('id_chat').exists({checkFalsy:true,checkNull:true}).trim().isInt(),   // id чата
        param('id').exists({checkFalsy:true,checkNull:true}).trim().isInt(),        // id сообщения
    ],async function(req, res,next){
        if(!validationResult(req).isEmpty()){
            res.status(404).end()
        }else{
            try{
                // Проверяем существование чата и сообщения
                var [ message ] = await mysql.execute( "SELECT id_message FROM list_messages WHERE id_chat=? and id_message=?", [req.params.id_chat,req.params.id])
                if( message.length < 1 ) throw new Error('Сообщения с индентификатором ' + req.params.id + ' не существует')
                next()

            }catch( err ){
                console.log(err.message)
                res.status(400).json( err.message )
            }
        }
    })
    /**
     * Запрос получения сообщения по id
     */
    .get(async function(req,res){
        try{
            // Запрашиваем данные сообщения
            var [ message ] = await mysql.query( "SELECT * FROM list_messages WHERE id_message=?", [req.params.id] )
            message = message[0]
            
            res.status(200).json(message)
        }catch( err ){
            console.log(err.message)
            res.status(400).json( err.message )
        }
    })
    /**
     * Запрос на редактирование сообщения
     */
    .put([
            body('body').trim().exists({checkFalsy:true,checkNull:true}).isString()     // тело сообщения
        ],async function(req,res){
        try{
            var [ result ] = await mysql.query( "UPDATE user_messages SET body=?,dt_edited=CURRENT_TIMESTAMP, edited=1 WHERE id=?", [req.body.body, req.params.id] )

            if( result.affectedRows != 1 ) throw new Error( 'Ошибка при редактирование сообщения #' + req.params.id )

            let data = {
                id_chat: req.params.id_chat,
                id_message: req.params.id
            }

            // Запрашиваем id всех пользователей текущего чата
            var [ chatUsers ] = await mysql.query( "SELECT id_user FROM list_chat_users WHERE id_chat=?", [req.params.id_chat] )
            let clients = []
            for( let row of chatUsers){
                clients.push(row.id_user)
            }

            // Отправляем событие отправки сообщения 
            req.app.io.emitMany('editMessage', clients, data)
            
            res.status(200).end()
        }catch( err ){
            console.log(err.message)
            res.status(400).json( err.message )
        }
    })
    /**
     * Запрос на удаление сообщения
     */
    .delete(async function(req,res){
        try{
            var [ result ] = await mysql.query( "UPDATE user_messages SET dt_deleted=CURRENT_TIMESTAMP, deleted=1 WHERE id=?", [req.params.id] )
            if( result.affectedRows != 1 ) throw new Error( 'Ошибка при удаление сообщения #' + req.params.id )

            let data = {
                id_chat: req.params.id_chat,
                id_message: req.params.id
            }

            // Запрашиваем id всех пользователей текущего чата
            var [ chatUsers ] = await mysql.query( "SELECT id_user FROM list_chat_users WHERE id_chat=?", [req.params.id_chat] )
            let clients = []
            for( let row of chatUsers){
                clients.push(row.id_user)
            }

            // Отправляем событие отправки сообщения 
            req.app.io.emitMany('deleteMessage', clients, data)
            
            res.status(200).end()
        }catch( err ){
            console.log(err.message)
            res.status(400).json( err.message )
        }
    })

module.exports = router