const { query, body, param, validationResult } = require('express-validator')
const passport = require('passport')

module.exports = router = require('express').Router()

router.route( '/' )
    // Только для авторизованных пользователей
    .all( passport.authenticate( 'jwt', { session: false } ) )
    .get( async ( req, res ) => {
        res.status(200).json( await dbAPI.getUsers() )
    } )

router.route( '/:id_user/friends' )
    // Только для авторизованных пользователей
    // .all( passport.authenticate( 'jwt', { session: false } ) )
    // Валидация индентификация пользователя
    .all([
        param('id_user').exists({checkFalsy:true,checkNull:true}).trim().isInt()
    ],async function(req, res,next){
        if( !validationResult(req).isEmpty() || await dbAPI.getUser(req.param.id_user) ){
            res.status(404).end()
        }else{
            next()
        }
    })
    .get( async function(req,res){
        try{
            let data = await dbAPI.getUserFriends( req.params.id_user )
            
            res.status(200).json( data )
        }catch(err){
            console.log(err.message)
            res.status(400).json( err.message )
        }
    })

router.route( '/:id_user/friendsByCondition' )
    // Только для авторизованных пользователей
    // .all( passport.authenticate( 'jwt', { session: false } ) )
    // Валидация индентификация пользователя
    .all([
        param('id_user').exists({checkFalsy:true,checkNull:true}).trim().isInt(),
        query('page').trim().exists({checkFalsy:true,checkNull:true}).toInt().isInt(),
        query('perPage').trim().exists({checkFalsy:true,checkNull:true}).toInt().isInt(),
        query('sortBy').trim().isString(),
        query('sortDesc').trim().toBoolean(),
        query('filter').trim().exists({checkFalsy:true,checkNull:true}).isString()
    ],async function(req, res,next){
        if( !validationResult(req).isEmpty() || await dbAPI.getUser(req.param.id_user) ){
            res.status(400).end( validationResult( req ) )
        }else{
            next()
        }
    })
    .get( async function(req,res){
        try{
            // Фильтр запроса
            let filter = JSON.parse(req.query.filter)
            // Сортировка
            let order
            if( req.query.sortBy ){
                order = req.query.sortBy + " " + (( req.query.sortDesc )? "DESC" : "ASC")
            }

            // Пагинация
            let limit = (+req.query.page-1)*req.query.perPage + ',' + (+req.query.perPage)

            let  friends  = await dbAPI.friendsByCondition( req.param.id_user )
            console.log( friends )


            // // Запрос на список чатов в которых состоит пользователь
            // var [ list_chats ] = await mysql.execute( "SELECT * FROM list_chats WHERE client=? " + orderBy + " LIMIT " + limit, [req.user.id_user])

            // // Запрашиваем списки пользователей этих чатов
            // for( var i = 0; i < list_chats.length; i++ ){
            //     var [ users ] = await mysql.execute( "SELECT * FROM list_chat_users WHERE id_chat=?", [list_chats[i].id])
            //     list_chats[i].users = users
            // }

            // // Запрос общего колличество записей
            // var [ count ] = await mysql.execute( "SELECT COUNT(*) count FROM list_chats WHERE client=? " + orderBy, [req.user.id_user])

            // // Формируем ответ на запрос
            // var data = {
            //     count: count[0]['count'],
            //     result: list_chats
            // }

            res.status(200).json(data)
        }catch(err){
            console.log(err.message)
            res.status(400).json( err.message )
        }
    })

router.route( '/:id_user' )
    // Только для авторизованных пользователей
    // .all( passport.authenticate( 'jwt', { session: false } ) )
    // Валидация индентификация пользователя
    .all([
        param('id_user').exists({checkFalsy:true,checkNull:true}).trim().isInt()
    ],async function(req, res,next){
        if( !validationResult(req).isEmpty() || await dbAPI.getUser(req.param.id_user) ){
            res.status(404).end()
        }else{
            next()
        }
    })
    .get( async function(req,res){
        try{
            let data = await dbAPI.getUser( req.params.id_user )
            data.id_avatar = await dbAPI.getUserAvatar( req.params.id_user )
            if( !data ) throw new Error('Пользователь не найден')
            res.status(200).json( data )
        }catch{
            console.log(err.message)
            res.status(400).json( err.message )
        }
    })