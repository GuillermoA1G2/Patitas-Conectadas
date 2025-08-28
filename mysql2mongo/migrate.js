// Script para migrar desde MySQL (Patitas_Conectadas) a MongoDB
// Uso:
//   1) Copia este archivo como migrate.js
//   2) Crea un .env con tus credenciales (ver plantilla en el mensaje del chat)
//   3) npm i mysql2 mongodb dotenv
//   4) node migrate.js
// mongodb+srv://Guillermo:<22110067>@cluster01.huaafgq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster01

require('dotenv').config();
const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');

function parseMaybeJSON(v) {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'string') return v;
  const s = v.trim();
  // Algunas filas vienen como '"archivo.jpg"' (string JSON con comillas incluidas)
  // Intentamos JSON.parse y si falla, retiramos comillas externas.
  try {
    return JSON.parse(s);
  } catch (_) {
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1);
    }
    return s; // como string normal
  }
}

function toBool(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  const s = String(v).toLowerCase();
  return s === '1' || s === 'true' || s === 't' || s === 'yes' || s === 'y';
}

function toDate(v) {
  if (!v) return null;
  // mysql2 regresa Date para DATETIME/DATE si no se cambiaron opciones; por si llegara string lo convertimos
  try { return new Date(v); } catch (_) { return null; }
}

