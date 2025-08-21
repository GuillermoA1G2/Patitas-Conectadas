import React, { useState } from 'react';
import { Link } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';

export default function CasosExitoScreen({ navigation }) {
  const [casos, setCasos] = useState([
    {
      id: '1',
      nombre: 'Luna',
      asociacion: 'Huellitas de Amor',
      historia: 'Luna fue adoptada por una familia amorosa en Guadalajara. Ahora vive feliz con dos niños que la adoran.',
      fecha: '12 Jul 2025',
      imagen: require('../assets/luna.jpeg'), // o video
    },
    {
      id: '2',
      nombre: 'Rocky',
      asociacion: 'Callejeritos Rescate',
      historia: 'Después de años en la calle, Rocky encontró un hogar seguro y un gran jardín para correr.',
      fecha: '08 Jul 2025',
      imagen: require('../assets/rocky.jpeg'),
    },
  ]);

  const renderCaso = ({ item }) => (
    <View style={styles.caso}>
      <Image source={item.imagen} style={styles.imagen} />
      <Text style={styles.nombre}>{item.nombre}</Text>
      <Text style={styles.asociacion}>Publicado por: {item.asociacion}</Text>
      <Text style={styles.historia}>{item.historia}</Text>
      <Text style={styles.fecha}>{item.fecha}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Casos de Éxito</Text>
          <Link href="/PublicarCas" asChild>
            <TouchableOpacity onPress={() => navigation.navigate('PublicarCaso')}>
              <Text style={styles.mas}>➕ Publicar</Text>
            </TouchableOpacity>
          </Link>
      </View>

      <FlatList
        data={casos}
        keyExtractor={(item) => item.id}
        renderItem={renderCaso}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: {
    backgroundColor: '#a2d2ff',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titulo: { fontSize: 20, fontWeight: 'bold' },
  mas: { fontSize: 16, color: '#0077cc' },
  caso: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    elevation: 3,
  },
  imagen: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
  },
  nombre: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  asociacion: { fontSize: 14, color: '#666', marginBottom: 6 },
  historia: { fontSize: 14, color: '#333', marginBottom: 6 },
  fecha: { fontSize: 12, color: '#aaa', textAlign: 'right' },
  icono: {
    fontSize: 22,
  },
});
