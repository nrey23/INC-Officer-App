-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: church_duty_db
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `fk_backup`
--

DROP TABLE IF EXISTS `fk_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fk_backup` (
  `CONSTRAINT_CATALOG` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_tolower_ci DEFAULT NULL,
  `CONSTRAINT_SCHEMA` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_tolower_ci DEFAULT NULL,
  `CONSTRAINT_NAME` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_tolower_ci DEFAULT NULL,
  `TABLE_SCHEMA` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_tolower_ci DEFAULT NULL,
  `TABLE_NAME` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_tolower_ci DEFAULT NULL,
  `CONSTRAINT_TYPE` varchar(11) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '',
  `ENFORCED` varchar(3) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fk_backup`
--

LOCK TABLES `fk_backup` WRITE;
/*!40000 ALTER TABLE `fk_backup` DISABLE KEYS */;
INSERT INTO `fk_backup` VALUES ('def','church_duty_db','PRIMARY','church_duty_db','tbl_member_roles','PRIMARY KEY','YES'),('def','church_duty_db','fk_member','church_duty_db','tbl_member_roles','FOREIGN KEY','YES'),('def','church_duty_db','fk_member_role_member','church_duty_db','tbl_member_roles','FOREIGN KEY','YES'),('def','church_duty_db','fk_member_role_role','church_duty_db','tbl_member_roles','FOREIGN KEY','YES'),('def','church_duty_db','fk_role','church_duty_db','tbl_member_roles','FOREIGN KEY','YES'),('def','church_duty_db','tbl_member_roles_ibfk_1','church_duty_db','tbl_member_roles','FOREIGN KEY','YES'),('def','church_duty_db','tbl_member_roles_ibfk_2','church_duty_db','tbl_member_roles','FOREIGN KEY','YES');
/*!40000 ALTER TABLE `fk_backup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_members`
--

DROP TABLE IF EXISTS `tbl_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_members` (
  `member_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `role` enum('Deacon','Deaconess','Choir','Secretary','Finance') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `qr_code_data` text,
  `contact_info` varchar(100) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  PRIMARY KEY (`member_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_members`
--

LOCK TABLES `tbl_members` WRITE;
/*!40000 ALTER TABLE `tbl_members` DISABLE KEYS */;
INSERT INTO `tbl_members` VALUES (1,'Niel Rey Licanda','Choir','Niel Rey Licanda-1745570601408','09067303490','Male','2004-12-23'),(2,'Irish Jane Maraviles','Choir','Irish Jane Maraviles-1745572997933','09455268741','Female','2001-02-07'),(3,'Marichu Licanda','Deaconess','Marichu Licanda-1745927508265','09050210367','Female','1973-12-28'),(4,'Othoniel Licanda','Deacon','Othoniel Licanda-1745927578716','09050210361','Male','1968-07-27'),(7,'Richniel Licanda','Choir','Richniel Licanda-1746172258817','09157337403','Male','2003-01-07'),(11,'Mariz Calamohoy','Choir','Mariz Calamohoy-1746328221160','09050210312','Female','2004-03-03');
/*!40000 ALTER TABLE `tbl_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_members_backup`
--

DROP TABLE IF EXISTS `tbl_members_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_members_backup` (
  `member_id` int NOT NULL DEFAULT '0',
  `full_name` varchar(100) NOT NULL,
  `role` enum('Deacon','Choir','Secretary','Finance') NOT NULL,
  `qr_code_data` text,
  `contact_info` varchar(100) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `birthday` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_members_backup`
--

LOCK TABLES `tbl_members_backup` WRITE;
/*!40000 ALTER TABLE `tbl_members_backup` DISABLE KEYS */;
INSERT INTO `tbl_members_backup` VALUES (1,'Niel Rey Licanda','Choir','Niel Rey Licanda-1745570601408','09067303490','Male','2004-12-23'),(2,'Irish Jane Maraviles','Choir','Irish Jane Maraviles-1745572997933','09455268741','Female','2001-02-07'),(3,'Marichu Licanda','Finance','Marichu Licanda-1745927508265','09050210367','Female','1973-12-28'),(4,'Othoniel Licanda','Deacon','Othoniel Licanda-1745927578716','09050210361','Male','1968-07-27'),(7,'Richniel Licanda','Choir','Richniel Licanda-1746172258817','09157337403','Male','2003-01-07'),(11,'Mariz Calamohoy','Choir','Mariz Calamohoy-1746328221160','09050210312','Female','2004-03-03');
/*!40000 ALTER TABLE `tbl_members_backup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_members_invalid`
--

DROP TABLE IF EXISTS `tbl_members_invalid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_members_invalid` (
  `member_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `qr_code_data` text,
  `contact_info` varchar(100) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  PRIMARY KEY (`member_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_members_invalid`
--

LOCK TABLES `tbl_members_invalid` WRITE;
/*!40000 ALTER TABLE `tbl_members_invalid` DISABLE KEYS */;
INSERT INTO `tbl_members_invalid` VALUES (1,'Niel Rey Licanda','Niel Rey Licanda-1745570601408','09067303490','Male','2004-12-23'),(2,'Irish Jane Maraviles','Irish Jane Maraviles-1745572997933','09455268741','Female','2001-02-07'),(3,'Marichu Licanda','Marichu Licanda-1745927508265','09050210367','Female','1973-12-28'),(4,'Othoniel Licanda','Othoniel Licanda-1745927578716','09050210361','Male','1968-07-27'),(7,'Richniel Licanda','Richniel Licanda-1746172258817','09157337403','Male','2003-01-07'),(11,'Mariz Calamohoy','Mariz Calamohoy-1746328221160','09050210312','Female','2004-03-03');
/*!40000 ALTER TABLE `tbl_members_invalid` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2b$10$W2bMzJaqKycNG/kQsbXXg.vI2dtowxwJ58Oe3iZKzE3vo1EroZTvy');
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

-- Dump completed on 2025-05-05  1:07:07
