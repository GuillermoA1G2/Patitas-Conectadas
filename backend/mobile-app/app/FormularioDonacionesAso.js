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

// Configuración de la API (igual que en registro_usuarios.js)
const API_CONFIG = {
  BASE_URL: 'http://172.20.10.5:3000',
  ENDPOINTS: {
    REFUGIOS: '/api/refugios',
    DONACIONES_INSUMOS: '/api/donaciones/insumos'
  }
};

// Servicios de Backend para donaciones de insumos
class BackendServices {
  
  // Obtener lista de refugios disponibles
  static async obtenerRefugios() {
    try {
      console.log('Obteniendo refugios del servidor...');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFUGIOS}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const resultado = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: resultado.refugios || [],
          mensaje: 'Refugios obtenidos correctamente'
        };
      } else {
        return {
          success: false,
          data: [],
          mensaje: resultado.message || 'Error al obtener refugios'
        };
      }
    } catch (error) {
      console.error('Error al obtener refugios:', error);
      return {
        success: false,
        data: [],
        mensaje: 'No se pudo conectar con el servidor'
      };
    }
  }

  // Registrar donación de insumos
  static async registrarDonacionInsumos(datosDonacion) {
    try {
      console.log('Enviando donación de insumos al servidor...');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DONACIONES_INSUMOS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosDonacion),
      });

      const resultado = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: resultado,
          mensaje: resultado.message || 'Donación registrada correctamente'
        };
      } else {
        return {
          success: false,
          data: null,
          mensaje: resultado.message || 'Error al registrar donación'
        };
      }
    } catch (error) {
      console.error('Error al registrar donación:', error);
      return {
        success: false,
        data: null,
        mensaje: 'No se pudo conectar con el servidor'
      };
    }
  }

  // Test de conexión con el servidor
  static async testConexion() {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, mensaje: `Servidor responde con error: ${response.status}` };
      }
    } catch (error) {
      return { success: false, mensaje: 'No se puede conectar al servidor' };
    }
  }
}

// Validadores
class ValidadoresDonacion {
  
