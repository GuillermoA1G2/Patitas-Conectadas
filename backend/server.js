require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://Guillermo:22110067@cluster01.huaafgq.mongodb.net/patitas_conectadas?retryWrites=true&w=majority&appName=Cluster01';

// Crear directorio para imágenes y documentos si no existe
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
app.use(cors({
  origin: '*', // Permite solicitudes desde cualquier origen
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Para parsear application/json
app.use(express.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conexión a MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Conexión a MongoDB establecida correctamente');
  })
  .catch((err) => {
    console.error('Error al conectar a MongoDB:', err);
  });

// Esquemas de Mongoose
const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  telefono: String,
  direccion: String,
  curp: String, // Agregado CURP
  foto_perfil: String, // Agregado campo para la ruta de la foto de perfil
  id_rol: { type: Number, default: 4 }, // 4 = usuario normal, 5 = admin
  fecha_registro: { type: Date, default: Date.now },
  resetToken: String,
  resetTokenExp: Date
});

const refugioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  telefono: String,
  direccion: String,
  ciudad: String,
  codigoPostal: String, // Agregado
  municipio: String, // Agregado
  rfc: String, // Agregado
  logo: String, // Agregado campo para la ruta del logo
  documentos: [String], // Agregado campo para rutas de documentos
  formularioAdopcion: String, // Agregado campo para el formulario de adopción
  fecha_registro: { type: Date, default: Date.now },
  resetToken: String,
  resetTokenExp: Date
});

const donacionSchema = new mongoose.Schema({
  id_usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  id_refugio: { type: mongoose.Schema.Types.ObjectId, ref: 'Refugio', required: true },
  tipo: { type: String, required: true },
  cantidad: { type: Number, required: true },
  fecha: { type: Date, default: Date.now }
});

const solicitudDonacionSchema = new mongoose.Schema({
  id_refugio: { type: mongoose.Schema.Types.ObjectId, ref: 'Refugio', required: true },
  nombre: { type: String, required: true },
  descripcion: String,
  cantidad: { type: Number, required: true },
  nivel_urgencia: { type: String, enum: ['Alta', 'Media', 'Baja'], required: true },
  fecha_solicitud: { type: Date, default: Date.now },
  activa: { type: Boolean, default: true } // Para saber si la solicitud sigue activa
});

const insumoMaterialSchema = new mongoose.Schema({
  idUsuarioDonante: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  id_refugio: { type: mongoose.Schema.Types.ObjectId, ref: 'Refugio', required: true },
  nombre: { type: String, required: true },
  descripcion: String,
  cantidad: { type: Number, required: true },
  completado: { type: Boolean, default: false },
  fecha_creacion: { type: Date, default: Date.now }
});

const animalSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  especie: { type: String, required: true },
  raza: String,
  edad: String,
  sexo: { type: String, required: true },
  tamaño: String,
  descripcion: String,
  fotos: [String],
  historial_medico: String,
  necesidades: String,
  esterilizacion: { type: Boolean, default: false },
  adoptado: { type: Boolean, default: false },
  id_refugio: { type: mongoose.Schema.Types.ObjectId, ref: 'Refugio', required: true },
  fecha_registro: { type: Date, default: Date.now }
});

const solicitudAdopcionSchema = new mongoose.Schema({
  id_usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  id_animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true },
  id_refugio: { type: mongoose.Schema.Types.ObjectId, ref: 'Refugio', required: true },
  motivo: { type: String, required: true },
  fecha_envio: { type: Date, default: Date.now },
  estado: { type: String, enum: ['pendiente', 'aprobada', 'rechazada'], default: 'pendiente' },
  documento_ine: { type: [String], required: true },
  ha_adoptado_antes: { type: String, enum: ['si', 'no'], required: true },
  cantidad_mascotas_anteriores: { type: Number, default: 0 },
  fotos_mascotas_anteriores: [String], // Array de rutas de fotos
  tipo_vivienda: { type: String, enum: ['propio', 'renta'], required: true },
  permiso_mascotas_renta: { type: String, enum: ['si', 'no', 'no_aplica'], default: 'no_aplica' }, // 'no_aplica' si es vivienda propia
  fotos_espacio_mascota: [String],
});

// Modelos
const Usuario = mongoose.model('Usuario', usuarioSchema);
const Refugio = mongoose.model('Refugio', refugioSchema);
const Donacion = mongoose.model('Donacion', donacionSchema);
const InsumoMaterial = mongoose.model('InsumoMaterial', insumoMaterialSchema);
const Animal = mongoose.model('Animal', animalSchema);
const SolicitudAdopcion = mongoose.model('SolicitudAdopcion', solicitudAdopcionSchema);
const SolicitudDonacion = mongoose.model('SolicitudDonacion', solicitudDonacionSchema);

// Rutas API

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API de Patitas Conectadas funcionando correctamente con MongoDB');
});

// Login para usuarios normales
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
    }

    const usuario = await Usuario.findOne({ email, password }).select('-password');

    if (!usuario) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    res.json({
      success: true,
      message: 'Login exitoso',
      usuario: {
        id: usuario._id,
        idUsuario: usuario._id, // Mantener compatibilidad
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        telefono: usuario.telefono,
        rol: usuario.id_rol,
        id_rol: usuario.id_rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// Login para refugios/asociaciones
app.post('/api/login/refugio', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
    }

    const refugio = await Refugio.findOne({ email, password }).select('-password');

    if (!refugio) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    res.json({
      success: true,
      message: 'Login exitoso',
      refugio: {
        id: refugio._id,
        idAsociacion: refugio._id, // Mantener compatibilidad
        nombre: refugio.nombre,
        email: refugio.email,
        telefono: refugio.telefono,
        tipo: 'refugio'
      }
    });
  } catch (error) {
    console.error('Error en login de refugio:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// Login para administradores
app.post('/api/login/admin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
    }

    const admin = await Usuario.findOne({ email, password, id_rol: 5 }).select('-password');

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas o no es administrador' });
    }

    res.json({
      success: true,
      message: 'Login exitoso como administrador',
      usuario: {
        id: admin._id,
        idUsuario: admin._id, // Mantener compatibilidad
        nombre: admin.nombre,
        apellido: admin.apellido,
        email: admin.email,
        telefono: admin.telefono,
        rol: admin.id_rol,
        id_rol: admin.id_rol, // Mantener compatibilidad
        tipo: 'admin'
      }
    });
  } catch (error) {
    console.error('Error en login de admin:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// Obtener todos los usuarios (para el panel de administración)
app.get('/api/admin/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password'); // Excluir la contraseña

    const usuariosFormateados = usuarios.map(usuario => ({
      idUsuario: usuario._id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      telefono: usuario.telefono,
      direccion: usuario.direccion,
      curp: usuario.curp, // Incluido CURP
      foto_perfil: usuario.foto_perfil ? `/uploads/${usuario.foto_perfil}` : null, // Ruta completa
      rol: usuario.id_rol === 5 ? 'Administrador' : 'Usuario Normal', // Asignar un nombre de rol legible
      id_rol: usuario.id_rol,
      fecha_registro: usuario.fecha_registro
    }));

    res.json({
      success: true,
      usuarios: usuariosFormateados
    });
  } catch (error) {
    console.error('Error al obtener usuarios para admin:', error);
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
  }
});

// Obtener todos los refugios (para el panel de administración)
app.get('/api/admin/refugios', async (req, res) => {
  try {
    const refugios = await Refugio.find().select('-password'); // Excluir la contraseña

    const refugiosFormateados = refugios.map(refugio => ({
      idAsociacion: refugio._id,
      nombre: refugio.nombre,
      descripcion: refugio.descripcion,
      email: refugio.email,
      telefono: refugio.telefono,
      direccion: refugio.direccion,
      ciudad: refugio.ciudad,
      codigoPostal: refugio.codigoPostal,
      municipio: refugio.municipio,
      rfc: refugio.rfc,
      logo: refugio.logo ? `/uploads/${refugio.logo}` : null, // Ruta completa
      documentos: refugio.documentos.map(doc => `/uploads/${doc}`), // Rutas completas
      formularioAdopcion: refugio.formularioAdopcion ? `/uploads/${refugio.formularioAdopcion}` : null,
      fecha_registro: refugio.fecha_registro
    }));

    res.json({
      success: true,
      refugios: refugiosFormateados
    });
  } catch (error) {
    console.error('Error al obtener refugios para admin:', error);
    res.status(500).json({ success: false, message: 'Error al obtener refugios' });
  }
});

// Registro de usuarios
app.post('/api/usuarios', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, apellido, email, password, telefono, direccion, curp } = req.body;
    const foto_perfil = req.file ? req.file.filename : null; // Obtener el nombre del archivo subido

    if (!nombre || !apellido || !email || !password || !direccion) {
      // Si falta algún campo obligatorio, eliminar el archivo subido
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios: nombre, apellido, email, password, direccion' });
    }

    // Verificar si el email ya existe
    const existeUsuario = await Usuario.findOne({ email });
    if (existeUsuario) {
      if (req.file) fs.unlinkSync(req.file.path); // Eliminar archivo si el email ya existe
      return res.status(409).json({ success: false, message: 'El email ya está registrado' });
    }

    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      email,
      password,
      telefono,
      direccion,
      curp,
      foto_perfil, // Guardar el nombre del archivo
      id_rol: 4
    });

    const usuarioGuardado = await nuevoUsuario.save();

    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      usuario: {
        id: usuarioGuardado._id,
        nombre: usuarioGuardado.nombre,
        apellido: usuarioGuardado.apellido,
        email: usuarioGuardado.email,
        foto_perfil: usuarioGuardado.foto_perfil ? `/uploads/${usuarioGuardado.foto_perfil}` : null
      }
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    if (req.file) fs.unlinkSync(req.file.path); // Asegurarse de eliminar el archivo en caso de error
    res.status(500).json({ success: false, message: 'Error al registrar usuario' });
  }
});

