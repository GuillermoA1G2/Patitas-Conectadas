import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

// ==================================================================================
// CONFIGURACIÓN Y SERVICIOS
// ==================================================================================

// Cambiar esta IP por la de tu computadora
const API_BASE_URL = 'http://192.168.1.119:3000';

class DonacionService {
  // Servicio para obtener refugios
  static async obtenerRefugios() {
    try {
      console.log('🔄 Obteniendo refugios desde:', `${API_BASE_URL}/api/refugios`);
      
      const response = await fetch(`${API_BASE_URL}/api/refugios`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Status refugios:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error response refugios:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Respuesta refugios:', data);
      
      if (data.success && data.refugios) {
        console.log('📝 Refugios encontrados:', data.refugios.length);
        return { exito: true, refugios: data.refugios };
      } else {
        return { exito: false, error: 'No se encontraron refugios' };
      }
    } catch (error) {
      console.error('❌ Error al obtener refugios:', error);
      return { exito: false, error: `Error de conexión: ${error.message}` };
    }
  }

  // Servicio para registrar donación de insumos
  static async registrarDonacionInsumos(datosUsuario, datosInsumo, refugioId) {
    try {
      // Construir descripción
      let descripcion = datosInsumo.tipoInsumo;
      if (datosInsumo.tipoInsumo === 'medicamento' && datosInsumo.nombreMedicamento) {
        descripcion += ` - ${datosInsumo.nombreMedicamento}`;
      }

      const donacionData = {
        idUsuarioDonante: datosUsuario.idUsuario || datosUsuario.id,
        id_refugio: refugioId, // Usar directamente como string (ObjectId)
        nombre: datosInsumo.tipoInsumo === 'medicamento' 
          ? datosInsumo.nombreMedicamento 
          : datosInsumo.tipoInsumo,
        descripcion: descripcion,
        cantidad: parseInt(datosInsumo.cantidad)
      };

      console.log('🎯 Enviando donación insumos:', JSON.stringify(donacionData, null, 2));

      const response = await fetch(`${API_BASE_URL}/api/donaciones/insumos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donacionData),
      });

      console.log('📡 Status insumos:', response.status);

      const resultado = await response.json();
      console.log('📨 Respuesta insumos:', resultado);

      if (!response.ok) {
        throw new Error(resultado.message || `Error HTTP: ${response.status}`);
      }

      if (resultado.success) {
        return { exito: true, datos: resultado };
      } else {
        return { exito: false, error: resultado.message || 'Error desconocido al registrar donación' };
      }
    } catch (error) {
      console.error('❌ Error donación insumos:', error);
      return { 
        exito: false, 
        error: error.message || 'Error de conexión al procesar donación de insumos' 
      };
    }
  }

  // Servicio para registrar donación monetaria
  static async registrarDonacionMonetaria(datosUsuario, monto, refugioId) {
    try {
      const donacionData = {
        id_usuario: datosUsuario.idUsuario || datosUsuario.id,
        id_refugio: refugioId, // Usar directamente como string (ObjectId)
        tipo: 'monetaria',
        cantidad: parseFloat(monto)
      };

      console.log('💰 Enviando donación monetaria:', JSON.stringify(donacionData, null, 2));

      const response = await fetch(`${API_BASE_URL}/api/donaciones/monetaria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donacionData),
      });

      console.log('📡 Status monetaria:', response.status);

      const resultado = await response.json();
      console.log('📨 Respuesta monetaria:', resultado);

      if (!response.ok) {
        throw new Error(resultado.message || `Error HTTP: ${response.status}`);
      }

      if (resultado.success) {
        return { exito: true, datos: resultado };
      } else {
        return { exito: false, error: resultado.message || 'Error desconocido al registrar donación' };
      }
    } catch (error) {
      console.error('❌ Error donación monetaria:', error);
      return { 
        exito: false, 
        error: error.message || 'Error de conexión al procesar donación monetaria' 
      };
    }
  }

  // Método para verificar conexión con el servidor
  static async verificarConexion() {
    try {
      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const text = await response.text();
        console.log('🟢 Servidor conectado:', text);
        return true;
      }
      return false;
    } catch (error) {
      console.error('🔴 Servidor desconectado:', error);
      return false;
    }
  }
}

