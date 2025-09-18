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
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';

// URL base de tu servidor Express
const BASE_URL = 'http://172.20.10.5:3000/api';

// ¡IMPORTANTE! Reemplaza 'ID_DEL_USUARIO_LOGUEADO' con la forma real de obtener el ID del usuario.
// Esto podría venir de un contexto de autenticación, AsyncStorage, etc.
const ID_USUARIO_LOGUEADO = '68c21f82def6d1b8da7b8d5b';

export default function FormularioAdopcion() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { mascota: mascotaParam } = params;

  // Estados del formulario
  const [refugioNombre, setRefugioNombre] = useState('');
  const [animalNombre, setAnimalNombre] = useState('');
  const [idRefugio, setIdRefugio] = useState('');
  const [idAnimal, setIdAnimal] = useState('');

  const [documentoINE, setDocumentoINE] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [cargando, setCargando] = useState(false);

  // Nuevos estados para las preguntas adicionales
  const [haAdoptadoAntes, setHaAdoptadoAntes] = useState(''); // 'si' | 'no'
  const [cantidadMascotasAnteriores, setCantidadMascotasAnteriores] = useState('');
  const [fotosMascotasAnteriores, setFotosMascotasAnteriores] = useState([]);
  const [tipoVivienda, setTipoVivienda] = useState('');
  const [permisoMascotasRenta, setPermisoMascotasRenta] = useState('');
  const [fotosEspacioMascota, setFotosEspacioMascota] = useState([]);

  // Efecto para cargar los datos de la mascota y el refugio desde los parámetros
  useEffect(() => {
    if (mascotaParam) {
      try {
        const parsedMascota = typeof mascotaParam === 'string' ? JSON.parse(mascotaParam) : mascotaParam;
        setAnimalNombre(parsedMascota.nombre);
        setIdAnimal(parsedMascota.idanimal);
        setRefugioNombre(parsedMascota.refugio_nombre || 'Refugio Desconocido');
        setIdRefugio(parsedMascota.id_refugio);
      } catch (e) {
        console.error("Error parsing mascota param:", e);
        Alert.alert('Error', 'No se pudieron cargar los datos de la mascota. Redirigiendo al catálogo.');
        router.replace('/CatalogoMascotas');
      }
    } else {
      if (!router.canGoBack()) { // Evita redirigir si ya estamos en la pantalla de catálogo
        Alert.alert('Error', 'No se ha seleccionado ninguna mascota para adoptar. Redirigiendo al catálogo.');
        router.replace('/CatalogoMascotas');
      }
    }
  }, [mascotaParam, router]); // Dependencia en mascotaParam para re-ejecutar si cambia

  // Función genérica para seleccionar una o múltiples imágenes
  const seleccionarImagenes = async (maxCount, currentImages, setImageState) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para subir imágenes.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: maxCount > 1,
      quality: 1,
      selectionLimit: maxCount,
    });

    if (!resultado.canceled && resultado.assets.length > 0) {
      const newImages = resultado.assets.map(asset => asset.uri);
      setImageState(prevImages => {
        // Si maxCount es 1, reemplaza la imagen existente. Si es >1, añade.
        const combined = maxCount === 1 ? newImages : [...prevImages, ...newImages];
        return combined.slice(0, maxCount); // Limitar al número máximo permitido
      });
    }
  };

  // Función para registrar la solicitud de adopción
  const registrarAdopcion = async () => {
    // Validaciones
    if (!ID_USUARIO_LOGUEADO) {
      Alert.alert('Error', 'No se pudo obtener el ID del usuario. Por favor, inicia sesión.');
      return;
    }
    if (!idRefugio || !idAnimal || !documentoINE || !motivo.trim() || !haAdoptadoAntes || !tipoVivienda) {
      Alert.alert('Error', 'Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (haAdoptadoAntes === 'si') {
      if (!cantidadMascotasAnteriores || parseInt(cantidadMascotasAnteriores) <= 0) {
        Alert.alert('Error', 'Por favor, indica cuántas mascotas tienes o has tenido.');
        return;
      }
      if (fotosMascotasAnteriores.length === 0) {
        Alert.alert('Error', 'Por favor, sube al menos una foto de tus mascotas anteriores.');
        return;
      }
    }

    if (tipoVivienda === 'renta' && !permisoMascotasRenta) {
      Alert.alert('Error', 'Por favor, indica si puedes tener mascotas en tu vivienda de renta.');
      return;
    }

    if (fotosEspacioMascota.length === 0) {
      Alert.alert('Error', 'Por favor, sube al menos una foto del espacio para la mascota.');
      return;
    }

    setCargando(true);
    try {
      const formData = new FormData();
      formData.append('idUsuario', ID_USUARIO_LOGUEADO);
      formData.append('idRefugio', idRefugio);
      formData.append('idAnimal', idAnimal);
      formData.append('motivo', motivo.trim());
      formData.append('haAdoptadoAntes', haAdoptadoAntes);
      formData.append('tipoVivienda', tipoVivienda);

      // Documento INE
      if (documentoINE) {
        // Asegurarse de que la URI sea un archivo local para FormData
        const fileInfo = await FileSystem.getInfoAsync(documentoINE);
        if (!fileInfo.exists) {
          Alert.alert('Error', 'El archivo INE no existe o no es accesible.');
          setCargando(false);
          return;
        }
        const filename = documentoINE.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`; // Default a jpeg si no se puede inferir
        formData.append('documentoINE', { uri: documentoINE, name: filename, type });
      }

      // Pregunta de adopción anterior
      if (haAdoptadoAntes === 'si') {
        formData.append('cantidadMascotasAnteriores', cantidadMascotasAnteriores);
        for (const uri of fotosMascotasAnteriores) {
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (!fileInfo.exists) {
            Alert.alert('Error', `Una de las fotos de mascotas anteriores no existe: ${uri}`);
            setCargando(false);
            return;
          }
          const filename = uri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;
          formData.append(`fotosMascotasAnteriores`, { uri, name: filename, type });
        }
      }

      // Tipo de vivienda
      if (tipoVivienda === 'renta') {
        formData.append('permisoMascotasRenta', permisoMascotasRenta);
      }

      // Fotos del espacio para la mascota
      for (const uri of fotosEspacioMascota) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          Alert.alert('Error', `Una de las fotos del espacio no existe: ${uri}`);
          setCargando(false);
          return;
        }
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append(`fotosEspacioMascota`, { uri, name: filename, type });
      }

      const response = await axios.post(`${BASE_URL}/solicitudes-adopcion`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Respuesta del servidor:', response.data);

      Alert.alert(
        'Éxito',
        'Formulario de adopción enviado correctamente. Te contactaremos pronto.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset de los campos del formulario
              setDocumentoINE(null);
              setMotivo('');
              setHaAdoptadoAntes('');
              setCantidadMascotasAnteriores('');
              setFotosMascotasAnteriores([]);
              setTipoVivienda('');
              setPermisoMascotasRenta('');
              setFotosEspacioMascota([]);
              router.replace('/CatalogoMascotas');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error al enviar formulario de adopción:', error);
      const errorMessage = error.response?.data?.message || 'No se pudo enviar el formulario de adopción. Intenta de nuevo.';
      Alert.alert('Error', errorMessage);
    } finally {
      setCargando(false);
    }
  };

  // Si los datos de la mascota aún no se han cargado, mostrar un indicador de carga
  if (!idAnimal && !mascotaParam) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a26b6c" />
        <Text style={styles.loadingText}>Cargando datos de la mascota...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <Text style={styles.titulo}>Formulario de Adopción</Text>
      <Text style={styles.subtitulo}>Completa los datos para tu solicitud</Text>

      {/* Información de la mascota y refugio (solo lectura) */}
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Mascota seleccionada:</Text>
        <Text style={styles.infoText}>{animalNombre}</Text>
        <Text style={styles.infoLabel}>Refugio:</Text>
        <Text style={styles.infoText}>{refugioNombre}</Text>
      </View>

      {/* Motivación para adoptar */}
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

      {/* ¿Has adoptado antes? */}
      <Text style={styles.label}>¿Has adoptado antes o tienes mascotas?</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={haAdoptadoAntes}
          onValueChange={(itemValue) => setHaAdoptadoAntes(itemValue)}
          mode="dropdown"
          style={styles.picker}
          itemStyle={styles.pickerItem}
          enabled={!cargando}
        >
          <Picker.Item label="Selecciona una opción" value="" />
          <Picker.Item label="Sí" value="si" />
          <Picker.Item label="No" value="no" />
        </Picker>
      </View>

      {haAdoptadoAntes === 'si' && (
        <>
          <Text style={styles.label}>¿Cuántas mascotas tienes o has tenido?</Text>
          <TextInput
            style={styles.input}
            placeholder="Número de mascotas"
            keyboardType="numeric"
            value={cantidadMascotasAnteriores}
            onChangeText={setCantidadMascotasAnteriores}
            editable={!cargando}
          />
          <Text style={styles.label}>Fotos de tus mascotas anteriores (máx. 5)</Text>
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={() => seleccionarImagenes(5, fotosMascotasAnteriores, setFotosMascotasAnteriores)}
            disabled={cargando}
          >
            {fotosMascotasAnteriores.length > 0 ? (
              <View style={styles.imagePreviewContainer}>
                {fotosMascotasAnteriores.map((uri, index) => (
                  <Image key={index} source={{ uri }} style={styles.imagePreview} />
                ))}
                <Text style={styles.textoSubirSecundario}>Toca para añadir/cambiar ({fotosMascotasAnteriores.length}/5)</Text>
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.textoSubir}>📸 Subir fotos</Text>
                <Text style={styles.textoSubirSecundario}>Toca para seleccionar</Text>
              </View>
            )}
          </TouchableOpacity>
        </>
      )}

      {/* Tipo de Vivienda */}
      <Text style={styles.label}>Tipo de Vivienda</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={tipoVivienda}
          onValueChange={(itemValue) => setTipoVivienda(itemValue)}
          mode="dropdown"
          style={styles.picker}
          itemStyle={styles.pickerItem}
          enabled={!cargando}
        >
          <Picker.Item label="Selecciona el tipo de vivienda" value="" />
          <Picker.Item label="Hogar propio" value="propio" />
          <Picker.Item label="Renta" value="renta" />
        </Picker>
      </View>

      {tipoVivienda === 'renta' && (
        <>
          <Text style={styles.label}>¿Tu contrato de renta permite mascotas?</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={permisoMascotasRenta}
              onValueChange={(itemValue) => setPermisoMascotasRenta(itemValue)}
              mode="dropdown"
              style={styles.picker}
              itemStyle={styles.pickerItem}
              enabled={!cargando}
            >
              <Picker.Item label="Selecciona una opción" value="" />
              <Picker.Item label="Sí" value="si" />
              <Picker.Item label="No" value="no" />
            </Picker>
          </View>
        </>
      )}

      {/* Fotos del espacio para la mascota */}
      <Text style={styles.label}>Fotos del espacio donde vivirá la mascota (máx. 5)</Text>
      <TouchableOpacity
        style={styles.imagePicker}
        onPress={() => seleccionarImagenes(5, fotosEspacioMascota, setFotosEspacioMascota)}
        disabled={cargando}
      >
        {fotosEspacioMascota.length > 0 ? (
          <View style={styles.imagePreviewContainer}>
            {fotosEspacioMascota.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.imagePreview} />
            ))}
            <Text style={styles.textoSubirSecundario}>Toca para añadir/cambiar ({fotosEspacioMascota.length}/5)</Text>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.textoSubir}>🏡 Subir fotos del espacio</Text>
            <Text style={styles.textoSubirSecundario}>Toca para seleccionar</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Documento INE */}
      <Text style={styles.label}>Sube tu Documento de Identidad (INE)</Text>
      <TouchableOpacity
        style={styles.imagePicker}
        onPress={() => seleccionarImagenes(1, [], setDocumentoINE)} // Solo 1 foto para INE
        disabled={cargando}
      >
        {documentoINE ? (
          <Image source={{ uri: documentoINE }} style={styles.imagen} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.textoSubir}>📄 Subir INE</Text>
            <Text style={styles.textoSubirSecundario}>Toca para seleccionar</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Botón de enviar solicitud */}
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

      {/* Botón de regresar */}
      <TouchableOpacity
        style={[styles.botonRegresar, cargando && styles.botonDeshabilitado]}
        onPress={() => router.replace('/CatalogoMascotas')}
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
    backgroundColor: '#A4645E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#A4645E',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ffffff',
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
  infoBox: {
    backgroundColor: '#FEE9E7',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 14,
    color: '#900B09',
    fontWeight: 'bold',
    marginBottom: 3,
  },
  infoText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
    fontWeight: '600',
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    marginTop: 15,
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
    color: '#333',
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
    height: 150,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    margin: 5,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: '#a26b6c',
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
    textAlign: 'center',
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
    ...Platform.select({
      android: {
        height: 50,
        justifyContent: 'center',
      },
    }),
  },
  picker: {
    width: '100%',
    color: '#333',
  },
  pickerItem: {
    fontSize: 16,
  },
  botonEnviar: {
    backgroundColor: '#FEE9E7',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
  botonRegresar: {
    backgroundColor: '#FFD6EC',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 20,
  },
  botonDeshabilitado: {
    backgroundColor: '#cccccc',
  },
  textoBoton: {
    color: '#900B09',
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