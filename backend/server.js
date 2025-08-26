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

// Crear directorio para PDFs si no existe
const pdfDir = path.join(__dirname, 'uploads', 'pdfs');
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, 'uploads/pdfs/');
    } else {
      cb(null, 'uploads/');
    }
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

// Función para guardar archivos PDF
const guardarPDF = (archivo) => {
  try {
    const filename = `pdf-${Date.now()}-${archivo.nombre}`;
    const filepath = path.join(pdfDir, filename);
    
    // Aquí deberías implementar la lógica para guardar el archivo
    // Por ahora retornamos información del archivo
    return {
      filename: filename,
      originalName: archivo.nombre,
      size: archivo.size || 0,
      path: filepath
    };
  } catch (error) {
    console.error('Error al guardar PDF:', error);
    return null;
  }
};

// ============= RUTAS DE LOGIN =============

// Ruta para iniciar sesión usuarios
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Faltan campos' });
  }

  const sql = 'SELECT * FROM usuarios WHERE email = ? AND password = ? AND id_rol != 5';

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

// Ruta para iniciar sesión administradores
app.post('/api/login/admin', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Faltan campos' });
  }

  // Solo usuarios con id_rol = 5 (Admin) pueden acceder
  const sql = 'SELECT * FROM usuarios WHERE email = ? AND password = ? AND id_rol = 5';

  db.query(sql, [email, password], (err, resultados) => {
    if (err) {
      return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
    }

    if (resultados.length === 0) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas o no tienes permisos de administrador' });
    }

    const usuario = resultados[0];
    return res.status(200).json({ 
      mensaje: 'Inicio de sesión exitoso como administrador', 
      usuario,
      tipo: 'admin'
    });
  });
});

// ============= REGISTRO DE USUARIOS =============

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

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    return res.status(400).json({ mensaje: 'Formato de correo electrónico inválido' });
  }

  // Validar longitud de contraseña
  if (contrasena.length < 6) {
    return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
  }

  // Validar CURP
  if (curp.length !== 18) {
    return res.status(400).json({ mensaje: 'El CURP debe tener exactamente 18 caracteres' });
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
    archivosPDF,
    logo 
  } = req.body;

  // Validar campos requeridos
  if (!nombre || !descripcion || !responsable || !direccion || !ciudad || 
      !correo || !contrasena || !telefono || !rfc || !documentosLegales) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    return res.status(400).json({ mensaje: 'Formato de correo electrónico inválido' });
  }

  // Validar longitud de contraseña
  if (contrasena.length < 6) {
    return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
  }

  // Validar RFC
  if (rfc.length < 12 || rfc.length > 13) {
    return res.status(400).json({ mensaje: 'El RFC debe tener entre 12 y 13 caracteres' });
  }

  // Verificar si el email ya existe en refugios
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

    // Procesar archivos PDF si existen
    let archivosProcesados = [];
    if (archivosPDF && Array.isArray(archivosPDF)) {
      archivosProcesados = archivosPDF.map(archivo => ({
        nombre: archivo.nombre,
        size: archivo.size,
        type: archivo.type
      }));
    }

    // Insertar refugio en la base de datos
    const sql = `
      INSERT INTO refugios 
      (nombre, descripcion, email, password, telefono, documentos_legales, rfc, informacion_contacto, direccion, ciudad, archivos_pdf) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const archivosPDFJson = archivosProcesados.length > 0 ? JSON.stringify(archivosProcesados) : null;

    db.query(sql, [
      nombre, 
      descripcion, 
      correo, 
      contrasena,
      telefono, 
      documentosLegales, 
      rfc, 
      responsable, 
      direccion, 
      ciudad,
      archivosPDFJson
    ], (err, result) => {
      if (err) {
        console.error('Error al insertar refugio:', err);
        return res.status(500).json({ mensaje: 'Error al registrar asociación', error: err });
      }

      res.status(201).json({ 
        mensaje: 'Asociación registrada correctamente', 
        asociacionId: result.insertId,
        archivosPDF: archivosProcesados.length 
      });
    });
  });
});

// ============= RUTAS DE REFUGIOS =============

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

// ============= RUTAS DE DONACIONES =============

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

// ============= RUTAS DE PERFIL DE USUARIO =============

app.get('/api/user/:id', (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      idUsuario,
      nombre,
      apellido,
      email,
      telefono,
      direccion,
      fotoPerfil,
      id_rol 
    FROM usuarios 
    WHERE idUsuario = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Error al obtener usuario:', err);
      return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const usuario = results[0];
    
    // Si tiene foto de perfil, construir la URL completa
    if (usuario.fotoPerfil) {
      try {
        // La fotoPerfil está guardada como JSON, necesitamos parsearla
        const nombreArchivo = JSON.parse(usuario.fotoPerfil);
        usuario.imagen = `http://192.168.1.119:3000/uploads/${nombreArchivo}`;
      } catch (e) {
        console.error('Error al parsear fotoPerfil:', e);
        usuario.imagen = null;
      }
    } else {
      usuario.imagen = null;
    }

    res.status(200).json({
      idUsuario: usuario.idUsuario,
      name: `${usuario.nombre} ${usuario.apellido}`,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      telefono: usuario.telefono,
      direccion: usuario.direccion,
      imagen: usuario.imagen,
      id_rol: usuario.id_rol
    });
  });
});

