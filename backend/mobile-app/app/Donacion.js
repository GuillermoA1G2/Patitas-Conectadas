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

// Configura la URL base de tu servidor
const API_BASE_URL = 'http://192.168.1.119:3000';

export default function DonacionScreen({ navigation, route }) {
  // Obtener datos del usuario desde navegación (debes pasarlos desde tu login)
  const usuario = route?.params?.usuario || { idUsuario: 1 };

  const [tipoDonacion, setTipoDonacion] = useState('insumos');
  const [tipoInsumo, setTipoInsumo] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [refugio, setRefugio] = useState('');
  const [nombreMedicamento, setNombreMedicamento] = useState('');
  const [refugios, setRefugios] = useState([]);
  const [cargando, setCargando] = useState(false);
  
  // Estados para donación monetaria
  const [montoMonetario, setMontoMonetario] = useState('');

  // Cargar refugios al iniciar el componente
  useEffect(() => {
    cargarRefugios();
  }, []);

  const cargarRefugios = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/refugios`);
      const data = await response.json();
      
      if (response.ok) {
        setRefugios(data.refugios);
      } else {
        Alert.alert('Error', 'No se pudieron cargar los refugios');
      }
    } catch (error) {
      console.error('Error al cargar refugios:', error);
      Alert.alert('Error', 'Error de conexión al cargar refugios');
    }
  };

  const validarCamposInsumos = () => {
    if (!tipoInsumo) {
      Alert.alert('Error', 'Por favor selecciona el tipo de insumo');
      return false;
    }
    
    if (!cantidad || cantidad.trim() === '') {
      Alert.alert('Error', 'Por favor ingresa la cantidad');
      return false;
    }
    
    if (isNaN(cantidad) || parseFloat(cantidad) <= 0) {
      Alert.alert('Error', 'La cantidad debe ser un número válido mayor a 0');
      return false;
    }
    
    if (!refugio) {
      Alert.alert('Error', 'Por favor selecciona un refugio');
      return false;
    }
    
    if (tipoInsumo === 'medicamento' && (!nombreMedicamento || nombreMedicamento.trim() === '')) {
      Alert.alert('Error', 'Por favor especifica el nombre del medicamento');
      return false;
    }
    
    return true;
  };

  const validarCamposMonetarios = () => {
    if (!montoMonetario || montoMonetario.trim() === '') {
      Alert.alert('Error', 'Por favor ingresa el monto a donar');
      return false;
    }
    
    if (isNaN(montoMonetario) || parseFloat(montoMonetario) <= 0) {
      Alert.alert('Error', 'El monto debe ser un número válido mayor a 0');
      return false;
    }

    if (!refugio) {
      Alert.alert('Error', 'Por favor selecciona un refugio para la donación monetaria');
      return false;
    }
    
    return true;
  };

  const procesarDonacionInsumos = async () => {
    try {
      // Crear descripción del insumo
      let descripcion = `${tipoInsumo}`;
      if (tipoInsumo === 'medicamento' && nombreMedicamento) {
        descripcion += ` - ${nombreMedicamento}`;
      }

      const donacionData = {
        id_usuario: usuario.idUsuario,
        id_refugio: parseInt(refugio),
        nombre_insumo: tipoInsumo === 'medicamento' ? nombreMedicamento : tipoInsumo,
        descripcion: descripcion,
        cantidad: parseInt(cantidad)
      };

      console.log('Enviando donación de insumos:', donacionData);

      const response = await fetch(`${API_BASE_URL}/api/donaciones/insumos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donacionData),
      });

      const resultado = await response.json();

      if (response.ok) {
        const refugioSeleccionado = refugios.find(r => r.idAsociacion === parseInt(refugio));
        Alert.alert(
          'Donación Exitosa', 
          `Gracias por tu donación de ${tipoInsumo}. El refugio ${refugioSeleccionado?.nombre} será contactado.`,
          [
            {
              text: 'OK',
              onPress: () => {
                resetearFormulario();
                if (navigation) {
                  navigation.goBack();
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', resultado.mensaje || 'Error al registrar donación');
      }
    } catch (error) {
      console.error('Error al procesar donación de insumos:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    }
  };

  const procesarDonacionMonetaria = async () => {
    try {
      const donacionData = {
        id_usuario: usuario.idUsuario,
        id_refugio: parseInt(refugio),
        monto: parseFloat(montoMonetario)
      };

      console.log('Enviando donación monetaria:', donacionData);

      const response = await fetch(`${API_BASE_URL}/api/donaciones/monetaria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donacionData),
      });

      const resultado = await response.json();

      if (response.ok) {
        const refugioSeleccionado = refugios.find(r => r.idAsociacion === parseInt(refugio));
        Alert.alert(
          'Donación Registrada', 
          `Gracias por tu donación de $${montoMonetario} al refugio ${refugioSeleccionado?.nombre}. Serás redirigido al pago.`,
          [
            {
              text: 'Proceder al Pago',
              onPress: () => {
                resetearFormulario();
                irAPasarelaPago(resultado);
                if (navigation) {
                  navigation.goBack();
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', resultado.mensaje || 'Error al registrar donación');
      }
    } catch (error) {
      console.error('Error al procesar donación monetaria:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    }
  };

  const procesarDonacion = async () => {
    if (cargando) return;

    setCargando(true);

    try {
      if (tipoDonacion === 'insumos') {
        if (!validarCamposInsumos()) {
          setCargando(false);
          return;
        }
        await procesarDonacionInsumos();
      } else {
        if (!validarCamposMonetarios()) {
          setCargando(false);
          return;
        }
        await procesarDonacionMonetaria();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar la donación. Intenta nuevamente.');
      console.error('Error general al procesar donación:', error);
    } finally {
      setCargando(false);
    }
  };

  const resetearFormulario = () => {
    setTipoInsumo('');
    setCantidad('');
    setRefugio('');
    setNombreMedicamento('');
    setMontoMonetario('');
  };

  const irAPasarelaPago = (donacionData) => {
    Alert.alert('Redirigiendo a Stripe', `Monto: $${donacionData.monto} 💳`);
    // Aquí integrar el SDK de Stripe
    // navigation.navigate('PasarelaPago', { donacion: donacionData });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Realizar Donación</Text>
        {usuario && (
          <Text style={styles.userInfo}>Usuario: {usuario.nombre || 'Invitado'}</Text>
        )}
      </View>

      {/* Tipo de donación */}
      <View style={styles.card}>
        <Text style={styles.subtitulo}>Tipo de donación</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.radio,
              tipoDonacion === 'insumos' && styles.radioSeleccionado,
            ]}
            onPress={() => {
              setTipoDonacion('insumos');
              // Reset campos cuando cambias tipo
              setMontoMonetario('');
            }}
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
            onPress={() => {
              setTipoDonacion('monetaria');
              // Reset campos cuando cambias tipo
              setTipoInsumo('');
              setCantidad('');
              setNombreMedicamento('');
            }}
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

      {/* Formulario de Insumos */}
      {tipoDonacion === 'insumos' && (
        <>
          <View style={styles.card}>
            <Text style={styles.subtitulo}>
              Donación de {tipoInsumo === 'medicamento' ? 'medicamentos' : 'insumos'}
            </Text>

            <Picker
              selectedValue={tipoInsumo}
              onValueChange={(itemValue) => {
                setTipoInsumo(itemValue);
                // Reset medicamento si cambia tipo
                if (itemValue !== 'medicamento') {
                  setNombreMedicamento('');
                }
              }}
              style={styles.picker}
            >
              <Picker.Item label="Seleccione tipo de insumo" value="" />
              <Picker.Item label="Alimento" value="alimento" />
              <Picker.Item label="Medicamento" value="medicamento" />
              <Picker.Item label="Accesorios" value="accesorios" />
            </Picker>

            {/* Campo específico para medicamento */}
            {tipoInsumo === 'medicamento' && (
              <TextInput
                placeholder="Especifica el medicamento (ej: Antibiótico, Vitaminas, etc.)"
                value={nombreMedicamento}
                onChangeText={setNombreMedicamento}
                style={[styles.input, !nombreMedicamento && styles.inputError]}
              />
            )}

            <TextInput
              placeholder={`Cantidad ${tipoInsumo === 'alimento' ? '(kg)' : tipoInsumo === 'medicamento' ? '(unidades/mg)' : '(unidades)'}`}
              value={cantidad}
              onChangeText={setCantidad}
              keyboardType="numeric"
              style={[styles.input, !cantidad && styles.inputError]}
            />
          </View>
        </>
      )}

      {/* Formulario de Donación Monetaria */}
      {tipoDonacion === 'monetaria' && (
        <View style={styles.card}>
          <Text style={styles.subtitulo}>Donación Monetaria</Text>
          <TextInput
            placeholder="Monto a donar ($)"
            value={montoMonetario}
            onChangeText={setMontoMonetario}
            keyboardType="numeric"
            style={[styles.input, !montoMonetario && styles.inputError]}
          />
          <Text style={styles.infoTexto}>
            Tu donación será procesada a través de Stripe de forma segura
          </Text>
        </View>
      )}

      {/* Refugio - Se muestra para ambos tipos */}
      <View style={styles.card}>
        <Text style={styles.subtitulo}>Seleccionar refugio</Text>
        <Picker
          selectedValue={refugio}
          onValueChange={(itemValue) => setRefugio(itemValue)}
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
        {refugios.length === 0 && (
          <Text style={styles.infoTexto}>Cargando refugios...</Text>
        )}
      </View>

      {/* Botón Donar */}
      <TouchableOpacity
        style={[styles.botonDonar, cargando && styles.botonDeshabilitado]}
        onPress={procesarDonacion}
        disabled={cargando}
      >
        <Text style={styles.textoBoton}>
          {cargando ? 'Procesando...' : 
           tipoDonacion === 'insumos' ? 'Registrar Donación' : 'Proceder al Pago'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

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
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
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