// Actualizar perfil de usuario
app.put('/api/usuarios/:id', upload.single('imagen'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, telefono, direccion, curp } = req.body;
    const foto_perfil = req.file ? req.file.filename : null;

    if (!nombre || !apellido || !direccion) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Nombre, apellido y dirección son obligatorios'
      });
    }

    const updateData = { nombre, apellido, telefono, direccion, curp };
    if (foto_perfil) {
      // Si se sube una nueva imagen, eliminar la anterior si existe
      const usuarioExistente = await Usuario.findById(id);
      if (usuarioExistente && usuarioExistente.foto_perfil) {
        const oldImagePath = path.join(uploadsDir, usuarioExistente.foto_perfil);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.foto_perfil = foto_perfil;
    }

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select('-password');

    if (!usuarioActualizado) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      usuario: {
        ...usuarioActualizado.toObject(),
        foto_perfil: usuarioActualizado.foto_perfil ? `/uploads/${usuarioActualizado.foto_perfil}` : null
      }
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el perfil'
    });
  }
});

// Obtener datos de un usuario específico
app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findById(id).select('-password');

    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      usuario: {
        id: usuario._id,
        idUsuario: usuario._id, // Mantener compatibilidad
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        curp: usuario.curp, // Incluido CURP
        foto_perfil: usuario.foto_perfil ? `/uploads/${usuario.foto_perfil}` : null, // Ruta completa
        rol: usuario.id_rol,
        id_rol: usuario.id_rol, // Mantener compatibilidad
        fecha_registro: usuario.fecha_registro
      }
    });
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos del usuario' });
  }
});

// Registro de refugios
app.post('/api/asociaciones', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'documentos', maxCount: 5 },
  { name: 'formularioAdopcion', maxCount: 1 }
]), async (req, res) => {
  // Helper para eliminar archivos subidos en caso de error
  const cleanupFiles = (files) => {
    if (files) {
      if (files.logo && files.logo[0]) {
        fs.unlink(path.join(uploadsDir, files.logo[0].filename), (err) => {
          if (err) console.error('Error al eliminar logo:', err);
        });
      }
      if (files.documentos) {
        files.documentos.forEach(file => {
          fs.unlink(path.join(uploadsDir, file.filename), (err) => {
            if (err) console.error('Error al eliminar documento:', err);
          });
        });
      }
      if (files.formularioAdopcion && files.formularioAdopcion[0]) {
        fs.unlink(path.join(uploadsDir, files.formularioAdopcion[0].filename), (err) => {
          if (err) console.error('Error al eliminar formularioAdopcion:', err);
        });
      }
    }
  };

  try {
    const { nombre, descripcion, email, password, telefono, direccion, ciudad, codigoPostal, municipio, rfc } = req.body;

    const logo = req.files && req.files.logo ? req.files.logo[0].filename : null;
    const documentos = req.files && req.files.documentos ? req.files.documentos.map(file => file.filename) : [];
    const formularioAdopcion = req.files && req.files.formularioAdopcion ? req.files.formularioAdopcion[0].filename : null;

    if (!nombre || !email || !password || !direccion || !ciudad || !codigoPostal || !municipio || !rfc) {
      cleanupFiles(req.files);
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios: nombre, email, password, direccion, ciudad, codigoPostal, municipio, rfc' });
    }

    // Verificar si el email ya existe
    const existeRefugio = await Refugio.findOne({ email });
    if (existeRefugio) {
      cleanupFiles(req.files);
      return res.status(409).json({ success: false, message: 'El email ya está registrado' });
    }

    const nuevoRefugio = new Refugio({
      nombre,
      descripcion,
      email,
      password,
      telefono,
      direccion,
      ciudad,
      codigoPostal,
      municipio,
      rfc,
      logo,
      documentos,
      formularioAdopcion
    });

    const refugioGuardado = await nuevoRefugio.save();

    res.status(201).json({
      success: true,
      message: 'Refugio registrado correctamente',
      refugio: {
        id: refugioGuardado._id,
        nombre: refugioGuardado.nombre,
        email: refugioGuardado.email,
        logo: refugioGuardado.logo ? `/uploads/${refugioGuardado.logo}` : null,
        documentos: refugioGuardado.documentos.map(doc => `/uploads/${doc}`),
        formularioAdopcion: refugioGuardado.formularioAdopcion ? `/uploads/${refugioGuardado.formularioAdopcion}` : null
      }
    });
  } catch (error) {
    console.error('Error al registrar refugio:', error);
    cleanupFiles(req.files); // Asegurarse de eliminar los archivos en caso de error
    res.status(500).json({ success: false, message: 'Error al registrar refugio' });
  }
});

