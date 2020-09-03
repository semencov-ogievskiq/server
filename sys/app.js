/**
 * Подключение библиотек
 */
const express = require('express');
const http = require('http');
const socket = require('socket.io');
const useragent = require('express-useragent');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path')
const config = require('../server.config');

// Получаем объект сервера express
const app = express();
// Получаем объект сервера http
const server = http.createServer(app);

// Добавляем к app объект socket.io
app.io = socket(server);

// Добавляем к app новое свойство db
// в котором будут храниться pool соединения к базам данным
app.db = {
    mysql: mysql.createPool(config.db.mysql)
};

/**
 * Подключение промежуточных обработчиков
 */
// Парсер заголовка user-agent ( Для определения браузера )
app.use(useragent.express());

/**
 * Подключение router
 * Для удобства разработки, подключаются автоматически, из
 * папки routers
 */
// Читаем директорию /routers
console.log(__dirname)
fs.readdirSync(__dirname+'\\..\\routers',{withFileTypes: true}).map(dir=>{
    // Строим путь до файла включения
    let path_router = path.join('routers', dir.name, 'index.js');
    // Проверяем что существование файла в нутри папки роутера
    if(dir.isDirectory() && fs.existsSync(path_router)){
        // Получаем объект данных с подключенного роутера
        let router = require(__dirname+'\\..\\'+path_router);
        // Что бы не допустить ошибок, проверяем что пришли данные и в нужном нам формате
        if(
            router && 
            ( router.path && typeof router.path == "string" ) && 
            ( router.router && typeof router.router == "function" )
        ){
            // Подключаем роутер к серверу
            app.use(router.path,router.router);
        }
    }
});


/**
 * Запускаем сервер
 */
server.listen(80,()=>{console.log('start')})