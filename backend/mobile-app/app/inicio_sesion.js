import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Link } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

// ==========================================
// BACKEND SECTION
// ==========================================

class AuthService {
  static BASE_URL = 'http://192.168.1.119:3000/api';

  // Validaciones
  static validarEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validarCampos(correo, contrasena) {
    if (!correo || !contrasena) {
      throw new Error('Por favor completa todos los campos.');
    }
    
    if (!this.validarEmail(correo)) {
      throw new Error('Por favor ingresa un correo electrónico válido.');
    }
  }

  // Configuración de endpoints
  static obtenerEndpoint(tipoUsuario) {
    const endpoints = {
      'usuario': `${this.BASE_URL}/login`,
      'refugio': `${this.BASE_URL}/login/refugio`,
      'admin': `${this.BASE_URL}/login/admin`
    };
    return endpoints[tipoUsuario] || endpoints['usuario'];
  }

  // Procesamiento de respuestas
  static procesarRespuestaLogin(response, tipoUsuario) {
    if (!response.data) {
      throw new Error('Respuesta del servidor incompleta.');
    }

    const configuraciones = {
      'usuario': {
        dataKey: 'usuario',
        pathname: '/pantalla_inicio',
        mensajeBienvenida: (data) => `¡Bienvenido ${data.nombre}!`,
        params: (data) => ({
          usuarioId: data.id || data.idUsuario,
          usuarioNombre: data.nombre,
          usuarioEmail: data.email,
          usuarioTelefono: data.telefono || '',
          usuarioTipo: 'usuario',
          id_rol: data.rol || data.id_rol || 4
        })
      },
      'refugio': {
        dataKey: 'refugio',
        pathname: '/refugio',
        mensajeBienvenida: (data) => `¡Bienvenido ${data.nombre}!`,
        params: (data) => ({
          refugioId: data.id || data.idAsociacion,
          refugioNombre: data.nombre,
          refugioEmail: data.email,
          refugioTelefono: data.telefono || '',
          usuarioTipo: 'refugio'
        })
      },
      'admin': {
        dataKey: 'usuario', // El servidor devuelve 'usuario' para admin
        pathname: '/admin',
        mensajeBienvenida: (data) => `¡Bienvenido Administrador ${data.nombre}!`,
        params: (data) => ({
          adminId: data.id || data.idUsuario,
          adminNombre: data.nombre,
          adminEmail: data.email,
          usuarioTipo: 'admin',
          id_rol: data.rol || data.id_rol || 5
        })
      }
    };

    const config = configuraciones[tipoUsuario];
    const userData = response.data[config.dataKey];

    if (!userData) {
      throw new Error('Datos de usuario no encontrados en la respuesta.');
    }

    return {
      mensajeBienvenida: config.mensajeBienvenida(userData),
      parametrosRedireccion: {
        pathname: config.pathname,
        params: config.params(userData)
      }
    };
  }

  // Manejo de errores
  static manejarErrorLogin(error) {
    if (error.response) {
      // El servidor respondió con un código de error
      const mensajes = {
        401: 'Correo o contraseña incorrectos.',
        404: 'Usuario no encontrado. Verifica el tipo de cuenta seleccionado.',
        500: 'Error interno del servidor. Intenta más tarde.'
      };
      
      return mensajes[error.response.status] || 
             error.response.data?.mensaje || 
             'Error desconocido.';
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    } else {
      // Error de validación o algo más
      return error.message || 'Ocurrió un error inesperado.';
    }
  }

  // Método principal de autenticación
  static async iniciarSesion(correo, contrasena, tipoUsuario) {
    try {
      // Validaciones
      this.validarCampos(correo, contrasena);

      // Obtener endpoint
      const endpoint = this.obtenerEndpoint(tipoUsuario);

      // Realizar petición
      const response = await axios.post(endpoint, {
        email: correo,
        password: contrasena
      });

      // Procesar respuesta
      return this.procesarRespuestaLogin(response, tipoUsuario);

    } catch (error) {
      throw new Error(this.manejarErrorLogin(error));
    }
  }
}

// ==========================================
// FRONTEND SECTION
// ==========================================

// Componente para botón de tipo de usuario
const TipoUsuarioButton = ({ 
  tipo, 
  titulo, 
  descripcion, 
  icono, 
  tipoSeleccionado, 
  onSeleccionar, 
  deshabilitado 
}) => (
  <TouchableOpacity 
    style={[
      styles.tipoUsuarioButton, 
      tipoSeleccionado === tipo && styles.tipoUsuarioSeleccionado
    ]}
    onPress={() => onSeleccionar(tipo)}
    disabled={deshabilitado}
  >
    <Text style={styles.iconoTipoUsuario}>{icono}</Text>
    <Text style={[
      styles.tituloTipoUsuario,
      tipoSeleccionado === tipo && styles.textoSeleccionado
    ]}>
      {titulo}
    </Text>
    <Text style={[
      styles.descripcionTipoUsuario,
      tipoSeleccionado === tipo && styles.textoSeleccionado
    ]}>
      {descripcion}
    </Text>
  </TouchableOpacity>
);

