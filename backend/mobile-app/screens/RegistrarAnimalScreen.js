import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, Alert } from 'react-native';
import axios from 'axios';

export default function RegistrarAnimalScreen() {
  const [form, setForm] = useState({
    nombre: '',
    especie: '',
    raza: '',
    edad: '',
    genero: '',
    tamaño: '',
    descripcion: '',
    imagen_url: '',
    id_refugio: '1' // ID de prueba
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post('http://TU-IP-LOCAL:3000/api/animales', form);
      Alert.alert('Éxito', response.data.message);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo registrar el animal');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registrar Animal</Text>
      {Object.keys(form).map((key) => (
        key !== 'id_refugio' && (
          <TextInput
            key={key}
            placeholder={key}
            value={form[key]}
            onChangeText={(value) => handleChange(key, value)}
            style={styles.input}
          />
        )
      ))}
      <Button title="Registrar" onPress={handleSubmit} color="#A3D5FF" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFF5E1',
    flexGrow: 1
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#D3D3D3',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff'
  }
});