async function main() {
  const MYSQL_HOST = process.env.MYSQL_HOST || '127.0.0.1';
  const MYSQL_USER = process.env.MYSQL_USER || 'root';
  const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || 'password';
  const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'patitas_conectadas';
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Guillermo:<22110067>@cluster01.huaafgq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster01';
  const MONGO_DB = process.env.MONGO_DB || 'patitas_conectadas';
  const RESET = (process.env.RESET || 'false').toLowerCase() === 'true';

  if (!MONGODB_URI) {
    throw new Error('Falta MONGODB_URI en .env');
  }

  console.log('> Conectando a MySQL...');
  const sql = await mysql.createConnection({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    multipleStatements: true,
    charset: 'utf8mb4_general_ci',
  });

  console.log('> Conectando a MongoDB...');
  const mongo = new MongoClient(MONGODB_URI, { ignoreUndefined: true });
  await mongo.connect();
  const db = mongo.db(MONGO_DB);

  if (RESET) {
    console.log('> RESET=true → Eliminando base de datos destino en Mongo...');
    await db.dropDatabase();
  }

  async function migrate(query, transformFn, collectionName) {
    console.log(`\n> Migrando ${collectionName}...`);
    const [rows] = await sql.execute(query);
    const docs = rows.map(transformFn).filter(Boolean);
    if (!docs.length) {
      console.log(`  - No hay filas para ${collectionName}`);
      return 0;
    }
    const col = db.collection(collectionName);
    try {
      const res = await col.insertMany(docs, { ordered: false });
      console.log(`  - Insertados: ${res.insertedCount}`);
      return res.insertedCount || docs.length;
    } catch (err) {
      console.warn(`  ! Aviso al insertar ${collectionName}:`, err.message);
      // Intento alterno fila por fila para continuar aunque haya duplicados
      let ok = 0; let dup = 0;
      for (const d of docs) {
        try { await col.insertOne(d); ok++; } catch (e) { dup++; }
      }
      console.log(`  - Insertados (fallback): ${ok}, duplicados: ${dup}`);
      return ok;
    }
  }

  let total = 0;

  // ROLES
  total += await migrate(
    'SELECT id, nombre FROM roles',
    (r) => ({ _id: r.id, nombre: r.nombre }),
    'roles'
  );

  // REFUGIOS
  total += await migrate(
    'SELECT * FROM refugios',
    (r) => ({
      _id: r.idAsociacion,
      nombre: r.nombre,
      descripcion: r.descripcion,
      email: r.email,
      password: r.password,
      telefono: r.telefono,
      documentos_legales: r.documentos_legales,
      rfc: r.rfc,
      informacion_contacto: r.informacion_contacto,
      direccion: r.direccion,
      ciudad: r.ciudad,
      archivos_pdf: parseMaybeJSON(r.archivos_pdf) || [],
    }),
    'refugios'
  );

  // USUARIOS (con nombre del rol)
  total += await migrate(
    'SELECT u.*, r.nombre AS rol_nombre FROM usuarios u LEFT JOIN roles r ON u.id_rol = r.id',
    (u) => ({
      _id: u.idUsuario,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      password: u.password,
      telefono: u.telefono,
      direccion: u.direccion,
      fotoPerfil: parseMaybeJSON(u.fotoPerfil), // puede ser string o array
      id_rol: u.id_rol,
      rol_nombre: u.rol_nombre || null,
      id_refugio: u.id_refugio || null,
    }),
    'usuarios'
  );

  // ANIMALES
  total += await migrate(
    'SELECT * FROM animales',
    (a) => ({
      _id: a.idanimal,
      nombre: a.nombre,
      especie: a.especie,
      raza: a.raza,
      edad: a.edad != null ? Number(a.edad) : null,
      sexo: a.sexo,
      tamano: a.tamano,
      descripcion: a.descripcion,
      fotos: parseMaybeJSON(a.fotos) || [],
      historial_medico: a.historial_medico,
      necesidades: a.necesidades,
      esterilizacion: toBool(a.esterilizacion),
      adoptado: toBool(a.adoptado),
      id_refugio: a.id_refugio || null,
    }),
    'animales'
  );

  // SOLICITUDES DE ADOPCIÓN
  total += await migrate(
    'SELECT * FROM solicitudes_adopcion',
    (s) => ({
      _id: s.id,
      idUsuario: s.idUsuario,
      idMascota: s.idMascota,
      idAsociacion: s.idAsociacion,
      estadoSolicitud: s.estadoSolicitud,
      fechaAprobacion: toDate(s.fechaAprobacion),
      fechaEntrega: toDate(s.fechaEntrega),
    }),
    'solicitudes_adopcion'
  );

  // ADOPCIONES
  total += await migrate(
    'SELECT * FROM adopciones',
    (ad) => ({
      _id: ad.idAdopcion,
      idUsuario: ad.idUsuario,
      idMascota: ad.idMascota,
      idAsociacion: ad.idAsociacion,
      fechaAprobacion: toDate(ad.fechaAprobacion),
      fechaEntrega: toDate(ad.fechaEntrega),
      observaciones: ad.observaciones,
    }),
    'adopciones'
  );

  // SEGUIMIENTOS
  total += await migrate(
    'SELECT * FROM seguimientos',
    (sg) => ({
      _id: sg.idSeguimiento,
      idAdopcion: sg.idAdopcion,
      fechaSeguimiento: toDate(sg.fechaSeguimiento),
      estadoMascota: sg.estadoMascota,
      fotos: parseMaybeJSON(sg.fotos) || [],
      comentarios: sg.comentarios,
    }),
    'seguimientos'
  );

  // DONACIONES
  total += await migrate(
    'SELECT * FROM donaciones',
    (d) => ({
      _id: d.id,
      id_usuario: d.id_usuario,
      id_refugio: d.id_refugio,
      tipo: d.tipo,
      cantidad: d.cantidad != null ? Number(d.cantidad) : null,
      fecha: toDate(d.fecha),
    }),
    'donaciones'
  );

  // INSUMOS MATERIALES
  total += await migrate(
    'SELECT * FROM insumos_materiales',
    (i) => ({
      _id: i.id,
      nombre: i.nombre,
      descripcion: i.descripcion,
      cantidad: i.cantidad != null ? Number(i.cantidad) : 1,
      completado: toBool(i.completado),
      idUsuarioDonante: i.idUsuarioDonante,
      id_refugio: i.id_refugio,
      fecha_creacion: toDate(i.fecha_creacion),
    }),
    'insumos_materiales'
  );

  console.log(`\n> Total documentos insertados: ${total}`);

  // INDEXES recomendados
  console.log('\n> Creando índices...');
  try {
    await db.collection('usuarios').createIndex({ email: 1 }, { unique: true });
  } catch (e) { console.warn('  (usuarios.email) índice/único:', e.message); }

  await db.collection('usuarios').createIndex({ id_rol: 1 });
  await db.collection('refugios').createIndex({ email: 1 }, { unique: false });
  await db.collection('animales').createIndex({ id_refugio: 1 });
  await db.collection('animales').createIndex({ adoptado: 1 });
  await db.collection('donaciones').createIndex({ id_usuario: 1 });
  await db.collection('donaciones').createIndex({ id_refugio: 1 });
  await db.collection('insumos_materiales').createIndex({ id_refugio: 1 });
  await db.collection('insumos_materiales').createIndex({ completado: 1 });

  console.log('> Listo.');

  await sql.end();
  await mongo.close();
}

main().catch((err) => {
  console.error('ERROR en migración:', err);
  process.exit(1);
});
