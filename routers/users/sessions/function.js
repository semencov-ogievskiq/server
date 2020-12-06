/**
 * Набор функций управления и манипуляций с данными сессиий
 */
const m = module.exports = {}

/**
 * Функция получения списка сессиий
 * @param {String} where Строка условия выборки
 * @param {String} limit Строка выборки limit
 * @param {String} orderBY Строка сортировки
 * @param {String} groupBY Строка группировки group by
 * @returns {Object} Объект с списком сессий и общим колличеством записей
 */
m.getSessions = async function( where = "", limit = "", orderBY = "", groupBY = "" ){
    if( typeof where != "string" ) throw new Error("Параметр where должен быть строкой")
    if( typeof limit != "string" ) throw new Error("Параметр limit должен быть строкой")
    if( typeof groupBY != "string" ) throw new Error("Параметр groupBY должен быть строкой")
    if( typeof orderBY != "string" ) throw new Error("Параметр orderBY должен быть строкой")

    if( where.length > 0 ) where = "WHERE " + where
    if( limit.length > 0 ) limit = " LIMIT " + limit
    if( groupBY.length > 0 ) groupBY = " GROUP BY " + groupBY
    if( orderBY.length > 0 ) orderBY = " ORDER BY " + orderBY

    let result = {
        result: [],
        count: 0
    }

    try{
        let [ count ] = await mysql.query( 'SELECT COUNT(*) count FROM sessions s LEFT JOIN users u ON s.id_user = u.id  ' + where + groupBY )
        result.count = count[0].count
        
        let [ res ] = await mysql.query( 'SELECT s.id, s.id_user, s.browser, s.os, s.platform, s.ip, DATE_FORMAT(s.iat, "%d.%m.%Y %H:%i:%s") iat , DATE_FORMAT(s.exp, "%d.%m.%Y %H:%i:%s") exp, u.mail, u.f, u.i, u.o FROM sessions s LEFT JOIN users u ON s.id_user = u.id  ' + where + groupBY + orderBY + limit )
        result.result = res

        return result
    }catch( err ){
        throw err
    }
}
