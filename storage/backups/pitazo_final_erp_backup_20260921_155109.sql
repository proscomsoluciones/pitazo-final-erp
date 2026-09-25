-- MariaDB dump 10.19  Distrib 10.4.28-MariaDB, for osx10.10 (x86_64)
--
-- Host: 127.0.0.1    Database: pitazo_final_erp
-- ------------------------------------------------------
-- Server version	10.4.28-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` bigint(20) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
INSERT INTO `cache` VALUES ('laravel-cache-admin@admin.com|127.0.0.1','i:1;',1787090421),('laravel-cache-admin@admin.com|127.0.0.1:timer','i:1787090421;',1787090421),('laravel-cache-admin@anfa.cl|127.0.0.1','i:1;',1786843866),('laravel-cache-admin@anfa.cl|127.0.0.1:timer','i:1786843866;',1786843866),('laravel-cache-admin@asociacion.cl|127.0.0.1','i:1;',1786843831),('laravel-cache-admin@asociacion.cl|127.0.0.1:timer','i:1786843831;',1786843831),('laravel-cache-spatie.permission.cache','a:3:{s:5:\"alias\";a:4:{s:1:\"a\";s:2:\"id\";s:1:\"b\";s:4:\"name\";s:1:\"c\";s:10:\"guard_name\";s:1:\"r\";s:5:\"roles\";}s:11:\"permissions\";a:12:{i:0;a:4:{s:1:\"a\";i:14;s:1:\"b\";s:10:\"ver clubes\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:5:{i:0;i:3;i:1;i:4;i:2;i:5;i:3;i:7;i:4;i:8;}}i:1;a:4:{s:1:\"a\";i:15;s:1:\"b\";s:16:\"gestionar clubes\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:3;i:1;i:4;}}i:2;a:4:{s:1:\"a\";i:16;s:1:\"b\";s:13:\"ver jugadores\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:5:{i:0;i:3;i:1;i:4;i:2;i:5;i:3;i:7;i:4;i:8;}}i:3;a:4:{s:1:\"a\";i:17;s:1:\"b\";s:19:\"gestionar jugadores\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:3;i:1;i:7;}}i:4;a:4:{s:1:\"a\";i:18;s:1:\"b\";s:11:\"ver torneos\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:5:{i:0;i:3;i:1;i:4;i:2;i:5;i:3;i:7;i:4;i:8;}}i:5;a:4:{s:1:\"a\";i:19;s:1:\"b\";s:17:\"gestionar torneos\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:3;i:1;i:4;}}i:6;a:4:{s:1:\"a\";i:20;s:1:\"b\";s:12:\"ver tribunal\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:6:{i:0;i:3;i:1;i:4;i:2;i:5;i:3;i:6;i:4;i:7;i:5;i:8;}}i:7;a:4:{s:1:\"a\";i:21;s:1:\"b\";s:19:\"gestionar sanciones\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:3;i:1;i:7;}}i:8;a:4:{s:1:\"a\";i:22;s:1:\"b\";s:15:\"gestionar notas\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:3;i:1;i:7;}}i:9;a:4:{s:1:\"a\";i:23;s:1:\"b\";s:16:\"gestionar fondos\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:3;i:1;i:6;}}i:10;a:4:{s:1:\"a\";i:24;s:1:\"b\";s:9:\"ver etica\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:4:{i:0;i:3;i:1;i:4;i:2;i:5;i:3;i:8;}}i:11;a:4:{s:1:\"a\";i:25;s:1:\"b\";s:15:\"gestionar etica\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:3;i:1;i:8;}}}s:5:\"roles\";a:6:{i:0;a:3:{s:1:\"a\";i:3;s:1:\"b\";s:11:\"Super admin\";s:1:\"c\";s:3:\"web\";}i:1;a:3:{s:1:\"a\";i:4;s:1:\"b\";s:10:\"Presidente\";s:1:\"c\";s:3:\"web\";}i:2;a:3:{s:1:\"a\";i:5;s:1:\"b\";s:10:\"Secretario\";s:1:\"c\";s:3:\"web\";}i:3;a:3:{s:1:\"a\";i:7;s:1:\"b\";s:17:\"Comite disciplina\";s:1:\"c\";s:3:\"web\";}i:4;a:3:{s:1:\"a\";i:8;s:1:\"b\";s:12:\"Comite etica\";s:1:\"c\";s:3:\"web\";}i:5;a:3:{s:1:\"a\";i:6;s:1:\"b\";s:8:\"Tesorero\";s:1:\"c\";s:3:\"web\";}}}',1790091204);
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` bigint(20) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `campeonatos`
--

