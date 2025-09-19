const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://Guillermo:22110067@cluster01.huaafgq.mongodb.net/patitas_conectadas?retryWrites=true&w=majority&appName=Cluster01';

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

// Conexión a MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Conexión a MongoDB establecida correctamente');
  })
  .catch((err) => {
    console.error('Error al conectar a MongoDB:', err);
  });

// Esquemas de MongoDB
const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  telefono: String,
  direccion: String,
  foto_perfil: String,
  id_rol: { type: Number, default: 4 }, // 4 = usuario normal, 5 = admin
  fecha_registro: { type: Date, default: Date.now }
});

const refugioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  telefono: String,
  direccion: String,
  ciudad: String,
  fecha_registro: { type: Date, default: Date.now }
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

// NUEVO ESQUEMA PARA SOLICITUDES DE ADOPCIÓN
const solicitudAdopcionSchema = new mongoose.Schema({
  id_usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  id_animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true },
  id_refugio: { type: mongoose.Schema.Types.ObjectId, ref: 'Refugio', required: true },
  motivo: { type: String, required: true },
  fecha_envio: { type: Date, default: Date.now },
  estado: { type: String, enum: ['pendiente', 'aprobada', 'rechazada'], default: 'pendiente' },
  documento_ine: { type: String, required: true }, // Ruta del archivo INE
  ha_adoptado_antes: { type: String, enum: ['si', 'no'], required: true },
  cantidad_mascotas_anteriores: { type: Number, default: 0 },
  fotos_mascotas_anteriores: [String], // Array de rutas de fotos
  tipo_vivienda: { type: String, enum: ['propio', 'renta'], required: true },
  permiso_mascotas_renta: { type: String, enum: ['si', 'no', 'no_aplica'], default: 'no_aplica' }, // 'no_aplica' si es vivienda propia
  fotos_espacio_mascota: [String], // Array de rutas de fotos del espacio
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
        id_rol: usuario.id_rol // Mantener compatibilidad
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
app.post('/api/usuarios', async (req, res) => {
  try {
    const { nombre, apellido, email, password, telefono, direccion } = req.body;
    
    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
    }
    
    // Verificar si el email ya existe
    const existeUsuario = await Usuario.findOne({ email });
    if (existeUsuario) {
      return res.status(409).json({ success: false, message: 'El email ya está registrado' });
    }
    
    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      email,
      password,
      telefono,
      direccion,
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
        email: usuarioGuardado.email
      }
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ success: false, message: 'Error al registrar usuario' });
  }
});

// Actualizar perfil de usuario
app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, telefono, direccion } = req.body;
    
    if (!nombre || !apellido) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre y apellido son obligatorios' 
      });
    }
    
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      id, 
      { nombre, apellido, telefono, direccion },
      { new: true }
    ).select('-password');
    
    if (!usuarioActualizado) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
    res.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
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
app.post('/api/asociaciones', async (req, res) => {
  try {
    const { nombre, descripcion, email, password, telefono, direccion, ciudad } = req.body;
    
    if (!nombre || !email || !password) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
    }
    
    // Verificar si el email ya existe
    const existeRefugio = await Refugio.findOne({ email });
    if (existeRefugio) {
      return res.status(409).json({ success: false, message: 'El email ya está registrado' });
    }
    
    const nuevoRefugio = new Refugio({
      nombre,
      descripcion,
      email,
      password,
      telefono,
      direccion,
      ciudad
    });
    
    const refugioGuardado = await nuevoRefugio.save();
    
    res.status(201).json({
      success: true,
      message: 'Refugio registrado correctamente',
      refugio: {
        id: refugioGuardado._id,
        nombre: refugioGuardado.nombre,
        email: refugioGuardado.email
      }
    });
  } catch (error) {
    console.error('Error al registrar refugio:', error);
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
      ciudad: refugio.ciudad
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
    
    res.json({ success: true, refugio });
  } catch (error) {
    console.error('Error al obtener datos del refugio:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos del refugio' });
  }
});

