const router = module.exports = require('express').Router()
const f = require('./function')
const { query, body, param, validationResult } = require('express-validator')
const passport = require('passport')
const moment = require('moment')

/**
 * Список пользователей
 */
router.get('/', passport.authenticate('jwt',{session: false}),[
    query('page').exists({checkFalsy:true,checkNull:true}).trim().isInt(),
    query('perPage').exists({checkFalsy:true,checkNull:true}).trim().isInt(),
    query('filter').exists({checkFalsy:true,checkNull:true}).isJSON()
], async function(req,res){
    if(!validationResult(req).isEmpty()){
        // Если валидация вернула false, отправляем ответ с ошибкой
        res.json(validationResult(req))
    }else{
        try{
            let filter = JSON.parse( req.query.filter )
            // Строка выборки sql
            let where = []
            let orderBy = ""
            
            if( filter.mail ){
                where.push( " users.mail LIKE '%" + filter.mail + "%'" )
            }
            if( filter.f ){
                where.push( " users.f LIKE '%" + filter.f + "%'" )
            }
            if( filter.i ){
                where.push( " users.i LIKE '%" + filter.i + "%'" )
            }
            if( filter.o ){
                where.push( " users.o LIKE '%" + filter.o + "%'" )
            }
            if( filter.dt_birth_from ){
                where.push( " users.dt_birth >= STR_TO_DATE('" + filter.dt_birth_from + "', '%d.%m.%Y') " )
            }
            if( filter.dt_birth_to ){
                where.push( " users.dt_birth <= STR_TO_DATE('" + filter.dt_birth_to + "', '%d.%m.%Y') " )
            }
            if( filter.groups instanceof Array && filter.groups.length > 0 ){
                for( var group of filter.groups ){
                    where.push( " users.groups LIKE '%" + group + "%' " )
                }
            }
            if( req.query.sortBy ){
                orderBy = " " + req.query.sortBy + " " + (( req.query.sortDesc == "true" )? "DESC" : "ASC")
            }        

            // Запрашиваем список пользователей
            const data = await f.getUsers( where.join( ' and ' ), (+req.query.page-1)*req.query.perPage + ',' + (+req.query.perPage), orderBy )

            for( var index in data.users ){
                var sockets = req.app.io.clients[data.users[index].id]
                data.users[index].status = ( sockets && sockets.length>0 )? true: false
            }

            res.json( data )
        }catch( err ){
            console.log(err)
            res.status(400).send( err )
        }        
    }
})

/**
 * Регистрация нового пользователя
 */
router.post('/addUser', passport.authenticate('jwt',{session: false}),[
    body("mail").exists({checkFalsy:true,checkNull:true}).trim().isEmail(),
    body("password").exists({checkFalsy:true,checkNull:true}).trim().isString().custom( (value,{req})=>{ if( value==req.body.repeatPassword ) return value; else throw new Error("Passwords dont match");}),
    body("f").exists({checkFalsy:true,checkNull:true}).trim().isString(),
    body("i").exists({checkFalsy:true,checkNull:true}).trim().isString(),
    body("o").trim().isString(),
    body("dt_birth").exists({checkFalsy:true,checkNull:true}).trim().isString(),
    body("groups").isArray()
], async function(req,res){
    if(!validationResult(req).isEmpty() || !moment(req.body.dt_birth, 'DD.MM.YYYY').isValid()){
        res.status(400).json({
            err: validationResult(req)
        })
    }else{       
        try{
            let idUser = await f.addUser( req.body )
            
            req.app.io.emit( 'addUser', idUser )
            res.status(200).json({id: idUser})
        }catch( err ){   
            res.status(400).json({
                err: err
            })
        }
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
    })
    // Редактирование данных пользователя
    .put([
            body("f").exists({checkFalsy:true,checkNull:true}).trim().isString(),
            body("i").exists({checkFalsy:true,checkNull:true}).trim().isString(),
            body("o").trim().isString(),
            body("dt_birth").exists({checkFalsy:true,checkNull:true}).trim().isString(),
            body("groups").isArray()
        ], async function(req,res){
            if(!validationResult(req).isEmpty() || !moment(req.body.dt_birth, 'DD.MM.YYYY').isValid()){
                res.status(400).json({
                    err: validationResult(req)
                })
            }else{
                let data = {
                    f: req.body.f,
                    i: req.body.i,
                    o: req.body.o,
                    dt_birth: req.body.dt_birth,
                    groups: req.body.groups
                }
                
                try{
                    await f.editUser( data, req.params.id)
                    req.app.io.emit( 'changedUser', req.params.id )
                    res.status(200).json({})

                }catch( err ){
                    res.status(400).json({
                        err: err
                    })
                }
            }
        }
    )