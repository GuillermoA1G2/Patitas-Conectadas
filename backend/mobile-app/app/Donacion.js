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

export default function DonacionScreen() {
  const [tipoDonacion, setTipoDonacion] = useState('insumos');
  const [tipoInsumo, setTipoInsumo] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [refugio, setRefugio] = useState('');
  const [nombreMedicamento, setNombreMedicamento] = useState(''); 

  const refugios = ['Refugio Patitas', 'Huellas Felices', 'Manos que Ayudan'];

  const enviarDonacion = () => {
    if (tipoDonacion === 'insumos') {
      if (!tipoInsumo || !cantidad || !refugio) {
        Alert.alert('Error', 'Por favor llena todos los campos de la donación de insumos');
        return;
      }
      if (tipoInsumo === 'medicamento' && !nombreMedicamento) {
        Alert.alert('Error', 'Por favor especifica el medicamento que deseas donar');
        return;
      }
    }
    Alert.alert('Éxito', 'Gracias por tu donación 🙌');
  };

  const irAPasarelaPago = () => {
    Alert.alert('Redirigiendo a Stripe... 💳');
    // Aquí puedes integrar el SDK de Stripe o navegación
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
            onPress={() => setTipoDonacion('insumos')}
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
            onPress={() => setTipoDonacion('monetaria')}
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
              onValueChange={(itemValue) => setTipoInsumo(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Seleccione tipo de insumo" value="" />
              <Picker.Item label="Alimento" value="alimento" />
              <Picker.Item label="Medicamento" value="medicamento" />
              <Picker.Item label="Accesorios" value="accesorios" />
            </Picker>

            {/*medicamento*/}
            {tipoInsumo === 'medicamento' && (
              <TextInput
                placeholder="Especifica el medicamento"
                value={nombreMedicamento}
                onChangeText={setNombreMedicamento}
                style={styles.input}
              />
            )}

            <TextInput
              placeholder="Cantidad"
              value={cantidad}
              onChangeText={setCantidad}
              keyboardType="numeric"
              style={styles.input}
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

      {/* Botón Donar */}
      <TouchableOpacity
        style={styles.botonDonar}
        onPress={tipoDonacion === 'insumos' ? enviarDonacion : irAPasarelaPago}
      >
        <Text style={styles.textoBoton}>Donar</Text>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },
  subtitulo: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
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
  },
  radioTexto: {
    color: '#000', 
  },
  radioTextoSeleccionado: {
    color: '#000', 
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
  },
  botonDonar: {
    backgroundColor: '#ff69b4',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  textoBoton: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  barraInferior: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#a2d2ff',
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
  },
  icono: {
    fontSize: 22,
  },
});