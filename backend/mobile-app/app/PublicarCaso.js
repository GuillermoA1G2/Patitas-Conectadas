import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export default function PublicarCaso({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [historia, setHistoria] = useState('');
  const [imagen, setImagen] = useState(null);

  const seleccionarImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });

    if (!resultado.canceled) {
      setImagen(resultado.assets[0].uri);
    }
  };

  const publicarCaso = async () => {
    if (!nombre || !historia || !imagen) {
      Alert.alert('Faltan datos', 'Completa todos los campos');
      return;
    }

    try {
      // Aquí puedes enviar el caso al backend
      const nuevoCaso = {
        nombre,
        historia,
        fecha: new Date().toISOString(),
        asociacion: 'Tu Asociación', // Reemplazar con dato real si es necesario
        imagen,
      };

      // Suponiendo un endpoint como:
      // await axios.post('http://TU_BACKEND_URL/api/casos', nuevoCaso);

      Alert.alert('Publicado', 'El caso se ha publicado exitosamente');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo publicar el caso');
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Publicar Caso de Éxito</Text>
      </View>

      <TouchableOpacity style={styles.imagePicker} onPress={seleccionarImagen}>
        {imagen ? (
          <Image source={{ uri: imagen }} style={styles.imagen} />
        ) : (
          <Text style={styles.textoSubir}>📷 Subir Imagen o Video</Text>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Nombre del animal"
        value={nombre}
        onChangeText={setNombre}
      />
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Cuenta su historia..."
        multiline
        value={historia}
        onChangeText={setHistoria}
      />

      <TouchableOpacity style={styles.boton} onPress={publicarCaso}>
        <Text style={styles.textoBoton}>Publicar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#a2d2ff',
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  titulo: { fontSize: 20, fontWeight: 'bold' },
  imagePicker: {
    alignItems: 'center',
    marginVertical: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 20,
    borderRadius: 10,
  },
  imagen: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  textoSubir: { color: '#555', fontSize: 16 },
  input: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  boton: {
    backgroundColor: '#c77dff',
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  textoBoton: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
