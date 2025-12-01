import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Componente para campos de formulario
const CampoFormulario = ({ label, value, onChangeText, requerido = false, style, ...props }) => {
  return (
    <>
      <Text style={styles.label}>{label}{requerido && ' *'}</Text>
      <TextInput
        style={[styles.input, style]}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
    </>
  );
};

// Componente para contador numérico
const ContadorNumerico = ({ label, valor, onCambio, cargando }) => {
  const displayValue = valor === '' ? 0 : parseInt(valor, 10);

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.contadorContainer}>
        <TouchableOpacity
          style={[styles.contadorBoton, displayValue <= 0 && styles.contadorBotonDeshabilitado]}
          onPress={() => displayValue > 0 && onCambio((displayValue - 1).toString())}
          disabled={cargando || displayValue <= 0}
        >
          <Text style={styles.contadorTexto}>-</Text>
        </TouchableOpacity>
        <View style={styles.contadorValor}>
          <Text style={styles.contadorTextoValor}>{displayValue}</Text>
        </View>
        <TouchableOpacity
          style={[styles.contadorBoton, displayValue >= 30 && styles.contadorBotonDeshabilitado]}
          onPress={() => displayValue < 30 && onCambio((displayValue + 1).toString())}
          disabled={cargando || displayValue >= 30}
        >
          <Text style={styles.contadorTexto}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.labelSecundario}>Edad en años (0 si es cachorro)</Text>
    </>
  );
};