class ValidacionService {
  static validarDonacionInsumos(tipoInsumo, cantidad, refugio, nombreMedicamento) {
    if (!tipoInsumo || tipoInsumo.trim() === '') {
      return { valido: false, error: 'Por favor selecciona el tipo de insumo' };
    }
    
    if (!cantidad || cantidad.trim() === '') {
      return { valido: false, error: 'Por favor ingresa la cantidad' };
    }
    
    const cantidadNum = parseFloat(cantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      return { valido: false, error: 'La cantidad debe ser un número válido mayor a 0' };
    }
    
    if (!refugio || refugio.trim() === '') {
      return { valido: false, error: 'Por favor selecciona un refugio' };
    }
    
    if (tipoInsumo === 'medicamento' && (!nombreMedicamento || nombreMedicamento.trim() === '')) {
      return { valido: false, error: 'Por favor especifica el nombre del medicamento' };
    }
    
    return { valido: true };
  }

  static validarDonacionMonetaria(monto, refugio) {
    if (!monto || monto.trim() === '') {
      return { valido: false, error: 'Por favor ingresa el monto a donar' };
    }
    
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      return { valido: false, error: 'El monto debe ser un número válido mayor a 0' };
    }

    if (montoNum < 10) {
      return { valido: false, error: 'El monto mínimo de donación es $10 MXN' };
    }

    if (!refugio || refugio.trim() === '') {
      return { valido: false, error: 'Por favor selecciona un refugio' };
    }
    
    return { valido: true };
  }

  static validarDatosUsuario(usuario) {
    if (!usuario) {
      return { valido: false, error: 'Datos de usuario no disponibles' };
    }
    
    const userId = usuario.idUsuario || usuario.id;
    if (!userId) {
      return { valido: false, error: 'ID de usuario no válido' };
    }
    
    return { valido: true };
  }
}

class UtilService {
  static resetearFormulario(setters) {
    Object.values(setters).forEach(setter => {
      if (typeof setter === 'function') {
        setter('');
      }
    });
  }

  static manejarPasarelaPago(donacionData) {
    const monto = donacionData.donacion?.cantidad || donacionData.cantidad || 0;
    Alert.alert(
      'Procesando Pago', 
      `Monto: $${monto} MXN\n\nEn una implementación real, aquí se abriría Stripe para procesar el pago.`,
      [
        {
          text: 'Entendido',
          onPress: () => console.log('Pago simulado procesado')
        }
      ]
    );
  }

  static mostrarErrorConexion() {
    Alert.alert(
      'Error de Conexión',
      'No se pudo conectar al servidor. Verifica:\n\n1. Que el servidor esté ejecutándose\n2. Que la IP sea correcta\n3. Que estés en la misma red WiFi',
      [
        { text: 'OK' }
      ]
    );
  }
}

// ========================================================================================
// COMPONENTE PRINCIPAL
// ========================================================================================

