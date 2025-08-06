import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function FormInsumos() {
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [tipo, setTipo] = useState('');
  const [urgencia, setUrgencia] = useState('');
  const [solicitudId, setSolicitudId] = useState('');

  const enviarSolicitud = () => {
    if (!nombre || !cantidad || !tipo || !urgencia || !solicitudId) {
      Alert.alert('Error', 'Por favor llena todos los campos');
      return;
    }

    // Aquí podrías hacer un fetch o axios.post al backend
    console.log({ nombre, cantidad, tipo, urgencia, solicitudId });
    Alert.alert('Éxito', 'Solicitud registrada correctamente');

    // Reset
    setNombre('');
    setCantidad('');
    setTipo('');
    setUrgencia('');
    setSolicitudId('');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Solicitud de Insumos</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre del producto o insumo"
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        style={styles.input}
        placeholder="Cantidad"
        keyboardType="numeric"
        value={cantidad}
        onChangeText={setCantidad}
      />

      <TextInput
        style={styles.input}
        placeholder="Tipo (medicina, comida, etc.)"
        value={tipo}
        onChangeText={setTipo}
      />

      <Text style={styles.label}>Nivel de urgencia</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={urgencia}
          onValueChange={(itemValue) => setUrgencia(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Selecciona..." value="" />
          <Picker.Item label="Bajo" value="bajo" />
          <Picker.Item label="Medio" value="medio" />
          <Picker.Item label="Alto" value="alto" />
        </Picker>
      </View>

      <TextInput
        style={styles.input}
        placeholder="ID de solicitud"
        value={solicitudId}
        onChangeText={setSolicitudId}
      />

      <TouchableOpacity style={styles.boton} onPress={enviarSolicitud}>
        <Text style={styles.textoBoton}>Enviar Solicitud</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#3a0ca3',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 10,
    marginBottom: 15,
    borderRadius: 6,
  },
  label: {
    marginBottom: 5,
    fontWeight: '600',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    marginBottom: 15,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  boton: {
    backgroundColor: '#7209b7',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  textoBoton: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
