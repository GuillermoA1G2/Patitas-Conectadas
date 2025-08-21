import React, {useState} from 'react';
import { Link } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

export default function PerfilAsociacion() {
  const ubicacion = {
    latitude: 20.6755,
    longitude: -103.3872,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const [menuVisible, setMenuVisible] = useState(false);
  const toggleMenu = () => setMenuVisible(!menuVisible);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Refugio Patitas Felices</Text>
        <TouchableOpacity onPress={toggleMenu}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Menú desplegable con scroll */}
      <Modal transparent={true} visible={menuVisible} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={toggleMenu}>
          <View style={styles.menu}>
            <ScrollView 
              style={styles.menuScrollContainer}
              contentContainerStyle={styles.menuContent}
              showsVerticalScrollIndicator={true}>

              <Link href="/pantalla_inicio" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Inicio</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />
              
              <Link href="/perfil_macota" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Perfil Mascota</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />

              <Link href="/registrar_animal" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Registro Animal</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />

              <Link href="/DonacionScre" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Scre</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />

              <Link href="/FormularioDonacionesAso" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Formulario Donaciones Aso</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />

              <Link href="/HistorialDonaciones" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Historial de Donaciones Aso</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />

              <Link href="/PublicarCaso" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Publicar Caso</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />

              <Link href="/inicio_sesion" asChild>
                <TouchableOpacity style={styles.customButton} onPress={toggleMenu}>
                  <Ionicons name="arrow-back" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>Cerrar Sesión</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />

            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
        />
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editText}>Editar Perfil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acerca de nosotros</Text>
        <Text style={styles.sectionText}>
          Somos un refugio comprometido con el rescate y rehabilitación de animales abandonados. Nuestro objetivo es encontrar hogares amorosos para cada mascota.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contacto</Text>
        <Text style={styles.sectionText}>📧 refugio@mail.com</Text>
        <Text style={styles.sectionText}>📞 +52 33 1234 56 78</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ubicación</Text>
        <Text style={styles.sectionText}>📍 Av. Circunvalación 123, Guadalajara.</Text>
        <MapView style={styles.map} region={ubicacion}>
          <Marker coordinate={ubicacion} title="Refugio Patitas Felices" />
        </MapView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 25,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#a2d2ff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
  },
  headerTitle: {
    color: '#000000',
    fontSize: 20,
    fontWeight: 'bold',
  },

  menuItemContainer: {
    paddingVertical: 10,
    paddingHorizontal: 1,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  menuItem: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  menuContent: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  menuIcon: {
    fontSize: 26,
    marginRight: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  menu: {
    backgroundColor: 'white',
    borderRadius: 10,
    maxHeight: '200%',
    minHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  menuScrollContainer: {
    flex: 1,
    maxHeight: '100%',
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FC7EAC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    borderRadius: 60,
    backgroundColor: '#ace2e1',
  },
  editButton: {
    backgroundColor: '#ff6b81',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
  },
  editText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  sectionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 10,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
});