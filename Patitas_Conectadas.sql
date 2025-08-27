-- Creación Base de Datos Patitas Conectadas - VERSION CORREGIDA
-- Eliminar base de datos si existe
DROP DATABASE IF EXISTS patitas_conectadas;

-- Crear base de datos
CREATE DATABASE patitas_conectadas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE patitas_conectadas;

-- Asegurarse de eliminar todas las tablas si existieran (en orden correcto por dependencias)
DROP TABLE IF EXISTS 
  seguimientos,
  adopciones,
  solicitudes_adopcion,
  animales,
  donaciones,
  insumos_materiales,
  usuarios,
  refugios,
  roles;

-- Crear tabla roles
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear tabla refugios
CREATE TABLE refugios (
  idAsociacion INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  documentos_legales TEXT,
  rfc VARCHAR(13),
  informacion_contacto TEXT,
  direccion TEXT,
  ciudad VARCHAR(100),
  archivos_pdf JSON
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear tabla usuarios
CREATE TABLE usuarios (
  idUsuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  apellido VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  direccion TEXT,
  fotoPerfil JSON,
  id_rol INT,
  id_refugio INT,
  FOREIGN KEY (id_rol) REFERENCES roles(id),
  FOREIGN KEY (id_refugio) REFERENCES refugios(idAsociacion)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear tabla animales
CREATE TABLE animales (
  idanimal INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  especie VARCHAR(50) NOT NULL,
  raza VARCHAR(50),
  edad INT,
  sexo VARCHAR(10),
  tamano VARCHAR(20),
  descripcion TEXT,
  fotos JSON,
  historial_medico TEXT,
  necesidades TEXT,
  esterilizacion BOOLEAN DEFAULT FALSE,
  adoptado BOOLEAN DEFAULT FALSE,
  id_refugio INT,
  FOREIGN KEY (id_refugio) REFERENCES refugios(idAsociacion)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear tabla solicitudes_adopcion
CREATE TABLE solicitudes_adopcion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idUsuario INT NOT NULL,
  idMascota INT NOT NULL,
  idAsociacion INT NOT NULL,
  estadoSolicitud VARCHAR(30) DEFAULT 'Pendiente',
  fechaAprobacion DATE,
  fechaEntrega DATE,
  FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario),
  FOREIGN KEY (idMascota) REFERENCES animales(idanimal),
  FOREIGN KEY (idAsociacion) REFERENCES refugios(idAsociacion)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear tabla adopciones
CREATE TABLE adopciones (
  idAdopcion INT AUTO_INCREMENT PRIMARY KEY,
  idUsuario INT NOT NULL,
  idMascota INT NOT NULL,
  idAsociacion INT NOT NULL,
  fechaAprobacion DATE NOT NULL,
  fechaEntrega DATE NOT NULL,
  observaciones TEXT,
  FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario),
  FOREIGN KEY (idMascota) REFERENCES animales(idanimal),
  FOREIGN KEY (idAsociacion) REFERENCES refugios(idAsociacion)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear tabla seguimientos
CREATE TABLE seguimientos (
  idSeguimiento INT AUTO_INCREMENT PRIMARY KEY,
  idAdopcion INT,
  fechaSeguimiento DATE NOT NULL,
  estadoMascota VARCHAR(100),
  fotos JSON,
  comentarios TEXT,
  FOREIGN KEY (idAdopcion) REFERENCES adopciones(idAdopcion)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear tabla donaciones
CREATE TABLE donaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT,
  id_refugio INT,
  tipo VARCHAR(30),
  cantidad NUMERIC(10,2),
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(idUsuario),
  FOREIGN KEY (id_refugio) REFERENCES refugios(idAsociacion)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear tabla insumos_materiales - CORREGIDA
CREATE TABLE insumos_materiales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  cantidad INT DEFAULT 1,
  completado BOOLEAN DEFAULT FALSE,
  idUsuarioDonante INT,
  id_refugio INT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idUsuarioDonante) REFERENCES usuarios(idUsuario),
  FOREIGN KEY (id_refugio) REFERENCES refugios(idAsociacion)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insertar roles
INSERT INTO roles (nombre) VALUES
('Adoptante'), 
('Refugio'), 
('Donante'),
('Usuario'),
('Admin');

-- Insertar refugios de ejemplo
INSERT INTO refugios (nombre, descripcion, email, password, telefono, documentos_legales, rfc, informacion_contacto, direccion, ciudad)
VALUES 
('Refugio Patitas Felices', 'Refugio de animales dedicado al cuidado y protección de perros y gatos abandonados', 'refugio@patitas.com', '12345678', '3312345678', 'Acta constitutiva y RFC vigente', 'RFC123456ABC', 'Contacto: refugio@patitas.com, Tel: 3312345678', 'Calle Falsa 123, Col. Centro', 'Guadalajara'),
('Hogar Animal Guadalajara', 'Asociación civil enfocada en rescate y adopción responsable', 'hogar@animal.org', 'refugio123', '3398765432', 'Registro ante CLUNI y documentos legales vigentes', 'HAG987654XYZ', 'Responsable: María García, hogar@animal.org', 'Av. Revolución 456, Col. Americana', 'Guadalajara'),
('Rescate Canino Zapopan', 'Organización dedicada al rescate de perros en situación de calle', 'rescate@zapopan.mx', 'canino2024', '3387654321', 'Registro como asociación civil vigente', 'RCZ456789DEF', 'Coordinador: Juan Pérez, rescate@zapopan.mx', 'Calle Independencia 789, Col. Centro', 'Zapopan');

-- Insertar usuarios adoptantes ejemplo
INSERT INTO usuarios (nombre, apellido, email, password, telefono, direccion, fotoPerfil, id_rol, id_refugio)
VALUES 
('Juan', 'Pérez González', 'juanperez@gmail.com', '12345678', '3312345678', 'Calle Ficticia 456, Col. Jardines', '"juan_foto.jpg"', 4, NULL),
('María', 'López Martínez', 'maria.lopez@hotmail.com', 'maria123', '3398765432', 'Av. Patria 123, Col. Providencia', '"maria_foto.jpg"', 4, NULL),
('Carlos', 'Ramírez Vega', 'carlos.ramirez@yahoo.com', 'carlos456', '3387654321', 'Calle Juárez 987, Col. Centro', '"carlos_foto.jpg"', 4, NULL);

-- Insertar animales ejemplo
INSERT INTO animales (nombre, especie, raza, edad, sexo, tamano, descripcion, fotos, historial_medico, necesidades, esterilizacion, adoptado, id_refugio)
VALUES 
('Firulais', 'Perro', 'Labrador Mixto', 3, 'Macho', 'Mediano', 'Perro muy amigable y juguetón, ideal para familias con niños', '["firulais1.jpg", "firulais2.jpg"]', 'Vacunas al día, desparasitado', 'Requiere espacio para correr y jugar', TRUE, FALSE, 1),
('Luna', 'Perro', 'Golden Retriever', 2, 'Hembra', 'Grande', 'Perra muy tranquila y obediente, perfecta para apartamento', '["luna1.jpg", "luna2.jpg"]', 'Todas las vacunas aplicadas, microchip colocado', 'Necesita caminatas diarias', TRUE, FALSE, 1),
('Mimi', 'Gato', 'Persa', 1, 'Hembra', 'Pequeño', 'Gata muy cariñosa y limpia, le gusta estar en interiores', '["mimi1.jpg"]', 'Vacunas completas, esterilizada', 'Requiere cuidados de pelaje regular', TRUE, FALSE, 2),
('Rocky', 'Perro', 'Pastor Alemán', 5, 'Macho', 'Grande', 'Perro protector y leal, ideal para casa con jardín', '["rocky1.jpg", "rocky2.jpg"]', 'Vacunado, tratamiento contra pulgas completado', 'Necesita ejercicio diario intenso', TRUE, FALSE, 3);

-- Insertar administradores del sistema
INSERT INTO usuarios (nombre, apellido, email, password, telefono, direccion, fotoPerfil, id_rol, id_refugio)
VALUES 
('Héctor', 'Admin Sistema', 'a22110141@ceti.mx', '22110141', '3312345678', 'CETI Colomos', NULL, 5, NULL),
('Galilea', 'Admin Sistema', 'a22110055@ceti.mx', '22110055', '3398765432', 'CETI Colomos', NULL, 5, NULL),
('Guillermo', 'Admin Sistema', 'a22110067@ceti.mx', '22110067', '3387654321', 'CETI Colomos', NULL, 5, NULL);

-- Insertar donaciones ejemplo
INSERT INTO donaciones (id_usuario, id_refugio, tipo, cantidad, fecha)
VALUES 
(1, 1, 'monetaria', 500.00, NOW()),
(2, 2, 'monetaria', 750.00, NOW()),
(3, 1, 'monetaria', 250.00, NOW());

-- Insertar insumos ejemplo
INSERT INTO insumos_materiales (nombre, descripcion, cantidad, completado, idUsuarioDonante, id_refugio)
VALUES 
('Alimento para perros', 'Croquetas para perro adulto, 20kg', 5, FALSE, 1, 1),
('Medicamentos', 'Antibióticos y antiparasitarios', 10, FALSE, 2, 2),
('Mantas y cobijas', 'Para mantener calientes a las mascotas', 15, TRUE, 3, 1),
('Juguetes para perros', 'Pelotas y huesos de juguete', 20, FALSE, 1, 3),
('Arena para gatos', 'Arena sanitaria para felinos, 10kg', 8, FALSE, 2, 2);

-- Insertar solicitudes de adopción ejemplo
INSERT INTO solicitudes_adopcion (idUsuario, idMascota, idAsociacion, estadoSolicitud, fechaAprobacion, fechaEntrega)
VALUES 
(1, 1, 1, 'Aprobada', '2024-01-15', '2024-01-20'),
(2, 2, 1, 'Pendiente', NULL, NULL),
(3, 4, 3, 'En proceso', NULL, NULL),
(1, 3, 2, 'Pendiente', NULL, NULL);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(id_rol);
CREATE INDEX idx_refugios_email ON refugios(email);
CREATE INDEX idx_animales_refugio ON animales(id_refugio);
CREATE INDEX idx_animales_adoptado ON animales(adoptado);
CREATE INDEX idx_donaciones_usuario ON donaciones(id_usuario);
CREATE INDEX idx_donaciones_refugio ON donaciones(id_refugio);
CREATE INDEX idx_insumos_refugio ON insumos_materiales(id_refugio);
CREATE INDEX idx_insumos_completado ON insumos_materiales(completado);

-- Verificar datos
SELECT 'Roles creados:' as info, COUNT(*) as cantidad FROM roles;
SELECT 'Refugios creados:' as info, COUNT(*) as cantidad FROM refugios;
SELECT 'Usuarios creados:' as info, COUNT(*) as cantidad FROM usuarios;
SELECT 'Animales creados:' as info, COUNT(*) as cantidad FROM animales;
SELECT 'Donaciones creadas:' as info, COUNT(*) as cantidad FROM donaciones;
SELECT 'Insumos creados:' as info, COUNT(*) as cantidad FROM insumos_materiales;