export default function DonacionScreen({ navigation, route }) {
  // Estado del componente
  const usuario = route?.params?.usuario || null;

  const [tipoDonacion, setTipoDonacion] = useState('insumos');
  const [tipoInsumo, setTipoInsumo] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [refugio, setRefugio] = useState('');
  const [nombreMedicamento, setNombreMedicamento] = useState('');
  const [refugios, setRefugios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [montoMonetario, setMontoMonetario] = useState('');
  const [estadoConexion, setEstadoConexion] = useState('verificando');

  // Efectos
  useEffect(() => {
    verificarConexionYCargarDatos();
  }, []);

  // Handlers
  const verificarConexionYCargarDatos = async () => {
    try {
      setEstadoConexion('verificando');
      console.log('🔍 Verificando conexión al servidor...');
      
      const conexionOk = await DonacionService.verificarConexion();
      
      if (conexionOk) {
        setEstadoConexion('conectado');
        await cargarRefugios();
      } else {
        setEstadoConexion('error');
        UtilService.mostrarErrorConexion();
      }
    } catch (error) {
      console.error('Error al verificar conexión:', error);
      setEstadoConexion('error');
      UtilService.mostrarErrorConexion();
    }
  };

  const cargarRefugios = async () => {
    try {
      console.log('📋 Cargando refugios...');
      const resultado = await DonacionService.obtenerRefugios();
      
      if (resultado.exito) {
        console.log('✅ Refugios cargados:', resultado.refugios.length);
        setRefugios(resultado.refugios);
      } else {
        console.error('❌ Error cargando refugios:', resultado.error);
        Alert.alert('Error', resultado.error);
        setRefugios([]);
      }
    } catch (error) {
      console.error('Error al cargar refugios:', error);
      Alert.alert('Error', 'Error inesperado al cargar refugios');
      setRefugios([]);
    }
  };

  const manejarCambioTipoDonacion = (tipo) => {
    console.log('🔄 Cambiando tipo donación a:', tipo);
    setTipoDonacion(tipo);
    
    // Limpiar campos del otro tipo
    if (tipo === 'insumos') {
      setMontoMonetario('');
    } else {
      setTipoInsumo('');
      setCantidad('');
      setNombreMedicamento('');
    }
  };

  const manejarCambioTipoInsumo = (valor) => {
    console.log('🔄 Cambiando tipo insumo a:', valor);
    setTipoInsumo(valor);
    if (valor !== 'medicamento') {
      setNombreMedicamento('');
    }
  };

  const procesarDonacionInsumos = async () => {
    try {
      console.log('🎯 Iniciando proceso donación insumos...');
      
      // Validar usuario
      const validacionUsuario = ValidacionService.validarDatosUsuario(usuario);
      if (!validacionUsuario.valido) {
        Alert.alert('Error', validacionUsuario.error);
        return false;
      }

      // Validar campos
      const validacion = ValidacionService.validarDonacionInsumos(
        tipoInsumo, cantidad, refugio, nombreMedicamento
      );

      if (!validacion.valido) {
        Alert.alert('Error de Validación', validacion.error);
        return false;
      }

      const datosInsumo = {
        tipoInsumo,
        nombreMedicamento,
        cantidad
      };

      console.log('📤 Procesando donación de insumos...');
      const resultado = await DonacionService.registrarDonacionInsumos(
        usuario, datosInsumo, refugio
      );

      if (resultado.exito) {
        const refugioSeleccionado = refugios.find(r => 
          r.idAsociacion.toString() === refugio.toString()
        );
        
        const nombreItem = tipoInsumo === 'medicamento' ? nombreMedicamento : tipoInsumo;
        
        Alert.alert(
          'Donación Exitosa',
          `¡Gracias por tu donación!\n\nInsumo: ${nombreItem}\nCantidad: ${cantidad}\nRefugio: ${refugioSeleccionado?.nombre || 'No encontrado'}\n\nEl refugio será notificado.`,
          [
            {
              text: 'OK',
              onPress: () => {
                limpiarFormulario();
                if (navigation?.goBack) navigation.goBack();
              }
            }
          ]
        );
        return true;
      } else {
        Alert.alert('Error al Procesar', resultado.error);
        return false;
      }
    } catch (error) {
      console.error('Error procesando donación insumos:', error);
      Alert.alert('Error', 'Error inesperado al procesar la donación');
      return false;
    }
  };

  const procesarDonacionMonetaria = async () => {
    try {
      console.log('💰 Iniciando proceso donación monetaria...');
      
      // Validar usuario
      const validacionUsuario = ValidacionService.validarDatosUsuario(usuario);
      if (!validacionUsuario.valido) {
        Alert.alert('Error', validacionUsuario.error);
        return false;
      }

      // Validar campos
      const validacion = ValidacionService.validarDonacionMonetaria(montoMonetario, refugio);

      if (!validacion.valido) {
        Alert.alert('Error de Validación', validacion.error);
        return false;
      }

      console.log('📤 Procesando donación monetaria...');
      const resultado = await DonacionService.registrarDonacionMonetaria(
        usuario, montoMonetario, refugio
      );

      if (resultado.exito) {
        const refugioSeleccionado = refugios.find(r => 
          r.idAsociacion.toString() === refugio.toString()
        );
        
        Alert.alert(
          'Donación Registrada',
          `¡Donación registrada exitosamente!\n\nMonto: $${montoMonetario} MXN\nRefugio: ${refugioSeleccionado?.nombre || 'No encontrado'}`,
          [
            {
              text: 'Proceder al Pago',
              onPress: () => {
                UtilService.manejarPasarelaPago(resultado.datos);
                limpiarFormulario();
                if (navigation?.goBack) navigation.goBack();
              }
            }
          ]
        );
        return true;
      } else {
        Alert.alert('Error al Procesar', resultado.error);
        return false;
      }
    } catch (error) {
      console.error('Error procesando donación monetaria:', error);
      Alert.alert('Error', 'Error inesperado al procesar la donación');
      return false;
    }
  };

  const manejarProcesarDonacion = async () => {
    if (cargando) return;
    if (estadoConexion !== 'conectado') {
      UtilService.mostrarErrorConexion();
      return;
    }

    setCargando(true);

    try {
      let procesoExitoso = false;

      if (tipoDonacion === 'insumos') {
        procesoExitoso = await procesarDonacionInsumos();
      } else {
        procesoExitoso = await procesarDonacionMonetaria();
      }

      console.log(procesoExitoso ? '✅ Donación procesada' : '❌ Donación falló');
    } catch (error) {
      console.error('Error general:', error);
      Alert.alert('Error', 'Error inesperado. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  const limpiarFormulario = () => {
    UtilService.resetearFormulario({
      setTipoInsumo,
      setCantidad,
      setRefugio,
      setNombreMedicamento,
      setMontoMonetario
    });
  };

  const reintentar = () => {
    verificarConexionYCargarDatos();
  };

  // Validar datos de usuario al inicio
  if (!usuario) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error de Usuario</Text>
        <Text style={styles.errorText}>
          No se encontraron datos de usuario. Por favor inicia sesión nuevamente.
        </Text>
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={() => navigation?.goBack && navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Pantalla de error de conexión
  if (estadoConexion === 'error') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Sin Conexión</Text>
        <Text style={styles.errorText}>
          No se pudo conectar al servidor.{'\n\n'}
          Verifica que:{'\n'}
          • El servidor esté ejecutándose{'\n'}
          • La IP sea correcta: {API_BASE_URL}{'\n'}
          • Estés conectado a la misma red WiFi
        </Text>
        <TouchableOpacity style={styles.errorButton} onPress={reintentar}>
          <Text style={styles.errorButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Pantalla de carga inicial
  if (estadoConexion === 'verificando') {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Conectando al servidor...</Text>
      </View>
    );
  }

  // Renderizado principal
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <HeaderComponent usuario={usuario} estadoConexion={estadoConexion} />

      <TipoDonacionComponent 
        tipoDonacion={tipoDonacion}
        onCambioTipo={manejarCambioTipoDonacion}
      />

      {tipoDonacion === 'insumos' && (
        <FormularioInsumosComponent
          tipoInsumo={tipoInsumo}
          onCambioTipoInsumo={manejarCambioTipoInsumo}
          nombreMedicamento={nombreMedicamento}
          onCambioNombreMedicamento={setNombreMedicamento}
          cantidad={cantidad}
          onCambioCantidad={setCantidad}
        />
      )}

      {tipoDonacion === 'monetaria' && (
        <FormularioMonetarioComponent
          montoMonetario={montoMonetario}
          onCambioMonto={setMontoMonetario}
        />
      )}

      <RefugioSelectorComponent
        refugio={refugio}
        refugios={refugios}
        onCambioRefugio={setRefugio}
        onRecargar={cargarRefugios}
      />

      <BotonDonarComponent
        cargando={cargando}
        tipoDonacion={tipoDonacion}
        estadoConexion={estadoConexion}
        onProcesar={manejarProcesarDonacion}
      />
    </ScrollView>
  );
}

// ========== COMPONENTES DE PRESENTACIÓN ==========

const HeaderComponent = ({ usuario, estadoConexion }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>Realizar Donación</Text>
    <Text style={styles.userInfo}>
      Usuario: {usuario?.nombre || 'Invitado'}
    </Text>
    <View style={[styles.statusIndicator, 
      estadoConexion === 'conectado' ? styles.statusConnected : styles.statusError
    ]}>
      <Text style={styles.statusText}>
        {estadoConexion === 'conectado' ? '● Conectado' : '● Sin conexión'}
      </Text>
    </View>
  </View>
);

const TipoDonacionComponent = ({ tipoDonacion, onCambioTipo }) => (
  <View style={styles.card}>
    <Text style={styles.subtitulo}>Tipo de donación</Text>
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.radio, tipoDonacion === 'insumos' && styles.radioSeleccionado]}
        onPress={() => onCambioTipo('insumos')}
      >
        <Text style={[styles.radioTexto, tipoDonacion === 'insumos' && styles.radioTextoSeleccionado]}>
          Insumos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.radio, tipoDonacion === 'monetaria' && styles.radioSeleccionado]}
        onPress={() => onCambioTipo('monetaria')}
      >
        <Text style={[styles.radioTexto, tipoDonacion === 'monetaria' && styles.radioTextoSeleccionado]}>
          Monetaria
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

