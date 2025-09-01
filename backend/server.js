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

// Modelos
const Usuario = mongoose.model('Usuario', usuarioSchema);
const Refugio = mongoose.model('Refugio', refugioSchema);
const Donacion = mongoose.model('Donacion', donacionSchema);
const InsumoMaterial = mongoose.model('InsumoMaterial', insumoMaterialSchema);
const Animal = mongoose.model('Animal', animalSchema);

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
app.get('/api/usuario/:id', async (req, res) => {
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

// Registro de asociaciones/refugios
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});