const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a la base de datos
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'TU_CONTRASEÑA',
  database: 'patitas_conectadas'
});

// Ruta para registrar un animal
app.post('/api/animales', (req, res) => {
  const {
    nombre, especie, raza, edad, genero, tamaño, descripcion, imagen_url, id_refugio
  } = req.body;

  const query = `INSERT INTO animales (nombre, especie, raza, edad, genero, tamaño, descripcion, imagen_url, id_refugio)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(query, [nombre, especie, raza, edad, genero, tamaño, descripcion, imagen_url, id_refugio],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Animal registrado exitosamente', id: result.insertId });
    });
});

app.listen(3000, () => {
  console.log('Servidor backend en http://localhost:3000');
});

// Ruta para iniciar sesión
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM usuarios WHERE email = ? AND password = ?';

  db.query(query, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = results[0];
    res.json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: {
        id: user.idUsuario,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        id_rol: user.id_rol
      }
    });
  });
});
