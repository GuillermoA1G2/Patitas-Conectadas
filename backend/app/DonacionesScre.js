import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function DonacionesScreen() {
  const [refugioSeleccionado, setRefugioSeleccionado] = useState('');

  const refugios = ['Refugio Patitas Felices', 'Manos que Salvan', 'Huellas Unidas'];

  const necesidades = [
    { id: 1, nombre: 'Alimentos para cachorros', prioridad: 'Urgente' },
    { id: 2, nombre: 'Medicinas (antibióticos)', prioridad: 'Alta Prioridad' },
    { id: 3, nombre: 'Mantas y cobijas', prioridad: 'Media Prioridad' },
    { id: 4, nombre: 'Donación monetaria', prioridad: 'Ayuda al refugio con una aportación económica', monetaria: true },
  ];

  const donar = (necesidad) => {
    if (necesidad.monetaria) {
      Alert.alert('Stripe', 'Redirigiendo a pasarela de pago...');
    } else {
      Alert.alert('Formulario', `Donando a: ${necesidad.nombre}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Selector de refugio */}
      <Text style={styles.subtitulo}>Selecciona un refugio</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={refugioSeleccionado}
          onValueChange={(itemValue) => setRefugioSeleccionado(itemValue)}
        >
          <Picker.Item label="Selecciona un refugio" value="" />
          {refugios.map((r, index) => (
            <Picker.Item key={index} label={r} value={r} />
          ))}
        </Picker>
      </View>

      {/* Info del refugio */}
      {refugioSeleccionado !== '' && (
        <View style={styles.cardRefugio}>
          <Text style={styles.refugioNombre}>{refugioSeleccionado}</Text>
          <Text style={styles.refugioUbicacion}>Guadalajara, Jalisco - Verificado</Text>
          <Text style={styles.iconoCasa}>🏠</Text>
        </View>
      )}

      {/* Lista de necesidades */}
      <Text style={styles.subtitulo}>Lista de necesidades</Text>
      {necesidades.map((item) => (
        <View
          key={item.id}
          style={[
            styles.necesidad,
            item.monetaria ? styles.monetaria : null,
          ]}
        >
          <View>
            <Text style={styles.nombreNecesidad}>{item.nombre}</Text>
            <Text style={styles.prioridad}>{item.prioridad}</Text>
          </View>
          <TouchableOpacity
            style={styles.botonDonar}
            onPress={() => donar(item)}
          >
            <Text style={styles.textoDonar}>Donar</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Barra inferior */}
      <View style={styles.barraInferior}>
        <Text style={styles.icono}>🏠</Text>
        <Text style={styles.icono}>🔍</Text>
        <Text style={styles.icono}>👤</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    flex: 1,
  },
  subtitulo: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 10,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },
  cardRefugio: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    flexDirection: 'column',
    alignItems: 'flex-start',
    position: 'relative',
  },
  refugioNombre: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  refugioUbicacion: {
    fontSize: 14,
    color: '#666',
  },
  iconoCasa: {
    position: 'absolute',
    right: 15,
    top: 15,
    fontSize: 20,
  },
  necesidad: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monetaria: {
    borderColor: '#bde0fe',
    borderWidth: 2,
  },
  nombreNecesidad: {
    fontSize: 15,
    fontWeight: '600',
  },
  prioridad: {
    fontSize: 13,
    color: '#777',
  },
  botonDonar: {
    backgroundColor: '#4ade80',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  textoDonar: {
    color: 'white',
    fontWeight: 'bold',
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