DROP TABLE IF EXISTS `campeonatos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `campeonatos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `estado` enum('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campeonatos`
--

LOCK TABLES `campeonatos` WRITE;
/*!40000 ALTER TABLE `campeonatos` DISABLE KEYS */;
INSERT INTO `campeonatos` VALUES (1,'Campeonato oficial 2026','ACTIVO','2026-06-21 02:32:58','2026-08-18 20:35:00');
/*!40000 ALTER TABLE `campeonatos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `casos_etica`
--

DROP TABLE IF EXISTS `casos_etica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `casos_etica` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `folio` varchar(255) NOT NULL,
  `tipo_oficio` enum('INVESTIGACION','CITACION','INHABILITACION','RESOLUCION') NOT NULL DEFAULT 'INVESTIGACION',
  `club_id` bigint(20) unsigned DEFAULT NULL,
  `jugador_id` bigint(20) unsigned DEFAULT NULL,
  `nombre_involucrado` varchar(255) DEFAULT NULL,
  `rut_involucrado` varchar(255) DEFAULT NULL,
  `articulo_reglamento` varchar(255) DEFAULT NULL,
  `tipo_involucrado` enum('JUGADOR','DIRIGENTE','CLUB') NOT NULL DEFAULT 'JUGADOR',
  `campeonato_id` bigint(20) unsigned DEFAULT NULL,
  `fase_id` bigint(20) unsigned DEFAULT NULL,
  `numero_fecha` int(11) DEFAULT NULL,
  `asunto` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_citacion` datetime DEFAULT NULL,
  `lugar_citacion` varchar(255) DEFAULT NULL,
  `fecha_inicio_inhabilitacion` date DEFAULT NULL,
  `fecha_fin_inhabilitacion` date DEFAULT NULL,
  `estado` enum('EN_INVESTIGACION','CITADO','INHABILITADO','RESUELTO','ARCHIVADO') NOT NULL DEFAULT 'EN_INVESTIGACION',
  `detalles_resolucion` text DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `casos_etica_folio_unique` (`folio`),
  KEY `casos_etica_club_id_foreign` (`club_id`),
  KEY `casos_etica_jugador_id_foreign` (`jugador_id`),
  KEY `casos_etica_campeonato_id_foreign` (`campeonato_id`),
  KEY `casos_etica_fase_id_foreign` (`fase_id`),
  CONSTRAINT `casos_etica_campeonato_id_foreign` FOREIGN KEY (`campeonato_id`) REFERENCES `campeonatos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `casos_etica_club_id_foreign` FOREIGN KEY (`club_id`) REFERENCES `clubes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `casos_etica_fase_id_foreign` FOREIGN KEY (`fase_id`) REFERENCES `fases` (`id`) ON DELETE SET NULL,
  CONSTRAINT `casos_etica_jugador_id_foreign` FOREIGN KEY (`jugador_id`) REFERENCES `jugadores` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `casos_etica`
--

LOCK TABLES `casos_etica` WRITE;
/*!40000 ALTER TABLE `casos_etica` DISABLE KEYS */;
INSERT INTO `casos_etica` VALUES (4,'ET-2026-001','RESOLUCION',1,NULL,'Carlos Mendoza (Presidente)','12.345.678-9','Art. 18 Inciso B - Código de Ética ANFA','DIRIGENTE',1,1,3,'Investigación por presunta suplantación de identidad en planilla','Se inicia investigación de oficio tras la denuncia presentada por la terna arbitral sobre anomalías en las firmas de la planilla de juego.',NULL,'Sede Oficial de la Asociación',NULL,NULL,'RESUELTO',NULL,NULL,'2026-07-18 18:36:57','2026-07-28 18:49:21'),(5,'ET-2026-002','CITACION',1,1,'Alexis Sánchez','15555555-5','Art. 22 Inciso A','JUGADOR',1,1,4,'Citación a comparendo por conducta antideportiva grave','Citación obligatoria al jugador para presentar sus descargos respecto a los incidentes ocurridos al finalizar el encuentro.','2026-07-31 19:30:57','Sede Oficial de la Asociación - Sala de Sesiones',NULL,NULL,'CITADO',NULL,NULL,'2026-07-23 18:36:57','2026-07-28 18:36:57'),(6,'ET-2026-003','INHABILITACION',2,NULL,'Roberto Gómez (Delegado General)','10.987.654-3','Art. 15 Inciso C','DIRIGENTE',1,NULL,NULL,'Inhabilitación preventiva por desacato a la autoridad deportiva','Se decreta la inhabilitación temporal preventiva del dirigente para ejercer cualquier cargo de representación deportiva durante la tramitación del proceso.',NULL,NULL,'2026-07-26','2026-08-25','INHABILITADO',NULL,NULL,'2026-07-26 18:36:57','2026-07-28 18:36:57'),(8,'ET-2026-005','RESOLUCION',2,2,'Arturo Vidal','16666666-6','Art. 12','JUGADOR',NULL,NULL,NULL,'Denuncia por agresiones verbales hacia el cuerpo técnico rival','Expediente archivado por falta de pruebas concluyentes en los informes arbitrales.',NULL,'Sede Oficial de la Asociación',NULL,NULL,'RESUELTO','Se Aplica Articulo 211 letra a un partido de sanción',NULL,'2026-07-08 18:36:57','2026-09-21 15:37:53');
/*!40000 ALTER TABLE `casos_etica` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clubes`
--

DROP TABLE IF EXISTS `clubes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clubes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `crest` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clubes`
--

LOCK TABLES `clubes` WRITE;
/*!40000 ALTER TABLE `clubes` DISABLE KEYS */;
INSERT INTO `clubes` VALUES (1,'CD Santa Rosa','logos/01KCQC6DZ4FB3500HQ8K01KQ0W.webp','2026-06-21 01:18:40','2026-06-21 01:18:40'),(2,'CD Alfredo Riesco','logos/01KCQBZH0P7MFNETYJ78JHZQ3G.webp','2026-06-21 01:18:40','2026-06-21 01:18:40'),(4,'CD Ñilhue','logos/01KCQC3TARGBP20FX3FWC8YEBT.webp','2026-06-21 01:18:40','2026-06-21 01:18:40'),(5,'CD Alianza','logos/01KCQC0WED02CJYMK0T9PGEZBJ.webp','2026-06-21 01:18:40','2026-06-21 01:18:40'),(6,'CD Carmelo de Praga','logos/01KCQBJGCSKW0Z8637J7S49699.webp','2026-06-21 01:18:40','2026-06-21 01:18:40'),(7,'CD Unión 28 de Marzo','logos/01KCQBVY06K0DZRW70PSC9TTKV.webp','2026-06-21 01:18:40','2026-06-21 01:18:40'),(9,'CD Arcoíris','logos/01KCQC1AR5E20V2YCPV31QEFYB.webp','2026-06-21 01:18:40','2026-06-21 01:18:40'),(10,'CD La Colonia','logos/01KR7C6JH59RS47BF1J8WAF86C.webp','2026-06-21 01:18:40','2026-06-21 01:18:40'),(11,'CD Estrella de Chile','logos/01KCQC2S8FZA7V4TVZ954ZB0X2.webp','2026-06-21 01:18:40','2026-06-21 01:18:40'),(12,'CD Minera Catemu','logos/01KCQC38CM51Q2J0Z1S08XEYDM.webp','2026-06-21 01:18:40','2026-06-21 01:18:40'),(13,'CD Peñarol Reinoso','logos/01KCQC4G62ZCAY3V3NNEYHXW5W.webp','2026-06-21 01:18:40','2026-06-21 01:18:40'),(14,'CD San Carlos','logos/01KCQC553YXRXG38H8BH6SNHKQ.webp','2026-06-21 01:18:40','2026-06-21 01:18:40'),(15,'CD Santa Margarita','logos/01KCQC5V3P4EFW1SYWKKAY3HJJ.webp','2026-06-21 01:18:40','2026-06-21 01:18:40'),(16,'CD Unión Compuertas','logos/01KCQC73P0T3114E7QS3D4420G.webp','2026-06-21 01:18:40','2026-06-21 01:18:40'),(17,'CD Valencia','logos/01KCQC08ZX9X7FCHV3HMR95N5H.webp','2026-06-21 01:18:40','2026-06-21 01:18:40');
/*!40000 ALTER TABLE `clubes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracion_asociacion`
--

DROP TABLE IF EXISTS `configuracion_asociacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `configuracion_asociacion` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL DEFAULT 'Asociación de Fútbol',
  `rut` varchar(255) DEFAULT NULL,
  `ciudad` varchar(255) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `telefono` varchar(255) DEFAULT NULL,
  `correo` varchar(255) DEFAULT NULL,
  `sitio_web` varchar(255) DEFAULT NULL,
  `nombre_presidente` varchar(255) DEFAULT NULL,
  `nombre_secretario` varchar(255) DEFAULT NULL,
  `nombre_tesorero` varchar(255) DEFAULT NULL,
  `etica_integrante_1` varchar(255) DEFAULT NULL,
  `etica_integrante_2` varchar(255) DEFAULT NULL,
  `etica_integrante_3` varchar(255) DEFAULT NULL,
  `disciplina_presidente` varchar(255) DEFAULT NULL,
  `disciplina_secretario` varchar(255) DEFAULT NULL,
  `disciplina_integrante_3` varchar(255) DEFAULT NULL,
  `logo_path` varchar(255) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracion_asociacion`
--

LOCK TABLES `configuracion_asociacion` WRITE;
/*!40000 ALTER TABLE `configuracion_asociacion` DISABLE KEYS */;
INSERT INTO `configuracion_asociacion` VALUES (1,'Asociación de Fútbol de Catemu',NULL,NULL,NULL,NULL,NULL,NULL,'Juan Cornejo G.','Franco Cortez O.','Orlando Días Z.','Javier Albornoz','Erick Aguilar','Claudia Muñoz','Persona 1','Persona 2','Persana 3','logos/KbMs1u34GyF3rDBghmDdqFXwNEAGBsB8OdwgLwi1.jpg',NULL,'2026-06-21 05:09:28','2026-08-18 21:06:38');
/*!40000 ALTER TABLE `configuracion_asociacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` varchar(255) NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fases`
--

DROP TABLE IF EXISTS `fases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fases` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `campeonato_id` bigint(20) unsigned NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `cantidad_fechas` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fases_campeonato_id_foreign` (`campeonato_id`),
  CONSTRAINT `fases_campeonato_id_foreign` FOREIGN KEY (`campeonato_id`) REFERENCES `campeonatos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fases`
--

LOCK TABLES `fases` WRITE;
/*!40000 ALTER TABLE `fases` DISABLE KEYS */;
INSERT INTO `fases` VALUES (1,1,'Apertura',13,'2026-06-21 02:33:29','2026-06-21 02:33:29'),(3,1,'Clausura',13,'2026-09-17 00:30:15','2026-09-17 00:30:15');
/*!40000 ALTER TABLE `fases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fondo_solidarios`
--

DROP TABLE IF EXISTS `fondo_solidarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fondo_solidarios` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `campeonato_id` bigint(20) unsigned NOT NULL,
  `fase_id` bigint(20) unsigned NOT NULL,
  `numero_fecha` int(11) NOT NULL,
  `club_id` bigint(20) unsigned NOT NULL,
  `jugador_rut` varchar(255) NOT NULL,
  `jugador_nombre` varchar(255) NOT NULL,
  `diagnostico` text NOT NULL,
  `tipo_beneficio` varchar(255) DEFAULT NULL,
  `monto_asignado` int(11) DEFAULT NULL,
  `estado` varchar(255) NOT NULL DEFAULT 'PENDIENTE',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fondo_solidarios_campeonato_id_foreign` (`campeonato_id`),
  KEY `fondo_solidarios_fase_id_foreign` (`fase_id`),
  KEY `fondo_solidarios_club_id_foreign` (`club_id`),
  CONSTRAINT `fondo_solidarios_campeonato_id_foreign` FOREIGN KEY (`campeonato_id`) REFERENCES `campeonatos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fondo_solidarios_club_id_foreign` FOREIGN KEY (`club_id`) REFERENCES `clubes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fondo_solidarios_fase_id_foreign` FOREIGN KEY (`fase_id`) REFERENCES `fases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fondo_solidarios`
--

LOCK TABLES `fondo_solidarios` WRITE;
/*!40000 ALTER TABLE `fondo_solidarios` DISABLE KEYS */;
INSERT INTO `fondo_solidarios` VALUES (1,1,1,1,1,'17.123.456-7','Carlos Gutiérrez','Esguince grado 2 en tobillo derecho.','7_DIAS',2500,'APROBADO','2026-06-21 03:52:01','2026-06-21 03:52:01'),(2,1,1,2,2,'18.987.654-3','Luis Venegas','Desgarro isquiotibial pierna izquierda.','8_A_13_DIAS',3750,'APROBADO','2026-06-21 03:52:01','2026-06-21 03:52:01'),(3,1,1,3,4,'16.555.444-1','Miguel Rojas','Corte profundo en ceja, requiere sutura y reposo.','14_A_30_DIAS',5000,'APROBADO','2026-06-21 03:52:01','2026-06-21 03:52:01'),(4,1,1,4,5,'15.333.222-K','Jorge Pizarro','Fractura de peroné en jugada dividida.','SOLO_FRACTURA',10000,'APROBADO','2026-06-21 03:52:01','2026-06-21 03:52:01'),(5,1,1,5,6,'19.111.000-2','Pedro Sánchez','Pérdida familiar directo del jugador (padre).','PERDIDA_FAMILIAR',10000,'APROBADO','2026-06-21 03:52:01','2026-06-21 03:52:01');
/*!40000 ALTER TABLE `fondo_solidarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` smallint(5) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jugadores`
--

DROP TABLE IF EXISTS `jugadores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jugadores` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `rut` varchar(255) DEFAULT NULL,
  `nombre` varchar(255) NOT NULL,
  `club_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `jugadores_club_id_foreign` (`club_id`),
  CONSTRAINT `jugadores_club_id_foreign` FOREIGN KEY (`club_id`) REFERENCES `clubes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jugadores`
--

LOCK TABLES `jugadores` WRITE;
/*!40000 ALTER TABLE `jugadores` DISABLE KEYS */;
INSERT INTO `jugadores` VALUES (1,'15555555-5','Alexis Sánchez',1,'2026-06-21 03:08:41','2026-06-21 03:08:41'),(2,'16666666-6','Arturo Vidal',11,'2026-06-21 03:08:41','2026-06-21 03:08:41'),(3,'17777777-7','Claudio Bravo',16,'2026-06-21 03:08:41','2026-06-21 03:08:41'),(4,'18888888-8','Gary Medel',14,'2026-06-21 03:08:41','2026-06-21 03:08:41'),(5,'19999999-9','Eduardo Vargas',5,'2026-06-21 03:08:41','2026-06-21 03:08:41'),(6,'11111111-1','Franco Cortez O',13,'2026-09-17 00:58:30','2026-09-17 00:58:30');
/*!40000 ALTER TABLE `jugadores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_06_20_210805_create_jugadors_table',1),(5,'2026_06_20_210806_create_clubs_table',1),(6,'2026_06_20_210806_create_permission_tables',1),(7,'2026_06_20_210807_create_sancions_table',1),(8,'2026_06_20_210808_create_oficio_habilitacions_table',1),(9,'2026_06_20_213854_add_rut_and_club_id_to_jugadores_table',2),(10,'2026_06_20_215408_add_context_fields_to_sanciones_table',3),(11,'2026_06_20_220952_create_campeonatos_table',4),(12,'2026_06_20_220952_create_fases_table',4),(13,'2026_06_20_221013_alter_context_in_sanciones_table',4),(14,'2026_06_20_222223_add_tipo_falta_to_sanciones_table',5),(15,'2026_06_20_231727_create_nota_disciplinas_table',6),(16,'2026_06_20_232348_create_fondo_solidarios_table',7),(17,'2026_06_20_233700_add_tipo_beneficio_to_fondo_solidarios_table',8),(18,'2026_06_21_010525_create_configuracion_asociacion_table',9),(19,'2026_07_28_000000_create_casos_etica_table',10),(20,'2026_07_28_000001_add_articulo_and_tipo_involucrado_to_casos_etica_table',11),(21,'2026_07_28_000002_add_comision_firmantes_to_configuracion_asociacion_table',12),(22,'2026_08_15_000003_add_rut_to_configuracion_asociacion_table',13),(23,'2026_08_15_212500_create_referencia_oficios_table',14);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `model_has_permissions`
--

DROP TABLE IF EXISTS `model_has_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `model_has_permissions` (
  `permission_id` bigint(20) unsigned NOT NULL,
  `model_type` varchar(255) NOT NULL,
  `model_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`model_id`,`model_type`),
  KEY `model_has_permissions_model_id_model_type_index` (`model_id`,`model_type`),
  CONSTRAINT `model_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `model_has_permissions`
--

LOCK TABLES `model_has_permissions` WRITE;
/*!40000 ALTER TABLE `model_has_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `model_has_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `model_has_roles`
--

DROP TABLE IF EXISTS `model_has_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `model_has_roles` (
  `role_id` bigint(20) unsigned NOT NULL,
  `model_type` varchar(255) NOT NULL,
  `model_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`model_id`,`model_type`),
  KEY `model_has_roles_model_id_model_type_index` (`model_id`,`model_type`),
  CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `model_has_roles`
--

LOCK TABLES `model_has_roles` WRITE;
/*!40000 ALTER TABLE `model_has_roles` DISABLE KEYS */;
INSERT INTO `model_has_roles` VALUES (1,'App\\Models\\User',1),(3,'App\\Models\\User',1),(3,'App\\Models\\User',2),(4,'App\\Models\\User',3),(5,'App\\Models\\User',4),(6,'App\\Models\\User',5),(7,'App\\Models\\User',6),(8,'App\\Models\\User',7);
/*!40000 ALTER TABLE `model_has_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nota_disciplinas`
--

DROP TABLE IF EXISTS `nota_disciplinas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nota_disciplinas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `campeonato_id` bigint(20) unsigned NOT NULL,
  `fase_id` bigint(20) unsigned NOT NULL,
  `numero_fecha` int(11) NOT NULL,
  `club_id` bigint(20) unsigned DEFAULT NULL,
  `nota` text NOT NULL,
  `monto` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `nota_disciplinas_campeonato_id_foreign` (`campeonato_id`),
  KEY `nota_disciplinas_fase_id_foreign` (`fase_id`),
  KEY `nota_disciplinas_club_id_foreign` (`club_id`),
  CONSTRAINT `nota_disciplinas_campeonato_id_foreign` FOREIGN KEY (`campeonato_id`) REFERENCES `campeonatos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `nota_disciplinas_club_id_foreign` FOREIGN KEY (`club_id`) REFERENCES `clubes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `nota_disciplinas_fase_id_foreign` FOREIGN KEY (`fase_id`) REFERENCES `fases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nota_disciplinas`
--

LOCK TABLES `nota_disciplinas` WRITE;
/*!40000 ALTER TABLE `nota_disciplinas` DISABLE KEYS */;
INSERT INTO `nota_disciplinas` VALUES (1,1,1,2,5,'test',25000,'2026-06-21 03:31:40','2026-06-21 03:31:40'),(2,1,1,1,1,'Multa por atraso en presentación de equipo titular en cancha. 15 minutos.',10000,'2026-06-21 03:52:01','2026-06-21 03:52:01'),(3,1,1,1,2,'Observación sobre conducta de la barra local. Incidentes menores post-partido.',NULL,'2026-06-21 03:52:01','2026-06-21 03:52:01'),(4,1,1,2,4,'Amonestación escrita por falta de balones reglamentarios para calentamiento.',5000,'2026-06-21 03:52:01','2026-06-21 03:52:01'),(5,1,1,3,5,'Club no presentó planilla de jugadores firmada a tiempo. Sanción económica aplicada.',15000,'2026-06-21 03:52:01','2026-06-21 03:52:01'),(6,1,1,5,6,'Suspensión temporal del delegado por insultos al árbitro asistente. A la espera de resolución.',NULL,'2026-06-21 03:52:01','2026-06-21 03:52:01'),(7,1,1,1,1,'Multa por atraso en presentación de equipo titular en cancha. 15 minutos.',10000,'2026-08-15 22:16:14','2026-08-15 22:16:14'),(8,1,1,1,2,'Observación sobre conducta de la barra local. Incidentes menores post-partido.',NULL,'2026-08-15 22:16:14','2026-08-15 22:16:14'),(9,1,1,2,4,'Amonestación escrita por falta de balones reglamentarios para calentamiento.',5000,'2026-08-15 22:16:14','2026-08-15 22:16:14'),(10,1,1,3,5,'Club no presentó camilla . Sanción económica aplicada.',15000,'2026-08-15 22:16:14','2026-09-17 00:55:12'),(11,1,1,5,6,'Suspensión temporal del delegado por insultos al árbitro asistente. A la espera de resolución.',NULL,'2026-08-15 22:16:14','2026-08-15 22:16:14');
/*!40000 ALTER TABLE `nota_disciplinas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `oficios_habilitacion`
--

DROP TABLE IF EXISTS `oficios_habilitacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `oficios_habilitacion` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `sancion_id` bigint(20) unsigned NOT NULL,
  `folio` varchar(255) NOT NULL,
  `fecha_emision` date NOT NULL,
  `pdf_path` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `oficios_habilitacion_folio_unique` (`folio`),
  KEY `oficios_habilitacion_sancion_id_foreign` (`sancion_id`),
  CONSTRAINT `oficios_habilitacion_sancion_id_foreign` FOREIGN KEY (`sancion_id`) REFERENCES `sanciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oficios_habilitacion`
--

LOCK TABLES `oficios_habilitacion` WRITE;
/*!40000 ALTER TABLE `oficios_habilitacion` DISABLE KEYS */;
INSERT INTO `oficios_habilitacion` VALUES (1,3,'CED-2026-00001','2026-06-20','oficios/CED-2026-00001.pdf','2026-06-21 03:09:27','2026-06-21 03:09:27'),(2,5,'CED-2026-00002','2026-06-20','oficios/CED-2026-00002.pdf','2026-06-21 03:14:54','2026-06-21 03:14:54'),(3,4,'DISC-2026-00001','2026-06-21','oficios/DISC-2026-00001.pdf','2026-06-21 05:01:45','2026-06-21 05:01:45'),(5,6,'DISC-2026-00002','2026-09-16','oficios/DISC-2026-00002.pdf','2026-09-17 00:59:06','2026-09-17 00:59:06');
/*!40000 ALTER TABLE `oficios_habilitacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `guard_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (14,'ver clubes','web','2026-06-21 04:27:02','2026-06-21 04:27:02'),(15,'gestionar clubes','web','2026-06-21 04:27:02','2026-06-21 04:27:02'),(16,'ver jugadores','web','2026-06-21 04:27:02','2026-06-21 04:27:02'),(17,'gestionar jugadores','web','2026-06-21 04:27:02','2026-06-21 04:27:02'),(18,'ver torneos','web','2026-06-21 04:27:02','2026-06-21 04:27:02'),(19,'gestionar torneos','web','2026-06-21 04:27:02','2026-06-21 04:27:02'),(20,'ver tribunal','web','2026-06-21 04:27:02','2026-06-21 04:27:02'),(21,'gestionar sanciones','web','2026-06-21 04:27:02','2026-06-21 04:27:02'),(22,'gestionar notas','web','2026-06-21 04:27:02','2026-06-21 04:27:02'),(23,'gestionar fondos','web','2026-06-21 04:27:02','2026-06-21 04:27:02'),(24,'ver etica','web','2026-07-28 18:05:38','2026-07-28 18:05:38'),(25,'gestionar etica','web','2026-07-28 18:05:38','2026-07-28 18:05:38');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `referencias_oficio`
--

DROP TABLE IF EXISTS `referencias_oficio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `referencias_oficio` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `modulo` enum('GENERAL','TRIBUNAL','ETICA') NOT NULL DEFAULT 'GENERAL',
  `activa` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `referencias_oficio`
--

LOCK TABLES `referencias_oficio` WRITE;
/*!40000 ALTER TABLE `referencias_oficio` DISABLE KEYS */;
INSERT INTO `referencias_oficio` VALUES (1,'Comunica Resolución','GENERAL',1,'2026-08-16 01:24:55','2026-08-16 01:24:55'),(2,'Notificación de Sanción','TRIBUNAL',1,'2026-08-16 01:24:55','2026-08-16 01:24:55'),(3,'Notificación de Habilitación','GENERAL',1,'2026-08-16 01:24:55','2026-08-16 01:24:55'),(4,'Citación a Sesión Oficial','ETICA',1,'2026-08-16 01:24:55','2026-08-16 01:24:55'),(5,'Inhabilitación Preventiva','GENERAL',1,'2026-08-16 01:24:55','2026-08-16 01:24:55'),(6,'Apertura de Investigación','ETICA',1,'2026-08-16 01:24:55','2026-08-16 01:24:55'),(7,'Faltas al fair play y alteración del orden','GENERAL',1,'2026-08-16 01:24:55','2026-08-16 01:24:55'),(8,'Recurso de Reposición y Apelación','GENERAL',1,'2026-08-16 01:24:55','2026-08-16 01:24:55');
/*!40000 ALTER TABLE `referencias_oficio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_has_permissions`
--

DROP TABLE IF EXISTS `role_has_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_has_permissions` (
  `permission_id` bigint(20) unsigned NOT NULL,
  `role_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`role_id`),
  KEY `role_has_permissions_role_id_foreign` (`role_id`),
  CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_has_permissions`
--

LOCK TABLES `role_has_permissions` WRITE;
/*!40000 ALTER TABLE `role_has_permissions` DISABLE KEYS */;
INSERT INTO `role_has_permissions` VALUES (14,3),(14,4),(14,5),(14,7),(14,8),(15,3),(15,4),(16,3),(16,4),(16,5),(16,7),(16,8),(17,3),(17,7),(18,3),(18,4),(18,5),(18,7),(18,8),(19,3),(19,4),(20,3),(20,4),(20,5),(20,6),(20,7),(20,8),(21,3),(21,7),(22,3),(22,7),(23,3),(23,6),(24,3),(24,4),(24,5),(24,8),(25,3),(25,8);
/*!40000 ALTER TABLE `role_has_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `guard_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Administrador','web','2026-06-21 01:18:40','2026-06-21 01:18:40'),(2,'Tribunal_Disciplina','web','2026-06-21 01:18:40','2026-06-21 01:18:40'),(3,'Super admin','web','2026-06-21 03:58:18','2026-06-21 03:58:18'),(4,'Presidente','web','2026-06-21 03:58:18','2026-06-21 03:58:18'),(5,'Secretario','web','2026-06-21 03:58:18','2026-06-21 03:58:18'),(6,'Tesorero','web','2026-06-21 03:58:18','2026-06-21 03:58:18'),(7,'Comite disciplina','web','2026-06-21 03:58:18','2026-06-21 03:58:18'),(8,'Comite etica','web','2026-06-21 03:58:18','2026-06-21 03:58:18');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sanciones`
--

DROP TABLE IF EXISTS `sanciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sanciones` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `campeonato_id` bigint(20) unsigned DEFAULT NULL,
  `fase_id` bigint(20) unsigned DEFAULT NULL,
  `numero_fecha` int(11) DEFAULT NULL,
  `jugador_id` bigint(20) unsigned DEFAULT NULL,
  `club_id` bigint(20) unsigned NOT NULL,
  `articulo_reglamento` varchar(255) NOT NULL,
  `tipo_falta` varchar(255) DEFAULT NULL,
  `tipo_sancion` enum('PARTIDOS','TIEMPO') NOT NULL,
  `cantidad_sancion` int(11) NOT NULL,
  `unidad_tiempo` enum('PARTIDOS','MESES','AÑOS') NOT NULL,
  `fecha_resolucion` date NOT NULL,
  `partidos_cumplidos` int(11) NOT NULL DEFAULT 0,
  `fecha_termino_cronologica` date DEFAULT NULL,
  `estado` enum('ACTIVO','CUMPLIDO') NOT NULL DEFAULT 'ACTIVO',
  `observacion` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sanciones_jugador_id_foreign` (`jugador_id`),
  KEY `sanciones_club_id_foreign` (`club_id`),
  KEY `sanciones_campeonato_id_foreign` (`campeonato_id`),
  KEY `sanciones_fase_id_foreign` (`fase_id`),
  CONSTRAINT `sanciones_campeonato_id_foreign` FOREIGN KEY (`campeonato_id`) REFERENCES `campeonatos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sanciones_club_id_foreign` FOREIGN KEY (`club_id`) REFERENCES `clubes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sanciones_fase_id_foreign` FOREIGN KEY (`fase_id`) REFERENCES `fases` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sanciones_jugador_id_foreign` FOREIGN KEY (`jugador_id`) REFERENCES `jugadores` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sanciones`
--

LOCK TABLES `sanciones` WRITE;
/*!40000 ALTER TABLE `sanciones` DISABLE KEYS */;
INSERT INTO `sanciones` VALUES (1,1,1,1,1,1,'ART 211 LETRA A','Reclamos indebidos al árbitro','PARTIDOS',1,'PARTIDOS','2026-05-23',0,NULL,'ACTIVO','El jugador fue sancionado según el informe arbitral.','2026-06-21 03:08:41','2026-06-21 03:08:41'),(2,1,1,5,2,11,'ART 212 LETRA B','Juego brusco grave','PARTIDOS',3,'PARTIDOS','2026-06-09',0,NULL,'ACTIVO','El jugador fue sancionado según el informe arbitral.','2026-06-21 03:08:41','2026-06-21 03:08:41'),(3,1,1,5,3,16,'ART 213 LETRA C','Insultos a la barra contraria','PARTIDOS',2,'PARTIDOS','2026-05-30',0,NULL,'CUMPLIDO','El jugador fue sancionado según el informe arbitral.','2026-06-21 03:08:41','2026-06-21 03:08:41'),(4,1,1,2,4,14,'ART 215 LETRA A','Conducta violenta con agresión','TIEMPO',1,'AÑOS','2026-06-01',0,'2027-06-01','ACTIVO','El jugador fue sancionado según el informe arbitral.','2026-06-21 03:08:41','2026-06-21 03:08:41'),(5,1,1,3,5,5,'ART 216 LETRA D','Demora en la reanudación del juego','PARTIDOS',1,'PARTIDOS','2026-05-30',0,NULL,'CUMPLIDO','El jugador fue sancionado según el informe arbitral.','2026-06-21 03:08:41','2026-06-21 03:08:41'),(6,1,3,1,6,13,'ART 211 L C','Notificación de Sanción','PARTIDOS',3,'PARTIDOS','2026-09-17',0,NULL,'ACTIVO',NULL,'2026-09-17 00:58:30','2026-09-17 00:58:30');
/*!40000 ALTER TABLE `sanciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('fXc2UAg6XRIOjRCOn7EEz2cMfCdKoiZqQgWcIG8R',NULL,'127.0.0.1','curl/8.7.1','eyJfdG9rZW4iOiJsVFRwU2s0OWhDWTY3cUlhZDV4SE1KMjhKZFZvWEJzUXU2TnF5UW5TIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwXC9sb2dpbiIsInJvdXRlIjoibG9naW4ifSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==',1789604461),('GjEzFEz1GKpicEqSHFIaY0PSvAbRVQ2U4PYFPtCB',NULL,'127.0.0.1','curl/8.7.1','eyJfdG9rZW4iOiJhdkJHNWRzY3NPZmJZOU9JNmtDelVhMHNOMG9idTU3dk1rclFHRTlEIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1789604454),('iLWwa0BfrcnN16vImNY1rlB00I35950WIJrtEGHj',2,'127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','eyJfdG9rZW4iOiJHNlNFbE1oVlFxVWY3VVVwTUZRR0c3Q1dOVDN0ejlVaFpXcXZBNzFXIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwXC9ldGljYVwvNFwvb2ZpY2lvXC9SRVNPTFVDSU9OIiwicm91dGUiOiJldGljYS5vZmljaW8ifSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119LCJsb2dpbl93ZWJfNTliYTM2YWRkYzJiMmY5NDAxNTgwZjAxNGM3ZjU4ZWE0ZTMwOTg5ZCI6Mn0=',1790005442),('jXhuSIkYSWDGH12Wyu4WlAPLM9R2EW40PC63A0hP',2,'127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','eyJfdG9rZW4iOiJxMmlrb2hoN2xBRWZINGJ5d004SkV4d240OFR5VDl0dEt5eWJoTmpPIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwXC90cmlidW5hbFwvc2FuY2lvbmVzXC82XC9vZmljaW8iLCJyb3V0ZSI6InRyaWJ1bmFsLnNhbmNpb25lcy5vZmljaW8ifSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119LCJsb2dpbl93ZWJfNTliYTM2YWRkYzJiMmY5NDAxNTgwZjAxNGM3ZjU4ZWE0ZTMwOTg5ZCI6Mn0=',1789606746),('LLFs97n3fHAyOiDhcRpOJj9fhgC97qsJLzAtMsDW',NULL,'127.0.0.1','curl/8.7.1','eyJfdG9rZW4iOiJYWURla2RmRkRHZUtIRWx0NTNmU01OY091bU52STlvQ1lnaHdreVJJIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwXC9sb2dpbiIsInJvdXRlIjoibG9naW4ifSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==',1789604457),('XoYahYnenPG0eiFfOpy0YXLqYyzBdcVo5HHbBdds',NULL,'127.0.0.1','curl/8.7.1','eyJfdG9rZW4iOiJZWTdrRUFzbDBQS0RFNFMzM3JFbVdhVFBVYXZONm9kdkdpeG1oUVpYIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwXC9sb2dpbiIsInJvdXRlIjoibG9naW4ifSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==',1789604469);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin Tribunal','admin@anfa.cl','2026-06-21 01:18:40','$2y$12$L3iGrPoXC/S6cOnQBRNtme.gwGrDI8q8yNDt1aFLL/P74A2qzuyKO',NULL,'2026-06-21 01:18:40','2026-08-15 22:09:48'),(2,'Super Admin','jcornejo@proscom.cl',NULL,'$2y$12$RVwSMwiMvA4I1A53P6Dry.iI67vp6TXBpjvF.UKYE294vINcTC/pW',NULL,'2026-06-21 03:58:18','2026-07-28 21:20:31'),(3,'Presidente ASOC','presidente@pitazofinal.com',NULL,'$2y$12$UIekkIq3QJl0fUPhUWntwOJEwjciSs9Q5iBbPX2IlorfpHumwtNrK',NULL,'2026-06-21 03:58:18','2026-07-28 21:20:31'),(4,'Secretario ASOC','secretario@pitazofinal.com',NULL,'$2y$12$6Vjsj09u37pY1I4hqgS/K.tHzb4OAJezqIsGl.TIM7y15ZldHBsku',NULL,'2026-06-21 03:58:18','2026-07-28 21:20:31'),(5,'Tesorero ASOC','tesorero@pitazofinal.com',NULL,'$2y$12$6aEryyjooqJqW6O/ksSRQOineMDcJZY6pKchMxHP5ZENcbq2Sfeg6',NULL,'2026-06-21 03:58:19','2026-07-28 21:20:31'),(6,'Comité Disciplina','disciplina@pitazofinal.com',NULL,'$2y$12$KQ7Orex3vsZQPze3oXxlmOh6MYrfCnImHrWAA9URgPV65N9n5aYRe',NULL,'2026-06-21 03:58:19','2026-07-28 21:20:31'),(7,'Comité Ética','etica@pitazofinal.com',NULL,'$2y$12$/4cxmId1SwIWteXP2VtOXO4Nz4WahJ6tW2Dl/8epTPLX31E402ioi',NULL,'2026-06-21 03:58:19','2026-07-28 21:20:31'),(8,'Admin','admin@asociacion.cl',NULL,'$2y$12$YQAmHPAo.3V7J7X84oxoxuJOt24aYhCHTPT6SixVzWRNWUg9kfJ/u',NULL,'2026-08-16 01:32:51','2026-08-16 01:32:51');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-21 15:51:10