  static validarFormularioDonacion(datos) {
    const { nombre, descripcion, cantidad, refugioSeleccionado } = datos;
    
    // Campos obligatorios
    if (!nombre || !cantidad || !refugioSeleccionado) {
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
export default function FormularioDonacionesAso({ navigation, route }) {
  // Estados del formulario (similar a registro_usuarios.js)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    cantidad: '',
    refugioSeleccionado: '',
  });
  
  const [refugios, setRefugios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoRefugios, setCargandoRefugios] = useState(true);
  const [conexionProbada, setConexionProbada] = useState(false);

  // Obtener ID de usuario desde los parámetros de navegación o contexto global
  const [idUsuario, setIdUsuario] = useState(route?.params?.idUsuario || null);

  // Inicializar componente
  useEffect(() => {
    inicializarFormulario();
  }, []);

  const inicializarFormulario = async () => {
    // Probar conexión
    await probarConexion();
    
    // Obtener refugios
    await cargarRefugios();
  };

  const probarConexion = async () => {
    const resultado = await BackendServices.testConexion();
    setConexionProbada(resultado.success);
    
    if (!resultado.success) {
      Alert.alert(
        'Problema de Conexión',
        'No se puede conectar al servidor. Verifica que esté corriendo.\n\nIP actual: ' + API_CONFIG.BASE_URL,
        [{ text: 'OK' }]
      );
    }
  };

  const cargarRefugios = async () => {
    setCargandoRefugios(true);
    const resultado = await BackendServices.obtenerRefugios();
    
    if (resultado.success) {
      setRefugios(resultado.data);
    } else {
      Alert.alert('Error', 'No se pudieron cargar los refugios: ' + resultado.mensaje);
      setRefugios([]);
    }
    
    setCargandoRefugios(false);
  };

  // Función para actualizar datos del formulario
  const actualizarCampo = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  // Función para registrar donación
  const registrarDonacion = async () => {
    // Validación en Frontend
    const validacion = ValidadoresDonacion.validarFormularioDonacion(formData);
    if (!validacion.valido) {
      Alert.alert('Error de Validación', validacion.mensaje);
      return;
    }

    // Verificar que tenemos un ID de usuario
    if (!idUsuario) {
      Alert.alert('Error', 'No se pudo identificar el usuario. Por favor inicia sesión nuevamente.');
      return;
    }

    setCargando(true);

    try {
      // Preparar datos para el servidor según el esquema de MongoDB
      const datosParaServidor = {
        idUsuarioDonante: idUsuario,
        id_refugio: formData.refugioSeleccionado,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || formData.nombre.trim(),
        cantidad: parseInt(formData.cantidad),
      };

      // Llamada al Backend
      const resultado = await BackendServices.registrarDonacionInsumos(datosParaServidor);

      if (resultado.success) {
        Alert.alert(
          'Donación Registrada', 
          `¡Gracias por tu donación de ${formData.nombre}! El refugio será notificado de tu donación.`, 
          [
            {
              text: 'OK',
              onPress: () => {
                limpiarFormulario();
                if (navigation && navigation.goBack) {
                  navigation.goBack();
                }
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
      refugioSeleccionado: '',
    });
  };

  // Función para regresar
  const regresar = () => {
    if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.formContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logoSmall} />
        <Text style={styles.titulo}>Donación de Insumos</Text>
        <Text style={styles.subtitulo}>Ayuda a los refugios con los insumos que necesitan</Text>

        {/* Indicador de conexión */}
        <View style={styles.estadoContainer}>
          <View style={[styles.conexionIndicator, { backgroundColor: conexionProbada ? '#4CAF50' : '#f44336' }]}>
            <Text style={styles.conexionTexto}>
              {conexionProbada ? '✓ Conectado al servidor' : '✗ Sin conexión al servidor'}
            </Text>
          </View>
        </View>

        {/* Campo: Nombre del insumo */}
        <CampoFormulario
          label="Nombre del Insumo *"
          placeholder="Ej: Comida para perros, Medicamentos, Mantas..."
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
          placeholder="Número de unidades a donar"
          value={formData.cantidad}
          onChangeText={(valor) => actualizarCampo('cantidad', valor)}
          keyboardType="numeric"
          editable={!cargando}
        />

        {/* Selector de refugio */}
        <Text style={styles.label}>Refugio Destinatario *</Text>
        {cargandoRefugios ? (
          <View style={styles.cargandoContainer}>
            <ActivityIndicator color="#0066ff" />
            <Text style={styles.textoCargando}>Cargando refugios...</Text>
          </View>
        ) : (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.refugioSeleccionado}
              onValueChange={(itemValue) => actualizarCampo('refugioSeleccionado', itemValue)}
              style={styles.picker}
              enabled={!cargando}
            >
              <Picker.Item label="Selecciona un refugio..." value="" />
              {refugios.map((refugio) => (
                <Picker.Item 
                  key={refugio.idAsociacion} 
                  label={`${refugio.nombre} - ${refugio.ciudad || 'Sin ciudad'}`} 
                  value={refugio.idAsociacion} 
                />
              ))}
            </Picker>
          </View>
        )}

        {/* Información del refugio seleccionado */}
        {formData.refugioSeleccionado && (
          <InfoRefugioSeleccionado 
            refugios={refugios} 
            refugioId={formData.refugioSeleccionado} 
          />
        )}

        {/* Botones */}
        <BotonPrincipal
          titulo={cargando ? "Registrando Donación..." : "Registrar Donación"}
          onPress={registrarDonacion}
          disabled={cargando || cargandoRefugios || !conexionProbada}
          mostrarIndicador={cargando}
        />
        
        <BotonSecundario
          titulo="Regresar"
          onPress={regresar}
          disabled={cargando}
        />

        {/* Información adicional */}
        <Text style={styles.infoAdicional}>
          * Una vez registrada la donación, el refugio se pondrá en contacto contigo para coordinar la entrega.
        </Text>
      </View>
    </ScrollView>
  );
}

// Componente para mostrar información del refugio seleccionado
function InfoRefugioSeleccionado({ refugios, refugioId }) {
  const refugio = refugios.find(r => r.idAsociacion === refugioId);
  
  if (!refugio) return null;

  return (
    <View style={styles.refugioInfo}>
      <Text style={styles.refugioInfoTitulo}>📍 Información del Refugio:</Text>
      <Text style={styles.refugioInfoTexto}>
        <Text style={styles.refugioInfoLabel}>Nombre: </Text>
        {refugio.nombre}
      </Text>
      {refugio.direccion && (
        <Text style={styles.refugioInfoTexto}>
          <Text style={styles.refugioInfoLabel}>Dirección: </Text>
          {refugio.direccion}
        </Text>
      )}
      {refugio.telefono && (
        <Text style={styles.refugioInfoTexto}>
          <Text style={styles.refugioInfoLabel}>Teléfono: </Text>
          {refugio.telefono}
        </Text>
      )}
    </View>
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
      <Text style={[styles.botonTextoSecundario, disabled && { color: '#FFD6EC' }]}>{titulo}</Text>
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
  
  // Container para indicadores de estado
  estadoContainer: {
    width: '100%',
    marginBottom: 20,
  },
  conexionIndicator: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  conexionTexto: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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
  
  // Picker de refugios
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
  
  // Indicador de carga
  cargandoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  textoCargando: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  
  // Información del refugio seleccionado
  refugioInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#0066ff',
  },
  refugioInfoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066ff',
    marginBottom: 8,
  },
  refugioInfoTexto: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },
  refugioInfoLabel: {
    fontWeight: '600',
    color: '#555',
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