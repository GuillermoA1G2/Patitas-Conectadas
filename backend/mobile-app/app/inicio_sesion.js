
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
} from 'react-native';

export default function LoginScreen() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const router = useRouter();

  const iniciarSesion = async () => {
  if (!correo || !contrasena) {
    Alert.alert('Error', 'Por favor completa todos los campos.');
    return;
  }

  try {
    const response = await axios.post('http://192.168.1.119:3000/api/login', {
      email: correo,
      password: contrasena
    });

    Alert.alert('Éxito', `¡Bienvenido ${response.data.usuario.nombre}!`);
    router.replace('/pantalla_inicio');

  } catch (error) {
    if (error.response && error.response.status === 401) {
      Alert.alert('Error', 'Correo o contraseña incorrectos.');
    } else {
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
      console.error(error);
    }
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
      />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="********"
        secureTextEntry
        value={contrasena}
        onChangeText={setContrasena}
      />

      <TouchableOpacity style={styles.boton} onPress={iniciarSesion}>
        <Text style={styles.botonTexto}>Iniciar sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={styles.link}>¿Olvidaste la contraseña?</Text>
      </TouchableOpacity>

      <Link href="/registro_usuarios" asChild>
        <TouchableOpacity>
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