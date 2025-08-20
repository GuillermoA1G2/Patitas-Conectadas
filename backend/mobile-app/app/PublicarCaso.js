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
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      // Crear el objeto del caso
      const nuevoCaso = {
        nombre,
        historia,
        fecha: new Date().toISOString(),
        asociacion: 'Mi Asociación', // Puedes hacer esto dinámico
        imagen,
      };

      // Simular envío al backend (descomenta cuando tengas el endpoint)
      // await axios.post('http://TU_BACKEND_URL/api/casos', nuevoCaso);
      
      // Por ahora solo mostramos en consola
      console.log('Caso publicado:', nuevoCaso);
      
      Alert.alert('Éxito', 'El caso se ha publicado exitosamente');
      
      // Reset de los campos
      setNombre('');
      setHistoria('');
      setImagen(null);
      
      // Opcional: navegar hacia atrás
      if (navigation) {
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo publicar el caso');
      console.error('Error al publicar:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Publicar Caso de Éxito</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={seleccionarImagen}>
        {imagen ? (
          <Image source={{ uri: imagen }} style={styles.imagen} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.textoSubir}>📷 Subir Imagen o Video</Text>
            <Text style={styles.textoSubirSecundario}>Toca para seleccionar</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Nombre del animal"
        value={nombre}
        onChangeText={setNombre}
      />
      
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Cuenta su historia..."
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        value={historia}
        onChangeText={setHistoria}
      />

      <TouchableOpacity style={styles.boton} onPress={publicarCaso}>
        <Text style={styles.textoBoton}>Publicar Caso</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#3a0ca3',
  },
  imagePicker: {
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  imagen: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  textoSubir: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  textoSubirSecundario: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 12,
    marginBottom: 15,
    borderRadius: 6,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  boton: {
    backgroundColor: '#7209b7',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  textoBoton: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});