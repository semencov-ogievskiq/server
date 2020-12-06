const router = module.exports = require('express').Router()
const f = require('./function')
const { query, body, param, validationResult } = require('express-validator')
const passport = require('passport')


/**
 * Список групп пользователей
 */
router.get('/', passport.authenticate('jwt',{session: false}), [
    query('page').trim(),
    query('perPage').trim(),
    query('sortBy').trim(),
    query('sortDesc').trim()
], async function(req,res){
    try{
        if( req.query.page && typeof req.query.page != "string" ) throw new Error( "Параметр 'page' должен иметь тип 'string'" )
        if( req.query.perPage && typeof req.query.perPage != "string" ) throw new Error( "Параметр 'perPage' должен иметь тип 'string'" )
        if( req.query.sortBy && typeof req.query.sortBy != "string" ) throw new Error( "Параметр 'sortBy' должен иметь тип 'string'" )
        if( req.query.sortDesc && typeof req.query.sortDesc != "string" ) throw new Error( "Параметр 'sortDesc' должен иметь тип 'string'" )

        let limit = ""
        if( req.query.page && req.query.perPage ) limit = (+req.query.page-1)*req.query.perPage + ',' + (+req.query.perPage)

        let orderBy = ""            
        if( req.query.sortBy ){
            orderBy = " " + req.query.sortBy + " " + (( req.query.sortDesc == "true" )? "DESC" : "ASC")
        }        

        // Запрашиваем список пользователей
        const data = await f.getGroups( "", limit, orderBy )

        res.json( data )
    }catch( err ){
        console.log(err)
        res.status(400).send( err )
    }        
})

/**
 * Маршруты группы
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
    // Запрос данных группы
    .get(async function(req,res){
        let data =  {group:null}
        data.group = await f.getGroup(req.params.id)
        if(data.group){
            res.json(data)
        }else{
            res.status(404).end()
        }
    })
    // Редактирование данных группы
    .put([
            body("name").exists({checkFalsy:true,checkNull:true}).trim().isString(),
            body("description").trim().isString(),
        ], async function(req,res){
            if(!validationResult(req).isEmpty()){
                res.status(400).json({
                    err: validationResult(req)
                })
            }else{
                let data = {
                    name: req.body.name,
                    description: req.body.description
                }
                
                try{
                    await f.editGroup( data, req.params.id)
                    req.app.io.emit( 'changedGroup', req.params.id )
                    res.status(200).json({})

                }catch( err ){
                    res.status(400).json({
                        err: err
                    })
                }
            }
        }
    )