// Ruta para actualizar datos del usuario
app.put('/api/user/:id', (req, res) => {
  const { id } = req.params;
  const { name, direccion, telefono, imagen } = req.body;

  // Separar nombre completo en nombre y apellido
  const nombreCompleto = name ? name.split(' ') : [];
  const nombre = nombreCompleto[0] || '';
  const apellido = nombreCompleto.slice(1).join(' ') || '';

  // Manejar la imagen
  let fotoPerfil = null;
  if (imagen) {
    // Si la imagen es una URL de nuestro servidor, extraer solo el nombre del archivo
    if (imagen.includes('http://192.168.1.119:3000/uploads/')) {
      const nombreArchivo = imagen.split('/uploads/')[1];
      fotoPerfil = JSON.stringify(nombreArchivo);
    } else if (imagen.startsWith('data:image/')) {
      // Si es una nueva imagen en base64, guardarla
      const nombreArchivo = guardarImagenBase64(imagen, 'perfil');
      if (nombreArchivo) {
        fotoPerfil = JSON.stringify(nombreArchivo);
      }
    } else if (imagen.startsWith('file://')) {
      // Si es una imagen local del dispositivo, necesitaríamos manejarla diferente
      // Por ahora, mantener la imagen anterior
      fotoPerfil = null;
    }
  }

  const sql = `
    UPDATE usuarios 
    SET nombre = ?, apellido = ?, telefono = ?, direccion = ?
    ${fotoPerfil ? ', fotoPerfil = ?' : ''}
    WHERE idUsuario = ?
  `;

  const params = fotoPerfil 
    ? [nombre, apellido, telefono, direccion, fotoPerfil, id]
    : [nombre, apellido, telefono, direccion, id];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error al actualizar usuario:', err);
      return res.status(500).json({ mensaje: 'Error al actualizar perfil', error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.status(200).json({ 
      mensaje: 'Perfil actualizado correctamente'
    });
  });
});

// Ruta para subir imagen de perfil
app.post('/api/user/:id/upload-image', upload.single('image'), (req, res) => {
  const { id } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ mensaje: 'No se recibió ninguna imagen' });
  }

  const fotoPerfil = JSON.stringify(req.file.filename);
  
  const sql = 'UPDATE usuarios SET fotoPerfil = ? WHERE idUsuario = ?';
  
  db.query(sql, [fotoPerfil, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar imagen:', err);
      return res.status(500).json({ mensaje: 'Error al guardar imagen', error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.status(200).json({ 
      mensaje: 'Imagen actualizada correctamente',
      imagenUrl: `http://192.168.1.119:3000/uploads/${req.file.filename}`
    });
  });
});

// ============= RUTAS ADICIONALES PARA ADMINISTRADORES =============

// Ruta para obtener estadísticas (para administradores)
app.get('/api/admin/estadisticas', (req, res) => {
  const estadisticas = {};
  
  // Contar usuarios
  const sqlUsuarios = 'SELECT COUNT(*) as total FROM usuarios WHERE id_rol != 5';
  
  // Contar refugios
  const sqlRefugios = 'SELECT COUNT(*) as total FROM refugios';
  
  // Contar donaciones
  const sqlDonaciones = 'SELECT COUNT(*) as total, SUM(cantidad) as total_monto FROM donaciones WHERE tipo = "monetaria"';
  
  // Contar insumos
  const sqlInsumos = 'SELECT COUNT(*) as total FROM insumos_materiales';

  db.query(sqlUsuarios, (err, resultUsuarios) => {
    if (err) {
      console.error('Error al obtener estadísticas de usuarios:', err);
      return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
    }
    
    estadisticas.usuarios = resultUsuarios[0].total;
    
    db.query(sqlRefugios, (err, resultRefugios) => {
      if (err) {
        console.error('Error al obtener estadísticas de refugios:', err);
        return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
      }
      
      estadisticas.refugios = resultRefugios[0].total;
      
      db.query(sqlDonaciones, (err, resultDonaciones) => {
        if (err) {
          console.error('Error al obtener estadísticas de donaciones:', err);
          return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
        }
        
        estadisticas.donaciones = resultDonaciones[0].total || 0;
        estadisticas.monto_total = resultDonaciones[0].total_monto || 0;
        
        db.query(sqlInsumos, (err, resultInsumos) => {
          if (err) {
            console.error('Error al obtener estadísticas de insumos:', err);
            return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
          }
          
          estadisticas.insumos = resultInsumos[0].total;
          
          res.status(200).json({ estadisticas });
        });
      });
    });
  });
});

// Ruta para obtener todos los usuarios (para administradores)
app.get('/api/admin/usuarios', (req, res) => {
  const sql = `
    SELECT 
      u.idUsuario,
      u.nombre,
      u.apellido,
      u.email,
      u.telefono,
      u.direccion,
      r.nombre as rol
    FROM usuarios u
    LEFT JOIN roles r ON u.id_rol = r.id
    WHERE u.id_rol != 5
    ORDER BY u.idUsuario DESC
  `;

  db.query(sql, (err, usuarios) => {
    if (err) {
      console.error('Error al obtener usuarios:', err);
      return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
    }

    res.status(200).json({ usuarios });
  });
});

// Ruta para obtener todos los refugios (para administradores)
app.get('/api/admin/refugios', (req, res) => {
  const sql = `
    SELECT 
      idAsociacion,
      nombre,
      descripcion,
      email,
      telefono,
      ciudad,
      direccion
    FROM refugios
    ORDER BY idAsociacion DESC
  `;

  db.query(sql, (err, refugios) => {
    if (err) {
      console.error('Error al obtener refugios:', err);
      return res.status(500).json({ mensaje: 'Error en el servidor', error: err });
    }

    res.status(200).json({ refugios });
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