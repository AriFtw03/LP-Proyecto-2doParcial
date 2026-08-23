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
    foto_url VARCHAR(255) DEFAULT NULL,
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

-- Datos Semilla de Prueba (20 Mascotas)
INSERT INTO mascotas (nombre, especie, raza, estado_salud, estado_adopcion, foto_url) VALUES
('Luna', 'Perro', 'Golden Retriever', 'Vacunas al día, esterilizada', 'disponible', 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80'),
('Milo', 'Gato', 'Siamés', 'Tratamiento antiparasitario completo', 'disponible', 'https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=600&q=80'),
('Rocky', 'Perro', 'Pastor Alemán', 'Saludable y enérgico', 'disponible', 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&w=600&q=80'),
('Bella', 'Perro', 'Labrador Retriever', 'Esterilizada, microchip colocado', 'disponible', 'https://images.unsplash.com/photo-1529429617124-95b109e86bb8?auto=format&fit=crop&w=600&q=80'),
('Oliver', 'Gato', 'Atigrado Europeo', 'Desparasitado, excelente salud', 'disponible', 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80'),
('Toby', 'Perro', 'Beagle', 'Esquema de vacunación completo', 'disponible', 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&w=600&q=80'),
('Simona', 'Gato', 'Calicó', 'Esterilizada y muy dócil', 'disponible', 'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?auto=format&fit=crop&w=600&q=80'),
('Max', 'Perro', 'Husky Siberiano', 'Revisión veterinaria reciente', 'en proceso', 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?auto=format&fit=crop&w=600&q=80'),
('Lucas', 'Perro', 'Mestizo Criollo', 'Rescatado de la calle, muy sociable', 'disponible', NULL),
('Cleo', 'Gato', 'Común Negro', 'Vacunada y sociable', 'disponible', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80'),
('Bruno', 'Perro', 'Bulldog Francés', 'En tratamiento dermatológico leve', 'disponible', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80'),
('Nala', 'Gato', 'Persa Blanco', 'Pelaje cuidado, esterilizada', 'disponible', 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=600&q=80'),
('Pelusa', 'Otro', 'Conejo Mini Lop', 'Nutrición balanceada, dócil', 'disponible', 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=600&q=80'),
('Thor', 'Perro', 'Rottweiler', 'Entrenado, excelente temperamento', 'disponible', 'https://images.unsplash.com/photo-1567752881298-894bb81f9379?auto=format&fit=crop&w=600&q=80'),
('Mia', 'Gato', 'Azul Ruso', 'Tratamiento preventivo al día', 'disponible', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=600&q=80'),
('Manchas', 'Perro', 'Dálmata', 'Muy activo, vacunas completas', 'disponible', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80'),
('Canela', 'Perro', 'Mestizo', 'Recién ingresada al refugio, en evaluación', 'disponible', NULL),
('Tambor', 'Otro', 'Conejo Cabeza de León', 'Chequeo veterinario aprobado', 'disponible', NULL),
('Bigotes', 'Gato', 'Mestizo Romano', 'Esterilizado, rescate de parque', 'adoptado', NULL),
('Baloo', 'Perro', 'Boyero de Berna', 'Saludable, rescate de montaña', 'disponible', 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&w=600&q=80');
