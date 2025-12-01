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
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const BASE_URL = 'https://patitas-conectadas-nine.vercel.app/api';

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

  // Estados para formulario de adopción
  const [urlFormularioRefugio, setUrlFormularioRefugio] = useState('');
  const [formularioCompletado, setFormularioCompletado] = useState(null);
  const [descargandoFormulario, setDescargandoFormulario] = useState(false);
  const [cargandoDatosRefugio, setCargandoDatosRefugio] = useState(false);

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
    setFormularioCompletado(null);
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

  // Cargar datos del refugio
  const cargarDatosRefugio = async (idRefugioParam) => {
    if (!idRefugioParam) return;
    
    setCargandoDatosRefugio(true);
    try {
      console.log('🔍 Cargando datos del refugio:', idRefugioParam);
      const response = await axios.get(`${BASE_URL}/refugio/${idRefugioParam}`);
      
      if (response.data.success && response.data.refugio) {
        const refugio = response.data.refugio;
        console.log('✅ Datos del refugio cargados:', refugio);
        
        if (refugio.formularioAdopcion) {
          const formularioUrl = refugio.formularioAdopcion.startsWith('http') 
            ? refugio.formularioAdopcion 
            : `${BASE_URL.replace('/api', '')}${refugio.formularioAdopcion}`;
          
          setUrlFormularioRefugio(formularioUrl);
          console.log('📄 URL del formulario:', formularioUrl);
        } else {
          console.log('⚠️ Este refugio no tiene formulario de adopción configurado');
        }
      }
    } catch (error) {
      console.error('❌ Error al cargar datos del refugio:', error);
    } finally {
      setCargandoDatosRefugio(false);
    }
  };

  // Efecto para cargar los datos de la mascota y el refugio
  useEffect(() => {
    console.log('📋 FormularioAdopcion mounted. Received params:', params);
    
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
        const refugioId = parsedMascota.id_refugio;
        setIdRefugio(refugioId);
        
        if (refugioId) {
          cargarDatosRefugio(refugioId);
        }
      } catch (e) {
        console.error("Error parsing mascota param:", e);
        Alert.alert('Error', 'No se pudieron cargar los datos de la mascota. Redirigiendo al catálogo.');
        router.replace({ pathname: '/CatalogoMascotas', params: { userId: idUsuario } });
      }
    } else {
      Alert.alert('Error', 'No se ha seleccionado ninguna mascota para adoptar. Redirigiendo al catálogo.');
      router.replace({ pathname: '/CatalogoMascotas', params: { userId: idUsuario } });
    }

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

  // Descargar formulario de adopción del refugio
  const descargarFormularioRefugio = async () => {
    if (!urlFormularioRefugio) {
      Alert.alert('Error', 'No hay formulario de adopción disponible para este refugio.');
      return;
    }

    try {
      setDescargandoFormulario(true);
      
      const supported = await Linking.canOpenURL(urlFormularioRefugio);
      
      if (supported) {
        await Linking.openURL(urlFormularioRefugio);
        Alert.alert(
          'Formulario Abierto',
          'El formulario se ha abierto en tu navegador. Descárgalo, complétalo y luego súbelo en el siguiente paso.',
          [{ text: 'Entendido' }]
        );
      } else {
        Alert.alert('Error', 'No se puede abrir el enlace del formulario.');
      }
    } catch (error) {
      console.error('Error abriendo formulario:', error);
      Alert.alert('Error', 'No se pudo abrir el formulario de adopción.');
    } finally {
      setDescargandoFormulario(false);
    }
  };

  // Seleccionar formulario completado
  const seleccionarFormularioCompletado = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (resultado.canceled || !resultado.assets || resultado.assets.length === 0) {
        return;
      }

      setFormularioCompletado(resultado.assets[0]);
      Alert.alert('Éxito', 'Formulario cargado correctamente.');
    } catch (error) {
      console.error('Error seleccionando formulario:', error);
      Alert.alert('Error', 'No se pudo seleccionar el formulario.');
    }
  };

  // Eliminar formulario completado
  const eliminarFormularioCompletado = () => {
    setFormularioCompletado(null);
  };

  // Verificar si un archivo existe
  const verificarArchivoExiste = async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.exists;
    } catch (error) {
      console.warn('⚠️ Error verificando archivo:', error);
      return uri && uri.length > 0;
    }
  };

  // Función genérica mejorada para seleccionar imágenes
  const seleccionarImagenes = async (maxCount, currentImages, setImageState) => {
    try {
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

  // ✅ FUNCIÓN CORREGIDA: Crear FormData de manera compatible con React Native
  const crearFormData = async () => {
    const formData = new FormData();
    
    // Agregar campos de texto
    formData.append('idUsuario', idUsuario);
    formData.append('idRefugio', idRefugio);
    formData.append('idAnimal', idAnimal);
    formData.append('motivo', motivo.trim());
    formData.append('haAdoptadoAntes', haAdoptadoAntes);
    formData.append('tipoVivienda', tipoVivienda);
    formData.append('cantidadMascotasAnteriores', haAdoptadoAntes === 'si' ? cantidadMascotasAnteriores.toString() : '0');
    formData.append('permisoMascotasRenta', tipoVivienda === 'renta' ? permisoMascotasRenta : 'no_aplica');

    // Función auxiliar para agregar archivos individualmente
    const agregarArchivo = async (uri, fieldName, index = null) => {
      try {
        const fileExists = await verificarArchivoExiste(uri);
        if (!fileExists) {
          throw new Error(`El archivo no existe: ${uri}`);
        }

        // Obtener información del archivo
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          throw new Error(`Archivo no encontrado: ${uri}`);
        }

        // Extraer nombre y tipo
        const filename = uri.split('/').pop() || `${fieldName}_${index || Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        let type = 'image/jpeg'; // tipo por defecto
        
        if (match) {
          const ext = match[1].toLowerCase();
          if (ext === 'png') type = 'image/png';
          else if (ext === 'jpg' || ext === 'jpeg') type = 'image/jpeg';
          else if (ext === 'pdf') type = 'application/pdf';
        }

        // Agregar al FormData
        formData.append(fieldName, {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          name: filename,
          type: type,
        });

        console.log(`✅ Archivo agregado: ${fieldName} - ${filename}`);
      } catch (error) {
        console.error(`❌ Error agregando archivo ${fieldName}:`, error);
        throw error;
      }
    };

    try {
      // Agregar formulario completado (OBLIGATORIO)
      if (formularioCompletado) {
        formData.append('formularioCompletado', {
          uri: Platform.OS === 'ios' 
            ? formularioCompletado.uri.replace('file://', '') 
            : formularioCompletado.uri,
          name: formularioCompletado.name || 'formulario.pdf',
          type: formularioCompletado.mimeType || 'application/pdf',
        });
        console.log('✅ Formulario completado agregado');
      }

      // Agregar documentos INE (ambas caras)
      console.log(`📄 Agregando ${documentosINE.length} documentos INE...`);
      for (let i = 0; i < documentosINE.length; i++) {
        await agregarArchivo(documentosINE[i], 'documentoINE', i);
      }

      // Agregar fotos del espacio de la mascota
      console.log(`🏡 Agregando ${fotosEspacioMascota.length} fotos del espacio...`);
      for (let i = 0; i < fotosEspacioMascota.length; i++) {
        await agregarArchivo(fotosEspacioMascota[i], 'fotosEspacioMascota', i);
      }

      // Agregar fotos de mascotas anteriores (solo si aplica)
      if (haAdoptadoAntes === 'si' && fotosMascotasAnteriores.length > 0) {
        console.log(`🐾 Agregando ${fotosMascotasAnteriores.length} fotos de mascotas anteriores...`);
        for (let i = 0; i < fotosMascotasAnteriores.length; i++) {
          await agregarArchivo(fotosMascotasAnteriores[i], 'fotosMascotasAnteriores', i);
        }
      }

      console.log('✅ FormData creado exitosamente');
      return formData;

    } catch (error) {
      console.error('❌ Error creando FormData:', error);
      throw error;
    }
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

    if (!formularioCompletado) {
      Alert.alert('Error', 'Debes subir el formulario de adopción completado.');
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

    if (documentosINE.length < 2) {
      Alert.alert('Error', 'Debe subir ambas caras de su documento INE (frente y reverso).');
      return;
    }

    if (fotosEspacioMascota.length === 0) {
      Alert.alert('Error', 'Por favor, suba al menos una foto del espacio donde vivirá la mascota.');
      return;
    }

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
        fotosMascotasAnteriores: fotosMascotasAnteriores.length,
        formularioCompletado: formularioCompletado ? 'Sí' : 'No'
      });

      const formData = await crearFormData();

      const response = await axios.post(`${BASE_URL}/solicitudes-adopcion`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 90000, // 90 segundos
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
        console.error('🔥 Error response:', error.response.data);
        errorMessage = error.response.data?.message || `Error del servidor: ${error.response.status}`;
      } else if (error.request) {
        console.error('📡 Error request:', error.request);
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
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

      {/* Descargar formulario del refugio */}
      <View style={styles.seccionFormulario}>
        <Text style={styles.label}>
          📄 Paso 1: Descarga el Formulario de Adopción <Text style={styles.required}>*</Text>
        </Text>
        <Text style={styles.instrucciones}>
          Descarga el formulario oficial del refugio, complétalo con tu información adicional y súbelo en el siguiente paso.
        </Text>
        
        {cargandoDatosRefugio ? (
          <View style={styles.loadingButtonContent}>
            <ActivityIndicator color="#4CAF50" size="small" />
            <Text style={[styles.textoSubirSecundario, { marginLeft: 10 }]}>Cargando formulario...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.botonDescargar, 
              (descargandoFormulario || !urlFormularioRefugio) && styles.botonDeshabilitado
            ]}
            onPress={descargarFormularioRefugio}
            disabled={descargandoFormulario || !urlFormularioRefugio}
          >
            {descargandoFormulario ? (
              <View style={styles.loadingButtonContent}>
                <ActivityIndicator color="white" size="small" />
                <Text style={[styles.textoBotonDescargar, { marginLeft: 10 }]}>Abriendo...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="download-outline" size={24} color="white" />
                <Text style={styles.textoBotonDescargar}>Descargar Formulario del Refugio</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {!urlFormularioRefugio && !cargandoDatosRefugio && (
          <Text style={styles.mensajeAdvertencia}>
            ⚠️ Este refugio no tiene formulario disponible aún.
          </Text>
        )}
      </View>

      {/* Subir formulario completado */}
      <View style={styles.seccionFormulario}>
        <Text style={styles.label}>
          📤 Paso 2: Sube el Formulario Completado <Text style={styles.required}>*</Text>
        </Text>
        <Text style={styles.instrucciones}>
          Sube el formulario que descargaste, ya completo con tu información.
        </Text>
        
        <TouchableOpacity
          style={styles.documentPicker}
          onPress={seleccionarFormularioCompletado}
          disabled={cargando}
        >
          {formularioCompletado ? (
            <View style={styles.documentoSeleccionadoContainer}>
              <Ionicons name="document-text" size={40} color="#4CAF50" />
              <Text style={styles.documentoNombre} numberOfLines={2}>
                {formularioCompletado.name}
              </Text>
              <TouchableOpacity
                style={styles.eliminarDocumentoBtn}
                onPress={eliminarFormularioCompletado}
                disabled={cargando}
              >
                <MaterialIcons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="cloud-upload-outline" size={40} color="#666" />
              <Text style={styles.textoSubir}>Seleccionar Formulario PDF</Text>
              <Text style={styles.textoSubirSecundario}>Toca para subir el documento</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Línea divisora */}
      <View style={styles.divisor} />

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
  seccionFormulario: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  instrucciones: {
    fontSize: 14,
    color: '#555',
    marginBottom: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  botonDescargar: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textoBotonDescargar: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  mensajeAdvertencia: {
    marginTop: 10,
    fontSize: 13,
    color: '#ff6b6b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  documentPicker: {
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#f0f8ff',
    minHeight: 120,
    justifyContent: 'center',
  },
  documentoSeleccionadoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  documentoNombre: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  eliminarDocumentoBtn: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#dc3545',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  divisor: {
    width: '100%',
    height: 2,
    backgroundColor: '#ffffff',
    marginVertical: 20,
    opacity: 0.3,
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
    color: '#ff6b6b',
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

