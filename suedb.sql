-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 26-09-2026 a las 02:47:24
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `suedb`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `auditoria`
--

CREATE TABLE `auditoria` (
  `id_auditoria` int(10) UNSIGNED NOT NULL,
  `id_usuario` int(10) UNSIGNED DEFAULT NULL,
  `accion` varchar(100) NOT NULL,
  `recurso` varchar(100) DEFAULT NULL,
  `recurso_id` int(10) UNSIGNED DEFAULT NULL,
  `detalle` text DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `resultado` enum('ok','error') NOT NULL DEFAULT 'ok',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `incidencias`
--

CREATE TABLE `incidencias` (
  `id_reporte` int(10) UNSIGNED NOT NULL,
  `id_simulacro` int(10) UNSIGNED NOT NULL,
  `id_docente` int(10) UNSIGNED NOT NULL,
  `id_sector` int(10) UNSIGNED NOT NULL,
  `tipo_incidencia` enum('incendio','humo','acceso_bloqueado','persona_lesionada','otro') NOT NULL DEFAULT 'otro',
  `gravedad` enum('critica','moderada','informativa') NOT NULL DEFAULT 'informativa',
  `estado` enum('activa','atendida','resuelta','cancelada') NOT NULL DEFAULT 'activa',
  `estado_sector` enum('evacuado_ok','peligro','en_proceso') NOT NULL,
  `detalle` varchar(500) DEFAULT NULL,
  `fecha_reporte` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `incidencias`
--

INSERT INTO `incidencias` (`id_reporte`, `id_simulacro`, `id_docente`, `id_sector`, `tipo_incidencia`, `gravedad`, `estado`, `estado_sector`, `detalle`, `fecha_reporte`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 'incendio', 'critica', 'activa', 'peligro', 'Fuego en aula 1', '2026-08-27 18:22:55', '2026-08-27 21:22:55', '2026-08-27 21:22:55'),
(2, 1, 1, 2, 'humo', 'moderada', 'activa', 'en_proceso', 'Humo en pasillo', '2026-08-27 18:22:55', '2026-08-27 21:22:55', '2026-08-27 21:22:55'),
(3, 1, 1, 3, 'acceso_bloqueado', 'moderada', 'activa', 'evacuado_ok', 'Puerta trabada', '2026-08-27 18:22:55', '2026-08-27 21:22:55', '2026-08-27 21:22:55'),
(4, 4, 1, 1, 'incendio', 'critica', 'activa', 'peligro', 'Fuego en Aula 1', '2026-08-27 19:12:59', '2026-08-27 22:12:59', '2026-08-27 22:12:59'),
(5, 4, 1, 2, 'humo', 'moderada', 'activa', 'en_proceso', 'Humo en pasillo', '2026-08-27 19:12:59', '2026-08-27 22:12:59', '2026-08-27 22:12:59'),
(6, 4, 1, 3, 'acceso_bloqueado', 'moderada', 'activa', 'evacuado_ok', 'Puerta trabada escalera', '2026-08-27 19:12:59', '2026-08-27 22:12:59', '2026-08-27 22:12:59'),
(7, 4, 1, 4, 'persona_lesionada', 'critica', 'activa', 'peligro', 'Alumno caido en escalera', '2026-08-27 19:12:59', '2026-08-27 22:12:59', '2026-08-27 22:12:59'),
(8, 5, 1, 1, 'incendio', 'critica', 'activa', 'peligro', 'Fuego en Aula 1', '2026-08-27 19:13:20', '2026-08-27 22:13:20', '2026-08-27 22:13:20'),
(9, 5, 1, 2, 'humo', 'moderada', 'activa', 'en_proceso', 'Humo en pasillo', '2026-08-27 19:13:21', '2026-08-27 22:13:21', '2026-08-27 22:13:21'),
(10, 5, 1, 3, 'acceso_bloqueado', 'moderada', 'activa', 'evacuado_ok', 'Puerta trabada escalera', '2026-08-27 19:13:21', '2026-08-27 22:13:21', '2026-08-27 22:13:21'),
(11, 5, 1, 4, 'persona_lesionada', 'critica', 'activa', 'peligro', 'Alumno caido en escalera', '2026-08-27 19:13:21', '2026-08-27 22:13:21', '2026-08-27 22:13:21'),
(12, 6, 1, 1, 'incendio', 'critica', 'activa', 'peligro', 'Fuego en Aula 1', '2026-08-27 19:13:38', '2026-08-27 22:13:38', '2026-08-27 22:13:38'),
(13, 6, 1, 2, 'humo', 'moderada', 'activa', 'en_proceso', 'Humo en pasillo', '2026-08-27 19:13:38', '2026-08-27 22:13:38', '2026-08-27 22:13:38'),
(14, 6, 1, 3, 'acceso_bloqueado', 'moderada', 'activa', 'evacuado_ok', 'Puerta trabada escalera', '2026-08-27 19:13:38', '2026-08-27 22:13:38', '2026-08-27 22:13:38'),
(15, 6, 1, 4, 'persona_lesionada', 'critica', 'activa', 'peligro', 'Alumno caido en escalera', '2026-08-27 19:13:38', '2026-08-27 22:13:38', '2026-08-27 22:13:38'),
(16, 14, 1, 1, 'acceso_bloqueado', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-02 21:20:59', '2026-09-03 00:20:59', '2026-09-03 00:20:59'),
(17, 15, 1, 2, 'acceso_bloqueado', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-02 21:24:29', '2026-09-03 00:24:29', '2026-09-03 00:24:29'),
(18, 16, 1, 2, 'acceso_bloqueado', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-02 21:25:22', '2026-09-03 00:25:22', '2026-09-03 00:25:22'),
(19, 17, 1, 3, 'acceso_bloqueado', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-02 21:25:54', '2026-09-03 00:25:54', '2026-09-03 00:25:54'),
(20, 18, 1, 3, 'acceso_bloqueado', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-02 21:27:14', '2026-09-03 00:27:14', '2026-09-03 00:27:14'),
(21, 19, 1, 2, 'acceso_bloqueado', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-02 21:28:30', '2026-09-03 00:28:30', '2026-09-03 00:28:30'),
(22, 20, 1, 4, 'acceso_bloqueado', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-02 21:28:44', '2026-09-03 00:28:44', '2026-09-03 00:28:44'),
(23, 20, 1, 6, 'humo', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-02 21:28:56', '2026-09-03 00:28:56', '2026-09-03 00:28:56'),
(24, 20, 1, 6, 'incendio', 'critica', 'activa', 'en_proceso', NULL, '2026-09-02 21:29:05', '2026-09-03 00:29:05', '2026-09-03 00:29:05'),
(25, 20, 1, 5, 'persona_lesionada', 'critica', 'activa', 'en_proceso', NULL, '2026-09-02 21:29:19', '2026-09-03 00:29:19', '2026-09-03 00:29:19'),
(26, 20, 1, 4, 'otro', 'informativa', 'activa', 'en_proceso', NULL, '2026-09-02 21:29:37', '2026-09-03 00:29:37', '2026-09-03 00:29:37'),
(27, 22, 1, 1, 'acceso_bloqueado', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-02 21:30:06', '2026-09-03 00:30:06', '2026-09-03 00:30:06'),
(28, 22, 1, 2, 'humo', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-02 21:30:08', '2026-09-03 00:30:08', '2026-09-03 00:30:08'),
(29, 22, 1, 7, 'incendio', 'critica', 'activa', 'en_proceso', NULL, '2026-09-02 21:30:10', '2026-09-03 00:30:10', '2026-09-03 00:30:10'),
(30, 22, 1, 3, 'persona_lesionada', 'critica', 'activa', 'en_proceso', NULL, '2026-09-02 21:30:12', '2026-09-03 00:30:12', '2026-09-03 00:30:12'),
(31, 23, 1, 7, 'acceso_bloqueado', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-02 21:38:13', '2026-09-03 00:38:13', '2026-09-03 00:38:13'),
(32, 23, 1, 2, 'humo', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-02 21:38:17', '2026-09-03 00:38:17', '2026-09-03 00:38:17'),
(33, 23, 1, 9, 'acceso_bloqueado', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-02 21:38:20', '2026-09-03 00:38:20', '2026-09-03 00:38:20'),
(34, 23, 1, 3, 'persona_lesionada', 'critica', 'activa', 'en_proceso', NULL, '2026-09-02 21:38:21', '2026-09-03 00:38:21', '2026-09-03 00:38:21'),
(35, 24, 1, 3, 'humo', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-02 21:39:34', '2026-09-03 00:39:34', '2026-09-03 00:39:34'),
(36, 24, 1, 2, 'humo', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-02 21:40:22', '2026-09-03 00:40:22', '2026-09-03 00:40:22'),
(37, 24, 1, 7, 'persona_lesionada', 'critica', 'activa', 'en_proceso', NULL, '2026-09-02 21:40:37', '2026-09-03 00:40:37', '2026-09-03 00:40:37'),
(38, 25, 1, 3, 'acceso_bloqueado', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-02 21:52:11', '2026-09-03 00:52:11', '2026-09-03 00:52:11'),
(39, 25, 1, 2, 'humo', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-02 21:52:12', '2026-09-03 00:52:12', '2026-09-03 00:52:12'),
(40, 30, 1, 2, 'humo', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-02 21:54:33', '2026-09-03 00:54:33', '2026-09-03 00:54:33'),
(41, 30, 1, 1, 'acceso_bloqueado', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-02 21:54:34', '2026-09-03 00:54:34', '2026-09-03 00:54:34'),
(42, 30, 1, 10, 'persona_lesionada', 'critica', 'activa', 'en_proceso', NULL, '2026-09-02 21:54:38', '2026-09-03 00:54:38', '2026-09-03 00:54:38'),
(43, 30, 1, 7, 'incendio', 'critica', 'activa', 'en_proceso', NULL, '2026-09-02 21:54:40', '2026-09-03 00:54:40', '2026-09-03 00:54:40'),
(44, 30, 1, 10, 'otro', 'informativa', 'activa', 'en_proceso', NULL, '2026-09-02 21:54:42', '2026-09-03 00:54:42', '2026-09-03 00:54:42'),
(45, 31, 1, 2, 'acceso_bloqueado', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-03 19:22:27', '2026-09-03 22:22:27', '2026-09-03 22:22:27'),
(46, 32, 1, 9, 'incendio', 'critica', 'activa', 'en_proceso', NULL, '2026-09-03 19:37:04', '2026-09-03 22:37:04', '2026-09-03 22:37:04'),
(47, 38, 1, 9, 'incendio', 'critica', 'activa', 'en_proceso', NULL, '2026-09-03 19:41:34', '2026-09-03 22:41:34', '2026-09-03 22:41:34'),
(48, 41, 1, 2, 'incendio', 'critica', 'activa', 'en_proceso', NULL, '2026-09-23 17:18:13', '2026-09-23 20:18:13', '2026-09-23 20:18:13'),
(49, 42, 1, 1, 'acceso_bloqueado', 'moderada', 'activa', 'en_proceso', NULL, '2026-09-23 17:18:20', '2026-09-23 20:18:20', '2026-09-23 20:18:20'),
(50, 43, 1, 7, 'incendio', 'critica', 'activa', 'en_proceso', NULL, '2026-09-25 20:21:08', '2026-09-25 23:21:08', '2026-09-25 23:21:08'),
(51, 46, 3, 2, 'incendio', 'critica', 'activa', 'en_proceso', NULL, '2026-09-25 20:40:36', '2026-09-25 23:40:36', '2026-09-25 23:40:36');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sectores`
--

CREATE TABLE `sectores` (
  `id_sector` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sectores`
--

INSERT INTO `sectores` (`id_sector`, `nombre`, `descripcion`, `activo`, `created_at`) VALUES
(1, 'Aula 1 — Piso 1', 'Planta baja ala norte', 1, '2026-08-26 20:55:52'),
(2, 'Aula 2 — Piso 1', 'Planta baja ala sur', 1, '2026-08-26 20:55:52'),
(3, 'Aula 3 — Piso 2', 'Primer piso ala norte', 1, '2026-08-26 20:55:52'),
(4, 'Aula 4 — Piso 2', 'Primer piso ala sur', 1, '2026-08-26 20:55:52'),
(5, 'Taller de Mecánica', 'Planta baja taller', 1, '2026-08-26 20:55:52'),
(6, 'Laboratorio', 'Primer piso', 1, '2026-08-26 20:55:52'),
(7, 'Biblioteca', 'Planta baja', 1, '2026-08-26 20:55:52'),
(8, 'Patio central', 'Exterior', 1, '2026-08-26 20:55:52'),
(9, 'Dirección', 'Planta baja entrada', 1, '2026-08-26 20:55:52'),
(10, 'Escalera Norte', 'Acceso primer piso', 1, '2026-08-26 20:55:52');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `simulacros`
--

CREATE TABLE `simulacros` (
  `id_simulacro` int(10) UNSIGNED NOT NULL,
  `id_directivo` int(10) UNSIGNED NOT NULL,
  `tipo` enum('simulacro','emergencia') NOT NULL DEFAULT 'simulacro',
  `nombre` varchar(150) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `estado` enum('activo','finalizado','cancelado') NOT NULL DEFAULT 'activo',
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `simulacros`
--

INSERT INTO `simulacros` (`id_simulacro`, `id_directivo`, `tipo`, `nombre`, `observaciones`, `estado`, `fecha_inicio`, `fecha_fin`, `created_at`, `updated_at`) VALUES
(1, 1, 'simulacro', NULL, 'Prueba completa', 'finalizado', '2026-08-27 18:22:55', '2026-08-27 18:22:56', '2026-08-27 21:22:55', '2026-08-27 21:22:56'),
(2, 1, 'simulacro', NULL, 'Primero', 'finalizado', '2026-08-27 18:24:24', '2026-08-27 18:24:57', '2026-08-27 21:24:24', '2026-08-27 21:24:57'),
(3, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-08-27 18:25:14', '2026-08-27 18:25:48', '2026-08-27 21:25:14', '2026-08-27 21:25:48'),
(4, 1, 'simulacro', NULL, 'Simulacro mensual evacuacion incendio', 'finalizado', '2026-08-27 19:12:56', '2026-08-27 19:13:04', '2026-08-27 22:12:56', '2026-08-27 22:13:04'),
(5, 1, 'simulacro', NULL, 'Simulacro mensual evacuacion incendio', 'finalizado', '2026-08-27 19:13:17', '2026-08-27 19:13:25', '2026-08-27 22:13:17', '2026-08-27 22:13:25'),
(6, 1, 'simulacro', NULL, 'Simulacro mensual evacuacion incendio', 'finalizado', '2026-08-27 19:13:35', '2026-08-27 19:13:42', '2026-08-27 22:13:35', '2026-08-27 22:13:42'),
(7, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-08-29 22:26:05', '2026-08-29 22:26:07', '2026-08-30 01:26:05', '2026-08-30 01:26:07'),
(8, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-08-29 22:26:16', '2026-08-29 22:26:21', '2026-08-30 01:26:16', '2026-08-30 01:26:21'),
(9, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-08-29 22:26:22', '2026-08-29 22:26:23', '2026-08-30 01:26:22', '2026-08-30 01:26:23'),
(10, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-08-29 22:28:47', '2026-08-29 22:28:47', '2026-08-30 01:28:47', '2026-08-30 01:28:47'),
(11, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-08-29 22:29:43', '2026-08-29 22:29:44', '2026-08-30 01:29:43', '2026-08-30 01:29:44'),
(12, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-08-29 22:31:34', '2026-08-29 22:31:43', '2026-08-30 01:31:34', '2026-08-30 01:31:43'),
(13, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-08-29 22:32:46', '2026-08-29 22:32:47', '2026-08-30 01:32:46', '2026-08-30 01:32:47'),
(14, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-02 21:20:51', '2026-09-02 21:21:07', '2026-09-03 00:20:51', '2026-09-03 00:21:07'),
(15, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-02 21:24:27', '2026-09-02 21:25:18', '2026-09-03 00:24:27', '2026-09-03 00:25:18'),
(16, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-02 21:25:19', '2026-09-02 21:25:46', '2026-09-03 00:25:19', '2026-09-03 00:25:46'),
(17, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-02 21:25:52', '2026-09-02 21:26:03', '2026-09-03 00:25:52', '2026-09-03 00:26:03'),
(18, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-02 21:27:12', '2026-09-02 21:27:23', '2026-09-03 00:27:12', '2026-09-03 00:27:23'),
(19, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-02 21:28:28', '2026-09-02 21:28:35', '2026-09-03 00:28:28', '2026-09-03 00:28:35'),
(20, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-02 21:28:40', '2026-09-02 21:29:45', '2026-09-03 00:28:40', '2026-09-03 00:29:45'),
(21, 1, 'simulacro', NULL, 'sdsdsd', 'finalizado', '2026-09-02 21:29:48', '2026-09-02 21:29:51', '2026-09-03 00:29:48', '2026-09-03 00:29:51'),
(22, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-02 21:30:02', '2026-09-02 21:30:21', '2026-09-03 00:30:02', '2026-09-03 00:30:21'),
(23, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-02 21:38:06', '2026-09-02 21:38:59', '2026-09-03 00:38:06', '2026-09-03 00:38:59'),
(24, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-02 21:39:31', '2026-09-02 21:52:06', '2026-09-03 00:39:31', '2026-09-03 00:52:06'),
(25, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-02 21:52:08', '2026-09-02 21:53:26', '2026-09-03 00:52:08', '2026-09-03 00:53:26'),
(26, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-02 21:53:33', '2026-09-02 21:53:37', '2026-09-03 00:53:33', '2026-09-03 00:53:37'),
(27, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-02 21:53:40', '2026-09-02 21:53:41', '2026-09-03 00:53:40', '2026-09-03 00:53:41'),
(28, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-02 21:53:52', '2026-09-02 21:53:54', '2026-09-03 00:53:52', '2026-09-03 00:53:54'),
(29, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-02 21:53:57', '2026-09-02 21:54:00', '2026-09-03 00:53:57', '2026-09-03 00:54:00'),
(30, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-02 21:54:30', '2026-09-02 21:54:56', '2026-09-03 00:54:30', '2026-09-03 00:54:56'),
(31, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-03 19:22:23', '2026-09-03 19:22:42', '2026-09-03 22:22:23', '2026-09-03 22:22:42'),
(32, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-03 19:36:56', '2026-09-03 19:37:22', '2026-09-03 22:36:56', '2026-09-03 22:37:22'),
(33, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-03 19:37:23', '2026-09-03 19:37:24', '2026-09-03 22:37:23', '2026-09-03 22:37:24'),
(34, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-03 19:38:40', '2026-09-03 19:38:42', '2026-09-03 22:38:40', '2026-09-03 22:38:42'),
(35, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-03 19:41:05', '2026-09-03 19:41:18', '2026-09-03 22:41:05', '2026-09-03 22:41:18'),
(36, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-03 19:41:25', '2026-09-03 19:41:26', '2026-09-03 22:41:25', '2026-09-03 22:41:26'),
(37, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-03 19:41:29', '2026-09-03 19:41:30', '2026-09-03 22:41:29', '2026-09-03 22:41:30'),
(38, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-03 19:41:31', '2026-09-03 19:41:52', '2026-09-03 22:41:31', '2026-09-03 22:41:52'),
(39, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-03 19:43:21', '2026-09-03 19:43:22', '2026-09-03 22:43:21', '2026-09-03 22:43:22'),
(40, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-03 19:43:40', '2026-09-03 19:43:41', '2026-09-03 22:43:40', '2026-09-03 22:43:41'),
(41, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-23 17:18:10', '2026-09-23 17:18:14', '2026-09-23 20:18:10', '2026-09-23 20:18:14'),
(42, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-23 17:18:16', '2026-09-23 17:18:35', '2026-09-23 20:18:16', '2026-09-23 20:18:35'),
(43, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-25 20:20:56', '2026-09-25 20:21:13', '2026-09-25 23:20:56', '2026-09-25 23:21:13'),
(44, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-25 20:22:26', '2026-09-25 20:22:27', '2026-09-25 23:22:26', '2026-09-25 23:22:27'),
(45, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-25 20:22:29', '2026-09-25 20:22:56', '2026-09-25 23:22:29', '2026-09-25 23:22:56'),
(46, 3, 'simulacro', NULL, NULL, 'finalizado', '2026-09-25 20:40:14', '2026-09-25 20:40:44', '2026-09-25 23:40:14', '2026-09-25 23:40:44'),
(47, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-25 21:24:02', '2026-09-25 21:24:04', '2026-09-26 00:24:02', '2026-09-26 00:24:04'),
(48, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-25 21:25:52', '2026-09-25 21:26:18', '2026-09-26 00:25:52', '2026-09-26 00:26:18'),
(49, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-25 21:26:39', '2026-09-25 21:26:56', '2026-09-26 00:26:39', '2026-09-26 00:26:56'),
(50, 3, 'simulacro', NULL, NULL, 'finalizado', '2026-09-25 21:28:56', '2026-09-25 21:29:29', '2026-09-26 00:28:56', '2026-09-26 00:29:29'),
(51, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-09-25 21:29:54', '2026-09-25 21:30:02', '2026-09-26 00:29:54', '2026-09-26 00:30:02');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('directivo','docente') NOT NULL DEFAULT 'docente',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `pin_hash` varchar(255) DEFAULT NULL,
  `fcm_token` varchar(255) DEFAULT NULL COMMENT 'Token de Firebase Cloud Messaging del último dispositivo registrado'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre`, `email`, `password_hash`, `rol`, `activo`, `created_at`, `pin_hash`, `fcm_token`) VALUES
(1, 'Juan Pérez', 'director@fatimarem.edu.ar', '$2b$10$zc/YJTwON5YoaLl6VPdAVu16dLxYevMEFY2qq3ObA30ABd0AYQjae', 'directivo', 1, '2026-08-27 21:21:54', '$2b$10$RVRyb2vKhdU4Z76CuJawW.bYz7Y0uv.0GGzqh/HGpdh.9W1Iau8Ii', 'fyApTUNRQLO4MH9qgFEn9w:APA91bF0r2aTBseCXEIsxQ1mh03DCGWn9h4W7rzLc-yVE-t4Haa-vEpNO8PpAoAh3NFf8U8PmxbECLm-3tUzRg97HiYuXJBevhAq3g3-KGvMUjVV8hLzDXo'),
(2, 'Maria Garcia', 'docente@fatimarem.edu.ar', '$2b$10$ETWZytJ225l3lh4Z72XVdOdz.3nc2NQ2b72eGfC.CsVwKROiWum5K', 'docente', 1, '2026-08-30 00:58:57', '$2b$10$GMTY3EM2Xcdf5NGQCD0xxusz2IIIq2sngPS4icWb1gpAarfClmKSW', NULL),
(3, 'maximiliano occhiuzzi', 'maximiliano@fatimarem.edu.ar', '$2b$10$bJKlHnMwv5qHeJURmd30meIfE4QoP4bM7zbVKk2QhdaSCqh6RM/Aa', 'directivo', 1, '2026-09-23 20:25:21', '$2b$10$9ckxLbSer0toQFLTs8c5sOgBz4SBWetzCUEB6o16QZzeEoxWITs5a', NULL),
(4, 'Mariano Eito', 'MarianoEito@fatimarem.edu.ar', '$2b$10$RlG4Nqhz8UpBd2kdLRZPx.MwqsNP23Xn.mAlxIGZEyYCwzE53yqFG', 'directivo', 1, '2026-09-23 20:35:24', NULL, NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `auditoria`
--
ALTER TABLE `auditoria`
  ADD PRIMARY KEY (`id_auditoria`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `incidencias`
--
ALTER TABLE `incidencias`
  ADD PRIMARY KEY (`id_reporte`),
  ADD KEY `id_simulacro` (`id_simulacro`),
  ADD KEY `id_docente` (`id_docente`),
  ADD KEY `id_sector` (`id_sector`);

--
-- Indices de la tabla `sectores`
--
ALTER TABLE `sectores`
  ADD PRIMARY KEY (`id_sector`);

--
-- Indices de la tabla `simulacros`
--
ALTER TABLE `simulacros`
  ADD PRIMARY KEY (`id_simulacro`),
  ADD KEY `id_directivo` (`id_directivo`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `auditoria`
--
ALTER TABLE `auditoria`
  MODIFY `id_auditoria` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `incidencias`
--
ALTER TABLE `incidencias`
  MODIFY `id_reporte` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT de la tabla `sectores`
--
ALTER TABLE `sectores`
  MODIFY `id_sector` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `simulacros`
--
ALTER TABLE `simulacros`
  MODIFY `id_simulacro` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `auditoria`
--
ALTER TABLE `auditoria`
  ADD CONSTRAINT `auditoria_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL;

--
-- Filtros para la tabla `incidencias`
--
ALTER TABLE `incidencias`
  ADD CONSTRAINT `incidencias_ibfk_1` FOREIGN KEY (`id_simulacro`) REFERENCES `simulacros` (`id_simulacro`) ON DELETE CASCADE,
  ADD CONSTRAINT `incidencias_ibfk_2` FOREIGN KEY (`id_docente`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `incidencias_ibfk_3` FOREIGN KEY (`id_sector`) REFERENCES `sectores` (`id_sector`);

--
-- Filtros para la tabla `simulacros`
--
ALTER TABLE `simulacros`
  ADD CONSTRAINT `simulacros_ibfk_1` FOREIGN KEY (`id_directivo`) REFERENCES `usuarios` (`id_usuario`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
