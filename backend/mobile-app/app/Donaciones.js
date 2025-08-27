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
// BACKEND LOGIC SECTION
// ==================================================================================

const API_BASE_URL = 'http://192.168.1.119:3000';

class DonacionService {
  // Servicio para obtener refugios
  static async obtenerRefugios() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/refugios`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return { exito: true, refugios: data.refugios || [] };
      } else {
        return { exito: false, error: data.message || 'No se pudieron cargar los refugios' };
      }
    } catch (error) {
      console.error('Error al cargar refugios:', error);
      // Datos de fallback para desarrollo
      return { 
        exito: true, 
        refugios: [
          { idAsociacion: 1, nombre: 'Refugio Patitas Felices' },
          { idAsociacion: 2, nombre: 'Hogar Animal Guadalajara' },
          { idAsociacion: 3, nombre: 'Rescate Canino Zapopan' }
        ]
      };
    }
  }

  // Servicio para registrar donación de insumos
  static async registrarDonacionInsumos(datosUsuario, datosInsumo, refugioId) {
    try {
      let descripcion = `${datosInsumo.tipoInsumo}`;
      if (datosInsumo.tipoInsumo === 'medicamento' && datosInsumo.nombreMedicamento) {
        descripcion += ` - ${datosInsumo.nombreMedicamento}`;
      }

      const donacionData = {
        idUsuarioDonante: datosUsuario.idUsuario || datosUsuario.id,
        id_refugio: parseInt(refugioId),
        nombre: datosInsumo.tipoInsumo === 'medicamento' 
          ? datosInsumo.nombreMedicamento 
          : datosInsumo.tipoInsumo,
        descripcion: descripcion,
        cantidad: parseInt(datosInsumo.cantidad)
      };

      console.log('Enviando donación de insumos:', donacionData);

      const response = await fetch(`${API_BASE_URL}/api/donaciones/insumos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donacionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const resultado = await response.json();

