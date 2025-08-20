-- Creación Base de Datos Patitas Conectadas
-- Eliminar base de datos si existe
DROP DATABASE IF EXISTS patitas_conectadas;

-- Crear base de datos
CREATE DATABASE patitas_conectadas;
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
);

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
  ciudad VARCHAR(100)
);

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
);

-- Crear tabla animales
CREATE TABLE animales (
  idanimal INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  especie VARCHAR(50) NOT NULL,
  raza VARCHAR(50),
  edad INT,
  sexo VARCHAR(10),
  tamaño VARCHAR(20),
  descripcion TEXT,
  fotos JSON,
  historial_medico TEXT,
  necesidades TEXT,
  esterilizacion BOOLEAN DEFAULT FALSE,
  adoptado BOOLEAN DEFAULT FALSE,
  id_refugio INT,
  FOREIGN KEY (id_refugio) REFERENCES refugios(idAsociacion)
);

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
);

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
);

-- Crear tabla seguimientos
CREATE TABLE seguimientos (
  idSeguimiento INT AUTO_INCREMENT PRIMARY KEY,
  idAdopcion INT,
  fechaSeguimiento DATE NOT NULL,
  estadoMascota VARCHAR(100),
  fotos JSON,
  comentarios TEXT,
  FOREIGN KEY (idAdopcion) REFERENCES adopciones(idAdopcion)
);

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
);

-- Crear tabla insumos_materiales
CREATE TABLE insumos_materiales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idLista INT,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  cantidad INT DEFAULT 1,
  completado BOOLEAN DEFAULT FALSE,
  idUsuarioDonante INT,
  id_refugio INT, -- Para saber a qué asociación pertenece el insumo
  FOREIGN KEY (idUsuarioDonante) REFERENCES usuarios(idUsuario),
  FOREIGN KEY (id_refugio) REFERENCES refugios(idAsociacion)
);

-- Roles
INSERT INTO roles (nombre) VALUES
('Adoptante'), 
('Refugio'), 
('Donante'),
('Usuario'),
('Admin');

-- Insertar un refugio de ejemplo
INSERT INTO refugios (nombre, descripcion, email, password, telefono, documentos_legales, rfc, informacion_contacto, direccion, ciudad)
VALUES ('Refugio Patitas', 'Refugio de animales', 'refugio@patitas.com', '12345678', '3312345678', 'Documentos aquí', 'RFC123456ABC', 'Contáctanos al 3312345678', 'Calle Falsa 123', 'Guadalajara');

-- Insertar un usuario adoptante ejemplo
INSERT INTO usuarios (nombre, apellido, email, password, telefono, direccion, fotoPerfil, id_rol, id_refugio)
VALUES ('Juan', 'Pérez', 'juanperez@mail.com', '12345678', '3312345678', 'Calle Ficticia 456', '"foto.jpg"', 1, 1);  -- 1 = Adoptante

-- Insertar animal ejemplo
INSERT INTO animales (nombre, especie, raza, edad, sexo, tamaño, descripcion, fotos, historial_medico, necesidades, esterilizacion, adoptado, id_refugio)
VALUES ('Firulais', 'Perro', 'Labrador', 3, 'Macho', 'Mediano', 'Perro muy amigable', '"foto1.jpg"', 'Vacunas al día', 'Requiere espacio', TRUE, FALSE, 1);

-- Insertar administradores
INSERT INTO usuarios (nombre, apellido, email, password, id_rol)
VALUES 
('Héctor', '', 'a22110141@ceti.mx', '22110141', 5),
('Galilea', '', 'a22110055@ceti.mx', '22110055', 5),
('Guillermo', '', 'a22110067@ceti.mx', '22110067', 5);