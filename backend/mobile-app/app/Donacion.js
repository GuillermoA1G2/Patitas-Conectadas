import React, { useState } from 'react';
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

export default function DonacionScreen({ navigation }) {
  const [tipoDonacion, setTipoDonacion] = useState('insumos');
  const [tipoInsumo, setTipoInsumo] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [refugio, setRefugio] = useState('');
  const [nombreMedicamento, setNombreMedicamento] = useState('');
  
  // Estados para donación monetaria
  const [montoMonetario, setMontoMonetario] = useState('');

  const refugios = ['Refugio Patitas', 'Huellas Felices', 'Manos que Ayudan'];

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
    
    return true;
  };

  const procesarDonacion = async () => {
    try {
      let donacionData = {};
      
      if (tipoDonacion === 'insumos') {
        // Validar campos de insumos
        if (!validarCamposInsumos()) {
          return;
        }
        
        // Crear objeto de donación de insumos
        donacionData = {
          tipo: 'insumos',
          tipoInsumo,
          cantidad: parseFloat(cantidad),
          refugio,
          fecha: new Date().toISOString(),
          estado: 'pendiente',
          ...(tipoInsumo === 'medicamento' && { nombreMedicamento })
        };
        
      } else {
        // Validar campos monetarios
        if (!validarCamposMonetarios()) {
          return;
        }
        
        // Crear objeto de donación monetaria
        donacionData = {
          tipo: 'monetaria',
          monto: parseFloat(montoMonetario),
          fecha: new Date().toISOString(),
          estado: 'pendiente'
        };
      }

      // Simular envío al backend (descomenta cuando tengas el endpoint)
      // await axios.post('http://TU_BACKEND_URL/api/donaciones', donacionData);
      
      // Por ahora solo mostramos en consola
      console.log('Donación procesada:', donacionData);
      
      // Mostrar mensaje de éxito
      Alert.alert(
        'Donación Exitosa', 
        tipoDonacion === 'insumos' 
          ? `Gracias por tu donación de ${tipoInsumo}. El refugio ${refugio} será contactado.`
          : `Gracias por tu donación de $${montoMonetario}. Serás redirigido al pago.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset de los campos
              resetearFormulario();
              
              // Si es donación monetaria, ir a pasarela de pago
              if (tipoDonacion === 'monetaria') {
                irAPasarelaPago(donacionData);
              }
              
              // Opcional: navegar hacia atrás
              if (navigation) {
                navigation.goBack();
              }
            }
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar la donación. Intenta nuevamente.');
      console.error('Error al procesar donación:', error);
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
    // Aquí integrar el SDK de Stripe o navegación
    // navigation.navigate('PasarelaPago', { donacion: donacionData });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Realizar Donación</Text>
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
              setRefugio('');
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

          {/* Refugio */}
          <View style={styles.card}>
            <Text style={styles.subtitulo}>Seleccionar refugio</Text>
            <Picker
              selectedValue={refugio}
              onValueChange={(itemValue) => setRefugio(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Seleccionar refugio para donar" value="" />
              {refugios.map((ref, i) => (
                <Picker.Item key={i} label={ref} value={ref} />
              ))}
            </Picker>
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

      {/* Botón Donar */}
      <TouchableOpacity
        style={styles.botonDonar}
        onPress={procesarDonacion}
      >
        <Text style={styles.textoBoton}>
          {tipoDonacion === 'insumos' ? 'Registrar Donación' : 'Proceder al Pago'}
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
  textoBoton: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});