      if (resultado.success) {
        return { exito: true, datos: resultado };
      } else {
        return { exito: false, error: resultado.message || 'Error al registrar donación' };
      }
    } catch (error) {
      console.error('Error al procesar donación de insumos:', error);
      // Simulación para desarrollo - remover en producción
      return { 
        exito: true, 
        datos: { 
          message: 'Donación registrada correctamente (modo desarrollo)',
          id: Math.floor(Math.random() * 1000)
        }
      };
    }
  }

  // Servicio para registrar donación monetaria
  static async registrarDonacionMonetaria(datosUsuario, monto, refugioId) {
    try {
      const donacionData = {
        id_usuario: datosUsuario.idUsuario || datosUsuario.id,
        id_refugio: parseInt(refugioId),
        tipo: 'monetaria',
        cantidad: parseFloat(monto)
      };

      console.log('Enviando donación monetaria:', donacionData);

      const response = await fetch(`${API_BASE_URL}/api/donaciones/monetaria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donacionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const resultado = await response.json();

      if (resultado.success) {
        return { exito: true, datos: resultado };
      } else {
        return { exito: false, error: resultado.message || 'Error al registrar donación' };
      }
    } catch (error) {
      console.error('Error al procesar donación monetaria:', error);
      // Simulación para desarrollo - remover en producción
      return { 
        exito: true, 
        datos: { 
          message: 'Donación monetaria registrada (modo desarrollo)',
          cantidad: parseFloat(monto),
          id: Math.floor(Math.random() * 1000)
        }
      };
    }
  }
}

class ValidacionService {
  // Validar campos de donación de insumos
  static validarDonacionInsumos(tipoInsumo, cantidad, refugio, nombreMedicamento) {
    if (!tipoInsumo) {
      return { valido: false, error: 'Por favor selecciona el tipo de insumo' };
    }
    
    if (!cantidad || cantidad.trim() === '') {
      return { valido: false, error: 'Por favor ingresa la cantidad' };
    }
    
    if (isNaN(cantidad) || parseFloat(cantidad) <= 0) {
      return { valido: false, error: 'La cantidad debe ser un número válido mayor a 0' };
    }
    
    if (!refugio) {
      return { valido: false, error: 'Por favor selecciona un refugio' };
    }
    
    if (tipoInsumo === 'medicamento' && (!nombreMedicamento || nombreMedicamento.trim() === '')) {
      return { valido: false, error: 'Por favor especifica el nombre del medicamento' };
    }
    
    return { valido: true };
  }

  // Validar campos de donación monetaria
  static validarDonacionMonetaria(monto, refugio) {
    if (!monto || monto.trim() === '') {
      return { valido: false, error: 'Por favor ingresa el monto a donar' };
    }
    
    if (isNaN(monto) || parseFloat(monto) <= 0) {
      return { valido: false, error: 'El monto debe ser un número válido mayor a 0' };
    }

    if (parseFloat(monto) < 10) {
      return { valido: false, error: 'El monto mínimo de donación es $10' };
    }

    if (!refugio) {
      return { valido: false, error: 'Por favor selecciona un refugio para la donación monetaria' };
    }
    
    return { valido: true };
  }
}

class UtilService {
  // Resetear formulario
  static resetearFormulario(setters) {
    if (setters.setTipoInsumo) setters.setTipoInsumo('');
    if (setters.setCantidad) setters.setCantidad('');
    if (setters.setRefugio) setters.setRefugio('');
    if (setters.setNombreMedicamento) setters.setNombreMedicamento('');
    if (setters.setMontoMonetario) setters.setMontoMonetario('');
  }

  // Manejar pasarela de pago
  static manejarPasarelaPago(donacionData) {
    Alert.alert(
      'Redirigiendo a Stripe', 
      `Monto: $${donacionData.cantidad || donacionData.monto} - Se abrirá la pasarela de pago`,
      [
        {
          text: 'OK',
          onPress: () => {
            // Aquí integrar el SDK de Stripe
            console.log('Redirigir a pasarela de pago con:', donacionData);
          }
        }
      ]
    );
  }
}

// ========================================================================================
// FRONTEND COMPONENTS SECTION
// ========================================================================================

export default function DonacionScreen({ navigation, route }) {
  // ========== ESTADO DEL COMPONENTE ==========
  const usuario = route?.params?.usuario || { 
    idUsuario: 1, 
    id: 1,
    nombre: 'Usuario Demo' 
  };

  const [tipoDonacion, setTipoDonacion] = useState('insumos');
  const [tipoInsumo, setTipoInsumo] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [refugio, setRefugio] = useState('');
  const [nombreMedicamento, setNombreMedicamento] = useState('');
  const [refugios, setRefugios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [montoMonetario, setMontoMonetario] = useState('');

  // ========== EFECTOS ==========
  useEffect(() => {
    cargarRefugiosDesdeServicio();
  }, []);

  // ========== HANDLERS DE FRONTEND ==========
  const cargarRefugiosDesdeServicio = async () => {
    try {
      const resultado = await DonacionService.obtenerRefugios();
      
      if (resultado.exito) {
        setRefugios(resultado.refugios);
      } else {
        Alert.alert('Error', resultado.error);
        // Datos de fallback para desarrollo
        setRefugios([
          { idAsociacion: 1, nombre: 'Refugio Patitas Felices' },
          { idAsociacion: 2, nombre: 'Hogar Animal Guadalajara' },
          { idAsociacion: 3, nombre: 'Rescate Canino Zapopan' }
        ]);
      }
    } catch (error) {
      console.error('Error al cargar refugios:', error);
      Alert.alert('Error', 'No se pudieron cargar los refugios');
    }
  };

  const manejarCambioTipoDonacion = (tipo) => {
    setTipoDonacion(tipo);
    if (tipo === 'insumos') {
      setMontoMonetario('');
    } else {
      setTipoInsumo('');
      setCantidad('');
      setNombreMedicamento('');
    }
  };

  const manejarCambioTipoInsumo = (valor) => {
    setTipoInsumo(valor);
    if (valor !== 'medicamento') {
      setNombreMedicamento('');
    }
  };

  const procesarDonacionInsumos = async () => {
    const validacion = ValidacionService.validarDonacionInsumos(
      tipoInsumo, cantidad, refugio, nombreMedicamento
    );

    if (!validacion.valido) {
      Alert.alert('Error', validacion.error);
      return false;
    }

    const datosInsumo = {
      tipoInsumo,
      nombreMedicamento,
      cantidad
    };

    const resultado = await DonacionService.registrarDonacionInsumos(
      usuario, datosInsumo, refugio
    );

    if (resultado.exito) {
      const refugioSeleccionado = refugios.find(r => r.idAsociacion === parseInt(refugio));
      Alert.alert(
        'Donación Exitosa', 
        `Gracias por tu donación de ${tipoInsumo === 'medicamento' ? nombreMedicamento : tipoInsumo}. El refugio ${refugioSeleccionado?.nombre} será contactado.`,
        [
          {
            text: 'OK',
            onPress: () => {
              UtilService.resetearFormulario({
                setTipoInsumo,
                setCantidad,
                setRefugio,
                setNombreMedicamento,
                setMontoMonetario
              });
              if (navigation && navigation.goBack) {
                navigation.goBack();
              }
            }
          }
        ]
      );
      return true;
    } else {
      Alert.alert('Error', resultado.error);
      return false;
    }
  };

  const procesarDonacionMonetaria = async () => {
    const validacion = ValidacionService.validarDonacionMonetaria(montoMonetario, refugio);

    if (!validacion.valido) {
      Alert.alert('Error', validacion.error);
      return false;
    }

    const resultado = await DonacionService.registrarDonacionMonetaria(
      usuario, montoMonetario, refugio
    );

    if (resultado.exito) {
      const refugioSeleccionado = refugios.find(r => r.idAsociacion === parseInt(refugio));
      Alert.alert(
        'Donación Registrada', 
        `Gracias por tu donación de $${montoMonetario} al refugio ${refugioSeleccionado?.nombre}. Serás redirigido al pago.`,
        [
          {
            text: 'Proceder al Pago',
            onPress: () => {
              UtilService.manejarPasarelaPago(resultado.datos);
              UtilService.resetearFormulario({
                setTipoInsumo,
                setCantidad,
                setRefugio,
                setNombreMedicamento,
                setMontoMonetario
              });
              if (navigation && navigation.goBack) {
                navigation.goBack();
              }
            }
          }
        ]
      );
      return true;
    } else {
      Alert.alert('Error', resultado.error);
      return false;
    }
  };

  const manejarProcesarDonacion = async () => {
    if (cargando) return;

    setCargando(true);

    try {
      let procesoExitoso = false;

      if (tipoDonacion === 'insumos') {
        procesoExitoso = await procesarDonacionInsumos();
      } else {
        procesoExitoso = await procesarDonacionMonetaria();
      }

      if (!procesoExitoso) {
        console.log('Proceso de donación no completado exitosamente');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar la donación. Intenta nuevamente.');
      console.error('Error general al procesar donación:', error);
    } finally {
      setCargando(false);
    }
  };

  // ========== RENDERIZADO DEL COMPONENTE ==========
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <HeaderComponent usuario={usuario} />

      {/* Tipo de donación */}
      <TipoDonacionComponent 
        tipoDonacion={tipoDonacion}
        onCambioTipo={manejarCambioTipoDonacion}
      />

      {/* Formulario de Insumos */}
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

      {/* Formulario de Donación Monetaria */}
      {tipoDonacion === 'monetaria' && (
        <FormularioMonetarioComponent
          montoMonetario={montoMonetario}
          onCambioMonto={setMontoMonetario}
        />
      )}

      {/* Refugio */}
      <RefugioSelectorComponent
        refugio={refugio}
        refugios={refugios}
        onCambioRefugio={setRefugio}
      />

      {/* Botón Donar */}
      <BotonDonarComponent
        cargando={cargando}
        tipoDonacion={tipoDonacion}
        onProcesar={manejarProcesarDonacion}
      />
    </ScrollView>
  );
}

// ========== COMPONENTES DE PRESENTACIÓN ==========

const HeaderComponent = ({ usuario }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>Realizar Donación</Text>
    {usuario && (
      <Text style={styles.userInfo}>Usuario: {usuario.nombre || 'Invitado'}</Text>
    )}
  </View>
);

const TipoDonacionComponent = ({ tipoDonacion, onCambioTipo }) => (
  <View style={styles.card}>
    <Text style={styles.subtitulo}>Tipo de donación</Text>
    <View style={styles.row}>
      <TouchableOpacity
        style={[
          styles.radio,
          tipoDonacion === 'insumos' && styles.radioSeleccionado,
        ]}
        onPress={() => onCambioTipo('insumos')}
      >
        <Text
          style={[
            styles.radioTexto,
            tipoDonacion === 'insumos' && styles.radioTextoSeleccionado,
          ]}
        >
          Insumos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.radio,
          tipoDonacion === 'monetaria' && styles.radioSeleccionado,
        ]}
        onPress={() => onCambioTipo('monetaria')}
      >
        <Text
          style={[
            styles.radioTexto,
            tipoDonacion === 'monetaria' && styles.radioTextoSeleccionado,
          ]}
        >
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
    <Text style={styles.subtitulo}>
      Donación de {tipoInsumo === 'medicamento' ? 'medicamentos' : 'insumos'}
    </Text>

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
        placeholder="Especifica el medicamento (ej: Antibiótico, Vitaminas, etc.)"
        value={nombreMedicamento}
        onChangeText={onCambioNombreMedicamento}
        style={[styles.input, !nombreMedicamento && styles.inputError]}
      />
    )}

    <TextInput
      placeholder={`Cantidad ${
        tipoInsumo === 'alimento' ? '(kg)' : 
        tipoInsumo === 'medicamento' ? '(unidades/mg)' : 
        '(unidades)'
      }`}
      value={cantidad}
      onChangeText={onCambioCantidad}
      keyboardType="numeric"
      style={[styles.input, !cantidad && styles.inputError]}
    />
  </View>
);

const FormularioMonetarioComponent = ({ montoMonetario, onCambioMonto }) => (
  <View style={styles.card}>
    <Text style={styles.subtitulo}>Donación Monetaria</Text>
    <TextInput
      placeholder="Monto a donar ($)"
      value={montoMonetario}
      onChangeText={onCambioMonto}
      keyboardType="numeric"
      style={[styles.input, !montoMonetario && styles.inputError]}
    />
    <Text style={styles.infoTexto}>
      Tu donación será procesada a través de Stripe de forma segura
    </Text>
    <Text style={styles.infoTexto}>
      Monto mínimo: $10 MXN
    </Text>
  </View>
);

const RefugioSelectorComponent = ({ refugio, refugios, onCambioRefugio }) => (
  <View style={styles.card}>
    <Text style={styles.subtitulo}>Seleccionar refugio</Text>
    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={refugio}
        onValueChange={onCambioRefugio}
        style={styles.picker}
      >
        <Picker.Item label="Seleccionar refugio para donar" value="" />
        {refugios.map((ref) => (
          <Picker.Item 
            key={ref.idAsociacion} 
            label={ref.nombre} 
            value={ref.idAsociacion.toString()} 
          />
        ))}
      </Picker>
    </View>
    {refugios.length === 0 && (
      <Text style={styles.infoTexto}>Cargando refugios...</Text>
    )}
  </View>
);

const BotonDonarComponent = ({ cargando, tipoDonacion, onProcesar }) => (
  <TouchableOpacity
    style={[styles.botonDonar, cargando && styles.botonDeshabilitado]}
    onPress={onProcesar}
    disabled={cargando}
  >
    <Text style={styles.textoBoton}>
      {cargando ? 'Procesando...' : 
       tipoDonacion === 'insumos' ? 'Registrar Donación' : 'Proceder al Pago'}
    </Text>
  </TouchableOpacity>
);

// ============================================================================
// STYLES SECTION
// ============================================================================
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f2f2f2',
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#a2d2ff',
    paddingTop: 50,
    paddingBottom: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  userInfo: {
    fontSize: 14,
    color: '#2c3e50',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subtitulo: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2c3e50',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  radio: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 20,
    width: '40%',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  radioSeleccionado: {
    backgroundColor: '#FC7EAC',
    borderColor: '#FC7EAC',
  },
  radioTexto: {
    color: '#2c3e50',
  },
  radioTextoSeleccionado: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
  },
  picker: {
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fdf2f2',
  },
  infoTexto: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 5,
  },
  botonDonar: {
    backgroundColor: '#ff69b4',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  botonDeshabilitado: {
    backgroundColor: '#ccc',
  },
  textoBoton: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});