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
import { useLocalSearchParams, useNavigation } from 'expo-router';

// ==========================================
// BACKEND SECTION
// ==========================================

// Configuración de la API
const API_CONFIG = {
  //BASE_URL: 'http://192.168.1.119:3000',
  BASE_URL: 'https://patitas-conectadas-nine.vercel.app',
  ENDPOINTS: {
    REFUGIOS: '/api/refugios',
    DONACIONES_INSUMOS: '/api/donaciones/insumos',
    DONACIONES_MONETARIAS: '/api/donaciones/monetaria',
  }
};

// Servicios de Backend para donaciones
class DonacionesBackendService {

  static configurarDebugging() {
  }

  static async obtenerRefugios() {
    try {
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
      console.error('❌ Error al obtener refugios:', error);
      return {
        success: false,
        data: [],
        mensaje: 'No se pudo conectar con el servidor. Verifica:\n• Tu conexión a internet\n• Que el servidor esté ejecutándose\n• La dirección IP del servidor'
      };
    }
  }

  static async registrarDonacionInsumos(datosDonacion) {
    try {
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
      console.error('❌ Error al registrar donación:', error);
      return {
        success: false,
        data: null,
        mensaje: 'No se pudo conectar con el servidor. Verifica la conexión.'
      };
    }
  }

