const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Crear directorio para imágenes si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static('uploads')); // Servir archivos estáticos

// Conexión a la base de datos
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'patitas_conectadas'
});

// Verifica la conexión
db.connect((err) => {
  if (err) {
    console.error('Error al conectar la base de datos:', err);
  } else {
    console.log('Conectado a la base de datos MySQL');
  }
});

// Función para guardar imagen base64
const guardarImagenBase64 = (base64Data, tipo) => {
  try {
    // Remover el prefijo data:image/...;base64,
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Formato de imagen inválido');
    }

    const imageBuffer = Buffer.from(matches[2], 'base64');
    const extension = matches[1].split('/')[1];
    const filename = `${tipo}-${Date.now()}.${extension}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, imageBuffer);
    return filename;
  } catch (error) {
    console.error('Error al guardar imagen:', error);
    return null;
  }
};

// Ruta para registrar usuario
app.post('/api/usuarios', (req, res) => {
  const { 
    nombre, 
    apellidos, 
    direccion, 
    correo, 
    contrasena, 
    numero, 
    curp, 
    imagen 
  } = req.body;

  // Validar campos requeridos
  if (!nombre || !apellidos || !direccion || !correo || !contrasena || !numero || !curp) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
  }

  // Verificar si el email ya existe
  const checkEmailSql = 'SELECT email FROM usuarios WHERE email = ?';
  db.query(checkEmailSql, [correo], (err, results) => {
    if (err) {
      console.error('Error al verificar email:', err);
      return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
    }

    if (results.length > 0) {
      return res.status(409).json({ mensaje: 'El correo ya está registrado' });
    }

    // Guardar imagen si existe
    let nombreImagen = null;
    if (imagen) {
      nombreImagen = guardarImagenBase64(imagen, 'usuario');
      if (!nombreImagen) {
        return res.status(400).json({ mensaje: 'Error al procesar la imagen' });
      }
    }

    // Insertar usuario en la base de datos
    const sql = `
      INSERT INTO usuarios 
      (nombre, apellido, email, password, telefono, direccion, fotoPerfil, id_rol) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const fotoPerfil = nombreImagen ? JSON.stringify(nombreImagen) : null;

    db.query(sql, [nombre, apellidos, correo, contrasena, numero, direccion, fotoPerfil, 4], (err, result) => {
      if (err) {
        console.error('Error al insertar usuario:', err);
        return res.status(500).json({ mensaje: 'Error al registrar usuario', error: err });
      }

      res.status(201).json({ 
        mensaje: 'Usuario registrado correctamente', 
        usuarioId: result.insertId 
      });
    });
  });
});

// Ruta para registrar asociación/refugio
app.post('/api/asociaciones', (req, res) => {
  const { 
    nombre, 
    responsable, 
    direccion, 
    correo, 
    telefono, 
    rfc, 
    logo 
  } = req.body;

  // Validar campos requeridos
  if (!nombre || !responsable || !direccion || !correo || !telefono || !rfc) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
  }

  // Verificar si el email ya existe
  const checkEmailSql = 'SELECT email FROM refugios WHERE email = ?';
  db.query(checkEmailSql, [correo], (err, results) => {
    if (err) {
      console.error('Error al verificar email:', err);
      return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
    }

    if (results.length > 0) {
      return res.status(409).json({ mensaje: 'El correo ya está registrado' });
    }

    // Guardar logo si existe
    let nombreLogo = null;
    if (logo) {
      nombreLogo = guardarImagenBase64(logo, 'refugio');
      if (!nombreLogo) {
        return res.status(400).json({ mensaje: 'Error al procesar el logo' });
      }
    }

    // Insertar refugio en la base de datos
    const sql = `
      INSERT INTO refugios 
      (nombre, descripcion, email, password, telefono, rfc, informacion_contacto, direccion) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Generar contraseña temporal (deberías implementar un sistema más seguro)
    const passwordTemporal = 'temp123';

    db.query(sql, [nombre, `Responsable: ${responsable}`, correo, passwordTemporal, telefono, rfc, responsable, direccion], (err, result) => {
      if (err) {
        console.error('Error al insertar refugio:', err);
        return res.status(500).json({ mensaje: 'Error al registrar asociación', error: err });
      }

      res.status(201).json({ 
        mensaje: 'Asociación registrada correctamente', 
        asociacionId: result.insertId 
      });
    });
  });
});

// Ruta para iniciar sesión (la que ya tenías)
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Faltan campos' });
  }

  const sql = 'SELECT * FROM usuarios WHERE email = ? AND password = ?';

  db.query(sql, [email, password], (err, resultados) => {
    if (err) {
      return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
    }

    if (resultados.length === 0) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    const usuario = resultados[0];
    return res.status(200).json({ mensaje: 'Inicio de sesión exitoso', usuario });
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Manejo de errores global
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
});