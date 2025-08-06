import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export default function RegistrarAnimal() {
  const [form, setForm] = useState({
    nombre: '',
    especie: '',
    raza: '',
    edad: '',
    genero: '',
    tamaño: '',
    descripcion: '',
    imagen_url: '',
    id_refugio: '1'
  });
  const [imagen, setImagen] = useState(null);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const seleccionarImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      alert('Se requiere permiso para acceder a la galería');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!resultado.cancelled) {
      setImagen(resultado.uri);
      setForm({ ...form, imagen_url: resultado.uri });
    }
  };

  const handleSubmit = async () => {
    // Validar que todos los campos estén llenos
    if (
      !form.nombre ||
      !form.especie ||
      !form.raza ||
      !form.edad ||
      !form.genero ||
      !form.tamaño ||
      !form.descripcion ||
      !imagen
    ) {
      alert('Por favor llena todos los campos');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/animales', form);
      Alert.alert('Éxito', 'Animal registrado correctamente');
      
      // Limpiar formulario después del registro exitoso
      setForm({
        nombre: '',
        especie: '',
        raza: '',
        edad: '',
        genero: '',
        tamaño: '',
        descripcion: '',
        imagen_url: '',
        id_refugio: '1'
      });
      setImagen(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo registrar el animal');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.formContainer}>
      <Text style={styles.titulo}>Registrar Animal</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nombre del animal"
        value={form.nombre}
        onChangeText={(value) => handleChange('nombre', value)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Especie"
        value={form.especie}
        onChangeText={(value) => handleChange('especie', value)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Raza"
        value={form.raza}
        onChangeText={(value) => handleChange('raza', value)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Edad"
        value={form.edad}
        onChangeText={(value) => handleChange('edad', value)}
        keyboardType="numeric"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Género"
        value={form.genero}
        onChangeText={(value) => handleChange('genero', value)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Tamaño"
        value={form.tamaño}
        onChangeText={(value) => handleChange('tamaño', value)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Descripción"
        value={form.descripcion}
        onChangeText={(value) => handleChange('descripcion', value)}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity onPress={seleccionarImagen} style={styles.botonImagen}>
        <Text style={styles.textoBoton}>Seleccionar Foto del Animal</Text>
      </TouchableOpacity>
      {imagen && <Image source={{ uri: imagen }} style={styles.imagen} />}

      <Button title="Registrar" onPress={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  titulo: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  botonImagen: {
    backgroundColor: '#007bff',
    padding: 12,
    marginBottom: 15,
    borderRadius: 5,
  },
  textoBoton: {
    color: '#fff',
    textAlign: 'center',
  },
  imagen: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: 20,
  },
});