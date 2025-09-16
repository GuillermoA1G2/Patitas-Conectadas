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
import { useLocalSearchParams, useNavigation } from 'expo-router'; // Importar useNavigation

// ==========================================
// BACKEND SECTION
// ==========================================

// Configuración de la API
const API_CONFIG = {
  BASE_URL: 'http://192.168.1.119:3000',
  ENDPOINTS: {
    REFUGIOS: '/api/refugios',
    DONACIONES_INSUMOS: '/api/donaciones/insumos',
    // TEST_CONNECTION: '/' // Eliminado: Ya no se necesita
  }
};

// Servicios de Backend para donaciones de insumos
class DonacionesBackendService {

  // Configuración de axios para debugging
  static configurarDebugging() {
    console.log('🔧 Configurando servicios de donaciones...');
    console.log('🌐 URL Base:', API_CONFIG.BASE_URL);
  }

  // Obtener lista de refugios disponibles
  static async obtenerRefugios() {
    try {
      console.log('📡 Obteniendo refugios del servidor...');

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFUGIOS}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000
      });

      const resultado = await response.json();
      console.log('📊 Respuesta refugios:', resultado);

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
      console.error('❌ Error al obtener refugios:', error);
      return {
        success: false,
        data: [],
        mensaje: 'No se pudo conectar con el servidor. Verifica:\n• Tu conexión a internet\n• Que el servidor esté ejecutándose\n• La dirección IP del servidor'
      };
    }
  }

  // Registrar donación de insumos
  static async registrarDonacionInsumos(datosDonacion) {
    try {
      console.log('📤 Enviando donación de insumos al servidor...');
      console.log('📋 Datos a enviar:', datosDonacion);

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DONACIONES_INSUMOS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosDonacion),
        timeout: 15000
      });

      const resultado = await response.json();
      console.log('📊 Respuesta donación:', resultado);

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
      console.error('❌ Error al registrar donación:', error);
      return {
        success: false,
        data: null,
        mensaje: 'No se pudo conectar con el servidor. Verifica la conexión.'
      };
    }
  }

  // Test de conexión con el servidor (Eliminado: Ya no se necesita)
  // static async probarConexion() { ... }

  // Procesamiento de respuestas de donación
  static procesarRespuestaDonacion(response) {
    if (!response || !response.data) {
      throw new Error('Respuesta del servidor incompleta.');
    }

    return {
      donacionId: response.data.donacion?.id || response.data.id,
      mensaje: response.mensaje || 'Donación registrada correctamente',
      datosCompletos: response.data
    };
  }

  // Manejo de errores específicos
  static manejarErrorDonacion(error) {
    console.log('Error details:', error);

    if (error.response) {
      const mensajes = {
        400: 'Datos inválidos. Verifica que hayas completado todos los campos obligatorios.',
        404: 'Usuario o refugio no encontrado. Verifica los datos.',
        409: 'Ya existe una donación similar pendiente.',
        500: 'Error interno del servidor. Intenta más tarde.'
      };

      return mensajes[error.response.status] ||
             error.response.data?.message ||
             'Error desconocido del servidor.';
    } else if (error.request) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    } else {
      return error.message || 'Ocurrió un error inesperado.';
    }
  }
}

// Validadores de donación
class ValidadoresDonacion {

  static validarParametrosUsuario(params) {
    console.log('🔍 Validando parámetros de usuario:', params);

    // Verificar diferentes formas de recibir el ID de usuario
    const posiblesIds = [
      params?.usuarioId,
      params?.idUsuario,
      params?.id,
      params?.userId,
      params?.user?.id, // Añadido para compatibilidad con objetos de usuario anidados
      params?.user?.idUsuario,
      params?.user?._id,
      params?.usuario?._id, // Añadido para compatibilidad con objetos de usuario anidados
      params?.usuario?.id,
      params?.usuario?.idUsuario,
    ];

    const idUsuario = posiblesIds.find(id => id && id.toString().length > 0);

    if (!idUsuario) {
      return {
        valido: false,
        mensaje: 'No se pudo identificar el usuario. Parámetros recibidos: ' + JSON.stringify(params),
        idUsuario: null
      };
    }

    console.log('✅ ID de usuario identificado:', idUsuario);
    return {
      valido: true,
      idUsuario: idUsuario,
      mensaje: 'Usuario identificado correctamente'
    };
  }

