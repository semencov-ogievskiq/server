const router = module.exports = require('express').Router()
const f = require('./function')
const { query, body, param, validationResult } = require('express-validator')
const passport = require('passport')
const moment = require('moment')


/**
 * Список сессий
 */
router.get('/', passport.authenticate('jwt',{session: false}), [
    query('page').trim().exists({checkFalsy:true,checkNull:true}).toInt().isInt(),
    query('perPage').trim().exists({checkFalsy:true,checkNull:true}).toInt().isInt(),
    query('sortBy').trim().isString(),
    query('sortDesc').trim().toBoolean(),
    query('filter').trim().exists({checkFalsy:true,checkNull:true}).isString()
], async function(req,res){
    if( !validationResult( req ).isEmpty() ){
        res.status( 400 ).json( validationResult( req ) )
    }else{
        try{
            let where = []
            let orderBy = ""

            let filter = JSON.parse(req.query.filter)
            if( filter.mail ){
                where.push( " u.mail LIKE '%" + filter.mail + "%'" )
            }
            if( filter.iatFrom ){
                where.push( " s.iat >= STR_TO_DATE('" + filter.iatFrom + "', '%d.%m.%Y') " )
            }
            if( filter.iatTo ){
                where.push( " s.iat <= STR_TO_DATE('" + filter.iatTo + "', '%d.%m.%Y') " )
            }
            
            if( req.query.sortBy ){
                orderBy = " " + req.query.sortBy + " " + (( req.query.sortDesc )? "DESC" : "ASC")
            }

            let sessions = await f.getSessions( where.join( ' and ' ), (+req.query.page-1)*req.query.perPage + ',' + (+req.query.perPage), orderBy )

            res.json(sessions)
        }catch( err ){
            res.status(400).json( err )
        }
    }     
})