const FormularioInsumosComponent = ({ 
  tipoInsumo, 
  onCambioTipoInsumo, 
  nombreMedicamento, 
  onCambioNombreMedicamento,
  cantidad,
  onCambioCantidad
}) => (
  <View style={styles.card}>
    <Text style={styles.subtitulo}>Donación de insumos</Text>

    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={tipoInsumo}
        onValueChange={onCambioTipoInsumo}
        style={styles.picker}
      >
        <Picker.Item label="Seleccione tipo de insumo" value="" />
        <Picker.Item label="Alimento" value="alimento" />
        <Picker.Item label="Medicamento" value="medicamento" />
        <Picker.Item label="Accesorios" value="accesorios" />
        <Picker.Item label="Juguetes" value="juguetes" />
        <Picker.Item label="Mantas/Cobijas" value="mantas" />
      </Picker>
    </View>

    {tipoInsumo === 'medicamento' && (
      <TextInput
        placeholder="Nombre del medicamento (ej: Antibiótico, Vitaminas)"
        value={nombreMedicamento}
        onChangeText={onCambioNombreMedicamento}
        style={styles.input}
      />
    )}

    <TextInput
      placeholder={`Cantidad ${
        tipoInsumo === 'alimento' ? '(kg)' : 
        tipoInsumo === 'medicamento' ? '(unidades)' : 
        '(unidades)'
      }`}
      value={cantidad}
      onChangeText={onCambioCantidad}
      keyboardType="numeric"
      style={styles.input}
    />
  </View>
);

