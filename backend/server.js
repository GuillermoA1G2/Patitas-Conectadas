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

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conexión a la base de datos
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'patitas_conectadas'
});

db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conexión a la base de datos establecida');
});

// Rutas API

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API de Patitas Conectadas funcionando correctamente');
});

// Login para usuarios normales
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
  }
  
  db.query(
    'SELECT idUsuario, nombre, apellido, email, telefono, id_rol FROM usuarios WHERE email = ? AND password = ?',
    [email, password],
    (err, results) => {
      if (err) {
        console.error('Error en login:', err);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      }
      
      const usuario = results[0];
      res.json({
        success: true,
        message: 'Login exitoso',
        usuario: {
          id: usuario.idUsuario,
          idUsuario: usuario.idUsuario, // Mantener ambas por compatibilidad
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          telefono: usuario.telefono,
          rol: usuario.id_rol,
          id_rol: usuario.id_rol // Mantener ambas por compatibilidad
        }
      });
    }
  );
});

// Login para refugios/asociaciones
app.post('/api/login/refugio', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
  }
  
  db.query(
    'SELECT idAsociacion, nombre, email, telefono FROM refugios WHERE email = ? AND password = ?',
    [email, password],
    (err, results) => {
      if (err) {
        console.error('Error en login de refugio:', err);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      }
      
      const refugio = results[0];
      res.json({
        success: true,
        message: 'Login exitoso',
        refugio: {
          id: refugio.idAsociacion,
          idAsociacion: refugio.idAsociacion, // Mantener ambas por compatibilidad
          nombre: refugio.nombre,
          email: refugio.email,
          telefono: refugio.telefono,
          tipo: 'refugio'
        }
      });
    }
  );
});

// Login para administradores - CORREGIDO
app.post('/api/login/admin', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
  }
  
  db.query(
    'SELECT idUsuario, nombre, apellido, email, telefono, id_rol FROM usuarios WHERE email = ? AND password = ? AND id_rol = 5',
    [email, password],
    (err, results) => {
      if (err) {
        console.error('Error en login de admin:', err);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas o no es administrador' });
      }
      
      const admin = results[0];
      res.json({
        success: true,
        message: 'Login exitoso como administrador',
        usuario: { // Cambiado de 'admin' a 'usuario' para consistencia
          id: admin.idUsuario,
          idUsuario: admin.idUsuario, // Mantener ambas por compatibilidad
          nombre: admin.nombre,
          apellido: admin.apellido,
          email: admin.email,
          telefono: admin.telefono,
          rol: admin.id_rol,
          id_rol: admin.id_rol, // Mantener ambas por compatibilidad
          tipo: 'admin'
        }
      });
    }
  );
});

// Registro de usuarios
app.post('/api/usuarios', (req, res) => {
  const { nombre, apellido, email, password, telefono, direccion } = req.body;
  
  if (!nombre || !apellido || !email || !password) {
    return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
  }
  
  // Verificar si el email ya existe
  db.query(
    'SELECT email FROM usuarios WHERE email = ?',
    [email],
    (err, results) => {
      if (err) {
        console.error('Error al verificar email:', err);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
      }
      
      if (results.length > 0) {
        return res.status(409).json({ success: false, message: 'El email ya está registrado' });
      }
      
      // Insertar nuevo usuario
      db.query(
        'INSERT INTO usuarios (nombre, apellido, email, password, telefono, direccion, id_rol) VALUES (?, ?, ?, ?, ?, ?, 4)',
        [nombre, apellido, email, password, telefono, direccion],
        (err, result) => {
          if (err) {
            console.error('Error al registrar usuario:', err);
            return res.status(500).json({ success: false, message: 'Error al registrar usuario' });
          }
          
          res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente',
            usuario: {
              id: result.insertId,
              nombre,
              apellido,
              email
            }
          });
        }
      );
    }
  );
});

// Registro de asociaciones/refugios
app.post('/api/asociaciones', (req, res) => {
  const { nombre, descripcion, email, password, telefono, direccion, ciudad } = req.body;
  
  if (!nombre || !email || !password) {
    return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
  }
  
  // Verificar si el email ya existe
  db.query(
    'SELECT email FROM refugios WHERE email = ?',
    [email],
    (err, results) => {
      if (err) {
        console.error('Error al verificar email:', err);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
      }
      
      if (results.length > 0) {
        return res.status(409).json({ success: false, message: 'El email ya está registrado' });
      }
      
      // Insertar nuevo refugio
      db.query(
        'INSERT INTO refugios (nombre, descripcion, email, password, telefono, direccion, ciudad) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nombre, descripcion, email, password, telefono, direccion, ciudad],
        (err, result) => {
          if (err) {
            console.error('Error al registrar refugio:', err);
            return res.status(500).json({ success: false, message: 'Error al registrar refugio' });
          }
          
          res.status(201).json({
            success: true,
            message: 'Refugio registrado correctamente',
            refugio: {
              id: result.insertId,
              nombre,
              email
            }
          });
        }
      );
    }
  );
});

