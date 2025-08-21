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
    descripcion,
    responsable, 
    direccion, 
    ciudad,
    correo, 
    contrasena,
    telefono, 
    rfc, 
    documentosLegales,
    logo 
  } = req.body;

  // Validar campos requeridos
  if (!nombre || !descripcion || !responsable || !direccion || !ciudad || !correo || !contrasena || !telefono || !rfc || !documentosLegales) {
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
      (nombre, descripcion, email, password, telefono, documentos_legales, rfc, informacion_contacto, direccion, ciudad) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
      nombre, 
      descripcion, 
      correo, 
      contrasena, // Ahora usamos la contraseña que envía el usuario
      telefono, 
      documentosLegales, 
      rfc, 
      responsable, 
      direccion, 
      ciudad
    ], (err, result) => {
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

// Ruta para iniciar sesión usuarios
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
    return res.status(200).json({ 
      mensaje: 'Inicio de sesión exitoso', 
      usuario,
      tipo: 'usuario'
    });
  });
});

// Ruta para iniciar sesión asociaciones/refugios
app.post('/api/login/refugio', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Faltan campos' });
  }

  const sql = 'SELECT * FROM refugios WHERE email = ? AND password = ?';

  db.query(sql, [email, password], (err, resultados) => {
    if (err) {
      return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
    }

    if (resultados.length === 0) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    const refugio = resultados[0];
    return res.status(200).json({ 
      mensaje: 'Inicio de sesión exitoso', 
      refugio,
      tipo: 'refugio'
    });
  });
});

// Ruta para obtener lista de refugios
app.get('/api/refugios', (req, res) => {
  const sql = 'SELECT idAsociacion, nombre FROM refugios';
  
  db.query(sql, (err, resultados) => {
    if (err) {
      console.error('Error al obtener refugios:', err);
      return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
    }
    
    res.status(200).json({ refugios: resultados });
  });
});

// Ruta para registrar donación monetaria
app.post('/api/donaciones/monetaria', (req, res) => {
  const { 
    id_usuario, 
    id_refugio, 
    monto 
  } = req.body;

  // Validar campos requeridos
  if (!id_usuario || !id_refugio || !monto) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios: id_usuario, id_refugio, monto' });
  }

  if (isNaN(monto) || parseFloat(monto) <= 0) {
    return res.status(400).json({ mensaje: 'El monto debe ser un número válido mayor a 0' });
  }

  // Verificar que el usuario existe
  const checkUserSql = 'SELECT idUsuario FROM usuarios WHERE idUsuario = ?';
  db.query(checkUserSql, [id_usuario], (err, userResults) => {
    if (err) {
      console.error('Error al verificar usuario:', err);
      return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Verificar que el refugio existe
    const checkRefugioSql = 'SELECT idAsociacion FROM refugios WHERE idAsociacion = ?';
    db.query(checkRefugioSql, [id_refugio], (err, refugioResults) => {
      if (err) {
        console.error('Error al verificar refugio:', err);
        return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
      }

      if (refugioResults.length === 0) {
        return res.status(404).json({ mensaje: 'Refugio no encontrado' });
      }

      // Insertar donación monetaria
      const sql = `
        INSERT INTO donaciones 
        (id_usuario, id_refugio, tipo, cantidad, fecha) 
        VALUES (?, ?, ?, ?, NOW())
      `;

      db.query(sql, [id_usuario, id_refugio, 'monetaria', parseFloat(monto)], (err, result) => {
        if (err) {
          console.error('Error al insertar donación monetaria:', err);
          return res.status(500).json({ mensaje: 'Error al registrar donación', error: err });
        }

        res.status(201).json({ 
          mensaje: 'Donación monetaria registrada correctamente', 
          donacionId: result.insertId,
          monto: parseFloat(monto)
        });
      });
    });
  });
});

