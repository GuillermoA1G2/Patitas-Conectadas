import React, { useState, useEffect, useCallback } from 'react';
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
// Importar la API legacy para mantener compatibilidad
import * as FileSystem from 'expo-file-system/legacy';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const BASE_URL = 'http://192.168.1.119:3000/api';
//const BASE_URL = 'https://patitas-conectadas-dlpdjaiwf-patitas-conectadas-projects.vercel.app/api';

export default function FormularioAdopcion() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { mascota: mascotaParam, userId: userIdParam } = params;

  // Estados del formulario
  const [refugioNombre, setRefugioNombre] = useState('');
  const [animalNombre, setAnimalNombre] = useState('');
  const [idRefugio, setIdRefugio] = useState('');
  const [idAnimal, setIdAnimal] = useState('');
  const [idUsuario, setIdUsuario] = useState(userIdParam || '');

  const [documentosINE, setDocumentosINE] = useState([]);
  const [motivo, setMotivo] = useState('');
  const [cargando, setCargando] = useState(false);

  const [haAdoptadoAntes, setHaAdoptadoAntes] = useState('');
  const [cantidadMascotasAnteriores, setCantidadMascotasAnteriores] = useState(0);
  const [fotosMascotasAnteriores, setFotosMascotasAnteriores] = useState([]);
  const [tipoVivienda, setTipoVivienda] = useState('');
  const [permisoMascotasRenta, setPermisoMascotasRenta] = useState('');
  const [fotosEspacioMascota, setFotosEspacioMascota] = useState([]);

  // Función para resetear el formulario
  const resetFormulario = useCallback(() => {
    setDocumentosINE([]);
    setMotivo('');
    setHaAdoptadoAntes('');
    setCantidadMascotasAnteriores(0);
    setFotosMascotasAnteriores([]);
    setTipoVivienda('');
    setPermisoMascotasRenta('');
    setFotosEspacioMascota([]);
  }, []);

  // Función para extraer userId de manera consistente
  const extraerUserId = (params) => {
    if (!params) return null;
    
    const posiblesIds = [
      params.userId,
      params.id,
      params.usuarioId,
      params._id,
      params.idUsuario,
      params.user?.id,
      params.usuario?.id
    ];
    
    return posiblesIds.find(id => id) || null;
  };

  // Efecto para cargar los datos de la mascota y el refugio
  useEffect(() => {
    console.log('📋 FormularioAdopcion mounted. Received params:', params);
    
    // Extraer userId de manera más robusta
    const extractedUserId = extraerUserId(params);
    if (extractedUserId) {
      setIdUsuario(extractedUserId);
    }

    if (mascotaParam) {
      try {
        const parsedMascota = typeof mascotaParam === 'string' ? JSON.parse(mascotaParam) : mascotaParam;
        console.log('🐕 Parsed mascota:', parsedMascota);
        
        setAnimalNombre(parsedMascota.nombre || 'Mascota');
        setIdAnimal(parsedMascota.idanimal || parsedMascota.id);
        setRefugioNombre(parsedMascota.refugio_nombre || 'Refugio Desconocido');
        setIdRefugio(parsedMascota.id_refugio);
      } catch (e) {
        console.error("Error parsing mascota param:", e);
        Alert.alert('Error', 'No se pudieron cargar los datos de la mascota. Redirigiendo al catálogo.');
        router.replace({ pathname: '/CatalogoMascotas', params: { userId: idUsuario } });
      }
    } else {
      Alert.alert('Error', 'No se ha seleccionado ninguna mascota para adoptar. Redirigiendo al catálogo.');
      router.replace({ pathname: '/CatalogoMascotas', params: { userId: idUsuario } });
    }

    // Verificar userId
    if (!extractedUserId && !idUsuario) {
      Alert.alert('Error de Sesión', 'No se pudo identificar tu sesión. Por favor, inicia sesión nuevamente.');
      router.replace('/inicio_sesion');
    }
  }, [mascotaParam, router]);

  // Efecto para manejar el cambio en "¿Has adoptado antes?"
  useEffect(() => {
    if (haAdoptadoAntes === 'no') {
      setCantidadMascotasAnteriores(0);
      setFotosMascotasAnteriores([]);
    } else if (haAdoptadoAntes === 'si' && cantidadMascotasAnteriores === 0) {
      setCantidadMascotasAnteriores(1);
    }
  }, [haAdoptadoAntes]);

  // Efecto para manejar el cambio en tipo de vivienda
  useEffect(() => {
    if (tipoVivienda === 'propio') {
      setPermisoMascotasRenta('no_aplica');
    } else if (tipoVivienda === 'renta') {
      setPermisoMascotasRenta('');
    }
  }, [tipoVivienda]);

  // Función mejorada para verificar si un archivo existe
  const verificarArchivoExiste = async (uri) => {
    try {
      // Usar la API legacy para evitar el error de deprecación
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.exists;
    } catch (error) {
      console.warn('⚠️ Error verificando archivo:', error);
      // Fallback: asumir que el archivo existe si hay un URI
      return uri && uri.length > 0;
    }
  };

  // Función genérica mejorada para seleccionar imágenes
  const seleccionarImagenes = async (maxCount, currentImages, setImageState) => {
    try {
      // Solicitar permisos de la galería
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para subir imágenes.');
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: maxCount > 1,
        quality: 0.7,
        selectionLimit: maxCount,
        allowsEditing: false,
      });

      if (!resultado.canceled && resultado.assets && resultado.assets.length > 0) {
        const newImages = resultado.assets.map(asset => asset.uri).filter(uri => uri);
        
        // Verificar que las imágenes existan antes de agregarlas
        const validImages = [];
        for (const uri of newImages) {
          const exists = await verificarArchivoExiste(uri);
          if (exists) {
            validImages.push(uri);
          } else {
            console.warn('⚠️ Imagen no válida o no existe:', uri);
          }
        }

        if (validImages.length > 0) {
          setImageState(prevImages => {
            const combined = [...prevImages, ...validImages];
            return combined.slice(0, maxCount);
          });
        } else {
          Alert.alert('Error', 'No se pudieron cargar las imágenes seleccionadas.');
        }
      }
    } catch (error) {
      console.error('❌ Error seleccionando imágenes:', error);
      Alert.alert('Error', 'No se pudieron seleccionar las imágenes. Intenta de nuevo.');
    }
  };

  // Función para eliminar una imagen de un estado específico
  const eliminarImagen = (uriToRemove, setImageState) => {
    setImageState(prevImages => prevImages.filter(uri => uri !== uriToRemove));
  };

  // Función para crear FormData de manera más robusta
  const crearFormData = async () => {
    const formData = new FormData();
    
    // Agregar datos básicos
    formData.append('idUsuario', idUsuario);
    formData.append('idRefugio', idRefugio);
    formData.append('idAnimal', idAnimal);
    formData.append('motivo', motivo.trim());
    formData.append('haAdoptadoAntes', haAdoptadoAntes);
    formData.append('tipoVivienda', tipoVivienda);
    formData.append('cantidadMascotasAnteriores', haAdoptadoAntes === 'si' ? cantidadMascotasAnteriores.toString() : '0');
    formData.append('permisoMascotasRenta', tipoVivienda === 'renta' ? permisoMascotasRenta : 'no_aplica');

    // Función auxiliar mejorada para adjuntar archivos
    const appendFiles = async (fileUris, fieldName) => {
      for (let i = 0; i < fileUris.length; i++) {
        const uri = fileUris[i];
        
        // Verificar que el archivo exista
        const fileExists = await verificarArchivoExiste(uri);
        if (!fileExists) {
          throw new Error(`El archivo no existe o no es accesible: ${uri}`);
        }

        // Crear el objeto de archivo para FormData
        const filename = uri.split('/').pop() || `${fieldName}_${i}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append(fieldName, {
          uri,
          name: filename,
          type
        });
      }
    };

    // Adjuntar archivos
    await appendFiles(documentosINE, 'documentoINE');
    await appendFiles(fotosEspacioMascota, 'fotosEspacioMascota');
    
    if (haAdoptadoAntes === 'si' && fotosMascotasAnteriores.length > 0) {
      await appendFiles(fotosMascotasAnteriores, 'fotosMascotasAnteriores');
    }

    return formData;
  };

  // Función principal para registrar la adopción
  const registrarAdopcion = async () => {
    // Validaciones básicas obligatorias
    if (!idUsuario) {
      Alert.alert('Error', 'No se pudo obtener el ID del usuario. Por favor, inicia sesión.');
      return;
    }

    if (!idRefugio || !idAnimal) {
      Alert.alert('Error', 'No se pudieron cargar los datos de la mascota o refugio. Por favor, intenta de nuevo.');
      console.error('❌ Error de validación: idRefugio o idAnimal están vacíos.');
      return;
    }

    if (!motivo.trim()) {
      Alert.alert('Error', 'Por favor, escribe tu motivación para adoptar.');
      return;
    }

    if (!haAdoptadoAntes) {
      Alert.alert('Error', 'Por favor, indica si has adoptado antes o tienes mascotas.');
      return;
    }

    if (!tipoVivienda) {
      Alert.alert('Error', 'Por favor, selecciona el tipo de vivienda.');
      return;
    }

    // Validar que se hayan subido ambas caras del INE
    if (documentosINE.length < 2) {
      Alert.alert('Error', 'Debe subir ambas caras de su documento INE (frente y reverso).');
      return;
    }

    // Validar fotos del espacio para la mascota
    if (fotosEspacioMascota.length === 0) {
      Alert.alert('Error', 'Por favor, suba al menos una foto del espacio donde vivirá la mascota.');
      return;
    }

    // Validaciones condicionales
    if (haAdoptadoAntes === 'si') {
      if (cantidadMascotasAnteriores < 1) {
        Alert.alert('Error', 'La cantidad de mascotas anteriores debe ser al menos 1.');
        return;
      }
      if (fotosMascotasAnteriores.length === 0) {
        Alert.alert('Error', 'Por favor, suba al menos una foto de sus mascotas anteriores.');
        return;
      }
    }

    if (tipoVivienda === 'renta' && !permisoMascotasRenta) {
      Alert.alert('Error', 'Por favor, indique si su contrato de renta permite mascotas.');
      return;
    }

    setCargando(true);
    try {
      console.log('📤 Enviando solicitud de adopción...');
      console.log('📋 Datos:', {
        idUsuario,
        idRefugio,
        idAnimal,
        animalNombre,
        refugioNombre,
        motivo: motivo.substring(0, 50) + '...',
        haAdoptadoAntes,
        tipoVivienda,
        documentosINE: documentosINE.length,
        fotosEspacioMascota: fotosEspacioMascota.length,
        fotosMascotasAnteriores: fotosMascotasAnteriores.length
      });

      const formData = await crearFormData();

      const response = await axios.post(`${BASE_URL}/solicitudes-adopcion`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 segundos timeout
      });

      console.log('✅ Respuesta exitosa:', response.data);

      Alert.alert(
        'Éxito',
        'Formulario de adopción enviado correctamente. Te contactaremos pronto.',
        [
          {
            text: 'OK',
            onPress: () => {
              resetFormulario();
              router.replace({ 
                pathname: '/CatalogoMascotas', 
                params: { 
                  userId: idUsuario,
                  id: idUsuario,
                  usuarioId: idUsuario 
                }
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error al enviar formulario de adopción:', error);
      let errorMessage = 'No se pudo enviar el formulario de adopción. Intenta de nuevo.';

      if (error.response) {
        console.error('📥 Error response:', error.response.data);
        errorMessage = error.response.data?.message || `Error del servidor: ${error.response.status}`;
      } else if (error.request) {
        console.error('📡 Error request:', error.request);
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet y que el servidor esté corriendo.';
      } else {
        console.error('⚙️ Error setup:', error.message);
        errorMessage = `Error: ${error.message}`;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setCargando(false);
    }
  };

  // Componente de imagen con manejo mejorado de errores
  const ImagePreview = ({ uri, onDelete, disabled = false }) => (
    <View style={styles.imageWrapper}>
      <Image 
        source={{ uri }} 
        style={styles.imagePreview}
        onError={(e) => {
          console.warn('⚠️ Error cargando imagen:', e.nativeEvent.error, 'URI:', uri);
        }}
      />
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onDelete}
        disabled={disabled}
      >
        <MaterialIcons name="close" size={18} color="white" />
      </TouchableOpacity>
    </View>
  );

  // Si los datos de la mascota aún no se han cargado
  if (!idAnimal && !mascotaParam) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a26b6c" />
        <Text style={styles.loadingText}>Cargando datos de la mascota...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <Text style={styles.titulo}>Formulario de Adopción</Text>
      <Text style={styles.subtitulo}>Completa los datos para tu solicitud</Text>

      {/* Información de la mascota y refugio */}
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Mascota seleccionada:</Text>
        <Text style={styles.infoText}>{animalNombre}</Text>
        <Text style={styles.infoLabel}>Refugio:</Text>
        <Text style={styles.infoText}>{refugioNombre}</Text>
      </View>

      {/* Motivación para adoptar */}
      <Text style={styles.label}>Tu Motivación para Adoptar <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="¿Por qué elegiste adoptar a este animal? Cuéntanos tu motivación..."
        value={motivo}
        onChangeText={setMotivo}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        editable={!cargando}
        maxLength={500}
      />

      {/* ¿Has adoptado antes? */}
      <Text style={styles.label}>¿Has adoptado antes o tienes mascotas? <Text style={styles.required}>*</Text></Text>
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
          <Text style={styles.label}>¿Cuántas mascotas tienes o has tenido? <Text style={styles.required}>*</Text></Text>
          <View style={styles.counterContainer}>
            <TouchableOpacity
              style={[styles.counterButton, (cargando || cantidadMascotasAnteriores <= 1) && styles.counterButtonDisabled]}
              onPress={() => setCantidadMascotasAnteriores(prev => Math.max(1, prev - 1))}
              disabled={cargando || cantidadMascotasAnteriores <= 1}
            >
              <Ionicons 
                name="remove" 
                size={24} 
                color={cargando || cantidadMascotasAnteriores <= 1 ? '#ccc' : '#333'} 
              />
            </TouchableOpacity>
            <Text style={styles.counterText}>{cantidadMascotasAnteriores}</Text>
            <TouchableOpacity
              style={[styles.counterButton, cargando && styles.counterButtonDisabled]}
              onPress={() => setCantidadMascotasAnteriores(prev => prev + 1)}
              disabled={cargando}
            >
              <Ionicons name="add" size={24} color={cargando ? '#ccc' : '#333'} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Fotos de tus mascotas anteriores (mín. 1, máx. 5) <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={() => seleccionarImagenes(5, fotosMascotasAnteriores, setFotosMascotasAnteriores)}
            disabled={cargando}
          >
            {fotosMascotasAnteriores.length > 0 ? (
              <View style={styles.imagePreviewContainer}>
                {fotosMascotasAnteriores.map((uri, index) => (
                  <ImagePreview
                    key={`mascota-${index}`}
                    uri={uri}
                    onDelete={() => eliminarImagen(uri, setFotosMascotasAnteriores)}
                    disabled={cargando}
                  />
                ))}
                <Text style={styles.textoSubirSecundario}>
                  Toca para añadir/cambiar ({fotosMascotasAnteriores.length}/5)
                </Text>
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
      <Text style={styles.label}>Tipo de Vivienda <Text style={styles.required}>*</Text></Text>
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
          <Text style={styles.label}>¿Tu contrato de renta permite mascotas? <Text style={styles.required}>*</Text></Text>
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
      <Text style={styles.label}>Fotos del espacio donde vivirá la mascota (mín. 1, máx. 5) <Text style={styles.required}>*</Text></Text>
      <TouchableOpacity
        style={styles.imagePicker}
        onPress={() => seleccionarImagenes(5, fotosEspacioMascota, setFotosEspacioMascota)}
        disabled={cargando}
      >
        {fotosEspacioMascota.length > 0 ? (
          <View style={styles.imagePreviewContainer}>
            {fotosEspacioMascota.map((uri, index) => (
              <ImagePreview
                key={`espacio-${index}`}
                uri={uri}
                onDelete={() => eliminarImagen(uri, setFotosEspacioMascota)}
                disabled={cargando}
              />
            ))}
            <Text style={styles.textoSubirSecundario}>
              Toca para añadir/cambiar ({fotosEspacioMascota.length}/5)
            </Text>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.textoSubir}>🏡 Subir fotos del espacio</Text>
            <Text style={styles.textoSubirSecundario}>Toca para seleccionar</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Documento INE */}
      <Text style={styles.label}>Sube tu Documento de Identidad (INE) - Frente y Reverso <Text style={styles.required}>*</Text></Text>
      <TouchableOpacity
        style={styles.imagePicker}
        onPress={() => seleccionarImagenes(2, documentosINE, setDocumentosINE)}
        disabled={cargando}
      >
        {documentosINE.length > 0 ? (
          <View style={styles.imagePreviewContainer}>
            {documentosINE.map((uri, index) => (
              <ImagePreview
                key={`ine-${index}`}
                uri={uri}
                onDelete={() => eliminarImagen(uri, setDocumentosINE)}
                disabled={cargando}
              />
            ))}
            <Text style={styles.textoSubirSecundario}>
              Toca para añadir/cambiar ({documentosINE.length}/2)
            </Text>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.textoSubir}>📄 Subir INE (Frente y Reverso)</Text>
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
          <View style={styles.loadingButtonContent}>
            <ActivityIndicator color="white" size="small" />
            <Text style={[styles.textoBoton, { marginLeft: 10 }]}>Enviando...</Text>
          </View>
        ) : (
          <Text style={styles.textoBoton}>Enviar Solicitud</Text>
        )}
      </TouchableOpacity>

      {/* Botón de regresar */}
      <TouchableOpacity
        style={[styles.botonRegresar, cargando && styles.botonDeshabilitado]}
        onPress={() => router.replace({ 
          pathname: '/CatalogoMascotas', 
          params: { 
            userId: idUsuario,
            id: idUsuario,
            usuarioId: idUsuario 
          }
        })}
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
  required: {
    color: 'red',
    fontWeight: 'bold',
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
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
  },
  counterButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 5,
  },
  counterButtonDisabled: {
    opacity: 0.5,
  },
  counterText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 40,
    textAlign: 'center',
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
    minHeight: 120,
    justifyContent: 'center',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  imageWrapper: {
    position: 'relative',
    margin: 5,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: '#a26b6c',
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#dc3545',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  textoSubir: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  textoSubirSecundario: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    width: '100%',
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
      ios: {
        paddingVertical: 8,
      },
    }),
  },
  picker: {
    width: '100%',
    color: '#333',
    ...Platform.select({
      android: {
        height: 50,
      },
    }),
  },
  pickerItem: {
    fontSize: 16,
    color: '#333',
  },
  botonEnviar: {
    backgroundColor: '#FFD6EC',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginTop: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  botonRegresar: {
    backgroundColor: '#7b848bff',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  botonDeshabilitado: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  textoBoton: {
    color: 'white',
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
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});