-- --------------------------------------------------------
-- Хост:                         localhost
-- Версия сервера:               5.7.27-log - MySQL Community Server (GPL)
-- Операционная система:         Win64
-- HeidiSQL Версия:              10.2.0.5599
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

-- Дамп структуры для таблица server.sessions
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL COMMENT 'id пользователя сессии',
  `hash_jwt` varchar(500) DEFAULT NULL COMMENT 'Хеш зашифроваваного токена ( для проверки что именно этот токен был отправлен клиенту )',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8 COMMENT='Таблица сессий пользователей';

-- Дамп данных таблицы server.sessions: ~11 rows (приблизительно)
DELETE FROM `sessions`;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` (`id`, `id_user`, `hash_jwt`) VALUES
	(1, 1, NULL),
	(2, 1, NULL),
	(3, 1, NULL),
	(4, 1, NULL),
	(5, 1, NULL),
	(6, 1, NULL),
	(7, 1, NULL),
	(8, 1, NULL),
	(9, 1, NULL),
	(10, 1, '22f1960e25441b84ceeaa62df14f7dd252e9a204477d8fd12e4536c347f443508b7b7768042ffb9c43d75d129395f5c3bc0c039eeec4ef66e3bb338aad951c87'),
	(11, 1, '87bc013e0a58ec00a0bb9b5cda622ae4763d40c39dff8d4e8a11518bbc9eb097523c3aeb12669772716fb843ddbe48759f350374532854a73e4399aa30e90253');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COMMENT='Таблица пользователей';

-- Дамп данных таблицы server.users: ~1 rows (приблизительно)
DELETE FROM `users`;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`id`, `mail`, `hash_password`, `f`, `i`, `o`, `dt_birth`) VALUES
	(1, 'admin@mail.ru', 'c7ad44cbad762a5da0a452f9e854fdc1e0e7a52a38015f23f3eab1d80b931dd472634dfac71cd34ebc35d16ab7fb8a90c81f975113d6c7538dc69dd8de9077ec', 'Семенцов', 'Алексей', NULL, '1996-06-09');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
