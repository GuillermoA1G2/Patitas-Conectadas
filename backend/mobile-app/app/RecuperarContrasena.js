import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import axios from 'axios';
import {
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';

// ==========================================
// BACKEND SECTION
// ==========================================

class AuthService {
  static BASE_URL = Platform.OS === 'android'
    ? 'http://192.168.1.119:3000/api'
    : 'http://localhost:3000/api';

  static validarEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static async recuperarContrasena(email) {
    if (!email) {
      throw new Error('Por favor ingresa tu correo electrónico.');
    }
    if (!this.validarEmail(email)) {
      throw new Error('Correo electrónico inválido.');
    }

    try {
      const response = await axios.post(`${this.BASE_URL}/recuperar-contrasena`, { email }, {
        headers: { 'Content-Type': 'application/json' }
      });

      // El backend debería devolver { mensaje: 'Correo enviado' }
      return response.data;
    } catch (error) {
      console.log('Error en recuperación:', error.response?.data || error.message);
      let errorMessage = 'Ocurrió un error al enviar el correo.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.request) {
        // Error de red, el servidor no respondió
        errorMessage = `No se pudo conectar con el servidor. Asegúrate de que el servidor esté corriendo y la IP sea correcta: ${this.BASE_URL.split('/api')[0]}`;
      } else {
        // Otros errores (ej. configuración de Axios)
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  }
}

// ==========================================
// FRONTEND COMPONENTS
// ==========================================

const CampoCorreo = ({ correo, setCorreo, deshabilitado }) => (
  <>
    <Text style={styles.label}>Correo electrónico</Text>
    <TextInput
      style={styles.input}
      placeholder="email@mail.com"
      keyboardType="email-address"
      value={correo}
      onChangeText={setCorreo}
      autoCapitalize="none"
      autoCorrect={false}
      editable={!deshabilitado}
    />
  </>
);

const BotonEnviar = ({ onPress, cargando }) => (
  <TouchableOpacity
    style={[styles.boton, cargando && styles.botonDeshabilitado]}
    onPress={onPress}
    disabled={cargando}
  >
    {cargando ? (
      <ActivityIndicator color="white" />
    ) : (
      <Text style={styles.botonTexto}>Enviar correo de recuperación</Text>
    )}
  </TouchableOpacity>
);

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function RecuperarContrasenaScreen() {
  const [correo, setCorreo] = useState('');
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const manejarRecuperacion = async () => {
    setCargando(true);

    try {
      const resultado = await AuthService.recuperarContrasena(correo);
      Alert.alert('Éxito', resultado.mensaje || 'Correo de recuperación enviado. Revisa tu bandeja de entrada.');
      setCorreo(''); // Limpiar el campo después de enviar
      router.push('/inicio_sesion');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />

      <Text style={styles.titulo}>Recuperar Contraseña</Text>
      <Text style={styles.subtitulo}>Ingresa tu correo electrónico para recibir un enlace de recuperación.</Text>

      <CampoCorreo correo={correo} setCorreo={setCorreo} deshabilitado={cargando} />

      <BotonEnviar onPress={manejarRecuperacion} cargando={cargando} />

      <TouchableOpacity onPress={() => router.push('/inicio_sesion')} disabled={cargando}>
        <Text style={styles.link}>Regresar al inicio de sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ==========================================
// STYLES
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
    textAlign: 'center',
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
  link: {
    color: '#ffffff',
    marginTop: 10,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});