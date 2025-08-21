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
} from 'react-native';

export default function LoginScreen() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
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
      const response = await axios.post('http://192.168.1.119:3000/api/login', {
        email: correo,
        password: contrasena
      });

      if (response.data && response.data.usuario) {
        Alert.alert('Éxito', `¡Bienvenido ${response.data.usuario.nombre}!`);
        
        // CLAVE: Pasar los datos del usuario a la pantalla de inicio
        router.replace({
          pathname: '/pantalla_inicio',
          params: { 
            usuarioId: response.data.usuario.id,
            usuarioNombre: response.data.usuario.nombre,
            usuarioEmail: response.data.usuario.email,
            // Agrega otros campos que necesites del usuario
            usuarioTelefono: response.data.usuario.telefono || '',
            usuarioTipo: response.data.usuario.tipo || 'usuario'
          }
        });
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
            Alert.alert('Error', 'Usuario no encontrado.');
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

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />

      <Text style={styles.titulo}>¡Bienvenido!</Text>

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

      <Link href="/registro_usuarios" asChild>
        <TouchableOpacity disabled={cargando}>
          <Text style={styles.link}>
            ¿No tienes cuenta? <Text style={{ color: '#ff791a' }}>Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </Link>

      <Text style={styles.politicas}>
        By clicking continue, you agree to our{' '}
        <Text style={{ textDecorationLine: 'underline' }}>Terms of Service</Text> and{' '}
        <Text style={{ textDecorationLine: 'underline' }}>Privacy Policy</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a2d2ff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    marginTop: 10,
    color: '#333',
  },
  input: {
    width: '100%',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
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
  },
  link: {
    color: '#333',
    marginBottom: 10,
  },
  politicas: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
    marginTop: 30,
    paddingHorizontal: 10,
  },
});