export default function RegistrarAnimal() {
  const router = useRouter();
  const { refugioId, refugioNombre, refugioEmail, refugioTelefono } = useLocalSearchParams();

  const [form, setForm] = useState({
    nombre: '',
    especie: '',
    raza: '',
    edad: '0',
    sexo: '',
    tamano: '', // Cambié tamaño por tamano para evitar problemas de encoding
    descripcion: '',
    historial_medico: '',
    necesidades: '',
    esterilizacion: false,
    id_refugio: refugioId || ''
  });
  const [imagenes, setImagenes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');

  // Usa tu URL de producción o local
  const API_URL = 'https://patitas-conectadas-nine.vercel.app';
  // const API_URL = 'http://192.168.1.119:3000'; // Para pruebas locales

  const tamanos = ['Muy pequeño', 'Pequeño', 'Mediano', 'Grande', 'Muy grande'];
  const sexos = ['Macho', 'Hembra'];

  useEffect(() => {
    if (refugioId && form.id_refugio !== refugioId) {
      setForm(prevForm => ({ ...prevForm, id_refugio: refugioId }));
    }
  }, [refugioId]);

  const handleChange = (key, value) => {
    setForm(prevForm => ({ ...prevForm, [key]: value }));
  };

  const seleccionarImagen = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se requiere permiso para acceder a la galería de fotos');
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7, // Reducí la calidad para archivos más pequeños
        aspect: [4, 3],
      });

      if (!resultado.canceled && resultado.assets && resultado.assets[0]) {
        if (imagenes.length >= 5) {
          Alert.alert('Límite alcanzado', 'Máximo 5 imágenes permitidas');
          return;
        }
        setImagenes(prevImagenes => [...prevImagenes, resultado.assets[0]]);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const eliminarImagen = (index) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar esta imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => setImagenes(prevImagenes => prevImagenes.filter((_, i) => i !== index))
        }
      ]
    );
  };

  const validarFormulario = () => {
    const errores = [];

    if (!form.nombre.trim()) errores.push('Nombre');
    if (!form.especie.trim()) errores.push('Especie');
    if (!form.sexo.trim()) errores.push('Sexo');
    if (!form.id_refugio) errores.push('Refugio (ID no disponible)');
    if (imagenes.length === 0) errores.push('Al menos una imagen');

    if (errores.length > 0) {
      Alert.alert('Campos obligatorios faltantes', `Por favor completa: ${errores.join(', ')}`);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validarFormulario()) return;

    // Validar que refugioId existe
    if (!refugioId) {
      Alert.alert('Error', 'No se pudo identificar el refugio. Por favor, intenta nuevamente.');
      return;
    }

    setCargando(true);
    try {
      const formData = new FormData();

      // Agregar campos de texto con validación
      formData.append('nombre', form.nombre.trim());
      formData.append('especie', form.especie.trim());
      formData.append('raza', form.raza.trim() || '');
      formData.append('edad', form.edad || '0'); // Asegurar que siempre hay un valor
      formData.append('sexo', form.sexo);
      formData.append('tamano', form.tamano || ''); // Usar 'tamano' sin ñ
      formData.append('descripcion', form.descripcion.trim() || '');
      formData.append('historial_medico', form.historial_medico.trim() || '');
      formData.append('necesidades', form.necesidades.trim() || '');
      formData.append('esterilizacion', form.esterilizacion ? 'true' : 'false');

      // Agregar imágenes con mejor manejo de tipos MIME
      imagenes.forEach((img, index) => {
        // Detectar el tipo de archivo desde la URI
        let mimeType = 'image/jpeg';
        const uri = img.uri.toLowerCase();
        
        if (uri.endsWith('.png')) {
          mimeType = 'image/png';
        } else if (uri.endsWith('.jpg') || uri.endsWith('.jpeg')) {
          mimeType = 'image/jpeg';
        } else if (uri.endsWith('.gif')) {
          mimeType = 'image/gif';
        }

        const fileExtension = mimeType.split('/')[1];

        formData.append('fotos', {
          uri: Platform.OS === 'ios' ? img.uri.replace('file://', '') : img.uri,
          type: mimeType,
          name: `foto-${index}-${Date.now()}.${fileExtension}`,
        });
      });

      console.log('Enviando datos al servidor...');
      console.log('URL:', `${API_URL}/api/refugio/${refugioId}/animales`);
      
      const response = await fetch(`${API_URL}/api/refugio/${refugioId}/animales`, {
        method: 'POST',
        body: formData,
        // NO incluir Content-Type header - FormData lo maneja automáticamente
      });

      console.log('Status de respuesta:', response.status);
      
      // Intentar parsear la respuesta incluso si hay error
      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error('Respuesta no JSON:', text);
        throw new Error('El servidor no devolvió una respuesta válida');
      }

      console.log('Respuesta del servidor:', result);

      if (response.ok && result.success) {
        Alert.alert(
          '¡Éxito!',
          'Animal registrado correctamente',
          [
            {
              text: 'OK',
              onPress: () => {
                limpiarFormulario();
                router.push({
                  pathname: '/refugio',
                  params: {
                    refugioId: refugioId,
                    refugioNombre: refugioNombre,
                    refugioEmail: refugioEmail,
                    refugioTelefono: refugioTelefono,
                    usuarioTipo: 'refugio'
                  }
                });
              }
            }
          ]
        );
      } else {
        throw new Error(result.message || 'Error al registrar el animal');
      }
    } catch (error) {
      console.error('Error completo:', error);
      let mensajeError = 'Error desconocido';

      if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
        mensajeError = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
      } else if (error.message.includes('JSON')) {
        mensajeError = 'Error al procesar la respuesta del servidor. Intenta nuevamente.';
      } else {
        mensajeError = error.message;
      }

      Alert.alert('Error', mensajeError);
    } finally {
      setCargando(false);
    }
  };

  const limpiarFormulario = () => {
    setForm({
      nombre: '',
      especie: '',
      raza: '',
      edad: '0',
      sexo: '',
      tamano: '',
      descripcion: '',
      historial_medico: '',
      necesidades: '',
      esterilizacion: false,
      id_refugio: refugioId || ''
    });
    setImagenes([]);
  };

  const mostrarModal = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setModalType('');
  };

  const seleccionarOpcion = (valor) => {
    if (modalType === 'tamano') {
      handleChange('tamano', valor);
    } else if (modalType === 'sexo') {
      handleChange('sexo', valor);
    }
    cerrarModal();
  };

  const obtenerOpcionesModal = () => {
    switch (modalType) {
      case 'tamano':
        return tamanos;
      case 'sexo':
        return sexos;
      default:
        return [];
    }
  };

  const CampoSelector = ({ label, valor, placeholder, onPress, requerido = false }) => {
    return (
      <>
        <Text style={styles.label}>{label}{requerido && ' *'}</Text>
        <TouchableOpacity
          style={[styles.input, styles.selectorInput]}
          onPress={onPress}
          disabled={cargando}
        >
          <Text style={[styles.selectorText, !valor && styles.placeholderText]}>
            {valor || placeholder}
          </Text>
          <Text style={styles.flechaAbajo}>▼</Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Image source={require('../assets/logo.png')} style={styles.logoSmall} />
          <Text style={styles.titulo}>Registrar Animal</Text>

          <Text style={styles.label}>Refugio</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={refugioNombre || 'Cargando...'}
            editable={false}
          />
          <Text style={styles.labelSecundario}>El animal se registrará bajo este refugio.</Text>

          <CampoFormulario
            label="Nombre"
            placeholder="Nombre del animal"
            value={form.nombre}
            onChangeText={(value) => handleChange('nombre', value)}
            requerido
            editable={!cargando}
          />

          <CampoFormulario
            label="Especie"
            placeholder="Ej: Perro, Gato, Conejo, etc."
            value={form.especie}
            onChangeText={(value) => handleChange('especie', value)}
            requerido
            editable={!cargando}
          />

          <CampoFormulario
            label="Raza"
            placeholder="Raza del animal (opcional)"
            value={form.raza}
            onChangeText={(value) => handleChange('raza', value)}
            editable={!cargando}
          />

          <ContadorNumerico
            label="Edad"
            valor={form.edad}
            onCambio={value => handleChange('edad', value)}
            cargando={cargando}
          />

          <CampoSelector
            label="Sexo"
            valor={form.sexo}
            placeholder="Selecciona el sexo"
            onPress={() => mostrarModal('sexo')}
            requerido
          />

          <CampoSelector
            label="Tamaño"
            valor={form.tamano}
            placeholder="Selecciona el tamaño"
            onPress={() => mostrarModal('tamano')}
          />

          <CampoFormulario
            label="Descripción"
            placeholder="Descripción del animal"
            value={form.descripcion}
            onChangeText={(value) => handleChange('descripcion', value)}
            multiline
            numberOfLines={4}
            style={styles.inputMultilinea}
            editable={!cargando}
          />

          <CampoFormulario
            label="Historial Médico"
            placeholder="Historial médico del animal"
            value={form.historial_medico}
            onChangeText={(value) => handleChange('historial_medico', value)}
            multiline
            numberOfLines={3}
            style={styles.inputMultilinea}
            editable={!cargando}
          />

          <CampoFormulario
            label="Necesidades Especiales"
            placeholder="Descripción de necesidades especiales"
            value={form.necesidades}
            onChangeText={(value) => handleChange('necesidades', value)}
            multiline
            numberOfLines={3}
            style={styles.inputMultilinea}
            editable={!cargando}
          />

          <Text style={styles.label}>Estado de Esterilización</Text>
          <View style={styles.esterilizacionContainer}>
            <TouchableOpacity
              onPress={() => handleChange('esterilizacion', true)}
              disabled={cargando}
              style={[
                styles.esterilizacionOpcion,
                form.esterilizacion && styles.esterilizacionSeleccionada
              ]}
            >
              <View style={[
                styles.radioButton,
                form.esterilizacion && styles.radioButtonSelected
              ]}>
                {form.esterilizacion && <Text style={styles.radioButtonText}>●</Text>}
              </View>
              <Text style={[
                styles.esterilizacionTexto,
                form.esterilizacion && styles.esterilizacionTextoSeleccionado
              ]}>
                Sí, está esterilizado
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleChange('esterilizacion', false)}
              disabled={cargando}
              style={[
                styles.esterilizacionOpcion,
                !form.esterilizacion && styles.esterilizacionSeleccionada
              ]}
            >
              <View style={[
                styles.radioButton,
                !form.esterilizacion && styles.radioButtonSelected
              ]}>
                {!form.esterilizacion && <Text style={styles.radioButtonText}>●</Text>}
              </View>
              <Text style={[
                styles.esterilizacionTexto,
                !form.esterilizacion && styles.esterilizacionTextoSeleccionado
              ]}>
                No está esterilizado
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Fotos del Animal *</Text>
          <Text style={styles.labelSecundario}>(Mínimo 1 imagen, máximo 5)</Text>

          <TouchableOpacity
            style={styles.imagePicker}
            onPress={seleccionarImagen}
            disabled={cargando || imagenes.length >= 5}
          >
            <View style={styles.placeholderContainer}>
              <Text style={styles.textoSubir}>📷 Seleccionar Imágenes</Text>
              <Text style={styles.textoSubirSecundario}>
                {imagenes.length > 0
                  ? `${imagenes.length} imagen(es) seleccionada(s)`
                  : 'Toca para seleccionar fotos del animal'
                }
              </Text>
              {imagenes.length >= 5 && (
                <Text style={styles.textoLimite}>Máximo de imágenes alcanzado</Text>
              )}
            </View>
          </TouchableOpacity>

          {imagenes.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagenesScrollContainer}
            >
              {imagenes.map((img, index) => (
                <View key={index} style={styles.imagenContainer}>
                  <Image source={{ uri: img.uri }} style={styles.imagenSeleccionada} />
                  <TouchableOpacity
                    onPress={() => eliminarImagen(index)}
                    style={styles.eliminarBotonImagen}
                    disabled={cargando}
                  >
                    <Text style={styles.eliminarTexto}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {imagenes.length < 5 && (
                <TouchableOpacity
                  onPress={seleccionarImagen}
                  style={styles.agregarImagenBoton}
                  disabled={cargando}
                >
                  <Text style={styles.agregarImagenTexto}>+</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.boton, cargando && styles.botonDeshabilitado]}
            onPress={handleSubmit}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.botonTexto}>Registrar Animal</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.boton, styles.botonSecundario, cargando && styles.botonDeshabilitado]}
            onPress={() => router.push({
              pathname: '/refugio',
              params: {
                refugioId: refugioId,
                refugioNombre: refugioNombre,
                refugioEmail: refugioEmail,
                refugioTelefono: refugioTelefono,
                usuarioTipo: 'refugio'
              }
            })}
            disabled={cargando}
          >
            <Text style={[styles.botonTextoSecundario, cargando && { color: '#FFD6EC' }]}>
              Regresar
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={cerrarModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitulo}>
                Seleccionar {
                  modalType === 'tamano' ? 'Tamaño' :
                  modalType === 'sexo' ? 'Sexo' : ''
                }
              </Text>

              <ScrollView style={styles.modalScroll}>
                {obtenerOpcionesModal().map((opcion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalOpcion}
                    onPress={() => seleccionarOpcion(opcion)}
                  >
                    <Text style={styles.modalTextoOpcion}>{opcion}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.modalBotonCerrar} onPress={cerrarModal}>
                <Text style={styles.modalTextoBoton}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#A4645E',
    paddingBottom: 50,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    justifyContent: 'center',
  },
  logoSmall: {
    width: 80,
    height: 80,
    borderRadius: 40,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 10,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#ffffff',
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    marginTop: 10,
    color: '#ffffff',
    fontWeight: '500',
  },
  labelSecundario: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    color: '#ffffff',
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  input: {
    width: '100%',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  readOnlyInput: {
    backgroundColor: '#e0e0e0',
    color: '#555',
  },
  inputMultilinea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectorInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  flechaAbajo: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  contadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contadorBoton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contadorBotonDeshabilitado: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
  },
  contadorTexto: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  contadorValor: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  contadorTextoValor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  esterilizacionContainer: {
    marginBottom: 15,
  },
  esterilizacionOpcion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  esterilizacionSeleccionada: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: '#ffffff',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#ffffff',
  },
  radioButtonText: {
    color: '#900B09',
    fontSize: 10,
    fontWeight: 'bold',
  },
  esterilizacionTexto: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  esterilizacionTextoSeleccionado: {
    fontWeight: 'bold',
  },
  boton: {
    backgroundColor: '#FFD6EC',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginTop: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  botonDeshabilitado: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  botonTexto: {
    color: '#900B09',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  botonSecundario: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFD6EC',
    marginTop: 0,
  },
  botonTextoSecundario: {
    color: '#FFD6EC',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  imagePicker: {
    alignItems: 'center',
    marginVertical: 15,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderStyle: 'dashed',
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  textoSubir: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  textoSubirSecundario: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
    opacity: 0.8,
  },
  textoLimite: {
    color: '#ffaaaa',
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  imagenesScrollContainer: {
    marginVertical: 15,
  },
  imagenContainer: {
    marginRight: 10,
    position: 'relative',
  },
  imagenSeleccionada: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  eliminarBotonImagen: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  eliminarTexto: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  agregarImagenBoton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  agregarImagenTexto: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalOpcion: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTextoOpcion: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  modalBotonCerrar: {
    backgroundColor: '#ff4444',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  modalTextoBoton: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});