import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios'; // Importar axios
import { useRouter } from 'expo-router'; // Importar useRouter para navegación
// URL base de tu servidor Express (ajusta si es diferente)
const BASE_URL = 'http://192.168.1.119:3000/api';
export default function FormularioAdopcion({ navigation, onBack }) {
  const router = useRouter(); // Inicializar useRouter
  // Estados del formulario
  const [refugios, setRefugios] = useState([]);
  const [refugioSeleccionado, setRefugioSeleccionado] = useState('');
  const [animales, setAnimales] = useState([]);
  const [animalSeleccionado, setAnimalSeleccionado] = useState('');
  const [documento, setDocumento] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [cargando, setCargando] = useState(false); // Estado de carga para las peticiones
  const [cargandoAnimales, setCargandoAnimales] = useState(false); // Estado de carga para animales
  // Efecto para cargar los refugios al iniciar el componente
  useEffect(() => {
    const cargarRefugios = async () => {
      setCargando(true);
      try {
        const response = await axios.get(`${BASE_URL}/refugios`);
        if (response.data.success) {
          // Añadir una opción por defecto al inicio
          setRefugios([{ idAsociacion: '', nombre: 'Selecciona un refugio' }, ...response.data.refugios]);
        } else {
          Alert.alert('Error', 'No se pudieron cargar los refugios.');
        }
      } catch (error) {
        console.error('Error al cargar refugios:', error);
        Alert.alert('Error', 'No se pudo conectar con el servidor para cargar refugios.');
      } finally {
        setCargando(false);
      }
    };
    cargarRefugios();
  }, []);
  // Efecto para cargar los animales cuando se selecciona un refugio
  useEffect(() => {
    const cargarAnimalesPorRefugio = async () => {
      if (refugioSeleccionado) {
        setCargandoAnimales(true);
        try {
          const response = await axios.get(`${BASE_URL}/refugio/${refugioSeleccionado}/animales`);
          if (response.data.success) {
            // Añadir una opción por defecto al inicio
            setAnimales([{ idanimal: '', nombre: 'Selecciona un animal' }, ...response.data.animales]);
          } else {
            Alert.alert('Error', 'No se pudieron cargar los animales de este refugio.');
          }
        } catch (error) {
          console.error('Error al cargar animales:', error);
          Alert.alert('Error', 'No se pudo conectar con el servidor para cargar animales.');
        } finally {
          setCargandoAnimales(false);
        }
      } else {
        setAnimales([{ idanimal: '', nombre: 'Selecciona un animal' }]); // Resetear animales si no hay refugio
        setAnimalSeleccionado('');
      }
    };
    cargarAnimalesPorRefugio();
  }, [refugioSeleccionado]);
  const seleccionarImagen = async (tipo) => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Solo imágenes para documentos
      allowsEditing: true,
      quality: 1,
    });
    if (!resultado.canceled && resultado.assets.length > 0) {
      if (tipo === 'documento') {
        setDocumento(resultado.assets[0].uri);
      }
    }
  };
  const registrarAdopcion = async () => {
    if (
      !refugioSeleccionado ||
      !animalSeleccionado ||
      !documento ||
      !motivo.trim()
    ) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    setCargando(true);
    try {
      // Crear el objeto del formulario de adopción
      const formularioAdopcion = {
        idRefugio: refugioSeleccionado,
        idAnimal: animalSeleccionado,
        documento, // Esto sería la URI local, necesitarías subirlo a un servidor
        motivo: motivo.trim(),
        fechaEnvio: new Date().toISOString(),
        estado: 'pendiente', // pendiente, aprobado, rechazado
      };
      console.log('Formulario de adopción enviado (simulado):', formularioAdopcion);
      Alert.alert(
        'Éxito',
        'Formulario de adopción enviado correctamente. Te contactaremos pronto.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset de los campos
              setRefugioSeleccionado('');
              setAnimalSeleccionado('');
              setDocumento(null);
              setMotivo('');
              setAnimales([{ idanimal: '', nombre: 'Selecciona un animal' }]); // Resetear animales
              // Navegar a pantalla_inicio.js
              router.replace('/pantalla_inicio');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el formulario de adopción. Intenta de nuevo.');
      console.error('Error al enviar formulario:', error);
    } finally {
      setCargando(false);
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <Text style={styles.titulo}>Formulario de Adopción</Text>
      <Text style={styles.subtitulo}>Completa los datos para tu solicitud</Text>
      {/* Selector de refugio */}
      <Text style={styles.label}>Selecciona un Refugio</Text>
      <View style={styles.pickerContainer}>
        {cargando ? (
          <ActivityIndicator size="small" color="#FEE9E7" />
        ) : (
          <Picker
            selectedValue={refugioSeleccionado}
            onValueChange={(itemValue) => {
              setRefugioSeleccionado(itemValue);
              setAnimalSeleccionado(''); // Resetear animal al cambiar de refugio
            }}
            mode="dropdown"
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {refugios.map((item) => (
              <Picker.Item key={item.idAsociacion} label={item.nombre} value={item.idAsociacion} />
            ))}
          </Picker>
        )}
      </View>
      {/* Selector de animal */}
      <Text style={styles.label}>Selecciona un Animal</Text>
      <View style={styles.pickerContainer}>
        {cargandoAnimales ? (
          <ActivityIndicator size="small" color="#FEE9E7" />
        ) : (
          <Picker
            selectedValue={animalSeleccionado}
            onValueChange={(itemValue) => setAnimalSeleccionado(itemValue)}
            mode="dropdown"
            style={styles.picker}
            itemStyle={styles.pickerItem}
            enabled={!!refugioSeleccionado && animales.length > 1} // Habilitar solo si hay refugio seleccionado y animales disponibles
          >
            {animales.map((item) => (
              <Picker.Item key={item.idanimal} label={item.nombre} value={item.idanimal} />
            ))}
          </Picker>
        )}
      </View>
      {/* Documento */}
      <Text style={styles.label}>Sube tu Documento de Identidad</Text>
      <TouchableOpacity
        style={styles.imagePicker}
        onPress={() => seleccionarImagen('documento')}
        disabled={cargando}
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
      <Text style={styles.label}>Tu Motivación para Adoptar</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="¿Por qué elegiste adoptar a este animal? Cuéntanos tu motivación..."
        value={motivo}
        onChangeText={setMotivo}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        editable={!cargando}
      />
      <TouchableOpacity
        style={[styles.botonEnviar, cargando && styles.botonDeshabilitado]}
        onPress={registrarAdopcion}
        disabled={cargando}
      >
        {cargando ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.textoBoton}>Enviar Solicitud</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.botonRegresar, cargando && styles.botonDeshabilitado]}
        onPress={() => router.replace('/pantalla_inicio')} // Navegar a pantalla_inicio.js
        disabled={cargando}
      >
        <Text style={styles.textoBotonRegresar}>Regresar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#A4645E', // Color de fondo similar a inicio_sesion.js
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#ffffff',
  },
  subtitulo: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    marginTop: 10,
    color: '#f7f3f3ff',
    fontWeight: '500',
    fontSize: 16,
  },
  input: {
    width: '100%',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  imagePicker: {
    width: '100%',
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
    height: 150, // Ajustado para que no sea demasiado grande
    borderRadius: 8,
    resizeMode: 'contain', // Asegura que la imagen se ajuste sin recortarse
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
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden', // Para asegurar que el borde redondeado se aplique al Picker
    ...Platform.select({
      android: {
        height: 50, // Altura fija para Android
        justifyContent: 'center',
      },
    }),
  },
  picker: {
    width: '100%',
    color: '#333', // Color del texto del Picker
  },
  pickerItem: {
    fontSize: 16, // Tamaño de fuente para los ítems del Picker
  },
  botonEnviar: {
    backgroundColor: '#FEE9E7', // Color de botón similar a inicio_sesion.js
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
  botonRegresar: {
    backgroundColor: '#900B09', // Un color de contraste para el botón de regresar
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 20,
  },
  botonDeshabilitado: {
    backgroundColor: '#cccccc',
  },
  textoBoton: {
    color: '#900B09', // Color del texto del botón de enviar
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textoBotonRegresar: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});