// Obtener todos los refugios
app.get('/api/refugios', async (req, res) => {
  try {
    const refugios = await Refugio.find().select('-password');

    const refugiosFormateados = refugios.map(refugio => ({
      idAsociacion: refugio._id,
      nombre: refugio.nombre,
      descripcion: refugio.descripcion,
      email: refugio.email,
      telefono: refugio.telefono,
      direccion: refugio.direccion,
      ciudad: refugio.ciudad,
      codigoPostal: refugio.codigoPostal,
      municipio: refugio.municipio,
      rfc: refugio.rfc,
      logo: refugio.logo ? `/uploads/${refugio.logo}` : null,
      documentos: refugio.documentos.map(doc => `/uploads/${doc}`),
      formularioAdopcion: refugio.formularioAdopcion ? `/uploads/${refugio.formularioAdopcion}` : null
    }));

    res.json({
      success: true,
      refugios: refugiosFormateados
    });
  } catch (error) {
    console.error('Error al obtener refugios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener refugios' });
  }
});

// Registrar donación de insumos
app.post('/api/donaciones/insumos', async (req, res) => {
  try {
    const { idUsuarioDonante, id_refugio, nombre, descripcion, cantidad } = req.body;

    if (!idUsuarioDonante || !id_refugio || !nombre || !cantidad) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: idUsuarioDonante, id_refugio, nombre, cantidad'
      });
    }

    // Verificar que el usuario existe
    const usuario = await Usuario.findById(idUsuarioDonante);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Verificar que el refugio existe
    const refugio = await Refugio.findById(id_refugio);
    if (!refugio) {
      return res.status(404).json({ success: false, message: 'Refugio no encontrado' });
    }

    const nuevoInsumo = new InsumoMaterial({
      idUsuarioDonante,
      id_refugio,
      nombre,
      descripcion: descripcion || nombre,
      cantidad,
      completado: false
    });

    const insumoGuardado = await nuevoInsumo.save();

    res.status(201).json({
      success: true,
      message: 'Donación de insumos registrada correctamente',
      donacion: {
        id: insumoGuardado._id,
        idUsuarioDonante,
        id_refugio,
        nombre,
        descripcion,
        cantidad,
        completado: false
      }
    });
  } catch (error) {
    console.error('Error al registrar donación de insumos:', error);
    res.status(500).json({ success: false, message: 'Error al registrar donación' });
  }
});

// Registrar donación monetaria
app.post('/api/donaciones/monetaria', async (req, res) => {
  try {
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
    const usuario = await Usuario.findById(id_usuario);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Verificar que el refugio existe
    const refugio = await Refugio.findById(id_refugio);
    if (!refugio) {
      return res.status(404).json({ success: false, message: 'Refugio no encontrado' });
    }

    const nuevaDonacion = new Donacion({
      id_usuario,
      id_refugio,
      tipo,
      cantidad: parseFloat(cantidad)
    });

    const donacionGuardada = await nuevaDonacion.save();

    res.status(201).json({
      success: true,
      message: 'Donación monetaria registrada correctamente',
      donacion: {
        id: donacionGuardada._id,
        id_usuario,
        id_refugio,
        tipo,
        cantidad: parseFloat(cantidad),
        fecha: donacionGuardada.fecha
      }
    });
  } catch (error) {
    console.error('Error al registrar donación monetaria:', error);
    res.status(500).json({ success: false, message: 'Error al registrar donación' });
  }
});

// Obtener donaciones de un usuario específico
app.get('/api/usuario/:id/donaciones', async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener donaciones monetarias
    const donacionesMonetarias = await Donacion.find({ id_usuario: id })
      .populate('id_refugio', 'nombre')
      .sort({ fecha: -1 });

    // Obtener donaciones de insumos
    const donacionesInsumos = await InsumoMaterial.find({ idUsuarioDonante: id })
      .populate('id_refugio', 'nombre')
      .sort({ fecha_creacion: -1 });

    // Formatear respuesta para mantener compatibilidad
    const donacionesMonetariasFormateadas = donacionesMonetarias.map(d => ({
      id: d._id,
      tipo: d.tipo,
      cantidad: d.cantidad,
      fecha: d.fecha,
      refugio_nombre: d.id_refugio?.nombre || 'Refugio no encontrado'
    }));

    const donacionesInsumosFormateadas = donacionesInsumos.map(i => ({
      id: i._id,
      nombre: i.nombre,
      descripcion: i.descripcion,
      cantidad: i.cantidad,
      completado: i.completado,
      refugio_nombre: i.id_refugio?.nombre || 'Refugio no encontrado'
    }));

    res.json({
      success: true,
      donacionesMonetarias: donacionesMonetariasFormateadas,
      donacionesInsumos: donacionesInsumosFormateadas
    });
  } catch (error) {
    console.error('Error al obtener donaciones:', error);
    res.status(500).json({ success: false, message: 'Error al obtener donaciones' });
  }
});

// Obtener todas las donaciones para un refugio específico
app.get('/api/refugio/:id/donaciones', async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener donaciones monetarias recibidas
    const donacionesMonetarias = await Donacion.find({ id_refugio: id })
      .populate('id_usuario', 'nombre apellido email')
      .sort({ fecha: -1 });

    // Obtener donaciones de insumos recibidas
    const donacionesInsumos = await InsumoMaterial.find({ id_refugio: id })
      .populate('idUsuarioDonante', 'nombre apellido telefono')
      .sort({ fecha_creacion: -1 });

    // Formatear respuesta para mantener compatibilidad
    const donacionesMonetariasFormateadas = donacionesMonetarias.map(d => ({
      id: d._id,
      tipo: d.tipo,
      cantidad: d.cantidad,
      fecha: d.fecha,
      nombre: d.id_usuario?.nombre || 'Usuario no encontrado',
      apellido: d.id_usuario?.apellido || '',
      email: d.id_usuario?.email || ''
    }));

    const donacionesInsumosFormateadas = donacionesInsumos.map(i => ({
      id: i._id,
      nombre: i.nombre,
      descripcion: i.descripcion,
      cantidad: i.cantidad,
      completado: i.completado,
      nombre: i.idUsuarioDonante?.nombre || 'Usuario no encontrado',
      apellido: i.idUsuarioDonante?.apellido || '',
      telefono: i.idUsuarioDonante?.telefono || ''
    }));

    res.json({
      success: true,
      donacionesMonetarias: donacionesMonetariasFormateadas,
      donacionesInsumos: donacionesInsumosFormateadas
    });
  } catch (error) {
    console.error('Error al obtener donaciones:', error);
    res.status(500).json({ success: false, message: 'Error al obtener donaciones' });
  }
});

// Obtener insumos pendientes para un refugio
app.get('/api/refugio/:id/insumos-pendientes', async (req, res) => {
  try {
    const { id } = req.params;

    const insumosPendientes = await InsumoMaterial.find({
      id_refugio: id,
      completado: false
    }).populate('idUsuarioDonante', 'nombre telefono');

    const insumosFormateados = insumosPendientes.map(i => ({
      id: i._id,
      nombre: i.nombre,
      descripcion: i.descripcion,
      cantidad: i.cantidad,
      completado: i.completado,
      nombre_donante: i.idUsuarioDonante?.nombre || 'Usuario no encontrado',
      telefono_donante: i.idUsuarioDonante?.telefono || ''
    }));

    res.json({
      success: true,
      insumosPendientes: insumosFormateados
    });
  } catch (error) {
    console.error('Error al obtener insumos pendientes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener insumos' });
  }
});