// Obtener todos los refugios
app.get('/api/refugios', (req, res) => {
  db.query(
    'SELECT idAsociacion, nombre, descripcion, email, telefono, direccion, ciudad FROM refugios',
    (err, results) => {
      if (err) {
        console.error('Error al obtener refugios:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener refugios' });
      }
      
      res.json({
        success: true,
        refugios: results
      });
    }
  );
});

// Registrar donación de insumos
app.post('/api/donaciones/insumos', (req, res) => {
  const { idUsuarioDonante, id_refugio, nombre, descripcion, cantidad } = req.body;
  
  if (!idUsuarioDonante || !id_refugio || !nombre || !cantidad) {
    return res.status(400).json({ 
      success: false, 
      message: 'Faltan campos obligatorios: idUsuarioDonante, id_refugio, nombre, cantidad' 
    });
  }
  
  // Verificar que el usuario existe
  db.query(
    'SELECT idUsuario FROM usuarios WHERE idUsuario = ?',
    [idUsuarioDonante],
    (err, userResults) => {
      if (err) {
        console.error('Error al verificar usuario:', err);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
      }
      
      if (userResults.length === 0) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      
      // Verificar que el refugio existe
      db.query(
        'SELECT idAsociacion FROM refugios WHERE idAsociacion = ?',
        [id_refugio],
        (err, refugioResults) => {
          if (err) {
            console.error('Error al verificar refugio:', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
          }
          
          if (refugioResults.length === 0) {
            return res.status(404).json({ success: false, message: 'Refugio no encontrado' });
          }
          
          // Insertar donación de insumos
          db.query(
            'INSERT INTO insumos_materiales (idUsuarioDonante, id_refugio, nombre, descripcion, cantidad, completado) VALUES (?, ?, ?, ?, ?, FALSE)',
            [idUsuarioDonante, id_refugio, nombre, descripcion || nombre, cantidad],
            (err, result) => {
              if (err) {
                console.error('Error al registrar donación de insumos:', err);
                return res.status(500).json({ success: false, message: 'Error al registrar donación' });
              }
              
              res.status(201).json({
                success: true,
                message: 'Donación de insumos registrada correctamente',
                donacion: {
                  id: result.insertId,
                  idUsuarioDonante,
                  id_refugio,
                  nombre,
                  descripcion,
                  cantidad,
                  completado: false
                }
              });
            }
          );
        }
      );
    }
  );
});

// Registrar donación monetaria
app.post('/api/donaciones/monetaria', (req, res) => {
  const { id_usuario, id_refugio, tipo, cantidad } = req.body;
  
  if (!id_usuario || !id_refugio || !tipo || !cantidad) {
    return res.status(400).json({ 
      success: false, 
      message: 'Faltan campos obligatorios: id_usuario, id_refugio, tipo, cantidad' 
    });
  }
  
  if (parseFloat(cantidad) < 10) {
    return res.status(400).json({ 
      success: false, 
      message: 'El monto mínimo de donación es $10' 
    });
  }
  
  // Verificar que el usuario existe
  db.query(
    'SELECT idUsuario FROM usuarios WHERE idUsuario = ?',
    [id_usuario],
    (err, userResults) => {
      if (err) {
        console.error('Error al verificar usuario:', err);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
      }
      
      if (userResults.length === 0) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      
      // Verificar que el refugio existe
      db.query(
        'SELECT idAsociacion FROM refugios WHERE idAsociacion = ?',
        [id_refugio],
        (err, refugioResults) => {
          if (err) {
            console.error('Error al verificar refugio:', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
          }
          
          if (refugioResults.length === 0) {
            return res.status(404).json({ success: false, message: 'Refugio no encontrado' });
          }
          
          // Insertar donación monetaria
          db.query(
            'INSERT INTO donaciones (id_usuario, id_refugio, tipo, cantidad, fecha) VALUES (?, ?, ?, ?, NOW())',
            [id_usuario, id_refugio, tipo, parseFloat(cantidad)],
            (err, result) => {
              if (err) {
                console.error('Error al registrar donación monetaria:', err);
                return res.status(500).json({ success: false, message: 'Error al registrar donación' });
              }
              
              res.status(201).json({
                success: true,
                message: 'Donación monetaria registrada correctamente',
                donacion: {
                  id: result.insertId,
                  id_usuario,
                  id_refugio,
                  tipo,
                  cantidad: parseFloat(cantidad),
                  fecha: new Date()
                }
              });
            }
          );
        }
      );
    }
  );
});

// Obtener donaciones de un usuario específico
app.get('/api/usuario/:id/donaciones', (req, res) => {
  const { id } = req.params;
  
  // Obtener donaciones monetarias
  const queryMonetarias = `
    SELECT d.id, d.tipo, d.cantidad, d.fecha, r.nombre as refugio_nombre
    FROM donaciones d
    JOIN refugios r ON d.id_refugio = r.idAsociacion
    WHERE d.id_usuario = ?
    ORDER BY d.fecha DESC
  `;
  
  // Obtener donaciones de insumos
  const queryInsumos = `
    SELECT i.id, i.nombre, i.descripcion, i.cantidad, i.completado, r.nombre as refugio_nombre
    FROM insumos_materiales i
    JOIN refugios r ON i.id_refugio = r.idAsociacion
    WHERE i.idUsuarioDonante = ?
    ORDER BY i.id DESC
  `;
  
  db.query(queryMonetarias, [id], (err, donacionesMonetarias) => {
    if (err) {
      console.error('Error al obtener donaciones monetarias:', err);
      return res.status(500).json({ success: false, message: 'Error al obtener donaciones' });
    }
    
    db.query(queryInsumos, [id], (err, donacionesInsumos) => {
      if (err) {
        console.error('Error al obtener donaciones de insumos:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener donaciones' });
      }
      
      res.json({
        success: true,
        donacionesMonetarias,
        donacionesInsumos
      });
    });
  });
});

// Obtener todas las donaciones para un refugio específico
app.get('/api/refugio/:id/donaciones', (req, res) => {
  const { id } = req.params;
  
  // Obtener donaciones monetarias recibidas
  const queryMonetarias = `
    SELECT d.id, d.tipo, d.cantidad, d.fecha, u.nombre, u.apellido, u.email
    FROM donaciones d
    JOIN usuarios u ON d.id_usuario = u.idUsuario
    WHERE d.id_refugio = ?
    ORDER BY d.fecha DESC
  `;
  
  // Obtener donaciones de insumos recibidas
  const queryInsumos = `
    SELECT i.id, i.nombre, i.descripcion, i.cantidad, i.completado, u.nombre, u.apellido, u.telefono
    FROM insumos_materiales i
    JOIN usuarios u ON i.idUsuarioDonante = u.idUsuario
    WHERE i.id_refugio = ?
    ORDER BY i.id DESC
  `;
  
  db.query(queryMonetarias, [id], (err, donacionesMonetarias) => {
    if (err) {
      console.error('Error al obtener donaciones monetarias:', err);
      return res.status(500).json({ success: false, message: 'Error al obtener donaciones' });
    }
    
    db.query(queryInsumos, [id], (err, donacionesInsumos) => {
      if (err) {
        console.error('Error al obtener donaciones de insumos:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener donaciones' });
      }
      
      res.json({
        success: true,
        donacionesMonetarias,
        donacionesInsumos
      });
    });
  });
});