// Componente para selector de tipo de usuario
const SelectorTipoUsuario = ({ tipoSeleccionado, onSeleccionar, deshabilitado }) => (
  <View style={styles.tipoUsuarioContainer}>
    <Text style={styles.labelTipoUsuario}>Tipo de cuenta:</Text>
    
    <View style={styles.tipoUsuarioRow}>
      <TipoUsuarioButton 
        tipo="usuario"
        titulo="Usuario"
        descripcion="Adoptar mascotas"
        icono="👤"
        tipoSeleccionado={tipoSeleccionado}
        onSeleccionar={onSeleccionar}
        deshabilitado={deshabilitado}
      />
      <TipoUsuarioButton 
        tipo="refugio"
        titulo="Refugio"
        descripcion="Asociación/ONG"
        icono="🏠"
        tipoSeleccionado={tipoSeleccionado}
        onSeleccionar={onSeleccionar}
        deshabilitado={deshabilitado}
      />
      <TipoUsuarioButton 
        tipo="admin"
        titulo="Admin"
        descripcion="Administrador"
        icono="⚙️"
        tipoSeleccionado={tipoSeleccionado}
        onSeleccionar={onSeleccionar}
        deshabilitado={deshabilitado}
      />
    </View>
  </View>
);

// Componente para campos de entrada
const CamposLogin = ({ correo, contrasena, onCorreoChange, onContrasenaChange, deshabilitado }) => (
  <>
    <Text style={styles.label}>Correo electrónico</Text>
    <TextInput
      style={styles.input}
      placeholder="email@mail.com"
      keyboardType="email-address"
      value={correo}
      onChangeText={onCorreoChange}
      autoCapitalize="none"
      autoCorrect={false}
      editable={!deshabilitado}
    />

    <Text style={styles.label}>Contraseña</Text>
    <TextInput
      style={styles.input}
      placeholder="********"
      secureTextEntry
      value={contrasena}
      onChangeText={onContrasenaChange}
      editable={!deshabilitado}
    />
  </>
);

// Componente para botón de login
const BotonLogin = ({ onPress, cargando }) => (
  <TouchableOpacity 
    style={[styles.boton, cargando && styles.botonDeshabilitado]} 
    onPress={onPress}
    disabled={cargando}
  >
    {cargando ? (
      <ActivityIndicator color="white" />
    ) : (
      <Text style={styles.botonTexto}>Iniciar sesión</Text>
    )}
  </TouchableOpacity>
);

// Componente para enlaces adicionales
const EnlacesAdicionales = ({ deshabilitado }) => (
  <>
    <TouchableOpacity disabled={deshabilitado}>
      <Text style={styles.link}>¿Olvidaste la contraseña?</Text>
    </TouchableOpacity>

    <View style={styles.registroContainer}>
      <Link href="/registro_usuarios" asChild>
        <TouchableOpacity disabled={deshabilitado} style={styles.linkRegistro}>
          <Text style={styles.textoRegistro}>
            ¿No tienes cuenta? <Text style={styles.linkRegistroTexto}>Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </View>

    <Text style={styles.politicas}>
      By clicking continue, you agree to our{' '}
      <Text style={{ textDecorationLine: 'underline' }}>Terms of Service</Text> and{' '}
      <Text style={{ textDecorationLine: 'underline' }}>Privacy Policy</Text>
    </Text>
  </>
);

// ==========================================
// MAIN COMPONENT (FRONTEND CONTROLLER)
// ==========================================

export default function LoginScreen() {
  // Estados del componente
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [tipoUsuarioSeleccionado, setTipoUsuarioSeleccionado] = useState('usuario');
  const router = useRouter();

  // Manejador principal de inicio de sesión
  const manejarInicioSesion = async () => {
    setCargando(true);

    try {
      const resultado = await AuthService.iniciarSesion(
        correo, 
        contrasena, 
        tipoUsuarioSeleccionado
      );

      Alert.alert('Éxito', resultado.mensajeBienvenida);
      router.replace(resultado.parametrosRedireccion);

    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setCargando(false);
    }
  };

  // Render del componente principal
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      
      <Text style={styles.titulo}>¡Bienvenido!</Text>

      <SelectorTipoUsuario 
        tipoSeleccionado={tipoUsuarioSeleccionado}
        onSeleccionar={setTipoUsuarioSeleccionado}
        deshabilitado={cargando}
      />

      <CamposLogin 
        correo={correo}
        contrasena={contrasena}
        onCorreoChange={setCorreo}
        onContrasenaChange={setContrasena}
        deshabilitado={cargando}
      />

      <BotonLogin 
        onPress={manejarInicioSesion}
        cargando={cargando}
      />

      <EnlacesAdicionales deshabilitado={cargando} />
    </ScrollView>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#a2d2ff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  tipoUsuarioContainer: {
    width: '100%',
    marginBottom: 20,
  },
  labelTipoUsuario: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  tipoUsuarioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  tipoUsuarioButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 2,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  tipoUsuarioSeleccionado: {
    borderColor: '#0066ff',
    backgroundColor: '#e6f3ff',
  },
  iconoTipoUsuario: {
    fontSize: 20,
    marginBottom: 4,
  },
  tituloTipoUsuario: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  descripcionTipoUsuario: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  textoSeleccionado: {
    color: '#0066ff',
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    marginTop: 10,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  boton: {
    backgroundColor: '#0066ff',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginTop: 10,
    marginBottom: 15,
  },
  botonDeshabilitado: {
    backgroundColor: '#cccccc',
  },
  botonTexto: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  registroContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  textoRegistro: {
    color: '#333',
    marginBottom: 8,
    fontSize: 14,
  },
  linkRegistro: {
    marginVertical: 4,
    paddingVertical: 4,
  },
  linkRegistroTexto: {
    color: '#ff791a',
    fontWeight: '600',
    fontSize: 14,
  },
  politicas: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
    marginTop: 20,
    paddingHorizontal: 10,
  },
});