// Marcar insumo como completado
app.put('/api/insumos/:id/completar', async (req, res) => {
  try {
    const { id } = req.params;
    const { id_refugio } = req.body;

    // Verificar que el insumo pertenezca al refugio
    const insumo = await InsumoMaterial.findOne({ _id: id, id_refugio });

    if (!insumo) {
      return res.status(404).json({
        success: false,
        message: 'Insumo no encontrado o no pertenece a este refugio'
      });
    }

    // Actualizar estado del insumo
    await InsumoMaterial.findByIdAndUpdate(id, { completado: true });

    res.json({
      success: true,
      message: 'Insumo marcado como completado'
    });
  } catch (error) {
    console.error('Error al actualizar insumo:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar insumo' });
  }
});

// Get refuge details
app.get('/api/refugio/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const refugio = await Refugio.findById(id).select('-password');

    if (!refugio) {
      return res.status(404).json({ success: false, message: 'Refugio no encontrado' });
    }

    res.json({
      success: true,
      refugio: {
        ...refugio.toObject(),
        logo: refugio.logo ? `/uploads/${refugio.logo}` : null,
        documentos: refugio.documentos.map(doc => `/uploads/${doc}`),
        formularioAdopcion: refugio.formularioAdopcion ? `/uploads/${refugio.formularioAdopcion}` : null
      }
    });
  } catch (error) {
    console.error('Error al obtener datos del refugio:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos del refugio' });
  }
});

// Update refuge profile
app.put('/api/refugio/:id', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'documentos', maxCount: 5 },
  { name: 'formularioAdopcion', maxCount: 1 }
]), async (req, res) => {
  const cleanupFiles = (files) => {
    if (files) {
      if (files.logo && files.logo[0]) {
        fs.unlink(path.join(uploadsDir, files.logo[0].filename), (err) => {
          if (err) console.error('Error al eliminar logo:', err);
        });
      }
      if (files.documentos) {
        files.documentos.forEach(file => {
          fs.unlink(path.join(uploadsDir, file.filename), (err) => {
            if (err) console.error('Error al eliminar documento:', err);
          });
        });
      }
      if (files.formularioAdopcion && files.formularioAdopcion[0]) {
        fs.unlink(path.join(uploadsDir, files.formularioAdopcion[0].filename), (err) => {
          if (err) console.error('Error al eliminar formularioAdopcion:', err);
        });
      }
    }
  };

  try {
    const { id } = req.params;
    const { nombre, email, telefono, descripcion, direccion, ciudad, codigoPostal, municipio, rfc } = req.body;

    // Validate required fields
    if (!nombre || !email || !direccion || !ciudad || !codigoPostal || !municipio || !rfc) {
      cleanupFiles(req.files);
      return res.status(400).json({ success: false, message: 'Nombre, email, dirección, ciudad, código postal, municipio y RFC son obligatorios' });
    }

    // Check if email is being changed and if it already exists
    const emailExistente = await Refugio.findOne({ email, _id: { $ne: id } });

    if (emailExistente) {
      cleanupFiles(req.files);
      return res.status(409).json({ success: false, message: 'El email ya está en uso por otro refugio' });
    }

    const updateData = {
      nombre, email, telefono, descripcion, direccion, ciudad, codigoPostal, municipio, rfc
    };

    const refugioExistente = await Refugio.findById(id);

    // Handle logo update
    if (req.files && req.files.logo && req.files.logo[0]) {
      if (refugioExistente && refugioExistente.logo) {
        const oldLogoPath = path.join(uploadsDir, refugioExistente.logo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
      updateData.logo = req.files.logo[0].filename;
    }

    // Handle documents update (assuming new documents replace old ones or are added)
    if (req.files && req.files.documentos && req.files.documentos.length > 0) {
      // Option 1: Replace all old documents
      if (refugioExistente && refugioExistente.documentos && refugioExistente.documentos.length > 0) {
        refugioExistente.documentos.forEach(doc => {
          const oldDocPath = path.join(uploadsDir, doc);
          if (fs.existsSync(oldDocPath)) {
            fs.unlinkSync(oldDocPath);
          }
        });
      }
      updateData.documentos = req.files.documentos.map(file => file.filename);
      // Option 2: Add new documents to existing ones (if you want to keep old ones)
      // updateData.documentos = [...(refugioExistente.documentos || []), ...req.files.documentos.map(file => file.filename)];
    }

    // Handle formularioAdopcion update
    if (req.files && req.files.formularioAdopcion && req.files.formularioAdopcion[0]) {
      if (refugioExistente && refugioExistente.formularioAdopcion) {
        const oldFormPath = path.join(uploadsDir, refugioExistente.formularioAdopcion);
        if (fs.existsSync(oldFormPath)) {
          fs.unlinkSync(oldFormPath);
        }
      }
      updateData.formularioAdopcion = req.files.formularioAdopcion[0].filename;
    }

    // Update refuge in database
    const updatedRefugio = await Refugio.findByIdAndUpdate(id, updateData, { new: true }).select('-password');

    if (!updatedRefugio) {
      cleanupFiles(req.files);
      return res.status(404).json({ success: false, message: 'Refugio no encontrado' });
    }

    res.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      refugio: {
        ...updatedRefugio.toObject(),
        logo: updatedRefugio.logo ? `/uploads/${updatedRefugio.logo}` : null,
        documentos: updatedRefugio.documentos.map(doc => `/uploads/${doc}`),
        formularioAdopcion: updatedRefugio.formularioAdopcion ? `/uploads/${updatedRefugio.formularioAdopcion}` : null
      }
    });
  } catch (error) {
    console.error('Error al actualizar refugio:', error);
    cleanupFiles(req.files);
    res.status(500).json({ success: false, message: 'Error al actualizar el perfil' });
  }
});

// Obtener animales disponibles para adopción
app.get('/api/animales', async (req, res) => {
  try {
    const animales = await Animal.find({ adoptado: false })
      .populate('id_refugio', 'nombre telefono')
      .sort({ fecha_registro: -1 });

    const animalesFormateados = animales.map(animal => ({
      idanimal: animal._id,
      nombre: animal.nombre,
      especie: animal.especie,
      raza: animal.raza,
      edad: animal.edad,
      sexo: animal.sexo,
      tamaño: animal.tamaño,
      descripcion: animal.descripcion,
      fotos: animal.fotos.map(foto => `/uploads/${foto}`), // Rutas completas
      historial_medico: animal.historial_medico,
      necesidades: animal.necesidades,
      esterilizacion: animal.esterilizacion,
      adoptado: animal.adoptado,
      refugio_nombre: animal.id_refugio?.nombre || 'Refugio no encontrado',
      refugio_telefono: animal.id_refugio?.telefono || '',
      id_refugio: animal.id_refugio?._id
    }));

    res.json({
      success: true,
      animales: animalesFormateados
    });
  } catch (error) {
    console.error('Error al obtener animales:', error);
    res.status(500).json({ success: false, message: 'Error al obtener animales' });
  }
});

// También para la ruta de animales de un refugio específico, si se usa para pasar datos a este formulario
app.get('/api/refugio/:id/animales', async (req, res) => {
  try {
    const { id } = req.params;

    const animales = await Animal.find({ id_refugio: id }).sort({ fecha_registro: -1 });

    const animalesFormateados = animales.map(animal => ({
      idanimal: animal._id,
      nombre: animal.nombre,
      especie: animal.especie,
      raza: animal.raza,
      edad: animal.edad,
      sexo: animal.sexo,
      tamaño: animal.tamaño,
      descripcion: animal.descripcion,
      fotos: animal.fotos.map(foto => `/uploads/${foto}`), // Rutas completas
      historial_medico: animal.historial_medico,
      necesidades: animal.necesidades,
      esterilizacion: animal.esterilizacion,
      adoptado: animal.adoptado,
      id_refugio: animal.id_refugio
    }));

    res.json({
      success: true,
      animales: animalesFormateados
    });
  } catch (error) {
    console.error('Error al obtener animales del refugio:', error);
    res.status(500).json({ success: false, message: 'Error al obtener animales' });
  }
});