// Update refuge profile
app.put('/api/refugio/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, descripcion, direccion, ciudad } = req.body;
    
    // Validate required fields
    if (!nombre || !email) {
      return res.status(400).json({ success: false, message: 'Nombre y email son obligatorios' });
    }
    
    // Check if email is being changed and if it already exists
    const emailExistente = await Refugio.findOne({ email, _id: { $ne: id } });
    
    if (emailExistente) {
      return res.status(409).json({ success: false, message: 'El email ya está en uso por otro refugio' });
    }
    
    // Update refuge in database
    await Refugio.findByIdAndUpdate(id, {
      nombre,
      email,
      telefono,
      descripcion,
      direccion,
      ciudad
    });
    
    res.json({ success: true, message: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar refugio:', error);
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
      fotos: animal.fotos,
      historial_medico: animal.historial_medico,
      necesidades: animal.necesidades,
      esterilizacion: animal.esterilizacion,
      adoptado: animal.adoptado,
      refugio_nombre: animal.id_refugio?.nombre || 'Refugio no encontrado',
      refugio_telefono: animal.id_refugio?.telefono || ''
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
      fotos: animal.fotos,
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
        fotos: animalGuardado.fotos
      }
    });
  } catch (error) {
    console.error('Error al agregar animal:', error);
    res.status(500).json({ success: false, message: 'Error al agregar animal' });
  }
});

