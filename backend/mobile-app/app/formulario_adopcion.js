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
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

export default function FormularioAdopcion({ navigation, onBack }) {
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

  const seleccionarImagen = async (tipo) => {
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

    if (!resultado.canceled && resultado.assets.length > 0) {
      if (tipo === 'perro') {
        setFotoPerro(resultado.assets[0].uri);
      } else if (tipo === 'documento') {
        setDocumento(resultado.assets[0].uri);
      }
    }
  };

  const registrarAdopcion = async () => {
    if (
      !nombre.trim() ||
      !direccion.trim() ||
      !idPerro.trim() ||
      !fotoPerro ||
      !asociacion ||
      !documento ||
      !motivo.trim()
    ) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      // Crear el objeto del formulario de adopción
      const formularioAdopcion = {
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        idPerro: idPerro.trim(),
        fotoPerro,
        asociacion,
        documento,
        motivo: motivo.trim(),
        fechaEnvio: new Date().toISOString(),
        estado: 'pendiente', // pendiente, aprobado, rechazado
      };

      // Simular envío al backend (descomenta cuando tengas el endpoint)
      // await axios.post('http://TU_BACKEND_URL/api/adopciones', formularioAdopcion);
      
      // Por ahora solo mostramos en consola
      console.log('Formulario de adopción enviado:', formularioAdopcion);
      
      Alert.alert(
        'Éxito', 
        'Formulario de adopción enviado correctamente. Te contactaremos pronto.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset de los campos
              setNombre('');
              setDireccion('');
              setIdPerro('');
              setFotoPerro(null);
              setAsociacion('');
              setDocumento(null);
              setMotivo('');
              
              // Navegar hacia atrás si está disponible
              if (navigation) {
                navigation.goBack();
              } else if (onBack) {
                onBack();
              }
            }
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el formulario de adopción');
      console.error('Error al enviar formulario:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Formulario de Adopción</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        style={styles.input}
        placeholder="Dirección completa"
        value={direccion}
        onChangeText={setDireccion}
        multiline
      />

      <TextInput
        style={styles.input}
        placeholder="Número o ID del perro a adoptar"
        value={idPerro}
        onChangeText={setIdPerro}
      />

      {/* Foto del perro */}
      <Text style={styles.label}>Foto del perro</Text>
      <TouchableOpacity 
        style={styles.imagePicker} 
        onPress={() => seleccionarImagen('perro')}
      >
        {fotoPerro ? (
          <Image source={{ uri: fotoPerro }} style={styles.imagen} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.textoSubir}>📷 Foto del perro</Text>
            <Text style={styles.textoSubirSecundario}>Toca para seleccionar</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Selector de asociación */}
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

      {/* Documento */}
      <Text style={styles.label}>Documento de identidad</Text>
      <TouchableOpacity 
        style={styles.imagePicker} 
        onPress={() => seleccionarImagen('documento')}
      >
        {documento ? (
          <Image source={{ uri: documento }} style={styles.imagen} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.textoSubir}>📄 Subir documento</Text>
            <Text style={styles.textoSubirSecundario}>Toca para seleccionar</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="¿Por qué elegiste adoptar a este perro? Cuéntanos tu motivación..."
        value={motivo}
        onChangeText={setMotivo}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TouchableOpacity style={styles.botonEnviar} onPress={registrarAdopcion}>
        <Text style={styles.textoBoton}>Enviar Solicitud</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.botonSalir} 
        onPress={() => {
          if (navigation) {
            navigation.goBack();
          } else if (onBack) {
            onBack();
          }
        }}
      >
        <Text style={styles.textoBotonSalir}>Cancelar</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#3a0ca3',
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
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
    color: '#333',
  },
  imagePicker: {
    alignItems: 'center',
    marginBottom: 20,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    marginBottom: 15,
    backgroundColor: '#fff',
    ...Platform.select({
      android: {
        height: 50,
        justifyContent: 'center',
      },
    }),
  },
  botonEnviar: {
    backgroundColor: '#7209b7',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  botonSalir: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  textoBoton: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textoBotonSalir: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});