// Obtener animales de un refugio específico
app.get('/api/refugio/:id/animales', async (req, res) => {
  try {
    const { id } = req.params;

    const animales = await Animal.find({ id_refugio: id }).sort({ fecha_registro: -1 });

    const animalesFormateados = animales.map(animal => ({
      idanimal: animal._id,
      nombre: animal.nombre,
      especie: animal.especie,
      raza: animal.raza,
      edad: animal.edad,
      sexo: animal.sexo,
      tamaño: animal.tamaño,
      descripcion: animal.descripcion,
      fotos: animal.fotos.map(foto => `/uploads/${foto}`), // Rutas completas
      historial_medico: animal.historial_medico,
      necesidades: animal.necesidades,
      esterilizacion: animal.esterilizacion,
      adoptado: animal.adoptado
    }));

    res.json({
      success: true,
      animales: animalesFormateados
    });
  } catch (error) {
    console.error('Error al obtener animales del refugio:', error);
    res.status(500).json({ success: false, message: 'Error al obtener animales' });
  }
});

// Agregar nuevo animal
app.post('/api/refugio/:id/animales', upload.array('fotos', 5), async (req, res) => {
  try {
    const refugioId = req.params.id;
    const { nombre, especie, raza, edad, sexo, tamaño, descripcion, historial_medico, necesidades, esterilizacion } = req.body;

    if (!nombre || !especie || !sexo) {
      // Eliminar archivos si la validación falla
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => fs.unlinkSync(file.path));
      }
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios: nombre, especie, sexo' });
    }

    // Procesar archivos subidos
    let fotos = [];
    if (req.files && req.files.length > 0) {
      fotos = req.files.map(file => file.filename);
    }

    const nuevoAnimal = new Animal({
      nombre,
      especie,
      raza: raza || null,
      edad: edad || null,
      sexo,
      tamaño: tamaño || null,
      descripcion: descripcion || null,
      fotos,
      historial_medico: historial_medico || null,
      necesidades: necesidades || null,
      esterilizacion: esterilizacion === 'true' || esterilizacion === true,
      adoptado: false,
      id_refugio: refugioId
    });

    const animalGuardado = await nuevoAnimal.save();

    res.status(201).json({
      success: true,
      message: 'Animal agregado correctamente',
      animal: {
        id: animalGuardado._id,
        nombre: animalGuardado.nombre,
        especie: animalGuardado.especie,
        fotos: animalGuardado.fotos.map(foto => `/uploads/${foto}`)
      }
    });
  } catch (error) {
    console.error('Error al agregar animal:', error);
    // Asegurarse de eliminar los archivos subidos si ocurre un error después de la subida
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => fs.unlinkSync(file.path));
    }
    res.status(500).json({ success: false, message: 'Error al agregar animal' });
  }
});

// RUTA PARA REGISTRAR SOLICITUDES DE ADOPCIÓN
app.post('/api/solicitudes-adopcion', upload.fields([
  { name: 'documentoINE', maxCount: 2 }, // <--- CAMBIADO A maxCount: 2
  { name: 'fotosMascotasAnteriores', maxCount: 5 },
  { name: 'fotosEspacioMascota', maxCount: 5 }
]), async (req, res) => {
  // Helper para eliminar archivos subidos en caso de error
  const cleanupFiles = (files) => {
    if (files) {
      if (files.documentoINE) { // Ahora puede ser un array
        files.documentoINE.forEach(file => {
          fs.unlink(path.join(uploadsDir, file.path), (err) => {
            if (err) console.error('Error al eliminar documentoINE:', err);
          });
        });
      }
      if (files.fotosMascotasAnteriores) {
        files.fotosMascotasAnteriores.forEach(file => {
          fs.unlink(path.join(uploadsDir, file.path), (err) => {
            if (err) console.error('Error al eliminar fotosMascotasAnteriores:', err);
          });
        });
      }
      if (files.fotosEspacioMascota) {
        files.fotosEspacioMascota.forEach(file => {
          fs.unlink(path.join(uploadsDir, file.path), (err) => {
            if (err) console.error('Error al eliminar fotosEspacioMascota:', err);
          });
        });
      }
    }
  };

  try {
    const {
      idUsuario,
      idRefugio,
      idAnimal,
      motivo,
      haAdoptadoAntes,
      cantidadMascotasAnteriores,
      tipoVivienda,
      permisoMascotasRenta
    } = req.body;

    // Validaciones básicas
    if (!idUsuario || !idRefugio || !idAnimal || !motivo || !haAdoptadoAntes || !tipoVivienda) {
      cleanupFiles(req.files);
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios en el formulario.' });
    }

    // Validar archivos
    // Modificado: Ahora esperamos 2 archivos para documentoINE
    if (!req.files || !req.files.documentoINE || req.files.documentoINE.length < 2) {
      cleanupFiles(req.files);
      return res.status(400).json({ success: false, message: 'Debe subir ambas caras del documento INE.' });
    }
    if (haAdoptadoAntes === 'si' && (!cantidadMascotasAnteriores || parseInt(cantidadMascotasAnteriores) <= 0)) {
      cleanupFiles(req.files);
      return res.status(400).json({ success: false, message: 'Debe indicar la cantidad de mascotas anteriores si ha adoptado antes.' });
    }
    if (haAdoptadoAntes === 'si' && (!req.files.fotosMascotasAnteriores || req.files.fotosMascotasAnteriores.length === 0)) {
      cleanupFiles(req.files);
      return res.status(400).json({ success: false, message: 'Debe subir fotos de sus mascotas anteriores si ha adoptado antes.' });
    }
    if (tipoVivienda === 'renta' && !permisoMascotasRenta) {
      cleanupFiles(req.files);
      return res.status(400).json({ success: false, message: 'Debe indicar si su contrato de renta permite mascotas.' });
    }
    if (!req.files.fotosEspacioMascota || req.files.fotosEspacioMascota.length === 0) {
      cleanupFiles(req.files);
      return res.status(400).json({ success: false, message: 'Debe subir fotos del espacio donde vivirá la mascota.' });
    }

    // Verificar existencia de usuario, animal y refugio
    const usuario = await Usuario.findById(idUsuario);
    if (!usuario) {
      cleanupFiles(req.files);
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }
    const animal = await Animal.findById(idAnimal);
    if (!animal) {
      cleanupFiles(req.files);
      return res.status(404).json({ success: false, message: 'Animal no encontrado.' });
    }
    const refugio = await Refugio.findById(idRefugio);
    if (!refugio) {
      cleanupFiles(req.files);
      return res.status(404).json({ success: false, message: 'Refugio no encontrado.' });
    }

    // Obtener rutas de los archivos subidos
    // Modificado: Ahora documento_ine_paths es un array de filenames
    const documento_ine_paths = req.files.documentoINE.map(file => file.filename);
    const fotos_mascotas_anteriores_paths = req.files.fotosMascotasAnteriores ? req.files.fotosMascotasAnteriores.map(file => file.filename) : [];
    const fotos_espacio_mascota_paths = req.files.fotosEspacioMascota ? req.files.fotosEspacioMascota.map(file => file.filename) : [];

    const nuevaSolicitud = new SolicitudAdopcion({
      id_usuario: idUsuario,
      id_animal: idAnimal,
      id_refugio: idRefugio,
      motivo,
      documento_ine: documento_ine_paths, // <--- Ahora guarda un array de rutas
      ha_adoptado_antes: haAdoptadoAntes,
      cantidad_mascotas_anteriores: haAdoptadoAntes === 'si' ? parseInt(cantidadMascotasAnteriores) : 0,
      fotos_mascotas_anteriores: fotos_mascotas_anteriores_paths,
      tipo_vivienda: tipoVivienda,
      permiso_mascotas_renta: tipoVivienda === 'renta' ? permisoMascotasRenta : 'no_aplica',
      fotos_espacio_mascota: fotos_espacio_mascota_paths,
      estado: 'pendiente'
    });

    const solicitudGuardada = await nuevaSolicitud.save();

    res.status(201).json({
      success: true,
      message: 'Solicitud de adopción enviada correctamente.',
      solicitud: solicitudGuardada
    });

  } catch (error) {
    console.error('Error al registrar solicitud de adopción:', error);
    cleanupFiles(req.files); // Asegurarse de eliminar los archivos subidos si ocurre un error después de la subida
    res.status(500).json({ success: false, message: 'Error interno del servidor al procesar la solicitud de adopción.' });
  }
});