const FormularioMonetarioComponent = ({ montoMonetario, onCambioMonto }) => (
  <View style={styles.card}>
    <Text style={styles.subtitulo}>Donación Monetaria</Text>
    <TextInput
      placeholder="Monto a donar (MXN)"
      value={montoMonetario}
      onChangeText={onCambioMonto}
      keyboardType="numeric"
      style={styles.input}
    />
    <Text style={styles.infoTexto}>
      • Monto mínimo: $10 MXN{'\n'}
      • Tu donación será procesada de forma segura{'\n'}
      • Recibirás confirmación por email
    </Text>
  </View>
);

const RefugioSelectorComponent = ({ refugio, refugios, onCambioRefugio, onRecargar }) => (
  <View style={styles.card}>
    <View style={styles.refugioHeader}>
      <Text style={styles.subtitulo}>Seleccionar refugio</Text>
      <TouchableOpacity style={styles.recargarButton} onPress={onRecargar}>
        <Text style={styles.recargarTexto}>🔄</Text>
      </TouchableOpacity>
    </View>
    
    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={refugio}
        onValueChange={onCambioRefugio}
        style={styles.picker}
      >
        <Picker.Item label="Seleccionar refugio..." value="" />
        {refugios.map((ref) => (
          <Picker.Item 
            key={ref.idAsociacion} 
            label={ref.nombre} 
            value={ref.idAsociacion.toString()} 
          />
        ))}
      </Picker>
    </View>
    
    <Text style={styles.infoTexto}>
      {refugios.length === 0 ? 'Cargando refugios...' : `${refugios.length} refugios disponibles`}
    </Text>
  </View>
);

const BotonDonarComponent = ({ cargando, tipoDonacion, estadoConexion, onProcesar }) => (
  <TouchableOpacity
    style={[
      styles.botonDonar, 
      (cargando || estadoConexion !== 'conectado') && styles.botonDeshabilitado
    ]}
    onPress={onProcesar}
    disabled={cargando || estadoConexion !== 'conectado'}
  >
    <Text style={styles.textoBoton}>
      {cargando ? 'Procesando...' : 
       estadoConexion !== 'conectado' ? 'Sin conexión' :
       tipoDonacion === 'insumos' ? 'Registrar Donación' : 'Proceder al Pago'}
    </Text>
  </TouchableOpacity>
);

// ============================================================================
// ESTILOS
// ============================================================================
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#a26b6c',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userInfo: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  statusIndicator: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusConnected: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  statusError: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#2c3e50',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  radio: {
    padding: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 25,
    width: '40%',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  radioSeleccionado: {
    backgroundColor: '#a26b6c',
    borderColor: '#a26b6c',
  },
  radioTexto: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '500',
  },
  radioTextoSeleccionado: {
    color: '#fff',
    fontWeight: 'bold',
  },
  refugioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  recargarButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  recargarTexto: {
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
  },
  picker: {
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
    fontSize: 16,
  },
  infoTexto: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
  botonDonar: {
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  botonDeshabilitado: {
    backgroundColor: '#bdc3c7',
  },
  textoBoton: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 18,
  },
  // Estilos para pantallas de error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  errorButton: {
    backgroundColor: '#a26b6c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos para pantalla de carga
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#2c3e50',
  },
});