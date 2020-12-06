// --------------------------------------------------
// Подключение библиотек
// --------------------------------------------------
const express = require('express')
const http = require('http')
const socket = require('socket.io')
const useragent = require('express-useragent')
const mysql = require('mysql2/promise')
const cors = require('cors')
const config = require('../server.config')
const ident = require('./identification')
const setRouters = require('./routers')         // Динамическое подключение Router


/**
 * Подключение к БД должно использоваться отовсюду,
 * и использоваться не только http сервером, по этому
 * объявлем pool соединение с mysql через global видимость
 */
global.mysql = mysql.createPool(config.db.mysql)

const app = express()

app.use(cors())                                   // Разрешение CORS
app.use(useragent.express())                      // Чтение заголовка User-Agent
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(ident.passport.initialize())              // Инициализация проверки аутентификации
app.use(express.static(__dirname + '/../static')) // Статические файлы
app.use('/', ident.router)                        // Router авторизации/идентитификации
setRouters(app)                                   // Динамическое подключение Router


const server = http.createServer(app)

app.io = socket(server)                             // Подключение Socket.io
app.io.clients = {}                                 // Массив данных хранящий индентификаторы сессий пользователей
app.io.use(ident.identSocket)                       // Подключение идентитификации пользователя Socket.io
app.io.on('connection', require('./appSocket') )    // Установка функционала socket сервера


// ---------- Запуск сервера ----------
server.listen(config.port,()=>{
    console.log('Сервер запущен. Используемый порт: '+config.port)
})