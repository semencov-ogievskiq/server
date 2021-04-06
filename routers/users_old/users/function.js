/**
 * Набор функций управления и манипуляций с данными сессиий
 */
const m = module.exports = {}
const { getGroups } = require('../groups/function')
const crypto = require('crypto-js')

/**
 * Функция получения списка пользователей
 * @param {String} where Строка условия выборки
 * @param {String} limit Строка выборки limit
 * @param {String} orderBY Строка сортировки
 * @param {String} groupBY Строка группировки group by
 * @returns {Object} Объект с списком пользователей и общим колличеством записей
 */
m.getUsers = async function( where = "", limit = "", orderBY = "", groupBY = "" ){
    if( typeof where != "string" ) throw new Error("Параметр where должен быть строкой")
    if( typeof limit != "string" ) throw new Error("Параметр limit должен быть строкой")
    if( typeof groupBY != "string" ) throw new Error("Параметр groupBY должен быть строкой")
    if( typeof orderBY != "string" ) throw new Error("Параметр orderBY должен быть строкой")

    if( where.length > 0 ) where = "WHERE " + where
    if( limit.length > 0 ) limit = " LIMIT " + limit
    if( groupBY.length > 0 ) groupBY = " GROUP BY " + groupBY
    if( orderBY.length > 0 ) orderBY = " ORDER BY " + orderBY

    let result = {
        users: [],
        count: 0
    }

    try{
        let [count] = await mysql.query( 'SELECT COUNT(*) count FROM (SELECT u.*, GROUP_CONCAT(gr.id_group SEPARATOR ",") groups FROM users u LEFT JOIN user_groups gr ON u.id=gr.id_user GROUP BY u.id) users ' + where + groupBY )
        result.count = count[0].count
        
        let [users] = await mysql.query( 'SELECT users.*, DATE_FORMAT(users.dt_birth, "%d.%m.%Y") dt_birth FROM (SELECT u.id, u.f, u.i, u.o, u.mail, dt_birth, GROUP_CONCAT(gr.id_group SEPARATOR ",") groups FROM users u LEFT JOIN user_groups gr ON u.id=gr.id_user GROUP BY u.id) users ' + where + groupBY + orderBY + limit )
        result.users = users

        result.users.map( row => {
            row.groups = (row.groups)?row.groups.split(','):'';
            return row
        })
   
        return result
    }catch( err ){
        throw err
    }
}

/**
 * Функция получения данных пользователя
 * @param {Number} id Идентификатор пользователя
 * @returns {Object|Boolean} Объект с данными пользователя или false в случае если пользователь не найден
 */
