/**
 * Модуль автоматического подключения роутеров приложения
 */

/**
 * Подключение библиотек
 */
const fs = require('fs');
const path = require('path')

/**
 * Подключение router
 * Для удобства разработки, подключаются автоматически, из
 * папки routers
 * @param {Object} app ссылка на объект сервера Express
 */
module.exports = function (app){
    // Читаем директорию /routers
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
}