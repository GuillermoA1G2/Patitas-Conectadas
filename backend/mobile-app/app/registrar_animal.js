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

export default function RegistrarAnimal({ navigation }) {
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
      quality: 0.8,
      aspect: [4, 3],
    });

    // Corregido: usar 'canceled' en lugar de 'cancelled'
    if (!resultado.canceled && resultado.assets && resultado.assets[0]) {
      setImagen(resultado.assets[0].uri); // Guardar solo la URI como en el código funcional
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

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    // Validación mejorada
    if (
      !form.nombre.trim() ||
      !form.especie ||
      !form.raza.trim() ||
      !form.edad.trim() ||
      !form.genero ||
      !form.tamaño ||
      !form.descripcion.trim() ||
      !imagen
    ) {
      Alert.alert('Error', 'Por favor llena todos los campos y selecciona una imagen');
      return;
    }

    // Validar que la edad sea un número
    if (isNaN(form.edad) || parseInt(form.edad) <= 0) {
      Alert.alert('Error', 'La edad debe ser un número válido mayor a 0');
      return;
    }

    setCargando(true);

    try {
      let imagenUrl = '';
      
      // Solo subir imagen si hay servidor configurado
      if (imagen) {
        try {
          imagenUrl = await subirImagen(imagen);
        } catch (uploadError) {
          // Si falla la subida de imagen, usar la URI local por ahora
          console.warn('Fallo en subida de imagen, usando URI local:', uploadError);
          imagenUrl = imagen;
        }
      }

      // Crear el objeto de datos completo
      const datosAnimal = {
        ...form,
        edad: parseInt(form.edad), // Convertir a número
        imagen_url: imagenUrl,
        fecha_registro: new Date().toISOString()
      };

      console.log('Datos del animal a registrar:', datosAnimal);

      // Simular registro exitoso por ahora (descomenta cuando tengas el backend)
      /*
      const response = await fetch('http://localhost:3000/api/animales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosAnimal),
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const resultado = await response.json();
      console.log('Respuesta del servidor:', resultado);
      */

      Alert.alert('Éxito', 'Animal registrado correctamente', [
        {
          text: 'OK',
          onPress: () => {
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
            
            // Opcional: navegar hacia atrás
            if (navigation) {
              navigation.goBack();
            }
          }
        }
      ]);

    } catch (error) {
      console.error('Error completo:', error);
      Alert.alert(
        'Error', 
        `No se pudo registrar el animal: ${error.message || 'Error desconocido'}`
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.formContainer}>
      <Text style={styles.titulo}>Registrar Animal</Text>
      
      {/* Selector de imagen mejorado, similar al código funcional */}
      <TouchableOpacity style={styles.imagePicker} onPress={seleccionarImagen}>
        {imagen ? (
          <Image source={{ uri: imagen }} style={styles.imagenPrevia} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.textoSubir}>📷 Subir Foto del Animal</Text>
            <Text style={styles.textoSubirSecundario}>Toca para seleccionar</Text>
          </View>
        )}
      </TouchableOpacity>
      
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
        placeholder="Descripción del animal (personalidad, cuidados especiales, etc.)"
        value={form.descripcion}
        onChangeText={(value) => handleChange('descripcion', value)}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

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
  // Estilos del selector de imagen mejorados
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
  imagenPrevia: {
    width: '100%',
    height: 200,
    borderRadius: 8,
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
    marginBottom: 5,
    fontWeight: '600',
    color: '#333',
    fontSize: 16,
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
    fontSize: 16,
  },
});