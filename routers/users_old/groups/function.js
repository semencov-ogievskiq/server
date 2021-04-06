/**
 * Набор функций управления и манипуляций с данными сессиий
 */
const m = module.exports = {}

/**
 * Функция получения данных группы
 * @param {Number} id Идентификатор группы
 * @returns {Object|Boolean} Объект с данными группы
 */
m.getGroup = async function(id){
    if( typeof id != "string" ) throw new Error( "Параметр 'id' дожен иметь тип 'string'" )
    // Запрашиваем данные группы
    let [group] = await mysql.query('SELECT * FROM groups WHERE id=?',[ id ])

    if(group.length==0){
        // если пользователь не найден возращаем ошибку
        return false
    }else{
        // возвращаем данные пользователя
        group = group[0]
        return group
    }
}

/**
 * Функция получения списка групп
 * @param {String} where Строка условия выборки
 * @param {String} limit Строка выборки limit
 * @param {String} orderBY Строка сортировки
 * @param {String} groupBY Строка группировки group by
 * @returns {Object} Объект с списком пользователей и общим колличеством записей
 */
m.getGroups = async function( where = "", limit = "", orderBY = "", groupBY = "" ){
    if( typeof where != "string" ) throw new Error("Параметр where должен быть строкой")
    if( typeof limit != "string" ) throw new Error("Параметр limit должен быть строкой")
    if( typeof groupBY != "string" ) throw new Error("Параметр groupBY должен быть строкой")
    if( typeof orderBY != "string" ) throw new Error("Параметр orderBY должен быть строкой")

    if( where.length > 0 ) where = "WHERE " + where
    if( limit.length > 0 ) limit = " LIMIT " + limit
    if( groupBY.length > 0 ) groupBY = " GROUP BY " + groupBY
    if( orderBY.length > 0 ) orderBY = " ORDER BY " + orderBY

    let result = {
        groups: [],
        count: 0
    }

    try{
        let [count] = await mysql.query( 'SELECT COUNT(*) count FROM groups ' + where + groupBY )
        result.count = count[0].count
        
        let [groups] = await mysql.query( 'SELECT * FROM groups ' + where + groupBY + orderBY + limit )
        result.groups = groups
   
        return result
    }catch( err ){
        throw err
    }
}

/**
 * Функция изменения данных группы
 * @param {Object} data Объект с данными для редактирования, где ключ это название столбца
 * @param {Number} id Идентификатор группы
 * @returns {Boolean} Результат изменения
 */
m.editGroup = async function( data, id ){
    if( typeof data != "object" || Object.keys(data).length == 0 ) throw new Error("Парамер data должен иметь тип 'object', и содержать данные для редактирования") 
    if( !+id ) throw new Error("Параметр id должен быть числом")
    
    // Проверяем что пользователь существует
    let group = await m.getGroup(id)
    if(!group) throw new Error("Группа не существует")

    // ---------- Подгатовка для редактирования group ----------
    // Проверяем что все ключи объекта data соответствуют столбцам таблицы пользователей
    var [ result ] = await mysql.query( "SHOW COLUMNS FROM groups WHERE Field NOT IN('id')" )
    let dataSql = [] // Переменная для вставки в запрос данных, в блок SET
    for( var key in data ){
        if( !result.find( ( e ) => ( e.Field == key ) ) ){ 
            throw new Error( key + " - не используется в таблице групп") 
        }

        dataSql.push( key + " = " + mysql.escape(data[key]) )
    }
    dataSql.join(", ")

    // ---------- Выполнение редактирования данных групп ----------
    let conn = await mysql.getConnection()
    await conn.beginTransaction()
    try{
        // Редактируем данные пользователя
        var [ editGroup ] = await conn.query( "UPDATE groups SET " + dataSql + " WHERE id=?", [id] )
        
        // Проверяем что редактированием таблицы groups была затронута одна строка
        if(editGroup.affectedRows != 1) throw new Error("Ошибка, при редактировании groups, было затронуто строк: " + editGroup.affectedRows)

        await conn.commit()  // Фиксируем изменения
        await conn.release() // Закрываем соединение
        return true

    }catch(err){
        await conn.rollback() // Отменяем изменения
        await conn.release()  // Закрываем соединение
        throw err
    }
}