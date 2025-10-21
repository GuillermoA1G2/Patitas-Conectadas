import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router'; // Importar useRouter y useLocalSearchParams

// Configuración de la API
const API_CONFIG = {
  BASE_URL: 'http://192.168.1.119:3000',
  //BASE_URL: 'https://patitas-conectadas-dlpdjaiwf-patitas-conectadas-projects.vercel.app/api',
  ENDPOINTS: {
    SOLICITUDES_DONACIONES: '/api/solicitudes-donaciones' // Nuevo endpoint para solicitudes de donación
  }
};

// Servicios de Backend para solicitudes de donaciones
class BackendServices {

  // Registrar solicitud de donación
  static async registrarSolicitudDonacion(datosSolicitud) {
    try {
      console.log('Enviando solicitud de donación al servidor...');

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SOLICITUDES_DONACIONES}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosSolicitud),
      });

      const resultado = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: resultado,
          mensaje: resultado.message || 'Solicitud de donación registrada correctamente'
        };
      } else {
        return {
          success: false,
          data: null,
          mensaje: resultado.message || 'Error al registrar solicitud de donación'
        };
      }
    } catch (error) {
      console.error('Error al registrar solicitud de donación:', error);
      return {
        success: false,
        data: null,
        mensaje: 'No se pudo conectar con el servidor'
      };
    }
  }
}

// Validadores
class ValidadoresDonacion {

  static validarFormularioSolicitud(datos) {
    const { nombre, descripcion, cantidad, nivelUrgencia } = datos;

    // Campos obligatorios
    if (!nombre || !cantidad || !nivelUrgencia) {
      return { valido: false, mensaje: 'Por favor completa todos los campos obligatorios' };
    }

    // Validar longitudes mínimas
    if (nombre.trim().length < 2) {
      return { valido: false, mensaje: 'El nombre del insumo debe tener al menos 2 caracteres' };
    }

    // Validar cantidad
    const cantidadNumerica = parseInt(cantidad);
    if (isNaN(cantidadNumerica) || cantidadNumerica <= 0) {
      return { valido: false, mensaje: 'La cantidad debe ser un número mayor a 0' };
    }

    // Validar descripción si se proporciona
    if (descripcion && descripcion.trim().length < 5) {
      return { valido: false, mensaje: 'La descripción debe tener al menos 5 caracteres' };
    }

    return { valido: true };
  }
}

