import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';

export default function AsociacionesScreen({ navigation }) {
  const [busqueda, setBusqueda] = useState('');

  const asociaciones = [
    {
      id: '1',
      nombre: 'Patitas Felices A.C',
      ubicacion: 'Zapopan',
      distancia: '3.2 km',
      animales: 45,
      donaciones: 4,
      logo: require('../assets/logo.png'),
    },
    {
      id: '2',
      nombre: 'Huellitas de Amor',
      ubicacion: 'Guadalajara',
      distancia: '5.7 km',
      animales: 32,
      donaciones: 5,
      logo: require('../assets/logo.png'),
    },
    {
      id: '3',
      nombre: 'Callejeritos Rescate',
      ubicacion: 'Tlaquepaque',
      distancia: '8.1 km',
      animales: 19,
      donaciones: 2,
      logo: require('../assets/logo.png'),
    },
  ];

  const asociacionesFiltradas = asociaciones.filter(a =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirPerfil = (asociacion) => {
    navigation.navigate('PerfilAsociacion', { asociacion });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Asociaciones</Text>
      </View>

      {/* Buscador */}
      <TextInput
        placeholder="Buscar Asociaciones"
        value={busqueda}
        onChangeText={setBusqueda}
        style={styles.buscador}
      />

      {/* Lista */}
      <FlatList
        data={asociacionesFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => abrirPerfil(item)}>
            <Image source={item.logo} style={styles.logo} />
            <View style={styles.info}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              <Text style={styles.detalle}>
                {item.distancia} – {item.ubicacion}
              </Text>
              <Text style={styles.disponibles}>
                {item.animales} animales disponibles – {item.donaciones} solicitudes
              </Text>
            </View>
            <Text style={styles.check}>✅</Text>
          </TouchableOpacity>
        )}
      />

      {/* Barra inferior */}
      <View style={styles.barraInferior}>
        <Text style={styles.icono}>🏠</Text>
        <Text style={styles.icono}>🔍</Text>
        <Text style={styles.icono}>👤</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: {
    backgroundColor: '#a2d2ff',
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  titulo: { fontSize: 20, fontWeight: 'bold' },
  buscador: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 10,
    borderRadius: 8,
    elevation: 3,
  },
  card: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 10,
  },
  info: {
    flex: 1,
  },
  nombre: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  detalle: {
    fontSize: 13,
    color: '#555',
  },
  disponibles: {
    fontSize: 12,
    color: '#777',
  },
  check: {
    fontSize: 18,
  },
  barraInferior: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#a2d2ff',
    paddingVertical: 12,
    borderRadius: 20,
    marginHorizontal: '5%',
    marginBottom: 10,
  },
  icono: {
    fontSize: 22,
  },
});