// Obtener solicitudes de adopción de un usuario específico
app.get('/api/solicitudes-adopcion/usuario/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const solicitudes = await SolicitudAdopcion.find({ id_usuario: id })
      .populate('id_refugio', 'nombre email telefono')
      .populate('id_animal', 'nombre especie raza fotos')
      .sort({ fecha_envio: -1 });

    const solicitudesFormateadas = solicitudes.map(sol => ({
      _id: sol._id,
      mascota: sol.id_animal?.nombre || 'Mascota no encontrada',
      especie: sol.id_animal?.especie || '',
      raza: sol.id_animal?.raza || '',
      fotos: sol.id_animal?.fotos || [],
      refugio: {
        id: sol.id_refugio?._id,
        nombre: sol.id_refugio?.nombre || 'Refugio no encontrado',
        email: sol.id_refugio?.email || '',
        telefono: sol.id_refugio?.telefono || ''
      },
      motivo: sol.motivo,
      estado: sol.estado,
      fechaCreacion: sol.fecha_envio,
      documentoINE: sol.documento_ine.map(doc => `/uploads/${doc}`),
      ha_adoptado_antes: sol.ha_adoptado_antes,
      cantidad_mascotas_anteriores: sol.cantidad_mascotas_anteriores,
      fotos_mascotas_anteriores: sol.fotos_mascotas_anteriores.map(foto => `/uploads/${foto}`),
      tipo_vivienda: sol.tipo_vivienda,
      permiso_mascotas_renta: sol.permiso_mascotas_renta,
      fotos_espacio_mascota: sol.fotos_espacio_mascota.map(foto => `/uploads/${foto}`)
    }));

    res.json({
      success: true,
      solicitudes: solicitudesFormateadas
    });
  } catch (error) {
    console.error('Error al obtener solicitudes de adopción para usuario:', error);
    res.status(500).json({ success: false, message: 'Error al obtener solicitudes de adopción' });
  }
});

// Registrar solicitud de donación por parte de un refugio
app.post('/api/solicitudes-donaciones', async (req, res) => {
  try {
    const { id_refugio, nombre, descripcion, cantidad, nivel_urgencia } = req.body;

    if (!id_refugio || !nombre || !cantidad || !nivel_urgencia) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: id_refugio, nombre, cantidad, nivel_urgencia'
      });
    }

    // Verificar que el refugio existe
    const refugio = await Refugio.findById(id_refugio);
    if (!refugio) {
      return res.status(404).json({ success: false, message: 'Refugio no encontrado' });
    }

    const nuevaSolicitud = new SolicitudDonacion({
      id_refugio,
      nombre,
      descripcion: descripcion || nombre,
      cantidad,
      nivel_urgencia
    });

    const solicitudGuardada = await nuevaSolicitud.save();

    res.status(201).json({
      success: true,
      message: 'Solicitud de donación registrada correctamente',
      solicitud: {
        id: solicitudGuardada._id,
        id_refugio,
        nombre,
        descripcion,
        cantidad,
        nivel_urgencia,
        fecha_solicitud: solicitudGuardada.fecha_solicitud
      }
    });
  } catch (error) {
    console.error('Error al registrar solicitud de donación:', error);
    res.status(500).json({ success: false, message: 'Error al registrar solicitud de donación' });
  }
});

// Obtener solicitudes de donación de un refugio específico
app.get('/api/solicitudes-donaciones/refugio/:idRefugio', async (req, res) => {
  try {
    const { idRefugio } = req.params;

    const solicitudes = await SolicitudDonacion.find({ id_refugio: idRefugio })
      .sort({ fecha_solicitud: -1 });

    res.json({
      success: true,
      solicitudes: solicitudes.map(sol => ({
        id: sol._id,
        nombre: sol.nombre,
        descripcion: sol.descripcion,
        cantidad: sol.cantidad,
        nivel_urgencia: sol.nivel_urgencia,
        fecha_solicitud: sol.fecha_solicitud,
        activa: sol.activa
      }))
    });
  } catch (error) {
    console.error('Error al obtener solicitudes de donación para refugio:', error);
    res.status(500).json({ success: false, message: 'Error al obtener solicitudes de donación' });
  }
});

// Eliminar usuario
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const usuarioEliminado = await Usuario.findByIdAndDelete(id);

    if (!usuarioEliminado) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Opcional: Eliminar la foto de perfil si existe
    if (usuarioEliminado.foto_perfil) {
      const imagePath = path.join(uploadsDir, usuarioEliminado.foto_perfil);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar usuario' });
  }
});

// Eliminar refugio
app.delete('/api/refugios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const refugioEliminado = await Refugio.findByIdAndDelete(id);

    if (!refugioEliminado) {
      return res.status(404).json({ success: false, message: 'Refugio no encontrado' });
    }

    // Opcional: Eliminar archivos asociados (logo, documentos, formularioAdopcion)
    if (refugioEliminado.logo) {
      const logoPath = path.join(uploadsDir, refugioEliminado.logo);
      if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
    }
    if (refugioEliminado.documentos && refugioEliminado.documentos.length > 0) {
      refugioEliminado.documentos.forEach(doc => {
        const docPath = path.join(uploadsDir, doc);
        if (fs.existsSync(docPath)) fs.unlinkSync(docPath);
      });
    }
    if (refugioEliminado.formularioAdopcion) {
      const formPath = path.join(uploadsDir, refugioEliminado.formularioAdopcion);
      if (fs.existsSync(formPath)) fs.unlinkSync(formPath);
    }

    res.json({ success: true, message: 'Refugio eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar refugio:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar refugio' });
  }
});

