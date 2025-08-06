import React, { useState } from 'react';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';

export default function NosotrosScreen() {
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => setMenuVisible(!menuVisible);

  return (
    <View style={styles.container}>
      {/* Menú superior */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nosotros</Text>
      </View>

      {/* Menú desplegable con scroll */}
      <Modal transparent={true} visible={menuVisible} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={toggleMenu}>
          <View style={styles.menu}>
            <ScrollView 
              style={styles.menuScrollContainer}
              contentContainerStyle={styles.menuContent}
              showsVerticalScrollIndicator={true}
            >
              <Link href="/perfil_asociaciones" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Perfil Asociación</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />

              <Link href="/PerfilUsuario" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Perfil Usuario</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />

              <Link href="/registro_usuarios" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Registro</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />

              <Link href="/formulario_adopcion" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Formulario de Adopción</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />

              <Link href="/verificacion" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Verificación de Cuenta</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />
              
              <Link href="/Asociaciones" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Asociaciones</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />

              <Link href="/CasosExito" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Casos de Éxito</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />

              <Link href="/Donacion" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Donación</Text>
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

              <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                <Text style={styles.menuItem}>Inicio</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Contenido principal */}
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
        <Text style={styles.subtitulo}>Quienes Somos</Text>
        <Text style={styles.texto}>
          Patitas conectadas es un grupo de personas que busca ayudar a las asociaciones y animalitos que más lo necesitan.
        </Text>

        <Text style={styles.subtitulo}>Que buscamos</Text>
        <Text style={styles.texto}>
          Buscamos ayudar a los refugios a encontrar el hogar más adecuado a los animales que lo necesitan.
        </Text>
      </ScrollView>

      {/* Barra inferior de navegación */}
      <View style={styles.barraInferior}>
        <TouchableOpacity>
          <Text style={styles.icono}>🏠</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.icono}>🔍</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.icono}>👤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a2d2ff',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  menuIcon: {
    fontSize: 26,
    marginRight: 15,
  },
  logo: {
    width: 350,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    
  },
  scroll: {
    padding: 20,
    paddingBottom: 100,
    alignItems: 'center',
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginTop: 20,
    textAlign: 'center',
  },
  texto: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  barraInferior: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#90e0ef',
    paddingVertical: 12,
    position: 'absolute',
    bottom: 20, 
    width: '90%',
    marginHorizontal: '5%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
  },
  icono: {
    fontSize: 24,
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
  menuContent: {
    paddingVertical: 10,
    paddingHorizontal: 10,
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
});