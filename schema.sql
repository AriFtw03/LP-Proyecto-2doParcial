-- Base de Datos refugio_db para Sistema de Gestión de Refugio de Mascotas
CREATE DATABASE IF NOT EXISTS refugio_db;
USE refugio_db;

-- Tabla de Mascotas
CREATE TABLE IF NOT EXISTS mascotas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    raza VARCHAR(50) DEFAULT 'Mestizo',
    estado_salud VARCHAR(100) DEFAULT 'No evaluado',
    estado_adopcion ENUM('disponible', 'en proceso', 'adoptado') DEFAULT 'disponible',
    fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de Adopciones
CREATE TABLE IF NOT EXISTS adopciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mascota_id INT NOT NULL,
    nombre_solicitante VARCHAR(100) NOT NULL,
    correo_contacto VARCHAR(100) NOT NULL,
    estado_solicitud ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de Turnos
CREATE TABLE IF NOT EXISTS turnos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_voluntario VARCHAR(100) NOT NULL,
    tarea_asignada VARCHAR(150) NOT NULL,
    fecha_turno DATE NOT NULL,
    hora_inicio TIME DEFAULT '08:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