// Obtener insumos pendientes para un refugio
app.get('/api/refugio/:id/insumos-pendientes', (req, res) => {
  const { id } = req.params;
  
  db.query(
    `SELECT i.*, u.nombre as nombre_donante, u.telefono as telefono_donante
     FROM insumos_materiales i
     LEFT JOIN usuarios u ON i.idUsuarioDonante = u.idUsuario
     WHERE i.id_refugio = ? AND i.completado = FALSE`,
    [id],
    (err, results) => {
      if (err) {
        console.error('Error al obtener insumos pendientes:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener insumos' });
      }
      
      res.json({
        success: true,
        insumosPendientes: results
      });
    }
  );
});

// Marcar insumo como completado
app.put('/api/insumos/:id/completar', (req, res) => {
  const { id } = req.params;
  const { id_refugio } = req.body;
  
  // Verificar que el insumo pertenezca al refugio
  db.query(
    'SELECT id FROM insumos_materiales WHERE id = ? AND id_refugio = ?',
    [id, id_refugio],
    (err, results) => {
      if (err) {
        console.error('Error al verificar insumo:', err);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'Insumo no encontrado o no pertenece a este refugio' });
      }
      
      // Actualizar estado del insumo
      db.query(
        'UPDATE insumos_materiales SET completado = TRUE WHERE id = ?',
        [id],
        (err, result) => {
          if (err) {
            console.error('Error al actualizar insumo:', err);
            return res.status(500).json({ success: false, message: 'Error al actualizar insumo' });
          }
          
          res.json({
            success: true,
            message: 'Insumo marcado como completado'
          });
        }
      );
    }
  );
});

