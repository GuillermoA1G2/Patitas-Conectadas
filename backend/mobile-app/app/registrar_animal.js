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
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function RegistrarAnimal({ navigation }) {
  const [form, setForm] = useState({
    nombre: '',
    especie: '',
    raza: '',
    edad: '',
    sexo: '',
    tamaño: '',
    descripcion: '',
    historial_medico: '',
    necesidades: '',
    esterilizacion: false
  });
  const [imagenes, setImagenes] = useState([]);
  const [cargando, setCargando] = useState(false);

  const API_URL = 'http://192.168.1.119:3000/api';

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
    if (!resultado.canceled && resultado.assets && resultado.assets[0]) {
      setImagenes([...imagenes, resultado.assets[0]]);
    }
  };

  const eliminarImagen = (index) => {
    setImagenes(imagenes.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validar campos obligatorios mínimos
    if (
      !form.nombre.trim() ||
      !form.especie.trim() ||
      !form.sexo.trim()
    ) {
      Alert.alert('Error', 'Por favor llena los campos: Nombre, Especie y Sexo');
      return;
    }

    setCargando(true);
    try {
      // Preparar FormData para enviar incluyendo las imágenes
      const formData = new FormData();
      formData.append('nombre', form.nombre);
      formData.append('especie', form.especie);
      formData.append('raza', form.raza);
      formData.append('edad', form.edad);
      formData.append('sexo', form.sexo);
      formData.append('tamaño', form.tamaño);
      formData.append('descripcion', form.descripcion);
      formData.append('historial_medico', form.historial_medico);
      formData.append('necesidades', form.necesidades);
      formData.append('esterilizacion', form.esterilizacion ? 'true' : 'false');

      // Agregar cada imagen con campo 'fotos'
      if (imagenes.length === 0) {
        Alert.alert('Error', 'Selecciona al menos una imagen del animal');
        setCargando(false);
        return;
      }
      imagenes.forEach((img, index) => {
        formData.append('fotos', {
          uri: img.uri,
          type: 'image/jpeg',
          name: `foto-${index}.jpg`,
        });
      });

      // Aquí se debe sustituir '1' por el id real del refugio que está registrando
      const refugioId = '1';

      const response = await fetch(`${API_URL}/api/refugio/${refugioId}/animales`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const respJson = await response.json();
        throw new Error(respJson.message || 'Error al registrar el animal');
      }

      const result = await response.json();

      Alert.alert('Éxito', 'Animal registrado correctamente', [
        {
          text: 'OK',
          onPress: () => {
            // Limpiar formulario
            setForm({
              nombre: '',
              especie: '',
              raza: '',
              edad: '',
              sexo: '',
              tamaño: '',
              descripcion: '',
              historial_medico: '',
              necesidades: '',
              esterilizacion: false
            });
            setImagenes([]);
            if (navigation) {
              navigation.goBack();
            }
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  // Componente para campo de formulario (reutilizado del registro de usuarios)
  const CampoFormulario = ({ label, style, ...props }) => {
    return (
      <>
        <Text style={styles.label}>{label}</Text>
        <TextInput 
          style={[styles.input, style]} 
          {...props}
        />
      </>
    );
  };

  // Componente para botón principal (reutilizado del registro de usuarios)
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

  // Componente para botón secundario (reutilizado del registro de usuarios)
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
        {/* Logo pequeño como en registro de usuarios */}
        <Image source={require('../assets/logo.png')} style={styles.logoSmall} />
        <Text style={styles.titulo}>Registrar Animal</Text>

        <CampoFormulario
          label="Nombre *"
          placeholder="Nombre del animal"
          value={form.nombre}
          onChangeText={value => handleChange('nombre', value)}
          editable={!cargando}
        />

        <CampoFormulario
          label="Especie *"
          placeholder="Ej: Perro, Gato, etc."
          value={form.especie}
          onChangeText={value => handleChange('especie', value)}
          editable={!cargando}
        />

        <CampoFormulario
          label="Raza"
          placeholder="Raza del animal (opcional)"
          value={form.raza}
          onChangeText={value => handleChange('raza', value)}
          editable={!cargando}
        />

        <CampoFormulario
          label="Edad"
          placeholder="Edad aproximada"
          value={form.edad}
          onChangeText={value => handleChange('edad', value)}
          keyboardType="numeric"
          editable={!cargando}
        />

        <CampoFormulario
          label="Sexo *"
          placeholder="Macho/Hembra"
          value={form.sexo}
          onChangeText={value => handleChange('sexo', value)}
          editable={!cargando}
        />

        <CampoFormulario
          label="Tamaño"
          placeholder="Pequeño/Mediano/Grande"
          value={form.tamaño}
          onChangeText={value => handleChange('tamaño', value)}
          editable={!cargando}
        />

        <CampoFormulario
          label="Descripción"
          placeholder="Descripción del animal"
          value={form.descripcion}
          onChangeText={value => handleChange('descripcion', value)}
          multiline
          numberOfLines={4}
          style={styles.inputMultilinea}
          editable={!cargando}
        />

        <CampoFormulario
          label="Historial Médico"
          placeholder="Historial médico del animal"
          value={form.historial_medico}
          onChangeText={value => handleChange('historial_medico', value)}
          multiline
          numberOfLines={3}
          style={styles.inputMultilinea}
          editable={!cargando}
        />

        <CampoFormulario
          label="Necesidades"
          placeholder="Necesidades especiales"
          value={form.necesidades}
          onChangeText={value => handleChange('necesidades', value)}
          multiline
          numberOfLines={3}
          style={styles.inputMultilinea}
          editable={!cargando}
        />

        {/* Checkbox para esterilización con mejor estilo */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            onPress={() => handleChange('esterilizacion', !form.esterilizacion)}
            disabled={cargando}
            style={[styles.checkbox, form.esterilizacion && styles.checkboxChecked]}
          >
            {form.esterilizacion && (
              <Text style={styles.checkboxText}>✓</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>¿Está esterilizado?</Text>
        </View>

        {/* Selector de imágenes con estilo mejorado */}
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
          titulo="Cancelar"
          onPress={() => navigation && navigation.goBack()}
          disabled={cargando}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ScrollView y formularios (copiado de registro_usuarios.js)
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

  // Logo pequeño (copiado de registro_usuarios.js)
  logoSmall: {
    width: 80,
    height: 80,
    borderRadius: 40,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 10,
  },

  // Título (copiado de registro_usuarios.js)
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#ffffff',
  },

  // Labels y inputs (copiado de registro_usuarios.js)
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

  // Botones (copiado de registro_usuarios.js)
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

  // Checkbox personalizado (mejorado)
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: 'transparent',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  checkboxText: {
    color: '#900B09',
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkboxLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },

  // Selector de imagen (adaptado de registro_usuarios.js)
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
});