// Componente principal
export default function FormularioDonacionesAso() {
  const router = useRouter();
  const { refugioId, refugioNombre, refugioEmail, refugioTelefono, usuarioTipo } = useLocalSearchParams();

  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    cantidad: '',
    nivelUrgencia: '', // Nuevo campo para el nivel de urgencia
  });

  const [cargando, setCargando] = useState(false);

  // Inicializar componente
  useEffect(() => {
    // No se necesita cargar refugios ni probar conexión aquí
    // El refugioId ya viene de los parámetros
  }, []);

  // Función para actualizar datos del formulario
  const actualizarCampo = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  // Función para registrar solicitud de donación
  const registrarSolicitud = async () => {
    // Validación en Frontend
    const validacion = ValidadoresDonacion.validarFormularioSolicitud(formData);
    if (!validacion.valido) {
      Alert.alert('Error de Validación', validacion.mensaje);
      return;
    }

    // Verificar que tenemos un ID de refugio
    if (!refugioId) {
      Alert.alert('Error', 'No se pudo identificar el refugio. Por favor, regresa e intenta de nuevo.');
      return;
    }

    setCargando(true);

    try {
      // Preparar datos para el servidor según el esquema de MongoDB
      const datosParaServidor = {
        id_refugio: refugioId,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || formData.nombre.trim(),
        cantidad: parseInt(formData.cantidad),
        nivel_urgencia: formData.nivelUrgencia, // Incluir nivel de urgencia
      };

      // Llamada al Backend
      const resultado = await BackendServices.registrarSolicitudDonacion(datosParaServidor);

      if (resultado.success) {
        Alert.alert(
          'Solicitud Registrada',
          `¡Tu solicitud de donación para "${formData.nombre}" con urgencia ${formData.nivelUrgencia} ha sido registrada!`,
          [
            {
              text: 'OK',
              onPress: () => {
                limpiarFormulario();
                regresar(); // Regresar a la pantalla del refugio
              }
            }
          ]
        );
      } else {
        Alert.alert('Error de Registro', resultado.mensaje);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado. Por favor intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  // Función para limpiar formulario
  const limpiarFormulario = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      cantidad: '',
      nivelUrgencia: '',
    });
  };

  // Función para regresar a la pantalla del refugio
  const regresar = () => {
    router.push({
      pathname: '/refugio',
      params: {
        refugioId: refugioId,
        refugioNombre: refugioNombre,
        refugioEmail: refugioEmail,
        refugioTelefono: refugioTelefono,
        usuarioTipo: usuarioTipo
      }
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.formContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logoSmall} />
        <Text style={styles.titulo}>Solicitud de Donaciones</Text>
        <Text style={styles.subtitulo}>Pide los insumos que tu refugio necesita</Text>

        {/* Campo: Nombre del insumo */}
        <CampoFormulario
          label="Nombre del Insumo *"
          placeholder="Ej: Comida, Medicamentos, Mantas..."
          value={formData.nombre}
          onChangeText={(valor) => actualizarCampo('nombre', valor)}
          editable={!cargando}
        />

        {/* Campo: Descripción */}
        <CampoFormulario
          label="Descripción (Opcional)"
          placeholder="Describe el insumo en detalle..."
          value={formData.descripcion}
          onChangeText={(valor) => actualizarCampo('descripcion', valor)}
          multiline
          numberOfLines={3}
          style={styles.inputMultilinea}
          editable={!cargando}
        />

        {/* Campo: Cantidad */}
        <CampoFormulario
          label="Cantidad *"
          placeholder="Número de unidades solicitadas"
          value={formData.cantidad}
          onChangeText={(valor) => actualizarCampo('cantidad', valor)}
          keyboardType="numeric"
          editable={!cargando}
        />

        {/* Selector de Nivel de Urgencia */}
        <Text style={styles.label}>Nivel de Urgencia *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.nivelUrgencia}
            onValueChange={(itemValue) => actualizarCampo('nivelUrgencia', itemValue)}
            style={styles.picker}
            enabled={!cargando}
          >
            <Picker.Item label="Selecciona la urgencia..." value="" />
            <Picker.Item label="Alta" value="Alta" />
            <Picker.Item label="Media" value="Media" />
            <Picker.Item label="Baja" value="Baja" />
          </Picker>
        </View>

        {/* Botones */}
        <BotonPrincipal
          titulo={cargando ? "Registrando Solicitud..." : "Registrar Solicitud"}
          onPress={registrarSolicitud}
          disabled={cargando}
          mostrarIndicador={cargando}
        />

        <BotonSecundario
          titulo="Regresar"
          onPress={regresar}
          disabled={cargando}
        />

        {/* Información adicional */}
        <Text style={styles.infoAdicional}>
          * Las solicitudes de donación serán visibles para los usuarios que deseen ayudar.
        </Text>
      </View>
    </ScrollView>
  );
}

// Componente para campo de formulario (reutilizado de registro_usuarios.js)
function CampoFormulario({ label, style, ...props }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, style]}
        {...props}
      />
    </>
  );
}

// Componente para botón principal (reutilizado de registro_usuarios.js)
function BotonPrincipal({ titulo, onPress, disabled, mostrarIndicador }) {
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
}

// Componente para botón secundario (reutilizado de registro_usuarios.js)
function BotonSecundario({ titulo, onPress, disabled }) {
  return (
    <TouchableOpacity
      style={[styles.boton, styles.botonSecundario, disabled && styles.botonDeshabilitado]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.botonTextoSecundario, disabled && { color: '#900B09' }]}>{titulo}</Text>
    </TouchableOpacity>
  );
}

// Estilos (basados en registro_usuarios.js)
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

  // Logo y títulos
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
    marginBottom: 10,
    textAlign: 'center',
    color: '#ffffff',
  },
  subtitulo: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#ffffff',
    opacity: 0.9,
  },

  // Labels y inputs
  label: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    marginTop: 10,
    color: '#ffffff',
    fontWeight: '500',
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

  // Picker de urgencia
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  picker: {
    height: 50,
    width: '100%',
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
    backgroundColor: 'transparent', // Fondo transparente para el botón secundario
    borderWidth: 2,
    borderColor: '#FFD6EC',
    marginTop: 0,
  },
  botonTextoSecundario: {
    color: '#FFD6EC', // Color del texto para el botón secundario
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Información adicional
  infoAdicional: {
    fontSize: 12,
    textAlign: 'center',
    color: '#ffffff',
    marginTop: 20,
    paddingHorizontal: 10,
    lineHeight: 18,
    opacity: 0.9,
  },
});