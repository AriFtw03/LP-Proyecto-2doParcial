CREATE DATABASE IF NOT EXISTS refugio_db;
USE refugio_db;

-- Tabla de Mascotas (APORTE: ARIANNA FEIJOO)
CREATE TABLE IF NOT EXISTS mascotas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    raza VARCHAR(50) DEFAULT 'Mestizo',
    estado_salud VARCHAR(100) DEFAULT 'No evaluado',
    estado_adopcion ENUM('disponible', 'en proceso', 'adoptado') DEFAULT 'disponible',
    fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mascota_estado (estado_adopcion),
    INDEX idx_mascota_especie (especie)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de Adopciones (APORTE: MATIAS COLLAGUAZO)
CREATE TABLE IF NOT EXISTS adopciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mascota_id INT NOT NULL,
    nombre_solicitante VARCHAR(100) NOT NULL,
    correo_contacto VARCHAR(100) NOT NULL,
    estado_solicitud ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_adopcion_estado (estado_solicitud),
    INDEX idx_adopcion_mascota (mascota_id),
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de Turnos (APORTE: DIEGO ALFONZO)
CREATE TABLE IF NOT EXISTS turnos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_voluntario VARCHAR(100) NOT NULL,
    tarea_asignada VARCHAR(150) NOT NULL,
    fecha_turno DATE NOT NULL,
    hora_inicio TIME DEFAULT '08:00:00',
    INDEX idx_turno_fecha (fecha_turno),
    INDEX idx_turno_voluntario (nombre_voluntario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Datos Semilla de Prueba (Opcional para inicialización rápida)
INSERT INTO mascotas (nombre, especie, raza, estado_salud, estado_adopcion)
SELECT 'Luna', 'Perro', 'Labrador Retriever', 'Vacunas al día, esterilizada', 'disponible'
WHERE NOT EXISTS (SELECT 1 FROM mascotas WHERE nombre = 'Luna');

INSERT INTO mascotas (nombre, especie, raza, estado_salud, estado_adopcion)
SELECT 'Milo', 'Gato', 'Siamés', 'Tratamiento antiparasitario completo', 'disponible'
WHERE NOT EXISTS (SELECT 1 FROM mascotas WHERE nombre = 'Milo');

INSERT INTO mascotas (nombre, especie, raza, estado_salud, estado_adopcion)
SELECT 'Rocky', 'Perro', 'Pastor Alemán', 'Saludable y enérgico', 'disponible'
WHERE NOT EXISTS (SELECT 1 FROM mascotas WHERE nombre = 'Rocky');
