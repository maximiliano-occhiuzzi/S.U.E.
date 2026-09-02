-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 02-09-2026 a las 12:29:32
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
(15, 6, 1, 4, 'persona_lesionada', 'critica', 'activa', 'peligro', 'Alumno caido en escalera', '2026-08-27 19:13:38', '2026-08-27 22:13:38', '2026-08-27 22:13:38');

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
(13, 1, 'simulacro', NULL, NULL, 'finalizado', '2026-08-29 22:32:46', '2026-08-29 22:32:47', '2026-08-30 01:32:46', '2026-08-30 01:32:47');

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
  `pin_hash` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre`, `email`, `password_hash`, `rol`, `activo`, `created_at`, `pin_hash`) VALUES
(1, 'Juan Pérez', 'director@fatimarem.edu.ar', '$2b$10$zc/YJTwON5YoaLl6VPdAVu16dLxYevMEFY2qq3ObA30ABd0AYQjae', 'directivo', 1, '2026-08-27 21:21:54', '$2b$10$G9VKPvSHpe1qNEe5lQloju5jLuE7Irgdz1EKreuhWiSuv8Oj/xlqu'),
(2, 'Maria Garcia', 'docente@fatimarem.edu.ar', '$2b$10$ETWZytJ225l3lh4Z72XVdOdz.3nc2NQ2b72eGfC.CsVwKROiWum5K', 'docente', 1, '2026-08-30 00:58:57', '$2b$10$GMTY3EM2Xcdf5NGQCD0xxusz2IIIq2sngPS4icWb1gpAarfClmKSW');

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
  MODIFY `id_reporte` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `sectores`
--
ALTER TABLE `sectores`
  MODIFY `id_sector` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `simulacros`
--
ALTER TABLE `simulacros`
  MODIFY `id_simulacro` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