  static validarFormularioDonacion(datos) {
    const { nombre, cantidad, refugioSeleccionado } = datos;

    // Campos obligatorios
    if (!nombre || !cantidad || !refugioSeleccionado) {
      return {
        valido: false,
        mensaje: 'Por favor completa todos los campos obligatorios:\n• Nombre del insumo\n• Cantidad\n• Refugio destinatario'
      };
    }

    // Validar longitudes mínimas
    if (nombre.trim().length < 2) {
      return {
        valido: false,
        mensaje: 'El nombre del insumo debe tener al menos 2 caracteres'
      };
    }

    // Validar cantidad
    const cantidadNumerica = parseInt(cantidad);
    if (isNaN(cantidadNumerica) || cantidadNumerica <= 0) {
      return {
        valido: false,
        mensaje: 'La cantidad debe ser un número mayor a 0'
      };
    }

    if (cantidadNumerica > 10000) {
      return {
        valido: false,
        mensaje: 'La cantidad no puede ser mayor a 10,000 unidades'
      };
    }

    return { valido: true };
  }

  static validarDatosCompletos(formData, idUsuario) {
    // Validar usuario
    if (!idUsuario) {
      return {
        valido: false,
        mensaje: 'No se pudo identificar el usuario. Por favor inicia sesión nuevamente.'
      };
    }

    // Validar formulario
    const validacionForm = this.validarFormularioDonacion(formData);
    if (!validacionForm.valido) {
      return validacionForm;
    }

    return { valido: true };
  }
}

// ==========================================
// FRONTEND SECTION
// ==========================================

// Componente para mostrar información del refugio seleccionado
const InfoRefugioSeleccionado = ({ refugios, refugioId }) => {
  const refugio = refugios.find(r => r.idAsociacion === refugioId);

  if (!refugio) return null;

  return (
    <View style={styles.refugioInfo}>
      <Text style={styles.refugioInfoTitulo}>📍 Información del Refugio:</Text>
      <Text style={styles.refugioInfoTexto}>
        <Text style={styles.refugioInfoLabel}>Nombre: </Text>
        {refugio.nombre}
      </Text>
      {refugio.descripcion && (
        <Text style={styles.refugioInfoTexto}>
          <Text style={styles.refugioInfoLabel}>Descripción: </Text>
          {refugio.descripcion}
        </Text>
      )}
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
};

// Componente para campo de formulario
const CampoFormulario = ({ label, style, ...props }) => (
  <>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, style]}
      {...props}
    />
  </>
);

// Componente para botón principal
const BotonPrincipal = ({ titulo, onPress, disabled, mostrarIndicador }) => (
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

// Componente para botón secundario
const BotonSecundario = ({ titulo, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.boton, styles.botonSecundario, disabled && styles.botonDeshabilitado]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[styles.botonTextoSecundario, disabled && { color: '#cccccc' }]}>{titulo}</Text>
  </TouchableOpacity>
);

// Componente para selector de refugios
const SelectorRefugios = ({ refugios, refugioSeleccionado, onSeleccionar, cargando, cargandoRefugios }) => (
  <>
    <Text style={styles.label}>Refugio Destinatario *</Text>
    {cargandoRefugios ? (
      <View style={styles.cargandoContainer}>
        <ActivityIndicator color="#0066ff" />
        <Text style={styles.textoCargando}>Cargando refugios...</Text>
      </View>
    ) : (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={refugioSeleccionado}
          onValueChange={onSeleccionar}
          style={styles.picker}
          enabled={!cargando}
        >
          <Picker.Item label="Selecciona un refugio..." value="" />
          {refugios.map((refugio) => (
            <Picker.Item
              key={refugio.idAsociacion}
              label={`${refugio.nombre}${refugio.ciudad ? ` - ${refugio.ciudad}` : ''}`}
              value={refugio.idAsociacion}
            />
          ))}
        </Picker>
      </View>
    )}
  </>
);

// Componente para información de depuración (solo en desarrollo)
const InfoDepuracion = ({ idUsuario }) => {
  // Solo mostrar en desarrollo
  if (__DEV__) {
    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugTexto}>
          🔧 DEBUG: Usuario ID: {idUsuario || 'No identificado'}
        </Text>
      </View>
    );
  }
  return null;
};

// ==========================================
// MAIN COMPONENT (FRONTEND CONTROLLER)
// ==========================================

