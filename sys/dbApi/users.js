const crypto = require('crypto-js')
/**
 * API взаимодействия с таблицей users
 */
module.exports = m = {
    /**
     * Функция получения всех пользователей
     */
    async getUsers(){
        try{
            let [ res ] = await mysql.query( `SELECT id as id_user, mail, f, i, o, DATE_FORMAT(dt_birth,'%d.%m.%Y') dt_birth FROM users` )
            return res
        }catch( err ){
            console.log( err )
            return []
        }
    },
    /**
     * Функция запроса данных пользователя по уникальному ключю
     * @param {Number} id_user Уникальный ключ пользователя
     */
    async getUser(id_user ){
        try{
            let [ res ] = await mysql.query(`SELECT id as id_user, mail, f, i, o, DATE_FORMAT(dt_birth,'%d.%m.%Y') dt_birth FROM users WHERE id=?`,[ id_user ])
            if( res.length != 1 ){
                return null
            }else{
                return res[0]
            }
        }catch( err ){
            console.log( err )
            return null
        }
    },
    /**
     * Функция редактирования данных пользователя по уникальном ключу
     * @param {Number} id_user Уникальный ключ пользователя
     * @param {Object} data Данные редактирования
     */
    async editUser( id_user, data ){
        try{
            let escaping = []
            let set = []
            // Запрашиваем названия всех колонок из бд исключая те которые нельзя редакировать
            var [ res ] = await mysql.query( "SHOW COLUMNS FROM users WHERE Field NOT IN('id','mail','hash_password')" )

            // Перебераем существующие колонки и относительно них собираем данные для запроса
            for ( var row of res) {
                if( data[row.Field] ){

                    escaping.push( data[row.Field] )

                    if( row.Type == 'date'){
                        set.push( row.Field + `=STR_TO_DATE(?,'%d.%m.%Y')` )
                    }else{
                        set.push( row.Field + '=?' )
                    }
                }
            }

            escaping.push(id_user)
            set = set.join(', ')

            let conn = await mysql.getConnection()
            await conn.beginTransaction()

            // Редактируем данные
            var [ res ] = await conn.query( "UPDATE users SET " + set + " WHERE id=?", escaping )
            
            // Проверяем что редактирование затронуло одну запись из таблицы
            if( res.affectedRows == 1 ){
                await conn.commit()  // Фиксируем изменения
                await conn.release()
                return true
            }else{
                await conn.rollback() // Отменяем изменения
                await conn.release()
                return false
            }
        }catch( err ){
            console.log( err )
            return false
        }
    },
    /**
     * Функция регистрации нового пользователя
     * @param {String} mail Почта пользователя
     * @param {String} password Пароль пользователя
     * @param {String} f Фамилия пользователя
     * @param {String} i Имя пользователя
     * @param {String} dt_birth Дата рождения пользователя
     */
     async addUser( mail, password, f, i, dt_birth ){
        try{
            if( !mail || !password || !f || !i || !dt_birth ) return false

            let hash_password = crypto.SHA512(password).toString()

            var [ res ] = await mysql.query( "INSERT INTO users(mail,hash_password,f,i,dt_birth) VALUES( ?, ?, ?, ?, STR_TO_DATE( ?, '%d.%m.%Y') )", [ mail, hash_password, f, i, dt_birth ] )

            return ( res.insertId )? res.insertId : false
            
        }catch( err ){
            console.log( err )
            return false
        }
    }

}