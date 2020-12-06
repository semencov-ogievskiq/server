module.exports = function( socket ){
    // Запрос состояния подключения пользователя
    socket.on( 'client_status', ( id, callback )=>{
        var data = socket.server.clients[id]
        var status = false
        if( data && data.length > 0 ){
            status = true
        }
        callback(status)
    })
}