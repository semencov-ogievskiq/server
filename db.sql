-- --------------------------------------------------------
-- Хост:                         127.0.0.1
-- Версия сервера:               5.7.27-log - MySQL Community Server (GPL)
-- Операционная система:         Win64
-- HeidiSQL Версия:              11.0.0.5919
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;


-- Дамп структуры базы данных server
DROP DATABASE IF EXISTS `server`;
CREATE DATABASE IF NOT EXISTS `server` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `server`;

-- Дамп структуры для таблица server.groups
DROP TABLE IF EXISTS `groups`;
CREATE TABLE IF NOT EXISTS `groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Ключ группы',
  `name` varchar(50) CHARACTER SET utf8 NOT NULL COMMENT 'Название для вывода на сайте',
  `description` varchar(100) CHARACTER SET utf8 DEFAULT NULL COMMENT 'Описание',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

-- Дамп данных таблицы server.groups: ~2 rows (приблизительно)
DELETE FROM `groups`;
/*!40000 ALTER TABLE `groups` DISABLE KEYS */;
INSERT INTO `groups` (`id`, `name`, `description`) VALUES
	(1, 'Администратор', 'Максимальные права'),
	(2, 'Модератор', 'Права администрирования системой');
/*!40000 ALTER TABLE `groups` ENABLE KEYS */;

-- Дамп структуры для таблица server.sessions
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL COMMENT 'id пользователя сессии',
  `browser` varchar(50) NOT NULL COMMENT 'Название браузера',
  `os` varchar(50) NOT NULL COMMENT 'ОС',
  `platform` varchar(50) NOT NULL COMMENT 'Платформа системы',
  `ip` varchar(50) NOT NULL COMMENT 'IP-адрес каким его видит express.js',
  `iat` datetime NOT NULL COMMENT 'Кода выдан',
  `exp` datetime NOT NULL COMMENT 'Срок действия',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `FK_sessions_users` (`id_user`),
  CONSTRAINT `FK_sessions_users` FOREIGN KEY (`id_user`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8 COMMENT='Таблица сессий пользователей';

-- Экспортируемые данные не выделены.

-- Дамп структуры для таблица server.users
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mail` varchar(50) NOT NULL COMMENT 'Почта пользователя, используется для авторизации и почтовой рассылки',
  `hash_password` varchar(500) NOT NULL COMMENT 'Хешированный пароль',
  `f` varchar(50) NOT NULL COMMENT 'Фамилия',
  `i` varchar(50) NOT NULL COMMENT 'Имя',
  `o` varchar(50) DEFAULT NULL COMMENT 'Отчество',
  `dt_birth` date NOT NULL COMMENT 'Дата рождения',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `mail` (`mail`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8 COMMENT='Таблица пользователей';

-- Дамп данных таблицы server.users: ~2 rows (приблизительно)
DELETE FROM `users`;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`id`, `mail`, `hash_password`, `f`, `i`, `o`, `dt_birth`) VALUES
	(1, 'admin@mail.ru', 'c7ad44cbad762a5da0a452f9e854fdc1e0e7a52a38015f23f3eab1d80b931dd472634dfac71cd34ebc35d16ab7fb8a90c81f975113d6c7538dc69dd8de9077ec', 'Админов', 'Админ', 'Админович', '1996-06-08'),
	(2, 'myblackguitar@mail.ru', '82f3d24ce9179f03b15eaf2363adb8abd738ebd325d21ff6cbf6d596526585820dd1d8467ae2684f15465d2599a808bf3ae8e7d0e496d55d0549b593e185dda4', 'Семенцов-Огиевский', 'Алексей', 'Михайлович', '1996-06-09');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;

-- Дамп структуры для таблица server.user_groups
DROP TABLE IF EXISTS `user_groups`;
CREATE TABLE IF NOT EXISTS `user_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `id_group` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `id_user` (`id_user`),
  KEY `id_group` (`id_group`),
  CONSTRAINT `FK__groups` FOREIGN KEY (`id_group`) REFERENCES `groups` (`id`),
  CONSTRAINT `FK__users` FOREIGN KEY (`id_user`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1 COMMENT='Таблица связывания пользователя с группами';

-- Дамп данных таблицы server.user_groups: ~3 rows (приблизительно)
DELETE FROM `user_groups`;
/*!40000 ALTER TABLE `user_groups` DISABLE KEYS */;
INSERT INTO `user_groups` (`id`, `id_user`, `id_group`) VALUES
	(1, 1, 1),
	(2, 2, 1),
	(3, 2, 2);
/*!40000 ALTER TABLE `user_groups` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
