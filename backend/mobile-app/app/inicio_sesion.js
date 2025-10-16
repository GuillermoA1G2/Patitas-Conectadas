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
import { Ionicons } from '@expo/vector-icons';

// ==========================================
// BACKEND SECTION - Lógica de Autenticación
// ==========================================

class AuthService {
  static BASE_URL = 'http://192.168.1.119:3000/api';

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

  static obtenerEndpoint(tipoUsuario) {
    const endpoints = {
      usuario: `${this.BASE_URL}/login`,
      refugio: `${this.BASE_URL}/login/refugio`,
      admin: `${this.BASE_URL}/login/admin`
    };
    return endpoints[tipoUsuario] || endpoints.usuario;
  }

  static determinarRutaPorRol(userData, tipoUsuario) {
    if (tipoUsuario === 'refugio') {
      return {
        pathname: '/refugio',
        params: {
          refugioId: userData.id || userData._id,
          refugioNombre: userData.nombre,
          refugioEmail: userData.email,
          refugioTelefono: userData.telefono || '',
          usuarioTipo: 'refugio'
        }
      };
    }

    const rol = userData.rol || userData.id_rol;

    if (rol === 5) {
      return {
        pathname: '/admin',
        params: {
          adminId: userData.id || userData._id,
          adminNombre: userData.nombre,
          adminEmail: userData.email,
          usuarioTipo: 'admin',
          id_rol: rol
        }
      };
    } else {
      return {
        pathname: '/PerfilUsuario',
        params: {
          usuarioId: userData.id || userData._id,
          usuarioNombre: userData.nombre,
          usuarioEmail: userData.email,
          usuarioTelefono: userData.telefono || '',
          usuarioTipo: 'usuario',
          id_rol: rol || 4
        }
      };
    }
  }

  static procesarRespuestaLogin(response, tipoUsuario) {
    if (!response.data) {
      throw new Error('Respuesta del servidor incompleta.');
    }

    let userData;
    if (tipoUsuario === 'refugio') {
      userData = response.data.refugio;
    } else {
      userData = response.data.usuario;
    }

    if (!userData) {
      throw new Error('Datos de usuario no encontrados en la respuesta.');
    }

    const parametrosRedireccion = this.determinarRutaPorRol(userData, tipoUsuario);

    let mensajeBienvenida;
    const rol = userData.rol || userData.id_rol;

    if (tipoUsuario === 'refugio') {
      mensajeBienvenida = `¡Bienvenido ${userData.nombre}!`;
    } else if (rol === 5) {
      mensajeBienvenida = `¡Bienvenido Administrador ${userData.nombre}!`;
    } else {
      mensajeBienvenida = `¡Bienvenid@ ${userData.nombre}!`;
    }

    return {
      mensajeBienvenida,
      parametrosRedireccion,
      userData
    };
  }

  static manejarErrorLogin(error) {
    console.log('Error details:', error.response?.data || error.message);

    if (error.response) {
      const mensajes = {
        400: 'Datos inválidos. Verifica que hayas completado todos los campos.',
        401: 'Correo o contraseña incorrectos.',
        404: 'Usuario no encontrado. Verifica el tipo de cuenta seleccionado.',
        409: 'Conflicto con los datos proporcionados.',
        500: 'Error interno del servidor. Intenta más tarde.'
      };

      return mensajes[error.response.status] ||
        error.response.data?.message ||
        'Error desconocido del servidor.';
    } else if (error.request) {
      return `No se pudo conectar con el servidor. Verifica:\n• Tu conexión a internet\n• Que el servidor esté ejecutándose en el puerto 3000\n• La dirección IP del servidor (actualmente: ${this.BASE_URL.split('/api')[0]})`;
    } else {
      return error.message || 'Ocurrió un error inesperado.';
    }
  }