// Get refuge details
app.get('/api/refugio/:id', (req, res) => {
  const { id } = req.params;
  
  db.query(
    'SELECT * FROM refugios WHERE idAsociacion = ?',
    [id],
    (err, results) => {
      if (err) {
        console.error('Error al obtener datos del refugio:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener datos del refugio' });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'Refugio no encontrado' });
      }
      
      // Don't send password to client
      const refugio = results[0];
      delete refugio.password;
      
      res.json({ success: true, refugio });
    }
  );
});

// Update refuge profile
app.put('/api/refugio/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, email, telefono, descripcion, direccion, ciudad } = req.body;
  
  // Validate required fields
  if (!nombre || !email) {
    return res.status(400).json({ success: false, message: 'Nombre y email son obligatorios' });
  }
  
  // Check if email is being changed and if it already exists
  db.query(
    'SELECT email FROM refugios WHERE email = ? AND idAsociacion != ?',
    [email, id],
    (err, results) => {
      if (err) {
        console.error('Error al verificar email:', err);
        return res.status(500).json({ success: false, message: 'Error al verificar email' });
      }
      
      if (results.length > 0) {
        return res.status(409).json({ success: false, message: 'El email ya está en uso por otro refugio' });
      }
      
      // Update refuge in database
      db.query(
        `UPDATE refugios 
         SET nombre = ?, email = ?, telefono = ?, descripcion = ?, direccion = ?, ciudad = ?
         WHERE idAsociacion = ?`,
        [nombre, email, telefono, descripcion, direccion, ciudad, id],
        (err, result) => {
          if (err) {
            console.error('Error al actualizar refugio:', err);
            return res.status(500).json({ success: false, message: 'Error al actualizar el perfil' });
          }
          
          res.json({ success: true, message: 'Perfil actualizado correctamente' });
        }
      );
    }
  );
});

// Obtener animales disponibles para adopción
app.get('/api/animales', (req, res) => {
  const query = `
    SELECT a.*, r.nombre as refugio_nombre, r.telefono as refugio_telefono
    FROM animales a
    JOIN refugios r ON a.id_refugio = r.idAsociacion
    WHERE a.adoptado = FALSE
    ORDER BY a.idanimal DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener animales:', err);
      return res.status(500).json({ success: false, message: 'Error al obtener animales' });
    }
    
    res.json({
      success: true,
      animales: results
    });
  });
});

// Obtener animales de un refugio específico
app.get('/api/refugio/:id/animales', (req, res) => {
  const { id } = req.params;
  
  db.query(
    'SELECT * FROM animales WHERE id_refugio = ? ORDER BY idanimal DESC',
    [id],
    (err, results) => {
      if (err) {
        console.error('Error al obtener animales del refugio:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener animales' });
      }
      
      res.json({
        success: true,
        animales: results
      });
    }
  );
});

// Agregar nuevo animal
app.post('/api/refugio/:id/animales', upload.array('fotos', 5), (req, res) => {
  const refugioId = req.params.id;
  const { nombre, especie, raza, edad, sexo, tamaño, descripcion, historial_medico, necesidades, esterilizacion } = req.body;
  
  if (!nombre || !especie || !sexo) {
    return res.status(400).json({ success: false, message: 'Faltan campos obligatorios: nombre, especie, sexo' });
  }
  
  // Procesar archivos subidos
  let fotos = [];
  if (req.files && req.files.length > 0) {
    fotos = req.files.map(file => file.filename);
  }
  
  db.query(
    `INSERT INTO animales (nombre, especie, raza, edad, sexo, tamaño, descripcion, fotos, historial_medico, necesidades, esterilizacion, adoptado, id_refugio)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?)`,
    [nombre, especie, raza || null, edad || null, sexo, tamaño || null, descripcion || null, 
     JSON.stringify(fotos), historial_medico || null, necesidades || null, 
     esterilizacion === 'true' || esterilizacion === true, refugioId],
    (err, result) => {
      if (err) {
        console.error('Error al agregar animal:', err);
        return res.status(500).json({ success: false, message: 'Error al agregar animal' });
      }
      
      res.status(201).json({
        success: true,
        message: 'Animal agregado correctamente',
        animal: {
          id: result.insertId,
          nombre,
          especie,
          fotos
        }
      });
    }
  );
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});