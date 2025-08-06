import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PerfilAnimal() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={28} color="#fff" />
        <Text style={styles.headerTitle}>Perfil de Luna</Text>
        {/* Placeholder para simetría */}
        <View style={{ width: 28 }} />
      </View>

      <Image
        source={require('../assets/luna.jpeg')}
        style={styles.fotoAnimal}
      />

      <View style={styles.infoContainer}>
        <Text style={styles.nombre}>Luna</Text>
        <Text style={styles.detalle}>• Edad: 2 años</Text>
        <Text style={styles.detalle}>• Raza: Mestiza</Text>
        <Text style={styles.detalle}>• Tamaño: Mediano</Text>
        <Text style={styles.detalle}>• Género: Hembra</Text>
        <Text style={styles.detalle}>• Esterilizada: Sí</Text>
      </View>

      <View style={styles.descripcionContainer}>
        <Text style={styles.tituloSeccion}>Descripción</Text>
        <Text style={styles.descripcion}>
          Luna es una perrita cariñosa y juguetona que busca un hogar amoroso. Se lleva bien con otros perros y le encanta salir a caminar. Ideal para familias activas.
        </Text>
      </View>

      <TouchableOpacity style={styles.botonAdoptar}>
        <Text style={styles.textoBoton}>Adoptar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#ff6b81',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fotoAnimal: {
    width: '100%',
    height: 250,
    borderRadius: 15,
    marginBottom: 20,
  },
  infoContainer: {
    marginBottom: 20,
  },
  nombre: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  detalle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  descripcionContainer: {
    marginBottom: 30,
  },
  tituloSeccion: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  descripcion: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  botonAdoptar: {
    backgroundColor: '#4cd137',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBoton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});