export default function FormularioDonacionesAso({ route }) {
  const navigation = useNavigation(); // Usar useNavigation para la navegación
  const searchParams = useLocalSearchParams(); // Para Expo Router
  const routeParams = route?.params || {}; // Para React Navigation

  // Combinar parámetros de ambas fuentes
  const todosLosParams = { ...routeParams, ...searchParams };

  console.log('📋 Parámetros recibidos en Donaciones.js:', todosLosParams);

  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    cantidad: '',
    refugioSeleccionado: '',
  });

  const [refugios, setRefugios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoRefugios, setCargandoRefugios] = useState(true);
  const [idUsuario, setIdUsuario] = useState(null);
  const [conexionExitosa, setConexionExitosa] = useState(false); // Nuevo estado para la conexión

  // Inicializar componente
  useEffect(() => {
    inicializarFormulario();
  }, []);

  const inicializarFormulario = async () => {
    console.log('🚀 Inicializando formulario de donaciones...');

    // Configurar servicios
    DonacionesBackendService.configurarDebugging();

    // Validar y extraer ID de usuario
    const validacionUsuario = ValidadoresDonacion.validarParametrosUsuario(todosLosParams);

    if (validacionUsuario.valido) {
      setIdUsuario(validacionUsuario.idUsuario);
      console.log('✅ Usuario configurado:', validacionUsuario.idUsuario);
    } else {
      console.error('❌ Error de usuario:', validacionUsuario.mensaje);
      Alert.alert(
        'Error de Usuario',
        validacionUsuario.mensaje + '\n\nPor favor, asegúrate de haber iniciado sesión correctamente.',
        [
          {
            text: 'Volver al Perfil',
            onPress: () => {
              // Intentar regresar al perfil, pasando el ID de usuario si está disponible
              navigation.navigate('PerfilUsuario', { idUsuario: validacionUsuario.idUsuario });
            }
          }
        ]
      );
      return;
    }

    // Cargar refugios
    await cargarRefugios();
  };

  const cargarRefugios = async () => {
    setCargandoRefugios(true);
    const resultado = await DonacionesBackendService.obtenerRefugios();

    if (resultado.success) {
      setRefugios(resultado.data);
      setConexionExitosa(true); // La conexión fue exitosa si se cargaron los refugios
      console.log('✅ Refugios cargados:', resultado.data.length);
    } else {
      console.error('❌ Error al cargar refugios:', resultado.mensaje);
      Alert.alert('Error', 'No se pudieron cargar los refugios: ' + resultado.mensaje);
      setRefugios([]);
      setConexionExitosa(false); // La conexión falló
    }

    setCargandoRefugios(false);
  };

  // Función para actualizar datos del formulario
  const actualizarCampo = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  // Función para registrar donación
  const registrarDonacion = async () => {
    console.log('🎯 Iniciando registro de donación...');

    // Validación completa
    const validacionCompleta = ValidadoresDonacion.validarDatosCompletos(formData, idUsuario);
    if (!validacionCompleta.valido) {
      Alert.alert('Error de Validación', validacionCompleta.mensaje);
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

      console.log('📤 Enviando datos al servidor:', datosParaServidor);

      // Llamada al Backend
      const resultado = await DonacionesBackendService.registrarDonacionInsumos(datosParaServidor);

      if (resultado.success) {
        const refugioNombre = refugios.find(r => r.idAsociacion === formData.refugioSeleccionado)?.nombre || 'el refugio seleccionado';

        Alert.alert(
          'Donación Registrada ✅',
          `¡Gracias por tu donación de ${formData.nombre}!\n\n${refugioNombre} será notificado y se pondrá en contacto contigo para coordinar la entrega.`,
          [
            {
              text: 'OK',
              onPress: () => {
                limpiarFormulario();
                // Regresar a la pantalla PerfilUsuario.js después de una donación exitosa
                navigation.navigate('PerfilUsuario', { idUsuario: idUsuario });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error de Registro', resultado.mensaje);
      }
    } catch (error) {
      console.error('💥 Error inesperado:', error);
      const mensajeError = DonacionesBackendService.manejarErrorDonacion(error);
      Alert.alert('Error', mensajeError);
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

  // Función para regresar a PerfilUsuario.js
  const regresar = () => {
    console.log('↩️ Regresando a PerfilUsuario.js con ID:', idUsuario);
    navigation.navigate('PerfilUsuario', { idUsuario: idUsuario });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.formContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logoSmall} />
        <Text style={styles.titulo}>Donación de Insumos</Text>
        <Text style={styles.subtitulo}>Ayuda a los refugios con los insumos que necesitan</Text>

        {/* Información de depuración */}
        <InfoDepuracion idUsuario={idUsuario} />

        {/* Indicador de conexión */}
        <View style={styles.estadoContainer}>
          <View style={[styles.conexionIndicator, { backgroundColor: conexionExitosa ? '#4CAF50' : '#f44336' }]}>
            <Text style={styles.conexionTexto}>
              {conexionExitosa ? '✅ Conectado al servidor' : '❌ Sin conexión al servidor'}
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
        <SelectorRefugios
          refugios={refugios}
          refugioSeleccionado={formData.refugioSeleccionado}
          onSeleccionar={(valor) => actualizarCampo('refugioSeleccionado', valor)}
          cargando={cargando}
          cargandoRefugios={cargandoRefugios}
        />

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
          disabled={cargando || cargandoRefugios || !conexionExitosa || !idUsuario}
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

// ==========================================
// STYLES
// ==========================================

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
    marginBottom: 10,
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

  // Debug container (solo desarrollo)
  debugContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  debugTexto: {
    color: '#00ff00',
    fontSize: 11,
    fontFamily: 'monospace',
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