/**
 * Подключение библиотек
 */
const router = require('express').Router()
const passport = require('passport')
const { query, body, param, validationResult } = require('express-validator')
const multer = require('multer')
const storage = require('multer').memoryStorage()
const upload = multer( { storage: storage } )

router.get('/:id', passport.authenticate('jwt',{session: false}), [
    param('id').exists({checkFalsy:true,checkNull:true}).trim().isInt(),   // id файла
], async function(req,res){
    if(!validationResult(req).isEmpty()){
        res.status(404).end()
    }else{
        try{
            // Получаем файл
            var [ file ] = await mysql.query( "SELECT * FROM user_files WHERE id=?", [req.params.id] )
            
            if( file.length > 0 ){
                file = file[0]
                // Готовим заголовки и отправляем файл
                res.set('Content-Description','File Transfer')
                res.type(file.mimetype)
                res.set('Content-Disposition','attachment; filename='+file.filename)
                res.set('Content-Transfer-Encoding', file.encoding)
                res.set('Content-Length', file.size)
                res.send(file.buffer)
            }else{
                throw new Error('Файл не найден')
            }
        }catch( err ){
            console.log(err.message)
            res.status(400).json( err.message )
        }
    }
})

router.post('/upload', passport.authenticate('jwt',{session: false}), upload.array('file'), [
    body('type').exists({checkFalsy:true,checkNull:true}).trim().isInt(),   // Тип загружаемого файла
], async function(req,res){
    if(!validationResult(req).isEmpty()){
        res.status(404).end()
    }else{
        try{
            if( req.files.length > 0){
                for( let file of req.files ){
                    var [ result ] = await mysql.query( "INSERT INTO user_files SET ?", {
                        id_user: req.user.id_user,
                        type: req.body.type,
                        filename: file.originalname,
                        encoding: file.encoding,
                        mimetype: file.mimetype,
                        buffer: file.buffer,
                        size: file.size
                    } )
                    
                    if( result.affectedRows != 1 ) throw new Error( 'Ошибка при добавление файла' )
                }
            }else{
                throw new Error( 'Файлы для загрузки не предоставленны' )
            }
        }catch( err ){
            console.log(err.message)
            res.status(400).json( err.message )
        }
    }
})

router.post('/upload_avatar', 
    passport.authenticate('jwt',{session: false}),
    upload.array('file'),
    [ body('id_user').trim().isInt() ],
    async function(req,res){
        if(!validationResult(req).isEmpty()){
            res.status(404).json(validationResult(req))
        }else{
            try{
                let id_user = (req.body.id_user)?req.body.id_user:null
                if( req.files.length > 0){
                    for( let file of req.files ){

                        let idAvatar = await dbAPI.addUserAvatar( id_user, file.originalname, file.encoding, file.mimetype, file.buffer, file.size )
                        if ( !idAvatar ) throw new Error( 'Ошибка при добавление файла' )

                        if( req.body.id_user ){
                            req.app.io.emit( 'changedUser', req.body.id_user )
                        }
                    }
                    res.status(200).end()
                }else{
                    throw new Error( 'Файлы для загрузки не предоставленны' )
                }
            }catch( err ){
                console.log(err.message)
                res.status(400).json( err.message )
            }
        }
})


/**
 * Экспортируем объект с параметрами:
 * path - Корневой каталог маршрута
 * router - Объект созданный с помощью express.Router()
 */
module.exports = { path: '/files', router: router}  