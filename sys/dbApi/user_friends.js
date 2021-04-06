/**
 * API взаимодействия с таблицей user_friends
 */
module.exports = m = {
    /**
     * Функция получения списка друзей пользователя по уникальному ключу
     * @param {Number} id_user Уникальный ключ пользователя
     */
    async getUserFriends( id_user ){
        try{
            let [ res ] = await mysql.query(`SELECT * FROM user_friends WHERE id_user1=? or id_user2=?`,[ id_user, id_user ])
            
            if( res.length < 1 ){
                return []
            }else{
                let result = []
                for (const row of res) {
                    let tmp_id = ( row.id_user1 == id_user )? 2 : 1
                    let user = await this.getUser( row[ 'id_user' + tmp_id ])
                    user.confirm_friendship = row[ 'confirm_user' + tmp_id ]
                    user.id_avatar = await this.getUserAvatar(user.id_user)
                    result.push(user)
                }
                return result
            }
        }catch( err ){
            console.log( err )
            return []
        }
    },
    /**
     * Функция получения списка друзей пользователя по условиям
     * @param {Number} id_user Уникальный ключ пользователя
     */
    async friendsByCondition( id_user ){
        try{
            let [ res ] = await mysql.query(`SELECT * FROM user_friends WHERE id_user1=? or id_user2=?`,[ id_user, id_user ])
            
            if( res.length < 1 ){
                return []
            }else{
                let result = []
                for (const row of res) {
                    let tmp_id = ( row.id_user1 == id_user )? 2 : 1
                    let user = await this.getUser( row[ 'id_user' + tmp_id ])
                    user.confirm_friendship = row[ 'confirm_user' + tmp_id ]
                    user.id_avatar = await this.getUserAvatar(user.id_user)
                    result.push(user)
                }
                return result
            }
        }catch( err ){
            console.log( err )
            return []
        }
    }
}