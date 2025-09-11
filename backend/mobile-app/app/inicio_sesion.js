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
  // CORREGIDO: Esta debe ser la URL de tu servidor Express, NO de MongoDB
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

  // NUEVO: Función para determinar la ruta basada en el rol del usuario
  static determinarRutaPorRol(userData, tipoUsuario) {
    // Para refugios, siempre van a /refugio
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

    // Para usuarios y admins, verificar el rol
    const rol = userData.rol || userData.id_rol;
    
    if (rol === 5) {
      // Admin
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
      // Usuario normal (rol 4 o cualquier otro)
      return {
        pathname: '/pantalla_inicio',
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

  // Procesamiento de respuestas - MEJORADO para manejar roles dinámicamente
  static procesarRespuestaLogin(response, tipoUsuario) {
    if (!response.data) {
      throw new Error('Respuesta del servidor incompleta.');
    }

    // Obtener los datos del usuario según el tipo de login
    let userData;
    if (tipoUsuario === 'refugio') {
      userData = response.data.refugio;
    } else {
      userData = response.data.usuario; // Para 'usuario' y 'admin'
    }

    if (!userData) {
      throw new Error('Datos de usuario no encontrados en la respuesta.');
    }

    // Determinar la ruta y parámetros basados en el rol real del usuario
    const parametrosRedireccion = this.determinarRutaPorRol(userData, tipoUsuario);
    
    // Generar mensaje de bienvenida basado en el rol
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
      userData // Agregamos los datos del usuario para debugging
    };
  }

  // Manejo de errores - MEJORADO
  static manejarErrorLogin(error) {
    console.log('Error details:', error.response?.data || error.message);
    
    if (error.response) {
      // El servidor respondió con un código de error
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
      // La petición se hizo pero no hubo respuesta
      return 'No se pudo conectar con el servidor. Verifica:\n• Tu conexión a internet\n• Que el servidor esté ejecutándose en el puerto 3000\n• La dirección IP del servidor (actualmente: 192.168.1.119)';
    } else {
      // Error de validación o algo más
      return error.message || 'Ocurrió un error inesperado.';
    }
  }

  // Método de configuración de axios para mejor debugging
  static configurarAxios() {
    // Limpiar interceptores anteriores para evitar duplicados
    axios.interceptors.request.handlers = [];
    axios.interceptors.response.handlers = [];

    // Interceptor para requests
    axios.interceptors.request.use(
      (config) => {
        console.log('🚀 Enviando request a:', config.url);
        console.log('📦 Datos:', config.data);
        return config;
      },
      (error) => {
        console.log('❌ Error en request:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para responses
    axios.interceptors.response.use(
      (response) => {
        console.log('✅ Respuesta recibida de:', response.config.url);
        console.log('📊 Status:', response.status);
        console.log('📋 Data:', response.data);
        return response;
      },
      (error) => {
        console.log('❌ Error en response:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  // MEJORADO: Método principal de autenticación con mejor logging
  static async iniciarSesion(correo, contrasena, tipoUsuario) {
    try {
      // Configurar axios para debugging
      this.configurarAxios();

      // Validaciones
      this.validarCampos(correo, contrasena);

      // Obtener endpoint
      const endpoint = this.obtenerEndpoint(tipoUsuario);
      console.log('🎯 Intentando login en:', endpoint);
      console.log('👤 Tipo de usuario seleccionado:', tipoUsuario);

      // Realizar petición con timeout
      const response = await axios.post(endpoint, {
        email: correo,
        password: contrasena
      }, {
        timeout: 15000, // 15 segundos de timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('🎉 Login exitoso:', response.data);

      // Procesar respuesta
      const resultado = this.procesarRespuestaLogin(response, tipoUsuario);
      
      // Log adicional para debugging de roles
      console.log('📍 Redirigiendo a:', resultado.parametrosRedireccion.pathname);
      console.log('👥 Rol del usuario:', resultado.userData?.rol || resultado.userData?.id_rol);

      return resultado;

    } catch (error) {
      console.error('💥 Error en iniciarSesion:', error);
      throw new Error(this.manejarErrorLogin(error));
    }
  }

  // Método para probar conexión con el servidor
  static async probarConexion() {
    try {
      console.log('🔍 Probando conexión con servidor...');
      const serverUrl = this.BASE_URL.replace('/api', '');
      console.log('🌐 URL del servidor:', serverUrl);
      
      const response = await axios.get(serverUrl, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Conexión exitosa:', response.data);
      return {
        exito: true,
        mensaje: response.data || 'Servidor respondiendo correctamente'
      };
    } catch (error) {
      console.log('❌ Error de conexión:', error);
      return {
        exito: false,
        mensaje: this.manejarErrorLogin(error)
      };
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

// MEJORADO: Selector de tipo de usuario con mejor descripción
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

// Componente para probar conexión
const BotonProbarConexion = ({ onPress, probandoConexion }) => (
  <TouchableOpacity 
    style={[styles.botonSecundario, probandoConexion && styles.botonDeshabilitado]} 
    onPress={onPress}
    disabled={probandoConexion}
  >
    {probandoConexion ? (
      <ActivityIndicator color="#0066ff" size="small" />
    ) : (
      <Text style={styles.botonSecundarioTexto}>Probar Conexión</Text>
    )}
  </TouchableOpacity>
);

// Componente de información del servidor
const InfoServidor = () => (
  <View style={styles.infoContainer}></View>
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
  const [probandoConexion, setProbandoConexion] = useState(false);
  const [tipoUsuarioSeleccionado, setTipoUsuarioSeleccionado] = useState('usuario');
  const router = useRouter();

  // Manejador para probar conexión
  const manejarProbarConexion = async () => {
    setProbandoConexion(true);
    
    try {
      const resultado = await AuthService.probarConexion();
      
      if (resultado.exito) {
        Alert.alert(
          'Conexión Exitosa ✅', 
          resultado.mensaje,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert(
          'Error de Conexión ❌', 
          resultado.mensaje,
          [
            { 
              text: 'Revisar IP', 
              onPress: () => {
                Alert.alert(
                  'Configuración del Servidor',
                  'Verifica que:\n\n• El servidor esté ejecutándose (node server.js)\n• La IP sea correcta: 192.168.1.119\n• El puerto 3000 esté disponible\n• Tu dispositivo esté en la misma red WiFi'
                );
              }
            },
            { text: 'OK', style: 'default' }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo probar la conexión');
    } finally {
      setProbandoConexion(false);
    }
  };

  // MEJORADO: Manejador principal de inicio de sesión
  const manejarInicioSesion = async () => {
    setCargando(true);

    try {
      console.log('🚀 Iniciando proceso de login...');
      console.log('👤 Tipo de usuario seleccionado:', tipoUsuarioSeleccionado);
      console.log('📧 Email:', correo);

      const resultado = await AuthService.iniciarSesion(
        correo, 
        contrasena, 
        tipoUsuarioSeleccionado
      );

      console.log('✅ Login exitoso, redirigiendo a:', resultado.parametrosRedireccion.pathname);
      console.log('📄 Parámetros:', resultado.parametrosRedireccion.params);

      // Mostrar mensaje de bienvenida
      Alert.alert('Éxito', resultado.mensajeBienvenida, [
        {
          text: 'Continuar',
          onPress: () => {
            // Redirigir usando replace para evitar volver atrás
            router.replace(resultado.parametrosRedireccion);
          }
        }
      ]);

    } catch (error) {
      console.error('❌ Error en login:', error.message);
      Alert.alert('Error de Inicio de Sesión', error.message);
    } finally {
      setCargando(false);
    }
  };

  // Render del componente principal
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      
      <Text style={styles.titulo}>¡Bienvenido!</Text>
      <Text style={styles.subtitulo}>Patitas Conectadas</Text>

      <InfoServidor />

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

      <BotonProbarConexion 
        onPress={manejarProbarConexion}
        probandoConexion={probandoConexion}
      />

      <EnlacesAdicionales deshabilitado={cargando} />
    </ScrollView>
  );
}

// ==========================================
// STYLES - MEJORADOS
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
  infoContainer: {
    marginBottom: 15,
  },
  infoTexto: {
    fontSize: 12,
    color: '#dddbdbff',
    textAlign: 'center',
    marginVertical: 2,
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
  botonSecundario: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ffe5f0',
  },
  botonSecundarioTexto: {
    color: '#a26b6c',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
  link: {
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  registroContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  textoRegistro: {
    color: '#f1f1f1ff',
    marginBottom: 8,
    fontSize: 14,
  },
  linkRegistro: {
    marginVertical: 4,
    paddingVertical: 4,
  },
  linkRegistroTexto: {
    color: '#000000',
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