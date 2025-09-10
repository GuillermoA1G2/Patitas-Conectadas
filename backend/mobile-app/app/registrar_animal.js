import React, { useState } from 'react';
import { useRouter } from 'expo-router';

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
  Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function RegistrarAnimal({ navigation, route }) {
  const [form, setForm] = useState({
    nombre: '',
    especie: '',
    raza: '',
    edad: 0,
    sexo: '',
    tamaño: '',
    descripcion: '',
    historial_medico: '',
    necesidades: '',
    esterilizacion: false
  });
  const [imagenes, setImagenes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const router = useRouter();

  // Obtener el ID del refugio desde la navegación o usar un ID por defecto
  const refugioId = route?.params?.refugioId || '675e5c123456789012345678'; // ID de ejemplo

  const API_URL = 'http://192.168.1.119:3000';

  // Opciones para los dropdowns
  const tamaños = ['Muy pequeño', 'Pequeño', 'Mediano', 'Grande', 'Muy grande'];
  const sexos = ['Macho', 'Hembra'];

  // Funciones de manejo de cambios corregidas
  const handleNombreChange = (value) => {
    setForm(prevForm => ({ ...prevForm, nombre: value }));
  };

  const handleEspecieChange = (value) => {
    setForm(prevForm => ({ ...prevForm, especie: value }));
  };

  const handleRazaChange = (value) => {
    setForm(prevForm => ({ ...prevForm, raza: value }));
  };

  const handleDescripcionChange = (value) => {
    setForm(prevForm => ({ ...prevForm, descripcion: value }));
  };

  const handleHistorialChange = (value) => {
    setForm(prevForm => ({ ...prevForm, historial_medico: value }));
  };

  const handleNecesidadesChange = (value) => {
    setForm(prevForm => ({ ...prevForm, necesidades: value }));
  };

  const handleChange = (key, value) => {
    setForm(prevForm => ({ ...prevForm, [key]: value }));
  };

  const seleccionarImagen = async () => {
    try {
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

      if (!resultado.canceled && resultado.assets && resultado.assets[0]) {
        setImagenes(prevImagenes => [...prevImagenes, resultado.assets[0]]);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const eliminarImagen = (index) => {
    setImagenes(prevImagenes => prevImagenes.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validar campos obligatorios
    if (!form.nombre.trim() || !form.especie.trim() || !form.sexo.trim()) {
      Alert.alert('Error', 'Por favor llena los campos: Nombre, Especie y Sexo');
      return;
    }

    if (imagenes.length === 0) {
      Alert.alert('Error', 'Selecciona al menos una imagen del animal');
      return;
    }

    setCargando(true);
    try {
      // Crear FormData para envío con imágenes
      const formData = new FormData();
      formData.append('nombre', form.nombre.trim());
      formData.append('especie', form.especie.trim());
      formData.append('raza', form.raza.trim() || '');
      formData.append('edad', form.edad.toString());
      formData.append('sexo', form.sexo);
      formData.append('tamaño', form.tamaño || '');
      formData.append('descripcion', form.descripcion.trim() || '');
      formData.append('historial_medico', form.historial_medico.trim() || '');
      formData.append('necesidades', form.necesidades.trim() || '');
      formData.append('esterilizacion', form.esterilizacion.toString());

      // Agregar imágenes
      imagenes.forEach((img, index) => {
        formData.append('fotos', {
          uri: img.uri,
          type: 'image/jpeg',
          name: `foto-${index}-${Date.now()}.jpg`,
        });
      });

      console.log('Enviando datos al servidor...');
      
      const response = await fetch(`${API_URL}/api/refugio/${refugioId}/animales`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      console.log('Respuesta del servidor:', result);

      if (response.ok && result.success) {
        Alert.alert('¡Éxito!', 'Animal registrado correctamente', [
          {
            text: 'OK',
            onPress: () => {
              limpiarFormulario();
              if (navigation) {
                navigation.goBack();
              }
            }
          }
        ]);
      } else {
        throw new Error(result.message || 'Error al registrar el animal');
      }
    } catch (error) {
      console.error('Error al registrar animal:', error);
      let mensajeError = 'Error desconocido';
      
      if (error.message.includes('Network request failed')) {
        mensajeError = 'No se pudo conectar al servidor. Verifica tu conexión y que el servidor esté corriendo.';
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
      edad: 0,
      sexo: '',
      tamaño: '',
      descripcion: '',
      historial_medico: '',
      necesidades: '',
      esterilizacion: false
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
    if (modalType === 'tamaño') {
      handleChange('tamaño', valor);
    } else if (modalType === 'sexo') {
      handleChange('sexo', valor);
    }
    cerrarModal();
  };

  const regresarAnterior = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  // Componente para campo de formulario
  const CampoFormulario = ({ label, style, onChangeText, ...props }) => {
    return (
      <>
        <Text style={styles.label}>{label}</Text>
        <TextInput 
          style={[styles.input, style]} 
          onChangeText={onChangeText}
          {...props}
        />
      </>
    );
  };

  // Componente para selector
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

  // Componente para contador numérico
  const ContadorNumerico = ({ label, valor, onCambio }) => {
    return (
      <>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.contadorContainer}>
          <TouchableOpacity
            style={[styles.contadorBoton, valor <= 0 && styles.contadorBotonDeshabilitado]}
            onPress={() => valor > 0 && onCambio(valor - 1)}
            disabled={cargando || valor <= 0}
          >
            <Text style={styles.contadorTexto}>-</Text>
          </TouchableOpacity>
          <View style={styles.contadorValor}>
            <Text style={styles.contadorTextoValor}>{valor}</Text>
          </View>
          <TouchableOpacity
            style={[styles.contadorBoton, valor >= 30 && styles.contadorBotonDeshabilitado]}
            onPress={() => valor < 30 && onCambio(valor + 1)}
            disabled={cargando || valor >= 30}
          >
            <Text style={styles.contadorTexto}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.labelSecundario}>Edad en años (0 si es cachorro)</Text>
      </>
    );
  };

  // Componente para botón principal
  const BotonPrincipal = ({ titulo, onPress, disabled, mostrarIndicador }) => {
    return (
      <TouchableOpacity 
        style={[styles.boton, disabled && styles.botonDeshabilitado]} 
        onPress={onPress}
        disabled={disabled}
      >
        {mostrarIndicador ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.botonTexto}>{titulo}</Text>
        )}
      </TouchableOpacity>
    );
  };

  // Componente para botón secundario
  const BotonSecundario = ({ titulo, onPress, disabled }) => {
    return (
      <TouchableOpacity 
        style={[styles.boton, styles.botonSecundario, disabled && styles.botonDeshabilitado]} 
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={[styles.botonTextoSecundario, disabled && { color: '#FFD6EC' }]}>{titulo}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.formContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logoSmall} />
        <Text style={styles.titulo}>Registrar Animal</Text>

        <CampoFormulario
          label="Nombre *"
          placeholder="Nombre del animal"
          value={form.nombre}
          onChangeText={handleNombreChange}
          editable={!cargando}
        />

        <CampoFormulario
          label="Especie *"
          placeholder="Ej: Perro, Gato, Conejo, etc."
          value={form.especie}
          onChangeText={handleEspecieChange}
          editable={!cargando}
        />

        <CampoFormulario
          label="Raza"
          placeholder="Raza del animal (opcional)"
          value={form.raza}
          onChangeText={handleRazaChange}
          editable={!cargando}
        />

        <ContadorNumerico
          label="Edad"
          valor={form.edad}
          onCambio={value => handleChange('edad', value)}
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
          valor={form.tamaño}
          placeholder="Selecciona el tamaño"
          onPress={() => mostrarModal('tamaño')}
        />

        <CampoFormulario
          label="Descripción"
          placeholder="Descripción del animal"
          value={form.descripcion}
          onChangeText={handleDescripcionChange}
          multiline
          numberOfLines={4}
          style={styles.inputMultilinea}
          editable={!cargando}
        />

        <CampoFormulario
          label="Historial Médico"
          placeholder="Historial médico del animal"
          value={form.historial_medico}
          onChangeText={handleHistorialChange}
          multiline
          numberOfLines={3}
          style={styles.inputMultilinea}
          editable={!cargando}
        />

        <CampoFormulario
          label="Necesidades Especiales"
          placeholder="Descripción de necesidades especiales"
          value={form.necesidades}
          onChangeText={handleNecesidadesChange}
          multiline
          numberOfLines={3}
          style={styles.inputMultilinea}
          editable={!cargando}
        />

        {/* Checkbox mejorado para esterilización */}
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

        {/* Selector de imágenes */}
        <Text style={styles.label}>Fotos del Animal *</Text>
        <Text style={styles.labelSecundario}>(Mínimo 1 imagen requerida)</Text>
        
        <TouchableOpacity 
          style={styles.imagePicker} 
          onPress={seleccionarImagen}
          disabled={cargando}
        >
          <View style={styles.placeholderContainer}>
            <Text style={styles.textoSubir}>📷 Seleccionar Imágenes</Text>
            <Text style={styles.textoSubirSecundario}>
              {imagenes.length > 0 
                ? `${imagenes.length} imagen(es) seleccionada(s)` 
                : 'Toca para seleccionar fotos del animal'
              }
            </Text>
          </View>
        </TouchableOpacity>

        {/* Lista de imágenes seleccionadas */}
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
            <TouchableOpacity
              onPress={seleccionarImagen}
              style={styles.agregarImagenBoton}
              disabled={cargando}
            >
              <Text style={styles.agregarImagenTexto}>+</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Botones */}
        <BotonPrincipal
          titulo={cargando ? "Registrando..." : "Registrar Animal"}
          onPress={handleSubmit}
          disabled={cargando}
          mostrarIndicador={cargando}
        />
        
        <BotonSecundario
          titulo="Regresar"
          onPress={() => router.push('/refugio')}
          disabled={cargando}
        />
      </View>

      {/* Modal para seleccionar opciones */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={cerrarModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitulo}>
              Seleccionar {modalType === 'tamaño' ? 'Tamaño' : 'Sexo'}
            </Text>
            
            <ScrollView style={styles.modalScroll}>
              {(modalType === 'tamaño' ? tamaños : sexos).map((opcion, index) => (
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
  );
}

const styles = StyleSheet.create({
  // ScrollView y formularios
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#A4645E',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    justifyContent: 'center',
  },

  // Logo pequeño
  logoSmall: {
    width: 80,
    height: 80,
    borderRadius: 40,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 10,
  },

  // Título
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#ffffff',
  },

  // Labels y inputs
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
  inputMultilinea: {
    height: 80,
    textAlignVertical: 'top',
  },

  // Estilos para selectores
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

  // Contador numérico
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

  // Esterilización
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

  // Botones
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
    backgroundColor: '#FFD6EC',
    borderWidth: 2,
    borderColor: '#FFD6EC',
    marginTop: 0,
  },
  botonTextoSecundario: {
    color: '#900B09',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Selector de imagen
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

  // Container para scroll horizontal de imágenes
  imagenesScrollContainer: {
    marginVertical: 15,
  },

  // Estilo para cada imagen seleccionada
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

  // Botón para eliminar imagen
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

  // Botón para agregar más imágenes
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

  // Estilos del modal
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