// RUTA PARA REGISTRAR SOLICITUDES DE ADOPCIÓN
app.post('/api/solicitudes-adopcion', upload.fields([
  { name: 'documentoINE', maxCount: 1 },
  { name: 'fotosMascotasAnteriores', maxCount: 5 },
  { name: 'fotosEspacioMascota', maxCount: 5 }
]), async (req, res) => {
  // Helper para eliminar archivos subidos en caso de error
  const cleanupFiles = (files) => {
    if (files) {
      if (files.documentoINE && files.documentoINE[0]) {
        fs.unlink(path.join(uploadsDir, files.documentoINE[0].filename), (err) => {
          if (err) console.error('Error al eliminar documentoINE:', err);
        });
      }
      if (files.fotosMascotasAnteriores) {
        files.fotosMascotasAnteriores.forEach(file => {
          fs.unlink(path.join(uploadsDir, file.filename), (err) => {
            if (err) console.error('Error al eliminar fotosMascotasAnteriores:', err);
          });
        });
      }
      if (files.fotosEspacioMascota) {
        files.fotosEspacioMascota.forEach(file => {
          fs.unlink(path.join(uploadsDir, file.filename), (err) => {
            if (err) console.error('Error al eliminar fotosEspacioMascota:', err);
          });
        });
      }
    }
  };

  try {
    const {
      idUsuario, // Asumimos que el ID del usuario logueado se envía en el body
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
      cleanupFiles(req.files); // <--- Limpiar archivos si la validación falla
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios en el formulario.' });
    }

    // Validar archivos
    if (!req.files || !req.files.documentoINE || req.files.documentoINE.length === 0) {
      cleanupFiles(req.files); // <--- Limpiar archivos si la validación falla
      return res.status(400).json({ success: false, message: 'El documento INE es obligatorio.' });
    }
    if (haAdoptadoAntes === 'si' && (!cantidadMascotasAnteriores || parseInt(cantidadMascotasAnteriores) <= 0)) {
      cleanupFiles(req.files); // <--- Limpiar archivos si la validación falla
      return res.status(400).json({ success: false, message: 'Debe indicar la cantidad de mascotas anteriores si ha adoptado antes.' });
    }
    if (haAdoptadoAntes === 'si' && (!req.files.fotosMascotasAnteriores || req.files.fotosMascotasAnteriores.length === 0)) {
      cleanupFiles(req.files); // <--- Limpiar archivos si la validación falla
      return res.status(400).json({ success: false, message: 'Debe subir fotos de sus mascotas anteriores si ha adoptado antes.' });
    }
    if (tipoVivienda === 'renta' && !permisoMascotasRenta) {
      cleanupFiles(req.files); // <--- Limpiar archivos si la validación falla
      return res.status(400).json({ success: false, message: 'Debe indicar si su contrato de renta permite mascotas.' });
    }
    if (!req.files.fotosEspacioMascota || req.files.fotosEspacioMascota.length === 0) {
      cleanupFiles(req.files); // <--- Limpiar archivos si la validación falla
      return res.status(400).json({ success: false, message: 'Debe subir fotos del espacio donde vivirá la mascota.' });
    }

    // Verificar existencia de usuario, animal y refugio
    const usuario = await Usuario.findById(idUsuario);
    if (!usuario) {
      cleanupFiles(req.files); // <--- Limpiar archivos si la validación falla
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }
    const animal = await Animal.findById(idAnimal);
    if (!animal) {
      cleanupFiles(req.files); // <--- Limpiar archivos si la validación falla
      return res.status(404).json({ success: false, message: 'Animal no encontrado.' });
    }
    const refugio = await Refugio.findById(idRefugio);
    if (!refugio) {
      cleanupFiles(req.files); // <--- Limpiar archivos si la validación falla
      return res.status(404).json({ success: false, message: 'Refugio no encontrado.' });
    }

    // Obtener rutas de los archivos subidos
    const documento_ine_path = req.files.documentoINE[0].filename;
    const fotos_mascotas_anteriores_paths = req.files.fotosMascotasAnteriores ? req.files.fotosMascotasAnteriores.map(file => file.filename) : [];
    const fotos_espacio_mascota_paths = req.files.fotosEspacioMascota ? req.files.fotosEspacioMascota.map(file => file.filename) : [];

    const nuevaSolicitud = new SolicitudAdopcion({
      id_usuario: idUsuario,
      id_animal: idAnimal,
      id_refugio: idRefugio,
      motivo,
      documento_ine: documento_ine_path,
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
    // Asegurarse de eliminar los archivos subidos si ocurre un error después de la subida
    cleanupFiles(req.files); // <--- Limpiar archivos en caso de error general
    res.status(500).json({ success: false, message: 'Error interno del servidor al procesar la solicitud de adopción.' });
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
  // Añadir esta configuración para ignorar certificados autofirmados
  tls: {
    rejectUnauthorized: false,
  },
});

// =============================
// PASSWORD RECOVERY UTILITIES
// =============================
async function generarToken(usuario) {
  const token = crypto.randomBytes(20).toString('hex');
  const expira = Date.now() + 3600000;

  usuario.resetToken = token;
  usuario.resetTokenExp = expira;
  await usuario.save();

  return token;
}

async function enviarCorreoRecuperacion(usuario, token) {
  const resetLink = `${process.env.BASE_URL}/reset-password?token=${token}&email=${usuario.email}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: usuario.email,
    subject: 'Recuperación de contraseña - Patitas Conectadas',
    html: `
      <h2>Hola ${usuario.nombre}</h2>
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

    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

    const token = await generarToken(usuario);
    await enviarCorreoRecuperacion(usuario, token);

    res.status(200).json({ mensaje: 'Correo de recuperación enviado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, token, nuevaPassword } = req.body;
    if (!email || !token || !nuevaPassword)
      return res.status(400).json({ message: 'Datos incompletos' });

    const usuario = await Usuario.findOne({
      email,
      resetToken: token,
      resetTokenExp: { $gt: Date.now() },
    });

    if (!usuario)
      return res.status(400).json({ message: 'Token inválido o expirado' });

    usuario.password = nuevaPassword;
    usuario.resetToken = undefined;
    usuario.resetTokenExp = undefined;
    await usuario.save();

    res.status(200).json({ mensaje: 'Contraseña restablecida correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
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