m.getUser = async function(id){
    if( typeof id != "string" ) throw new Error( "Параметр 'id' дожен иметь тип 'string'" )
    // Запрашиваем данные пользователя
    let [user] = await mysql.query('SELECT id,mail,f,i,o, DATE_FORMAT(dt_birth, "%d.%m.%Y") dt_birth FROM users WHERE id=?',[ id ])
    if(user.length==0){
        // если пользователь не найден возращаем ошибку
        return false
    }else{
        // если найден пользователь, запрашиваем его группы и возвращаем данные
        user = {...user[0], groups: []} // Грабли ... Иначе вернеться объет ResultRow
        // Запрашиваем группы
        let [groups] = await mysql.query('SELECT g.id FROM user_groups ug LEFT JOIN groups g ON ug.id_group=g.id WHERE ug.id_user=?',[ id ])
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
 * Функция изменения данных пользователя
 * @param {Object} data Объект с данными для редактирования, где ключ это название столбца
 * @param {Number} id Идентификатор пользователя
 * @returns {Boolean} Результат изменения
 */
m.editUser = async function( data, id ){
    if( typeof data != "object" || Object.keys(data).length == 0 ) throw new Error("Парамер data должен иметь тип 'object', и содержать данные для редактирования") 
    if( !+id ) throw new Error("Параметр id должен быть числом")
    
    // Проверяем что пользователь существует
    let user = await m.getUser(id)
    if(!user) throw new Error("Пользователя не существует")

    // ---------- Подгатовка для редактирования groups ----------
    if(data.hasOwnProperty('groups')){
        if(!( typeof data.groups == "object" && data.groups instanceof Array ) ) throw new Error("data.groups - должен быть Array")
        // Проверяем что входящие группы соответствуют объявленным группам
        let allGroups = await getGroups() // Запрашиваем список существующих групп
        allGroups = allGroups.groups
        for( var item of data.groups ){
            if( !allGroups.find( ( e ) => ( e.id == item ) ) ){ 
                throw new Error(item + " - данная группа не существует")
            }
        }
        userGroups = user.groups // Список групп в которых пользователь состоит
        // Список групп на удаление
        delGroup = userGroups.filter( e => ( !data.groups.includes(e) ) )
        // Список групп на добавление
        addGroup = data.groups.filter( e => ( !userGroups.includes(e) ) )
        // Подготовка для вставки в запрос
        delGroupPrep = delGroup.map( e => ( mysql.escape(e) ) ).join(", ")   
        addGroupPrep = addGroup.map( e => ( "(" + mysql.escape(id) + "," + mysql.escape(e) + ")" ) ).join(", ")      
    }
    // ---------- Подгатовка для редактирования users ----------
    // Проверяем что все ключи объекта data соответствуют столбцам таблицы пользователей
    var [ result ] = await mysql.query( "SHOW COLUMNS FROM users WHERE Field NOT IN('id','mail','hash_password')" )
    let dataSql = [] // Переменная для вставки в запрос данных, в блок SET
    for( var key in data ){
        // Проверяем что ключ соответствует столбцам таблицы
        if( key == "groups" ) {
            continue
        }else if( !result.find( ( e ) => ( e.Field == key ) ) ){ 
            throw new Error(key + " - не используется в таблице пользователей") 
        }

        if( key == "dt_birth" ) {
            dataSql.push( key + " = STR_TO_DATE(" + mysql.escape(data[key]) + ", '%d.%m.%Y')" )
        }else{
            dataSql.push( key + " = " + mysql.escape(data[key]) )
        }
    }
    dataSql.join(", ")

    // ---------- Выполнение редактирования данных пользователя ----------
    let conn = await mysql.getConnection()
    await conn.beginTransaction()
    try{
        // Редактируем данные пользователя
        var [ editUser ] = await conn.query( "UPDATE users SET " + dataSql + " WHERE id=?", [id] )

        if( data.hasOwnProperty('groups') ){
            // Удаление групп
            if( delGroup.length > 0 ){
                var [ resDelGroup ] = await conn.query( "DELETE FROM user_groups WHERE id_user=? and id_group IN(" + delGroupPrep + ")", [id] )
            }
            // Добавление групп
            if( addGroup.length > 0 ){
                var [ resAddGroup ] = await conn.query( "INSERT INTO user_groups(id_user, id_group) VALUES"+addGroupPrep)
            }
            
        }
        
        // Проверяем что редактированием таблицы users была затронута одна строка
        if(editUser.affectedRows != 1) throw new Error("Ошибка, при редактировании users, было затронуто строк: " + editUser.affectedRows)
        // Проверяем что удаление и добавление групп прошло успешно
        if( data.hasOwnProperty('groups') && ( ( delGroup.length > 0 && resDelGroup.affectedRows != delGroup.length) || 
            (addGroup.length > 0 && resAddGroup.affectedRows != addGroup.length ) ) ) {
            throw new Error(
                "Ошибка, при редактировании user_groups, удалено " + resDelGroup.affectedRows + " из " + delGroup.length +
                ", добавлено " + resAddGroup.affectedRows + " из " + addGroup.length 
            )
        }

        await conn.commit() // Фиксируем изменения
        await conn.release()
        return true

    }catch(err){
        await conn.rollback() // Отменяем изменения
        await conn.release()
        throw err
    }
}

/**
 * Функция регистрации нового пользователя
 * @param {Object} data Объект с данными нового пользователя
 * @returns {Number} Индентитификатор нового пользователя
 */
m.addUser = async function( data ){
    if( typeof data != "object" || Object.keys(data).length == 0 ) throw new Error("Парамер data должен иметь тип 'object', и содержать данные для редактирования")
    if( !data.mail || !data.password || !data.repeatPassword || !data.f || !data.i || !data.dt_birth ) throw new Error('Не все обязательные данные переданы')
    if( data.password !== data.repeatPassword ) throw new Error('Пароли не совпадают')
    if(!( typeof data.groups == "object" && data.groups instanceof Array ) ) throw new Error("data.groups - должен быть Array")

    // Проверяем что входящие группы соответствуют объявленным группам
    let allGroups = await getGroups() // Запрашиваем список существующих групп
    allGroups = allGroups.groups
    for( var item of data.groups ){
        if( !allGroups.find( ( e ) => ( e.id == item ) ) ){ 
            throw new Error(item + " - данная группа не существует")
        }
    }
    
    let hash_password = crypto.SHA512(data.password).toString()

    let conn = await mysql.getConnection()
    await conn.beginTransaction()

    try{
        // Создаем нового пользователя
        var [ resAddUser ] = await conn.execute( "INSERT INTO users(mail,hash_password,f,i,o,dt_birth) VALUES( ? , ? , ? , ? , ? , STR_TO_DATE( ? , '%d.%m.%Y') )", [data.mail, hash_password, data.f, data.i, (data.o)?data.o:null, data.dt_birth])

        if( !resAddUser.insertId ){
            throw new Error('Не удалось добавить пользователя')
        }

        // Добавление групп
        if( data.groups.length > 0 ){
            // Строка для вставки в запрос на добавление в user_groups
            let addGroupPrep = data.groups.map( e => ( "(" + mysql.escape(resAddUser.insertId) + "," + mysql.escape(e) + ")" ) ).join(", ")
            await conn.query( "INSERT INTO user_groups(id_user, id_group) VALUES"+addGroupPrep)
        }

        await conn.commit()  // Фиксируем изменения
        await conn.release() // Закрываем соединение
        return resAddUser.insertId

    }catch(err){
        await conn.rollback() // Отменяем изменения
        await conn.release()  // Закрываем соединение
        throw err
    }


}