  static configurarAxios() {
    axios.interceptors.request.handlers = [];
    axios.interceptors.response.handlers = [];

    axios.interceptors.request.use(
      (config) => {
        console.log('Enviando request a:', config.url);
        console.log('Datos:', config.data);
        return config;
      },
      (error) => {
        console.log('Error en request:', error);
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      (response) => {
        console.log('Respuesta recibida de:', response.config.url);
        console.log('Status:', response.status);
        console.log('Data:', response.data);
        return response;
      },
      (error) => {
        console.log('Error en response:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  static async iniciarSesion(correo, contrasena, tipoUsuario) {
    try {
      this.configurarAxios();
      this.validarCampos(correo, contrasena);

      const endpoint = this.obtenerEndpoint(tipoUsuario);
      console.log('Intentando login en:', endpoint);
      console.log('Tipo de usuario seleccionado:', tipoUsuario);

      const response = await axios.post(endpoint, {
        email: correo,
        password: contrasena
      }, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Login exitoso:', response.data);

      const resultado = this.procesarRespuestaLogin(response, tipoUsuario);

      console.log('Redirigiendo a:', resultado.parametrosRedireccion.pathname);
      console.log('Rol del usuario:', resultado.userData?.rol || resultado.userData?.id_rol);

      return resultado;

    } catch (error) {
      console.error('Error en iniciarSesion:', error);
      throw new Error(this.manejarErrorLogin(error));
    }
  }
}

// ==========================================
// FRONTEND SECTION - Componentes de UI
// ==========================================

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
    <Text style={styles.iconoTipoUsuario}>
      {icono}
    </Text>
    <Text
      style={[
        styles.tituloTipoUsuario,
        tipoSeleccionado === tipo && styles.textoSeleccionado
      ]}
    >
      {titulo}
    </Text>
    <Text
      style={[
        styles.descripcionTipoUsuario,
        tipoSeleccionado === tipo && styles.textoSeleccionado
      ]}
    >
      {descripcion}
    </Text>
  </TouchableOpacity>
);

const SelectorTipoUsuario = ({ tipoSeleccionado, onSeleccionar, deshabilitado }) => (
  <View style={styles.tipoUsuarioContainer}>
    <Text style={styles.labelTipoUsuario}>Tipo de cuenta:</Text>

    <View style={styles.tipoUsuarioRow}>
      <TipoUsuarioButton
        tipo="usuario"
        titulo="Usuario"
        descripcion="Usuario/Admin"
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
    </View>
  </View>
);

const CampoCorreo = ({ correo, onCorreoChange, deshabilitado }) => (
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
      placeholderTextColor="#999"
    />
  </>
);

function CampoContrasena({ label, value, onChangeText, editable, placeholder }) {
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          editable={editable}
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={styles.passwordVisibilityToggle}
          onPress={() => setSecureTextEntry(!secureTextEntry)}
          disabled={!editable}
        >
          <Ionicons
            name={secureTextEntry ? 'eye-off' : 'eye'}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
      </View>
    </>
  );
}

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

const EnlacesAdicionales = ({ deshabilitado }) => (
  <>
    <View style={styles.registroContainer}>
      <Link href="/RecuperarContrasena" asChild>
        <TouchableOpacity disabled={deshabilitado} style={styles.linkRegistro}>
          <Text style={styles.textoRegistro}>
            ¿Olvidaste tu contraseña?{' '}
            <Text style={styles.linkRegistroTexto}>Recuperar</Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </View>

    <View style={styles.registroContainer}>
      <Link href="/registro_usuarios" asChild>
        <TouchableOpacity disabled={deshabilitado} style={styles.linkRegistro}>
          <Text style={styles.textoRegistro}>
            ¿No tienes cuenta?{' '}
            <Text style={styles.linkRegistroTexto}>Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </View>

    <Text style={styles.politicas}>
      Al continuar, aceptas nuestros{' '}
      <Text style={styles.politicasLink}>Términos de Servicio</Text>
      {' '}y{' '}
      <Text style={styles.politicasLink}>Política de Privacidad</Text>
    </Text>
  </>
);

// ==========================================
// MAIN COMPONENT (FRONTEND CONTROLLER)
// ==========================================

export default function LoginScreen() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [tipoUsuarioSeleccionado, setTipoUsuarioSeleccionado] = useState('usuario');
  const router = useRouter();

  const manejarInicioSesion = async () => {
    setCargando(true);

    try {
      console.log('Iniciando proceso de login...');
      console.log('Tipo de usuario seleccionado:', tipoUsuarioSeleccionado);
      console.log('Email:', correo);

      const resultado = await AuthService.iniciarSesion(
        correo,
        contrasena,
        tipoUsuarioSeleccionado
      );

      console.log('Login exitoso, redirigiendo a:', resultado.parametrosRedireccion.pathname);
      console.log('Parametros:', resultado.parametrosRedireccion.params);

      Alert.alert('Éxito', resultado.mensajeBienvenida, [
        {
          text: 'Continuar',
          onPress: () => {
            router.replace(resultado.parametrosRedireccion);
          }
        }
      ]);

    } catch (error) {
      console.error('Error en login:', error.message);
      Alert.alert('Error de Inicio de Sesión', error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />

      <Text style={styles.titulo}>¡Bienvenido!</Text>
      <Text style={styles.subtitulo}>Patitas Conectadas</Text>

      <SelectorTipoUsuario
        tipoSeleccionado={tipoUsuarioSeleccionado}
        onSeleccionar={setTipoUsuarioSeleccionado}
        deshabilitado={cargando}
      />

      <CampoCorreo
        correo={correo}
        onCorreoChange={setCorreo}
        deshabilitado={cargando}
      />

      <CampoContrasena
        label="Contraseña"
        placeholder="••••••••"
        value={contrasena}
        onChangeText={setContrasena}
        editable={!cargando}
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
// STYLES - Estilos de la Interfaz de Usuario
// ==========================================

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#A4645E',
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
    marginBottom: 5,
    color: '#ffffff',
  },
  subtitulo: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 15,
    fontWeight: '500',
  },
  tipoUsuarioContainer: {
    width: '100%',
    marginBottom: 20,
  },
  labelTipoUsuario: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    color: '#ffffff',
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
    shadowColor: '#FFD6EC',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  tipoUsuarioSeleccionado: {
    borderColor: '#ffe5f0',
    backgroundColor: '#ffe5f0',
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
    color: '#000000',
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    marginTop: 10,
    color: '#f7f3f3ff',
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
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  passwordVisibilityToggle: {
    padding: 10,
  },
  boton: {
    backgroundColor: '#FEE9E7',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
  botonDeshabilitado: {
    backgroundColor: '#cccccc',
  },
  botonTexto: {
    color: '#900B09',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registroContainer: {
    alignItems: 'center',
    marginVertical: 5,
  },
  textoRegistro: {
    color: '#f1f1f1ff',
    marginBottom: 3,
    fontSize: 14,
  },
  linkRegistro: {
    marginVertical: 4,
    paddingVertical: 1,
  },
  linkRegistroTexto: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 14,
  },
  politicas: {
    fontSize: 13,
    textAlign: 'center',
    color: '#f1f1f1ff',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  politicasLink: {
    textDecorationLine: 'underline',
    color: '#000000',
    fontWeight: '800',
  },
});