// Obtener estadísticas para el panel de administración
app.get('/api/admin/estadisticas', async (req, res) => {
  try {
    const totalUsuarios = await Usuario.countDocuments({ id_rol: 4 }); // Solo usuarios normales
    const totalRefugios = await Refugio.countDocuments();
    const totalDonaciones = await Donacion.countDocuments();
    const totalInsumos = await InsumoMaterial.countDocuments();

    const resultadoMontoTotal = await Donacion.aggregate([
      {
        $group: {
          _id: null,
          montoTotal: { $sum: '$cantidad' }
        }
      }
    ]);
    const montoTotalDonado = resultadoMontoTotal.length > 0 ? resultadoMontoTotal[0].montoTotal : 0;

    res.json({
      success: true,
      data: {
        usuarios: totalUsuarios,
        refugios: totalRefugios,
        donaciones: totalDonaciones,
        monto_total: montoTotalDonado,
        insumos: totalInsumos,
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas para admin:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
});

// Obtener todos los insumos donados
app.get('/api/admin/insumos', async (req, res) => {
  try {
    const insumos = await InsumoMaterial.find()
      .populate('idUsuarioDonante', 'nombre apellido')
      .populate('id_refugio', 'nombre')
      .sort({ fecha_creacion: -1 });

    const insumosFormateados = insumos.map(insumo => ({
      id: insumo._id,
      nombre: insumo.nombre,
      descripcion: insumo.descripcion,
      cantidad: insumo.cantidad,
      completado: insumo.completado,
      fecha_creacion: insumo.fecha_creacion,
      donante: insumo.idUsuarioDonante ? `${insumo.idUsuarioDonante.nombre} ${insumo.idUsuarioDonante.apellido}` : 'Desconocido',
      refugio: insumo.id_refugio ? insumo.id_refugio.nombre : 'Desconocido',
    }));

    res.json({
      success: true,
      insumos: insumosFormateados
    });
  } catch (error) {
    console.error('Error al obtener insumos para admin:', error);
    res.status(500).json({ success: false, message: 'Error al obtener insumos' });
  }
});

// =============================
// CHATBOT CONFIG
// =============================
const fsPromises = require("fs/promises");
const natural = require("natural");

const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();
const stemmer = natural.PorterStemmerEs;

const DATA_PATH = path.join(__dirname, "data", "respuestas.json");
let diccionarioCache = null;

async function ensureData() {
  try {
    await fsPromises.access(DATA_PATH);
  } catch {
    const seed = {
      "hola": "¡Hola! 🐾 ¿Cómo estás?",
      "hola amigo": "¡Hola! Qué bueno verte por aquí 😊",
      "buenos días": "¡Buenos días! Que tengas un día peludamente feliz 🐶☀️",
      "buenas tardes": "¡Buenas tardes! ¿Listo para conocer a nuevos amigos de cuatro patas?",
      "buenas noches": "¡Buenas noches! Que sueñes con muchos perritos y gatitos 🐾🌙",
      "como estas": "¡Muy bien! Y mejor ahora que tú estás aquí 🐶",
      "quiero adoptar un perro": "¡Qué buena decisión! Para adoptar un perro necesitarás espacio adecuado y tiempo para paseos diarios.",
      "como cuido a mi perrito": "Con comida, agua, cariño, juegos y visitas al veterinario. ¡Y muchos mimos!",
      "me siento solo": "Aquí estoy contigo ❤️ ¿Te gustaría ver a un amigo peludo?",
      "adios": "¡Hasta pronto! Los perritos y yo te esperamos 🐾",
      "quiero adoptar un perrito": "¡Genial! Tenemos muchos perritos esperando un hogar. ¿Quieres ver una lista o saber más sobre los refugios?",
      "como adopto": "¡Adoptar es un acto de amor! Contacta a un refugio o protectora, llena un formulario y conoce a tu nuevo amiguito 🐶🐱",
      "que necesito para adoptar": "INE, comprobante de domicilio y compromiso de cuidados. A veces visita domiciliaria."
    };
    await fsPromises.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fsPromises.writeFile(DATA_PATH, JSON.stringify(seed, null, 2), "utf-8");
  }
}

function limpiarTexto(t) {
  return t
    .toLowerCase()
    .trim()
    .replace(/[^a-záéíóúüñ\s?¿]/gi, "")
    .split(/\s+/)
    .map(word => stemmer.stem(word))
    .join(" ");
}

async function cargarDic() {
  await ensureData();
  const raw = await fsPromises.readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

async function guardarDic(dic) {
  await fsPromises.writeFile(DATA_PATH, JSON.stringify(dic, null, 2), "utf-8");
}

async function cargarDicEntrenar() {
  const dic = await cargarDic();
  if (dic !== diccionarioCache) {
    tfidf.documents = [];
    for (const clave of Object.keys(dic)) {
      tfidf.addDocument(limpiarTexto(clave));
    }
    diccionarioCache = dic;
  }
  return dic;
}

function buscarRespuesta(dic, mensaje) {
  let mejorClave = null;
  let mejorScore = 0;

  tfidf.tfidfs(mensaje, (i, score) => {
    const clave = Object.keys(dic)[i];
    if (score > mejorScore) {
      mejorScore = score;
      mejorClave = clave;
    }
  });

  if (mejorClave && mejorScore > 0.1) {
    return { reply: dic[mejorClave], match: mejorClave, score: mejorScore };
  }

  for (const [clave, valor] of Object.entries(dic)) {
    if (mensaje.includes(limpiarTexto(clave))) {
      return { reply: valor, match: clave, score: 1 };
    }
  }

  return {
    reply: "No entiendo muy bien... ¿puedes repetirlo? 🐶",
    match: null,
    score: 0
  };
}

// =============================
// CHATBOT ROUTES
// =============================
app.get("/health", (_, res) => res.json({ ok: true }));

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message requerido" });
    }

    const dic = await cargarDicEntrenar();
    const limpio = limpiarTexto(message);
    const resultado = buscarRespuesta(dic, limpio);

    res.json(resultado);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

app.post("/train", async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: "question y answer requeridos" });
    }
    const dic = await cargarDic();
    dic[question.trim()] = answer.trim();
    await guardarDic(dic);

    tfidf.addDocument(limpiarTexto(question.trim()));
    diccionarioCache = dic;

    res.json({ ok: true, size: Object.keys(dic).length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

app.get("/pairs", async (_, res) => {
  const dic = await cargarDic();
  res.json(dic);
});

// =============================
// PASSWORD RECOVERY CONFIG
// =============================
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// =============================
// PASSWORD RECOVERY UTILITIES
// =============================
async function generarToken(entidad) {
  const token = crypto.randomBytes(20).toString('hex');
  const expira = Date.now() + 3600000; // 1 hora

  entidad.resetToken = token;
  entidad.resetTokenExp = expira;
  await entidad.save();

  return token;
}

async function enviarCorreoRecuperacion(entidad, token) {
  const resetLink = `${process.env.BASE_URL}/reset-password?token=${token}&email=${entidad.email}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: entidad.email,
    subject: 'Recuperación de contraseña - Patitas Conectadas',
    html: `
      <h2>Hola ${entidad.nombre}</h2>
      <p>Has solicitado recuperar tu contraseña.</p>
      <p>Haz click en el siguiente enlace para restablecerla (válido 1 hora):</p>
      <a href="${resetLink}">Restablecer contraseña</a>
      <p>Si no solicitaste esto, ignora este correo.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// =============================
// PASSWORD RECOVERY ROUTES
// =============================
app.post('/api/recuperar-contrasena', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Correo obligatorio' });

    // Buscar en el modelo Usuario
    let entidad = await Usuario.findOne({ email });

    // Si no se encuentra en Usuario, buscar en el modelo Refugio
    if (!entidad) {
      entidad = await Refugio.findOne({ email });
    }

    if (!entidad) return res.status(404).json({ message: 'Correo electrónico no registrado.' });

    const token = await generarToken(entidad);
    await enviarCorreoRecuperacion(entidad, token);

    res.status(200).json({ mensaje: 'Correo de recuperación enviado correctamente. Revisa tu bandeja de entrada.' });
  } catch (error) {
    console.error('Error en /api/recuperar-contrasena:', error);
    res.status(500).json({ message: 'Error interno del servidor al intentar recuperar la contraseña.' });
  }
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, token, nuevaPassword } = req.body;
    if (!email || !token || !nuevaPassword)
      return res.status(400).json({ message: 'Datos incompletos' });

    // Buscar en el modelo Usuario
    let entidad = await Usuario.findOne({
      email,
      resetToken: token,
      resetTokenExp: { $gt: Date.now() },
    });

    // Si no se encuentra en Usuario, buscar en el modelo Refugio
    if (!entidad) {
      entidad = await Refugio.findOne({
        email,
        resetToken: token,
        resetTokenExp: { $gt: Date.now() },
      });
    }

    if (!entidad)
      return res.status(400).json({ message: 'Token inválido o expirado, o correo electrónico no encontrado.' });

    entidad.password = nuevaPassword; // ¡IMPORTANTE! En un entorno real, aquí deberías hashear la contraseña.
    entidad.resetToken = undefined;
    entidad.resetTokenExp = undefined;
    await entidad.save();

    res.status(200).json({ mensaje: 'Contraseña restablecida correctamente.' });
  } catch (error) {
    console.error('Error en /api/reset-password:', error);
    res.status(500).json({ message: 'Error interno del servidor al restablecer la contraseña.' });
  }
});

// =============================
// SOLICITUDES CONFIG
// =============================
const Solicitud = require("./mobile-app/app/Solicitudes");

// Configuración de almacenamiento con multer
const storageSolicitud = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});