  static async registrarDonacionMonetaria(datosDonacion) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DONACIONES_MONETARIAS}`, {
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
          mensaje: resultado.message || 'Donación monetaria registrada correctamente'
        };
      } else {
        return {
          success: false,
          data: null,
          mensaje: resultado.message || 'Error al registrar donación monetaria'
        };
      }
    } catch (error) {
      console.error('❌ Error al registrar donación monetaria:', error);
      return {
        success: false,
        data: null,
        mensaje: 'No se pudo conectar con el servidor. Verifica la conexión.'
      };
    }
  }

  static manejarErrorDonacion(error) {
    console.log('Error details:', error);

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return 'No se pudo conectar con el servidor. Verifica tu conexión a internet y que el servidor esté ejecutándose.';
    } else if (error.message.includes('Network request failed')) {
      return 'Error de red. Verifica tu conexión a internet.';
    } else if (error.message.includes('timeout')) {
      return 'La solicitud tardó demasiado en responder. Inténtalo de nuevo.';
    } else if (error.message) {
      return error.message;
    } else {
      return 'Ocurrió un error inesperado.';
    }
  }
}

// Validadores de donación
class ValidadoresDonacion {

  static validarParametrosUsuario(params) {
    const posiblesIds = [
      params?.usuarioId,
      params?.idUsuario,
      params?.id,
      params?.userId,
      params?.user?.id,
      params?.user?.idUsuario,
      params?.user?._id,
      params?.usuario?._id,
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

    return {
      valido: true,
      idUsuario: idUsuario,
      mensaje: 'Usuario identificado correctamente'
    };
  }

  static validarFormularioDonacionInsumos(datos) {
    const { nombre, cantidad, refugioSeleccionado } = datos;

    if (!refugioSeleccionado) {
      return {
        valido: false,
        mensaje: 'Por favor selecciona un refugio destinatario'
      };
    }

    if (!nombre || !cantidad) {
      return {
        valido: false,
        mensaje: 'Por favor completa todos los campos obligatorios:\n• Nombre del insumo\n• Cantidad'
      };
    }

    if (nombre.trim().length < 2) {
      return {
        valido: false,
        mensaje: 'El nombre del insumo debe tener al menos 2 caracteres'
      };
    }

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

  static validarFormularioDonacionMonetaria(datos) {
    const { cantidad, refugioSeleccionado } = datos;

    if (!refugioSeleccionado) {
      return {
        valido: false,
        mensaje: 'Por favor selecciona un refugio destinatario'
      };
    }

    if (!cantidad) {
      return {
        valido: false,
        mensaje: 'Por favor ingresa el monto a donar'
      };
    }

    const cantidadNumerica = parseFloat(cantidad);
    if (isNaN(cantidadNumerica) || cantidadNumerica < 10) {
      return {
        valido: false,
        mensaje: 'El monto mínimo de donación es $10.00 MXN'
      };
    }

    if (cantidadNumerica > 100000) {
      return {
        valido: false,
        mensaje: 'El monto máximo de donación es $100,000.00 MXN'
      };
    }

    return { valido: true };
  }

  static validarDatosCompletos(formData, idUsuario, tipoDonacion) {
    if (!idUsuario) {
      return {
        valido: false,
        mensaje: 'No se pudo identificar el usuario. Por favor inicia sesión nuevamente.'
      };
    }

    if (tipoDonacion === 'insumos') {
      return this.validarFormularioDonacionInsumos(formData);
    } else {
      return this.validarFormularioDonacionMonetaria(formData);
    }
  }
}

// ==========================================
// FRONTEND COMPONENTS
// ==========================================

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

const CampoFormulario = ({ label, style, ...props }) => (
  <>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, style]}
      {...props}
    />
  </>
);

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

const BotonSecundario = ({ titulo, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.boton, styles.botonSecundario, disabled && styles.botonDeshabilitado]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[styles.botonTextoSecundario, disabled && { color: '#cccccc' }]}>{titulo}</Text>
  </TouchableOpacity>
);

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

// ==========================================
// PANTALLA DE SELECCIÓN DE TIPO DE DONACIÓN
// ==========================================

function PantallaSeleccionTipoDonacion({ onSeleccionTipo, onBack }) {
  return (
    <View style={styles.seleccionContainer}>
      <Image source={require('../assets/logo.png')} style={styles.logoSmall} />
      <Text style={styles.titulo}>¿Qué tipo de donación deseas hacer?</Text>
      <Text style={styles.descripcionTipo}>Selecciona el tipo de ayuda que quieres brindar</Text>

      <TouchableOpacity 
        style={[styles.botonTipo, styles.botonInsumos]} 
        onPress={() => onSeleccionTipo('insumos')}
      >
        <Text style={styles.iconoTipo}>📦</Text>
        <Text style={styles.tituloBotonTipo}>Donación de Insumos</Text>
        <Text style={styles.descripcionBotonTipo}>
          Dona alimentos, medicinas, mantas y más
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.botonTipo, styles.botonMonetaria]} 
        onPress={() => onSeleccionTipo('monetaria')}
      >
        <Text style={styles.iconoTipo}>💰</Text>
        <Text style={styles.tituloBotonTipo}>Donación Monetaria</Text>
        <Text style={styles.descripcionBotonTipo}>
          Realiza una aportación económica segura
        </Text>
      </TouchableOpacity>

      <BotonSecundario
        titulo="Regresar"
        onPress={onBack}
      />
    </View>
  );
}

// ==========================================
// FORMULARIO DE DONACIÓN DE INSUMOS
// ==========================================

function FormularioDonacionInsumos({ refugios, cargandoRefugios, idUsuario, onBack, navigation }) {
  const [formData, setFormData] = useState({
    refugioSeleccionado: '',
    nombre: '',
    descripcion: '',
    cantidad: '',
  });
  const [cargando, setCargando] = useState(false);

  const actualizarCampo = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const registrarDonacion = async () => {
    const validacionCompleta = ValidadoresDonacion.validarDatosCompletos(formData, idUsuario, 'insumos');
    if (!validacionCompleta.valido) {
      Alert.alert('Error de Validación', validacionCompleta.mensaje);
      return;
    }

    setCargando(true);

    try {
      const datosParaServidor = {
        idUsuarioDonante: idUsuario,
        id_refugio: formData.refugioSeleccionado,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || formData.nombre.trim(),
        cantidad: parseInt(formData.cantidad),
      };

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
                navigation.navigate('PerfilUsuario', { userId: idUsuario });
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

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.formContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logoSmall} />
        <Text style={styles.titulo}>Donación de Insumos</Text>
        <Text style={styles.subtitulo}>Ayuda a los refugios con los insumos que necesitan</Text>

        {/* REFUGIO AL INICIO */}
        <SelectorRefugios
          refugios={refugios}
          refugioSeleccionado={formData.refugioSeleccionado}
          onSeleccionar={(valor) => actualizarCampo('refugioSeleccionado', valor)}
          cargando={cargando}
          cargandoRefugios={cargandoRefugios}
        />

        {formData.refugioSeleccionado && (
          <InfoRefugioSeleccionado
            refugios={refugios}
            refugioId={formData.refugioSeleccionado}
          />
        )}

        <CampoFormulario
          label="Nombre del Insumo *"
          placeholder="Ej: Comida, Medicamentos, Mantas..."
          value={formData.nombre}
          onChangeText={(valor) => actualizarCampo('nombre', valor)}
          editable={!cargando}
        />

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

        <CampoFormulario
          label="Cantidad *"
          placeholder="Número de unidades a donar"
          value={formData.cantidad}
          onChangeText={(valor) => actualizarCampo('cantidad', valor)}
          keyboardType="numeric"
          editable={!cargando}
        />

        {/* TEXTO INFORMATIVO ANTES DEL BOTÓN */}
        <View style={styles.avisoEntrega}>
          <Text style={styles.avisoEntregaTexto}>
            ⚠️ Para la entrega de todas las donaciones de insumos se debe poner en contacto con el refugio para coordinar la entrega.
          </Text>
        </View>

        <BotonPrincipal
          titulo={cargando ? "Registrando Donación..." : "Registrar Donación"}
          onPress={registrarDonacion}
          disabled={cargando || cargandoRefugios || !idUsuario}
          mostrarIndicador={cargando}
        />

        <BotonSecundario
          titulo="Regresar"
          onPress={onBack}
          disabled={cargando}
        />
      </View>
    </ScrollView>
  );
}

// ==========================================
// FORMULARIO DE DONACIÓN MONETARIA
// ==========================================

function FormularioDonacionMonetaria({ refugios, cargandoRefugios, idUsuario, onBack, navigation }) {
  const [formData, setFormData] = useState({
    refugioSeleccionado: '',
    cantidad: '',
  });
  const [cargando, setCargando] = useState(false);

  const actualizarCampo = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const montosRapidos = [50, 100, 200, 500];

  const seleccionarMontoRapido = (monto) => {
    actualizarCampo('cantidad', monto.toString());
  };

  const procesarPagoStripe = async () => {
    const validacionCompleta = ValidadoresDonacion.validarDatosCompletos(formData, idUsuario, 'monetaria');
    if (!validacionCompleta.valido) {
      Alert.alert('Error de Validación', validacionCompleta.mensaje);
      return;
    }

    setCargando(true);

    try {
      // SIMULACIÓN DE STRIPE - En producción aquí integrarías Stripe
      Alert.alert(
        '💳 Procesando Pago',
        'Redirigiendo a pasarela de pago segura de Stripe...',
        [
          {
            text: 'Simular Pago Exitoso',
            onPress: async () => {
              // Registrar la donación en el backend
              const datosParaServidor = {
                id_usuario: idUsuario,
                id_refugio: formData.refugioSeleccionado,
                tipo: 'monetaria',
                cantidad: parseFloat(formData.cantidad),
              };

              const resultado = await DonacionesBackendService.registrarDonacionMonetaria(datosParaServidor);

              if (resultado.success) {
                const refugioNombre = refugios.find(r => r.idAsociacion === formData.refugioSeleccionado)?.nombre || 'el refugio';
                
                Alert.alert(
                  'Donación Exitosa ✅',
                  `¡Gracias por tu donación de $${formData.cantidad} MXN a ${refugioNombre}!\n\nTu apoyo hace la diferencia. 🐾`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        navigation.navigate('PerfilUsuario', { userId: idUsuario });
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('Error', resultado.mensaje);
              }
              setCargando(false);
            }
          },
          {
            text: 'Cancelar',
            onPress: () => setCargando(false),
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('💥 Error en pago:', error);
      Alert.alert('Error', 'Ocurrió un error al procesar el pago.');
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.formContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logoSmall} />
        <Text style={styles.titulo}>Donación Monetaria</Text>
        <Text style={styles.subtitulo}>Realiza una aportación económica segura</Text>

        {/* REFUGIO AL INICIO */}
        <SelectorRefugios
          refugios={refugios}
          refugioSeleccionado={formData.refugioSeleccionado}
          onSeleccionar={(valor) => actualizarCampo('refugioSeleccionado', valor)}
          cargando={cargando}
          cargandoRefugios={cargandoRefugios}
        />

        {formData.refugioSeleccionado && (
          <InfoRefugioSeleccionado
            refugios={refugios}
            refugioId={formData.refugioSeleccionado}
          />
        )}

        <Text style={styles.label}>Monto de Donación * (MXN)</Text>
        <View style={styles.montosRapidosContainer}>
          {montosRapidos.map((monto) => (
            <TouchableOpacity
              key={monto}
              style={[
                styles.botonMontoRapido,
                formData.cantidad === monto.toString() && styles.botonMontoRapidoSeleccionado
              ]}
              onPress={() => seleccionarMontoRapido(monto)}
              disabled={cargando}
            >
              <Text style={[
                styles.textoMontoRapido,
                formData.cantidad === monto.toString() && styles.textoMontoRapidoSeleccionado
              ]}>
                ${monto}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <CampoFormulario
          label="O ingresa tu monto (mínimo $10 MXN)"
          placeholder="Cantidad en MXN"
          value={formData.cantidad}
          onChangeText={(valor) => actualizarCampo('cantidad', valor)}
          keyboardType="numeric"
          editable={!cargando}
        />

        <View style={styles.infoStripe}>
          <Text style={styles.infoStripeTexto}>
            🔒 Pago seguro procesado por Stripe
          </Text>
          <Text style={styles.infoStripeSubtexto}>
            Tus datos están protegidos con encriptación de nivel bancario
          </Text>
        </View>

        <BotonPrincipal
          titulo={cargando ? "Procesando..." : "Proceder al Pago"}
          onPress={procesarPagoStripe}
          disabled={cargando || cargandoRefugios || !idUsuario}
          mostrarIndicador={cargando}
        />

        <BotonSecundario
          titulo="Regresar"
          onPress={onBack}
          disabled={cargando}
        />
      </View>
    </ScrollView>
  );
}

// ==========================================
// MAIN COMPONENT (FRONTEND CONTROLLER)
// ==========================================

export default function FormularioDonacionesAso({ route }) {
  const navigation = useNavigation();
  const searchParams = useLocalSearchParams();
  const routeParams = route?.params || {};

  const todosLosParams = { ...routeParams, ...searchParams };

  const [tipoDonacion, setTipoDonacion] = useState(null);
  const [refugios, setRefugios] = useState([]);
  const [cargandoRefugios, setCargandoRefugios] = useState(true);
  const [idUsuario, setIdUsuario] = useState(null);

  useEffect(() => {
    inicializarFormulario();
  }, []);

  const inicializarFormulario = async () => {
    DonacionesBackendService.configurarDebugging();

    const validacionUsuario = ValidadoresDonacion.validarParametrosUsuario(todosLosParams);

    if (validacionUsuario.valido) {
      setIdUsuario(validacionUsuario.idUsuario);
    } else {
      console.error('❌ Error de usuario:', validacionUsuario.mensaje);
      Alert.alert(
        'Error de Usuario',
        validacionUsuario.mensaje + '\n\nPor favor, asegúrate de haber iniciado sesión correctamente.',
        [
          {
            text: 'Volver al Perfil',
            onPress: () => {
              navigation.navigate('PerfilUsuario', { userId: validacionUsuario.idUsuario });
            }
          }
        ]
      );
      return;
    }

    await cargarRefugios();
  };

  const cargarRefugios = async () => {
    setCargandoRefugios(true);
    const resultado = await DonacionesBackendService.obtenerRefugios();

    if (resultado.success) {
      setRefugios(resultado.data);
    } else {
      console.error('❌ Error al cargar refugios:', resultado.mensaje);
      Alert.alert('Error', 'No se pudieron cargar los refugios: ' + resultado.mensaje);
      setRefugios([]);
    }

    setCargandoRefugios(false);
  };

  const regresar = () => {
    if (tipoDonacion !== null) {
      setTipoDonacion(null);
    } else {
      navigation.navigate('PerfilUsuario', { userId: idUsuario });
    }
  };

  // Pantalla de selección de tipo
  if (tipoDonacion === null) {
    return (
      <PantallaSeleccionTipoDonacion
        onSeleccionTipo={setTipoDonacion}
        onBack={() => navigation.navigate('PerfilUsuario', { userId: idUsuario })}
      />
    );
  }

  // Formulario de insumos
  if (tipoDonacion === 'insumos') {
    return (
      <FormularioDonacionInsumos
        refugios={refugios}
        cargandoRefugios={cargandoRefugios}
        idUsuario={idUsuario}
        onBack={regresar}
        navigation={navigation}
      />
    );
  }

  // Formulario monetario
  if (tipoDonacion === 'monetaria') {
    return (
      <FormularioDonacionMonetaria
        refugios={refugios}
        cargandoRefugios={cargandoRefugios}
        idUsuario={idUsuario}
        onBack={regresar}
        navigation={navigation}
      />
    );
  }

  return null;
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  seleccionContainer: {
    flex: 1,
    backgroundColor: '#A4645E',
    paddingHorizontal: 20,
    paddingVertical: 30,
    justifyContent: 'center',
  },
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
  descripcionTipo: {
    fontSize: 14,
    marginBottom: 30,
    textAlign: 'center',
    color: '#ffffff',
    opacity: 0.8,
  },
  botonTipo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  botonInsumos: {
    borderLeftWidth: 5,
    borderLeftColor: '#4ade80',
  },
  botonMonetaria: {
    borderLeftWidth: 5,
    borderLeftColor: '#60a5fa',
  },
  iconoTipo: {
    fontSize: 48,
    marginBottom: 10,
  },
  tituloBotonTipo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  descripcionBotonTipo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
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
  avisoEntrega: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  avisoEntregaTexto: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  montosRapidosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  botonMontoRapido: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
  },
  botonMontoRapidoSeleccionado: {
    backgroundColor: '#60a5fa',
    borderColor: '#3b82f6',
  },
  textoMontoRapido: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  textoMontoRapidoSeleccionado: {
    color: 'white',
  },
  infoStripe: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#60a5fa',
    alignItems: 'center',
  },
  infoStripeTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  infoStripeSubtexto: {
    fontSize: 12,
    color: '#4b5563',
    textAlign: 'center',
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
});