// Ruta para registrar donación de insumos
app.post('/api/donaciones/insumos', (req, res) => {
  const { 
    id_usuario, 
    id_refugio, 
    nombre_insumo,
    descripcion,
    cantidad 
  } = req.body;

  // Validar campos requeridos
  if (!id_usuario || !id_refugio || !nombre_insumo || !cantidad) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios: id_usuario, id_refugio, nombre_insumo, cantidad' });
  }

  if (isNaN(cantidad) || parseFloat(cantidad) <= 0) {
    return res.status(400).json({ mensaje: 'La cantidad debe ser un número válido mayor a 0' });
  }

  // Verificar que el usuario existe
  const checkUserSql = 'SELECT idUsuario FROM usuarios WHERE idUsuario = ?';
  db.query(checkUserSql, [id_usuario], (err, userResults) => {
    if (err) {
      console.error('Error al verificar usuario:', err);
      return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Verificar que el refugio existe
    const checkRefugioSql = 'SELECT idAsociacion FROM refugios WHERE idAsociacion = ?';
    db.query(checkRefugioSql, [id_refugio], (err, refugioResults) => {
      if (err) {
        console.error('Error al verificar refugio:', err);
        return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
      }

      if (refugioResults.length === 0) {
        return res.status(404).json({ mensaje: 'Refugio no encontrado' });
      }

      // Insertar insumo en la tabla insumos_materiales
      const sql = `
        INSERT INTO insumos_materiales 
        (nombre, descripcion, cantidad, idUsuarioDonante, id_refugio) 
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(sql, [nombre_insumo, descripcion || '', parseInt(cantidad), id_usuario, id_refugio], (err, result) => {
        if (err) {
          console.error('Error al insertar insumo:', err);
          return res.status(500).json({ mensaje: 'Error al registrar donación de insumo', error: err });
        }

        res.status(201).json({ 
          mensaje: 'Donación de insumo registrada correctamente', 
          insumoId: result.insertId,
          nombre_insumo,
          cantidad: parseInt(cantidad)
        });
      });
    });
  });
});

// Ruta para obtener donaciones de un usuario
app.get('/api/donaciones/usuario/:id_usuario', (req, res) => {
  const { id_usuario } = req.params;

  // Obtener donaciones monetarias
  const sqlMonetarias = `
    SELECT d.*, r.nombre as nombre_refugio 
    FROM donaciones d 
    JOIN refugios r ON d.id_refugio = r.idAsociacion 
    WHERE d.id_usuario = ? AND d.tipo = 'monetaria'
    ORDER BY d.fecha DESC
  `;

  // Obtener donaciones de insumos
  const sqlInsumos = `
    SELECT i.*, r.nombre as nombre_refugio 
    FROM insumos_materiales i 
    JOIN refugios r ON i.id_refugio = r.idAsociacion 
    WHERE i.idUsuarioDonante = ?
    ORDER BY i.id DESC
  `;

  db.query(sqlMonetarias, [id_usuario], (err, donacionesMonetarias) => {
    if (err) {
      console.error('Error al obtener donaciones monetarias:', err);
      return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
    }

    db.query(sqlInsumos, [id_usuario], (err, donacionesInsumos) => {
      if (err) {
        console.error('Error al obtener donaciones de insumos:', err);
        return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
      }

      res.status(200).json({ 
        donacionesMonetarias,
        donacionesInsumos
      });
    });
  });
});

// Ruta para actualizar estado de insumo (para refugios)
app.put('/api/insumos/:id_insumo/completar', (req, res) => {
  const { id_insumo } = req.params;
  const { id_refugio } = req.body; // Para validar que el refugio puede actualizar este insumo

  if (!id_refugio) {
    return res.status(400).json({ mensaje: 'Se requiere id_refugio' });
  }

  // Verificar que el insumo pertenece al refugio
  const checkSql = 'SELECT * FROM insumos_materiales WHERE id = ? AND id_refugio = ?';
  
  db.query(checkSql, [id_insumo, id_refugio], (err, results) => {
    if (err) {
      console.error('Error al verificar insumo:', err);
      return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ mensaje: 'Insumo no encontrado o no pertenece a este refugio' });
    }

    // Actualizar estado del insumo
    const updateSql = 'UPDATE insumos_materiales SET completado = TRUE WHERE id = ?';
    
    db.query(updateSql, [id_insumo], (err, result) => {
      if (err) {
        console.error('Error al actualizar insumo:', err);
        return res.status(500).json({ mensaje: 'Error al actualizar insumo', error: err });
      }

      res.status(200).json({ 
        mensaje: 'Insumo marcado como completado',
        insumoId: id_insumo
      });
    });
  });
});

// Ruta para obtener insumos pendientes de un refugio
app.get('/api/refugio/:id_refugio/insumos-pendientes', (req, res) => {
  const { id_refugio } = req.params;

  const sql = `
    SELECT i.*, u.nombre as nombre_donante, u.telefono as telefono_donante 
    FROM insumos_materiales i 
    JOIN usuarios u ON i.idUsuarioDonante = u.idUsuario 
    WHERE i.id_refugio = ? AND i.completado = FALSE
    ORDER BY i.id DESC
  `;

  db.query(sql, [id_refugio], (err, insumos) => {
    if (err) {
      console.error('Error al obtener insumos pendientes:', err);
      return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
    }

    res.status(200).json({ 
      insumosPendientes: insumos
    });
  });
});
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