const uploadSolicitud = multer({ storage: storageSolicitud });
// =============================
// SOLICITUDES ROUTES
// =============================

// Test de conexión
app.get("/api/solicitudes/test", (req, res) => {
  res.send("Servidor de Solicitudes de Adopción funcionando 🚀");
});

// Crear nueva solicitud (usuario)
app.post("/api/solicitudes", uploadSolicitud.single("documento"), async (req, res) => {
  try {
    const {
      mascota,
      usuarioId,
      usuarioNombre,
      refugioId,
      refugioNombre,
      respuestasFormulario
    } = req.body;

    const nuevaSolicitud = new Solicitud({
      mascota,
      usuario: { id: usuarioId, nombre: usuarioNombre },
      refugio: { id: refugioId, nombre: refugioNombre },
      documentoUrl: req.file ? `/uploads/${req.file.filename}` : null,
      respuestasFormulario: respuestasFormulario ? JSON.parse(respuestasFormulario) : {}
    });

    await nuevaSolicitud.save();
    res.status(201).json(nuevaSolicitud);
  } catch (err) {
    console.error("❌ Error al crear la solicitud:", err);
    res.status(500).json({ error: "Error al crear la solicitud" });
  }
});

// Obtener todas las solicitudes de un usuario
app.get("/api/solicitudes/usuario/:id", async (req, res) => {
  try {
    const solicitudes = await Solicitud.find({ "usuario.id": req.params.id });
    res.json(solicitudes);
  } catch (err) {
    console.error("❌ Error al obtener solicitudes del usuario:", err);
    res.status(500).json({ error: "Error al obtener solicitudes" });
  }
});

// Obtener todas las solicitudes de un refugio
app.get("/api/solicitudes/refugio/:id", async (req, res) => {
  try {
    const solicitudes = await Solicitud.find({ "refugio.id": req.params.id });
    res.json(solicitudes);
  } catch (err) {
    console.error("❌ Error al obtener solicitudes del refugio:", err);
    res.status(500).json({ error: "Error al obtener solicitudes" });
  }
});

// Actualizar estado de solicitud (refugio)
app.patch("/api/solicitudes/:id", async (req, res) => {
  try {
    const { estado } = req.body;
    if (!["recibido", "revisando", "aprobado", "rechazado"].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const solicitud = await Solicitud.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    );

    if (!solicitud)
      return res.status(404).json({ error: "Solicitud no encontrada" });

    res.json(solicitud);
  } catch (err) {
    console.error("❌ Error al actualizar solicitud:", err);
    res.status(500).json({ error: "Error al actualizar solicitud" });
  }
});

// Obtener solicitudes de adopción de un refugio específico
app.get('/api/solicitudes-adopcion/refugio/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const solicitudes = await SolicitudAdopcion.find({ id_refugio: id })
      .populate('id_usuario', 'nombre apellido email telefono')
      .populate('id_animal', 'nombre especie raza fotos')
      .sort({ fecha_envio: -1 });

    const solicitudesFormateadas = solicitudes.map(sol => ({
      _id: sol._id,
      mascota: sol.id_animal?.nombre || 'Mascota no encontrada',
      especie: sol.id_animal?.especie || '',
      raza: sol.id_animal?.raza || '',
      fotos: sol.id_animal?.fotos || [],
      usuario: {
        id: sol.id_usuario?._id,
        nombre: `${sol.id_usuario?.nombre || ''} ${sol.id_usuario?.apellido || ''}`.trim() || 'Usuario no encontrado',
        email: sol.id_usuario?.email || '',
        telefono: sol.id_usuario?.telefono || ''
      },
      motivo: sol.motivo,
      estado: sol.estado,
      fechaCreacion: sol.fecha_envio,
      documentoINE: sol.documento_ine.map(doc => `/uploads/${doc}`),
      ha_adoptado_antes: sol.ha_adoptado_antes,
      cantidad_mascotas_anteriores: sol.cantidad_mascotas_anteriores,
      fotos_mascotas_anteriores: sol.fotos_mascotas_anteriores.map(foto => `/uploads/${foto}`),
      tipo_vivienda: sol.tipo_vivienda,
      permiso_mascotas_renta: sol.permiso_mascotas_renta,
      fotos_espacio_mascota: sol.fotos_espacio_mascota.map(foto => `/uploads/${foto}`)
    }));

    res.json({
      success: true,
      solicitudes: solicitudesFormateadas
    });
  } catch (error) {
    console.error('Error al obtener solicitudes de adopción para refugio:', error);
    res.status(500).json({ success: false, message: 'Error al obtener solicitudes de adopción' });
  }
});

// Actualizar estado de solicitud de adopción
app.patch('/api/solicitudes-adopcion/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!['pendiente', 'aprobada', 'rechazada'].includes(estado)) {
      return res.status(400).json({ success: false, message: 'Estado inválido' });
    }

    const solicitud = await SolicitudAdopcion.findByIdAndUpdate(
      id,
      { estado },
      { new: true }
    )
    .populate('id_usuario', 'nombre apellido email telefono')
    .populate('id_animal', 'nombre especie raza fotos');

    if (!solicitud) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
    }

    // Si se aprueba, marcar al animal como adoptado
    if (estado === 'aprobada') {
      await Animal.findByIdAndUpdate(solicitud.id_animal._id, { adoptado: true });
    }

    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      solicitud
    });
  } catch (error) {
    console.error('Error al actualizar solicitud de adopción:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar solicitud' });
  }
});

// =============================
// MIDDLEWARES GLOBALES DE ERROR
// =============================
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Ruta no encontrada" });
});

app.use((err, req, res, next) => {
  console.error("❌ Error interno del servidor:", err.stack);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    error: err.message
  });
});

// Middleware para manejar errores 404 (ruta no encontrada)
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});
// Middleware de manejo de errores general
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging
  res.status(500).json({ success: false, message: 'Error interno del servidor', error: err.message });
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});