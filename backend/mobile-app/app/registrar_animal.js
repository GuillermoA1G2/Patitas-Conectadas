import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

export default function RegistrarAnimal() {
  const [form, setForm] = useState({
    nombre: '',
    especie: '',
    raza: '',
    edad: '',
    genero: '',
    tamaño: '',
    descripcion: '',
    id_refugio: '1'
  });
  const [imagen, setImagen] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const seleccionarImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'Se requiere permiso para acceder a la galería');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8, // Reducir calidad para menor tamaño
      aspect: [4, 3],
    });

    if (!resultado.cancelled && resultado.assets && resultado.assets[0]) {
      setImagen(resultado.assets[0]);
    }
  };

  const subirImagen = async (imagenUri) => {
    const formData = new FormData();
    formData.append('imagen', {
      uri: imagenUri,
      type: 'image/jpeg',
      name: 'animal.jpg',
    });

    try {
      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      return result.url; // Asumiendo que el servidor devuelve { url: "ruta/imagen.jpg" }
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      throw error;
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
      Alert.alert('Error', 'Por favor llena todos los campos');
      return;
    }

    setCargando(true);

    try {
      // Primero subir la imagen
      let imagenUrl = '';
      if (imagen) {
        imagenUrl = await subirImagen(imagen.uri);
      }

      // Crear el objeto de datos completo
      const datosAnimal = {
        ...form,
        imagen_url: imagenUrl
      };

      // Enviar los datos del animal
      const response = await fetch('http://localhost:3000/api/animales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosAnimal),
      });

      if (response.ok) {
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
          id_refugio: '1'
        });
        setImagen(null);
      } else {
        throw new Error('Error en el servidor');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo registrar el animal');
    } finally {
      setCargando(false);
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
      
      <Text style={styles.label}>Especie</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={form.especie}
          onValueChange={(value) => handleChange('especie', value)}
          style={styles.picker}
        >
          <Picker.Item label="Selecciona especie..." value="" />
          <Picker.Item label="Perro" value="perro" />
          <Picker.Item label="Gato" value="gato" />
          <Picker.Item label="Conejo" value="conejo" />
          <Picker.Item label="Otro" value="otro" />
        </Picker>
      </View>
      
      <TextInput
        style={styles.input}
        placeholder="Raza"
        value={form.raza}
        onChangeText={(value) => handleChange('raza', value)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Edad (en años)"
        value={form.edad}
        onChangeText={(value) => handleChange('edad', value)}
        keyboardType="numeric"
      />
      
      <Text style={styles.label}>Género</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={form.genero}
          onValueChange={(value) => handleChange('genero', value)}
          style={styles.picker}
        >
          <Picker.Item label="Selecciona género..." value="" />
          <Picker.Item label="Macho" value="macho" />
          <Picker.Item label="Hembra" value="hembra" />
        </Picker>
      </View>
      
      <Text style={styles.label}>Tamaño</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={form.tamaño}
          onValueChange={(value) => handleChange('tamaño', value)}
          style={styles.picker}
        >
          <Picker.Item label="Selecciona tamaño..." value="" />
          <Picker.Item label="Pequeño" value="pequeño" />
          <Picker.Item label="Mediano" value="mediano" />
          <Picker.Item label="Grande" value="grande" />
        </Picker>
      </View>
      
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Descripción del animal"
        value={form.descripcion}
        onChangeText={(value) => handleChange('descripcion', value)}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity onPress={seleccionarImagen} style={styles.botonImagen}>
        <Text style={styles.textoBoton}>
          {imagen ? 'Cambiar Foto' : 'Seleccionar Foto del Animal'}
        </Text>
      </TouchableOpacity>
      
      {imagen && (
        <Image source={{ uri: imagen.uri }} style={styles.imagen} />
      )}

      <TouchableOpacity 
        style={[styles.botonRegistrar, cargando && styles.botonDeshabilitado]} 
        onPress={handleSubmit}
        disabled={cargando}
      >
        <Text style={styles.textoBoton}>
          {cargando ? 'Registrando...' : 'Registrar Animal'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  titulo: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#3a0ca3',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 10,
    marginBottom: 15,
    borderRadius: 6,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  label: {
    marginBottom: 5,
    fontWeight: '600',
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    marginBottom: 15,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  botonImagen: {
    backgroundColor: '#007bff',
    padding: 12,
    marginBottom: 15,
    borderRadius: 6,
  },
  botonRegistrar: {
    backgroundColor: '#7209b7',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  botonDeshabilitado: {
    backgroundColor: '#ccc',
  },
  textoBoton: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  imagen: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 10,
  },
});