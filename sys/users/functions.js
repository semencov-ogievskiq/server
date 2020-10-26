/**
 * Набор функций для взаимодействием с данными пользователей
 */
const f = module.exports = {}

/**
 * Функция получения данных пользователя
 * @param {Number} _id Идентификатор пользователя
 * @returns {Object|Boolean} Объект с данными пользователя или false в случае если пользователь не найден
 */
f.getUser = async function(_id){
    // Запрашиваем данные пользователя
    let [user] = await mysql.query('SELECT id,mail,f,i,o, DATE_FORMAT(dt_birth, "%d.%m.%Y") dt_birth FROM users WHERE id=?',[ _id ])
    if(user.length==0){
        // если пользователь не найден возращаем ошибку
        return false
    }else{
        // если найден пользователь, запрашиваем его группы и возвращаем данные
        user = {...user[0], groups: []} // Грабли ... Иначе вернеться объет ResultRow
        // Запрашиваем группы
        let [groups] = await mysql.query('SELECT g.id FROM user_groups ug LEFT JOIN groups g ON ug.id_group=g.id WHERE ug.id_user=?',[ _id ])
        if(groups.length > 0){
            groups.map((row)=>{
                user.groups.push(row.id)
            })
        }
        // возвращаем данные пользователя
        return user
    }
}

/**
 * Функция получения списка групп пользователей, если используется пагинация
 * - groups {Array} список групп пользователей
 * - count {Number} общее колличество групп пользователей
 * @param {Number|String} perPage Колличество элементов на странице или '*' вернуть весь список
 * @param {Number} page Номер страницы
 * @returns {Array|Object} Список групп или объект с данными.
 */
f.getGroups = async function( perPage = "*", page = 1 ){
    if(perPage == "*"){
        // Возвращаем весь
        let [groups] = await mysql.query('SELECT * FROM groups')
        return groups
    }else{
        // Если perPage является не переводимой в number строкой, перезадем ее
        if(!+perPage) perPage = 10
        if(!+page) page = 1

        // Предопределяем структуру ответа
        const data = {
            count: 0,
            groups: []
        }

        // Запрашиваем общее колличество записей
        data.count = await mysql.query('SELECT COUNT(*) count FROM groups').count

        let [groups] = await mysql.query('SELECT * FROM groups LIMIT ?,?',[(+page-1)*perPage,+perPage])
        data.groups = groups
        return data
    }
}

/**
 * Функция получения списка пользователей, возвращает объект с следующей структурой
 * - users {Array} список пользователей
 * - count {Number} общее колличество пользователей
 * @returns {Object} Объект с данными. 
 */
f.getUsers = async function(page,perPage=10){
    // Предопределяем структуру ответа
    const data = {
        count: 0,
        users: []
    }
    // Запрашиваем общее колличество записей
    let [count] = await mysql.query('SELECT COUNT(*) count FROM users')
    data.count = count[0].count
    // Запрашиваем пользователей
    let [users] = await mysql.query('SELECT id, f, i, o, mail, DATE_FORMAT(dt_birth, "%d.%m.%Y") dt_birth FROM users LIMIT ?,?',[(+page-1)*perPage,+perPage])
    data.users = users
    // Возвращаем данные
    return data
}