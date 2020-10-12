// --------------------------------------------------
// Подключение библиотек
// --------------------------------------------------

const express = require('express')
const http = require('http')
const socket = require('socket.io')
const useragent = require('express-useragent')
const mysql = require('mysql2/promise')
const ejs = require('ejs-locals')
const config = require('../server.config')
const ident = require('./identification')

// --------------------------------------------------
// Создание сервера http/socket, и подключение 
// дополнительного функционала
// --------------------------------------------------

/**
 * Объект фреймворка Express
 */
const app = express()

/**
 * Http сервер, созданный через http.createServer()
 */
const server = http.createServer(app)

/**
 * Свойство хранит объект Socket.io, подключенный к
 * серверу созданный через http.createServer().
 * Сервер будет инициализировать события своим клиентам
 * через Socket соединение, по этому для прямого доступа к 
 * socket.io мы объявлем его в нутри app
 */
app.io = socket(server)

/**
 * Подключение к БД должно использоваться отовсюду,
 * и использоваться не только http сервером, по этому
 * объявлем pool соединение с mysql через global видимость
 */
global.mysql = mysql.createPool(config.db.mysql)


// --------------------------------------------------
// Инициализация Passport.js, и расширение app функционалом
// проверки авторизации 
// --------------------------------------------------
app.use(ident.passport.initialize()) // инициализация проверки аутентификации

// --------------------------------------------------
// Настройка socket части сервера
// --------------------------------------------------

/**
 * Промежуточный обработчик, производящий идентификацию пользователя
 * при подключении к socket части сервера
 */
app.io.use(require('./identificationSocket'))


// --------------------------------------------------
// Настройка http части сервера
// --------------------------------------------------

/**
 * Парсер заголовка user-agent ( Для определения браузера )
 */
app.use(useragent.express())

/**
 * Прсинг запросов
 */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/**
 * Настройка CORS
 */
app.use((req, res, next) => {
    res.header({
      "Access-Control-Allow-Origin": "http://192.168.1.64",
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Headers": 'Authorization,content-type'
    })
    next();
})

/**
 * Подключение статических файлов
 */
app.use(express.static(__dirname + '/../static'))

/**
 * Подключение маршрутов идентификации
 */
app.use('/', ident.router)

/**
 * Подключение роутеров к серверу
 */
require('./routers')(app)


// --------------------------------------------------
// Запуск сервера
// --------------------------------------------------

server.listen(config.port,()=>{
    console.log('Сервер запущен. Используемый порт: '+config.port)
})