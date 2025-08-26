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

export default function LoginScreen() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [tipoUsuarioSeleccionado, setTipoUsuarioSeleccionado] = useState('usuario'); // 'usuario', 'refugio', 'admin'
  const router = useRouter();

  const iniciarSesion = async () => {
    if (!correo || !contrasena) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido.');
      return;
    }

    setCargando(true);

    try {
      let endpoint = '';
      let mensajeBienvenida = '';
      let parametrosRedireccion = {};

      // Determinar endpoint según tipo de usuario
      switch (tipoUsuarioSeleccionado) {
        case 'usuario':
          endpoint = 'http://192.168.1.119:3000/api/login';
          break;
        case 'refugio':
          endpoint = 'http://192.168.1.119:3000/api/login/refugio';
          break;
        case 'admin':
          endpoint = 'http://192.168.1.119:3000/api/login/admin';
          break;
        default:
          endpoint = 'http://192.168.1.119:3000/api/login';
      }

      const response = await axios.post(endpoint, {
        email: correo,
        password: contrasena
      });

      if (response.data) {
        // Manejar respuesta según tipo de usuario
        switch (tipoUsuarioSeleccionado) {
          case 'usuario':
            if (response.data.usuario) {
              mensajeBienvenida = `¡Bienvenido ${response.data.usuario.nombre}!`;
              parametrosRedireccion = {
                pathname: '/pantalla_inicio',
                params: { 
                  usuarioId: response.data.usuario.idUsuario || response.data.usuario.id,
                  usuarioNombre: response.data.usuario.nombre,
                  usuarioEmail: response.data.usuario.email,
                  usuarioTelefono: response.data.usuario.telefono || '',
                  usuarioTipo: 'usuario',
                  id_rol: response.data.usuario.id_rol || 4
                }
              };
            }
            break;
            
          case 'refugio':
            if (response.data.refugio) {
              mensajeBienvenida = `¡Bienvenido ${response.data.refugio.nombre}!`;
              parametrosRedireccion = {
                pathname: '/refugio',
                params: { 
                  refugioId: response.data.refugio.idAsociacion,
                  refugioNombre: response.data.refugio.nombre,
                  refugioEmail: response.data.refugio.email,
                  refugioTelefono: response.data.refugio.telefono || '',
                  usuarioTipo: 'refugio'
                }
              };
            }
            break;
            
          case 'admin':
            if (response.data.usuario) {
              mensajeBienvenida = `¡Bienvenido Administrador ${response.data.usuario.nombre}!`;
              parametrosRedireccion = {
                pathname: '/admin',
                params: { 
                  adminId: response.data.usuario.idUsuario || response.data.usuario.id,
                  adminNombre: response.data.usuario.nombre,
                  adminEmail: response.data.usuario.email,
                  usuarioTipo: 'admin',
                  id_rol: response.data.usuario.id_rol
                }
              };
            }
            break;
        }

        Alert.alert('Éxito', mensajeBienvenida);
        router.replace(parametrosRedireccion);
      } else {
        Alert.alert('Error', 'Respuesta del servidor incompleta.');
      }

    } catch (error) {
      console.error('Error de login:', error);
      
      if (error.response) {
        // El servidor respondió con un código de error
        switch (error.response.status) {
          case 401:
            Alert.alert('Error', 'Correo o contraseña incorrectos.');
            break;
          case 404:
            Alert.alert('Error', 'Usuario no encontrado. Verifica el tipo de cuenta seleccionado.');
            break;
          case 500:
            Alert.alert('Error', 'Error interno del servidor. Intenta más tarde.');
            break;
          default:
            Alert.alert('Error', error.response.data?.mensaje || 'Error desconocido.');
        }
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        Alert.alert('Error', 'No se pudo conectar con el servidor. Verifica tu conexión a internet.');
      } else {
        // Algo más salió mal
        Alert.alert('Error', 'Ocurrió un error inesperado.');
      }
    } finally {
      setCargando(false);
    }
  };

  const TipoUsuarioButton = ({ tipo, titulo, descripcion, icono }) => (
    <TouchableOpacity 
      style={[
        styles.tipoUsuarioButton, 
        tipoUsuarioSeleccionado === tipo && styles.tipoUsuarioSeleccionado
      ]}
      onPress={() => setTipoUsuarioSeleccionado(tipo)}
      disabled={cargando}
    >
      <Text style={styles.iconoTipoUsuario}>{icono}</Text>
      <Text style={[
        styles.tituloTipoUsuario,
        tipoUsuarioSeleccionado === tipo && styles.textoSeleccionado
      ]}>
        {titulo}
      </Text>
      <Text style={[
        styles.descripcionTipoUsuario,
        tipoUsuarioSeleccionado === tipo && styles.textoSeleccionado
      ]}>
        {descripcion}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />

      <Text style={styles.titulo}>¡Bienvenido!</Text>

      {/* Selector de tipo de usuario */}
      <View style={styles.tipoUsuarioContainer}>
        <Text style={styles.labelTipoUsuario}>Tipo de cuenta:</Text>
        
        <View style={styles.tipoUsuarioRow}>
          <TipoUsuarioButton 
            tipo="usuario"
            titulo="Usuario"
            descripcion="Adoptar mascotas"
            icono="👤"
          />
          <TipoUsuarioButton 
            tipo="refugio"
            titulo="Refugio"
            descripcion="Asociación/ONG"
            icono="🏠"
          />
        </View>
      </View>

      <Text style={styles.label}>Correo electrónico</Text>
      <TextInput
        style={styles.input}
        placeholder="email@mail.com"
        keyboardType="email-address"
        value={correo}
        onChangeText={setCorreo}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!cargando}
      />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="********"
        secureTextEntry
        value={contrasena}
        onChangeText={setContrasena}
        editable={!cargando}
      />

      <TouchableOpacity 
        style={[styles.boton, cargando && styles.botonDeshabilitado]} 
        onPress={iniciarSesion}
        disabled={cargando}
      >
        {cargando ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.botonTexto}>Iniciar sesión</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity disabled={cargando}>
        <Text style={styles.link}>¿Olvidaste la contraseña?</Text>
      </TouchableOpacity>

      <View style={styles.registroContainer}>
        <Link href="/registro_usuarios" asChild>
          <TouchableOpacity disabled={cargando} style={styles.linkRegistro}>
            <Text style={styles.textoRegistro}>¿No tienes cuenta? <Text style={styles.linkRegistroTexto}>Regístrate</Text></Text>
          </TouchableOpacity>
        </Link>
      </View>

      <Text style={styles.politicas}>
        By clicking continue, you agree to our{' '}
        <Text style={{ textDecorationLine: 'underline' }}>Terms of Service</Text> and{' '}
        <Text style={{ textDecorationLine: 'underline' }}>Privacy Policy</Text>
      </Text>
    </ScrollView>
  );
}

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