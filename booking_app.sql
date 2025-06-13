-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 12-06-2025 a las 23:43:07
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Base de datos: `booking_app`
--

DELIMITER $$
--
-- Procedimientos
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `CrearReservaConServicios` (IN `p_ID_Usuario` INT, IN `p_ID_Paquete` INT, IN `p_Servicios` VARCHAR(255))   BEGIN
    DECLARE v_PrecioBase DECIMAL(10,2);
    DECLARE v_TotalServicios DECIMAL(10,2) DEFAULT 0;
    DECLARE v_TotalFinal DECIMAL(12,2);

    SELECT Precio_Base INTO v_PrecioBase
    FROM Paquete_Turistico
    WHERE ID_Paquete = p_ID_Paquete;

    IF p_Servicios IS NOT NULL AND p_Servicios != '' THEN
        SET @sql = CONCAT('SELECT SUM(Precio) INTO @suma FROM Servicio_Adicional WHERE ID_Servicio IN (', p_Servicios, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;

        SET v_TotalServicios = IFNULL(@suma, 0);
    END IF;

    SET v_TotalFinal = v_PrecioBase + v_TotalServicios;

    INSERT INTO Reserva (ID_Usuario, ID_Paquete, Fecha_Reserva, Total)
    VALUES (p_ID_Usuario, p_ID_Paquete, NOW(), v_TotalFinal);
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `paquete_turistico`
--

CREATE TABLE `paquete_turistico` (
  `ID_Paquete` int(11) NOT NULL,
  `Nombre` varchar(100) NOT NULL,
  `Destino` varchar(100) NOT NULL,
  `Descripcion` text DEFAULT NULL,
  `Precio_Base` decimal(10,2) NOT NULL,
  `Disponible` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reserva`
--

CREATE TABLE `reserva` (
  `ID_Reserva` int(11) NOT NULL,
  `ID_Usuario` int(11) DEFAULT NULL,
  `ID_Paquete` int(11) DEFAULT NULL,
  `Fecha_Reserva` datetime NOT NULL,
  `Total` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicio_adicional`
--

CREATE TABLE `servicio_adicional` (
  `ID_Servicio` int(11) NOT NULL,
  `ID_Paquete` int(11) DEFAULT NULL,
  `Tipo` enum('Traslado','Asistencia','Guía','Tour','Otros') NOT NULL,
  `Descripcion` text DEFAULT NULL,
  `Precio` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `ID_Usuario` int(11) NOT NULL,
  `Nombre` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `Contraseña` varchar(255) NOT NULL,
  `Fecha_Registro` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`ID_Usuario`, `Nombre`, `Email`, `Contraseña`, `Fecha_Registro`) VALUES
(3, 'tzaw', 'zawadskitiziano@gmail.com', '$2y$10$uNtu8FAmSpd22BUcfXHq4e8ZlIc9Pih1KzTc4/NfNP6n5vkVlTTdW', '2025-06-12');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `paquete_turistico`
--
ALTER TABLE `paquete_turistico`
  ADD PRIMARY KEY (`ID_Paquete`);

--
-- Indices de la tabla `reserva`
--
ALTER TABLE `reserva`
  ADD PRIMARY KEY (`ID_Reserva`),
  ADD KEY `ID_Usuario` (`ID_Usuario`),
  ADD KEY `ID_Paquete` (`ID_Paquete`);

--
-- Indices de la tabla `servicio_adicional`
--
ALTER TABLE `servicio_adicional`
  ADD PRIMARY KEY (`ID_Servicio`),
  ADD KEY `ID_Paquete` (`ID_Paquete`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`ID_Usuario`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `paquete_turistico`
--
ALTER TABLE `paquete_turistico`
  MODIFY `ID_Paquete` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `reserva`
--
ALTER TABLE `reserva`
  MODIFY `ID_Reserva` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `servicio_adicional`
--
ALTER TABLE `servicio_adicional`
  MODIFY `ID_Servicio` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `ID_Usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `reserva`
--
ALTER TABLE `reserva`
  ADD CONSTRAINT `reserva_ibfk_1` FOREIGN KEY (`ID_Usuario`) REFERENCES `usuario` (`ID_Usuario`) ON DELETE CASCADE,
  ADD CONSTRAINT `reserva_ibfk_2` FOREIGN KEY (`ID_Paquete`) REFERENCES `paquete_turistico` (`ID_Paquete`) ON DELETE CASCADE;

--
-- Filtros para la tabla `servicio_adicional`
--
ALTER TABLE `servicio_adicional`
  ADD CONSTRAINT `servicio_adicional_ibfk_1` FOREIGN KEY (`ID_Paquete`) REFERENCES `paquete_turistico` (`ID_Paquete`) ON DELETE CASCADE;
COMMIT;