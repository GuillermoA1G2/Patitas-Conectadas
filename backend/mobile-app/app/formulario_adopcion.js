import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker'; 

export default function FormularioAdopcion({ onBack }) {
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [idPerro, setIdPerro] = useState('');
  const [fotoPerro, setFotoPerro] = useState(null);
  const [asociacion, setAsociacion] = useState('');
  const [documento, setDocumento] = useState(null);
  const [motivo, setMotivo] = useState('');

  
  const asociaciones = [
    { label: 'Selecciona asociación', value: '' },
    { label: 'Asociación 1', value: 'asociacion1' },
    { label: 'Asociación 2', value: 'asociacion2' },
    { label: 'Asociación 3', value: 'asociacion3' },
  ];

  const seleccionarImagen = async (setImagen) => {
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

    if (!resultado.canceled && resultado.assets.length > 0) {
      setImagen(resultado.assets[0].uri);
    }
  };

  const registrar = () => {
    if (
      !nombre.trim() ||
      !direccion.trim() ||
      !idPerro.trim() ||
      !fotoPerro ||
      !asociacion ||
      !documento ||
      !motivo.trim()
    ) {
      alert('Por favor llena todos los campos');
      return;
    }

    Alert.alert('Éxito', 'Formulario de adopción enviado correctamente');
    // para enviar los datos a la bd
  };

  return (
    <ScrollView contentContainerStyle={styles.formContainer}>
      <Text style={styles.titulo}>Formulario de Adopción</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        style={styles.input}
        placeholder="Dirección"
        value={direccion}
        onChangeText={setDireccion}
      />

      <TextInput
        style={styles.input}
        placeholder="Número o ID del perro a adoptar"
        value={idPerro}
        onChangeText={setIdPerro}
      />

      <TouchableOpacity
        onPress={() => seleccionarImagen(setFotoPerro)}
        style={styles.botonImagen}
      >
        <Text style={styles.textoBoton}>Seleccionar foto del perro</Text>
      </TouchableOpacity>
      {fotoPerro && <Image source={{ uri: fotoPerro }} style={styles.imagen} />}

      <Text style={styles.label}>Asociación</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={asociacion}
          onValueChange={(itemValue) => setAsociacion(itemValue)}
          mode="dropdown"
        >
          {asociaciones.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>

      <TouchableOpacity
        onPress={() => seleccionarImagen(setDocumento)}
        style={styles.botonImagen}
      >
        <Text style={styles.textoBoton}>Subir documento</Text>
      </TouchableOpacity>
      {documento && <Image source={{ uri: documento }} style={styles.imagen} />}

      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="¿Por qué elegiste adoptar a este perro?"
        value={motivo}
        onChangeText={setMotivo}
        multiline
      />

      <Button title="Enviar" onPress={registrar} />
      <View style={{ marginVertical: 10 }} />
      <Button title="Salir" color="red" onPress={onBack} />
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
    textAlignVertical: 'top', 
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
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 5,
    marginBottom: 15,
    ...Platform.select({
      android: {
        
        height: 50,
        justifyContent: 'center',
      },
    }),
  },
});
