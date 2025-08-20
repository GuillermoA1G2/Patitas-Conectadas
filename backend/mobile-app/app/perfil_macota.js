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
        <View style={{ width: 28 }} /> {/* Placeholder para simetría */}
      </View>

      <Image
        source={require('../assets/luna.jpeg')} // Asegúrate de que la imagen esté en assets
        style={styles.fotoAnimal}
      />

      {/* Información en tarjetas */}
      <View style={styles.infoContainer}>
        <Text style={styles.nombre}>Luna</Text>
        <View style={styles.datosBox}>
          <Text style={styles.label}>Edad: <Text style={styles.valor}>2 años</Text></Text>
        </View>
        <View style={styles.datosBox}>
          <Text style={styles.label}>Raza: <Text style={styles.valor}>Mestiza</Text></Text>
        </View>
        <View style={styles.datosBox}>
          <Text style={styles.label}>Tamaño: <Text style={styles.valor}>Mediano</Text></Text>
        </View>
        <View style={styles.datosBox}>
          <Text style={styles.label}>Género: <Text style={styles.valor}>Hembra</Text></Text>
        </View>
        <View style={styles.datosBox}>
          <Text style={styles.label}>Esterilizada: <Text style={styles.valor}>Sí</Text></Text>
        </View>
      </View>

      <View style={styles.descripcionContainer}>
        <Text style={styles.tituloSeccion}>Descripción</Text>
        <Text style={styles.descripcion}>
          Luna es una perrita cariñosa y juguetona que busca un hogar amoroso. 
          Se lleva bien con otros perros y le encanta salir a caminar. 
          Ideal para familias activas.
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
    backgroundColor: '#a2d2ff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#000000',
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
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  datosBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
  },
  valor: {
    fontWeight: 'normal',
    color: '#555',
  },
  descripcionContainer: {
    marginBottom: 30,
    backgroundColor: '#fff7f9',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffccd5',
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
    backgroundColor: '#339c23ff',
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