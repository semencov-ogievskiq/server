/**
 * API взаимодействия с таблицей user_files
 */
module.exports = m = {
    /**
     * Функция запроса аватарки пользователя по уникальному ключу
     * @param {Number} id_user Уникальный ключ пользователя
     */
    async getUserAvatar( id_user ){
        try{
            let [ res ] = await mysql.query(`SELECT MAX(id) as id_avatar FROM user_files WHERE id_user=?`,[ id_user ])
            if( res.length != 1 ){
                return null
            }else{
                return res[0].id_avatar
            }
        }catch( err ){
            console.log( err )
            return null
        }
    },
    /**
     * Функция добавления новой аватарки
     * @param {String} id_user Id пользователя
     * @param {String} filename Название файла
     * @param {String} encoding Кодировка файла
     * @param {String} mimetype mime - тип файла
     * @param {Buffer} buffer содержимое файла
     * @param {String} size Размер файла
     */
    async addUserAvatar( id_user, filename, encoding, mimetype, buffer, size ){
        try{
            if( !filename || !encoding || !mimetype || !buffer || !size ) return false

            var [ res ] = await mysql.query( "INSERT INTO user_files(type,id_user,filename,encoding,mimetype,buffer,size) VALUES(1, ?, ?, ?, ?, ?, ?) ", [ id_user, filename, encoding, mimetype, buffer, size ] )

            return ( res.insertId )? res.insertId : false
            
        }catch( err ){
            console.log( err )
            return false
        }
    }
}