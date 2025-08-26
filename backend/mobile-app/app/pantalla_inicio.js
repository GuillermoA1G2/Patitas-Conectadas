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
  Animated,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.80; // 80% del ancho de la pantalla

export default function NosotrosScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [slideAnimation] = useState(new Animated.Value(-MENU_WIDTH));

  const toggleMenu = () => {
    if (menuVisible) {
      // Cerrar menú
      Animated.timing(slideAnimation, {
        toValue: -MENU_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setMenuVisible(false);
      });
    } else {
      // Abrir menú
      setMenuVisible(true);
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const menuItems = [
    {
      title: 'Perfil Asociación',
      icon: 'business-outline',
      route: '/perfil_asociaciones',
      color: '#FF6B6B',
      gradient: ['#FF6B6B', '#FF8E53']
    },
    {
      title: 'Perfil Usuario',
      icon: 'person-outline',
      route: '/PerfilUsuario',
      color: '#4ECDC4',
      gradient: ['#4ECDC4', '#44A08D']
    },
    {
      title: 'Formulario de Adopción',
      icon: 'heart-outline',
      route: '/formulario_adopcion',
      color: '#96CEB4',
      gradient: ['#96CEB4', '#FFECD2']
    },
    {
      title: 'Verificación de Cuenta',
      icon: 'shield-checkmark-outline',
      route: '/verificacion',
      color: '#FECA57',
      gradient: ['#FECA57', '#FF9FF3']
    },
    {
      title: 'Asociaciones',
      icon: 'people-outline',
      route: '/Asociaciones',
      color: '#A55EEA',
      gradient: ['#A55EEA', '#FD79A8']
    },
    {
      title: 'Casos de Éxito',
      icon: 'star-outline',
      route: '/CasosExito',
      color: '#26DE81',
      gradient: ['#26DE81', '#20BF55']
    },
    {
      title: 'Donación',
      icon: 'gift-outline',
      route: '/Donacion',
      color: '#FD79A8',
      gradient: ['#FD79A8', '#FDBB2D']
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <View style={styles.hamburgerContainer}>
            <View style={[styles.hamburgerLine, menuVisible && styles.hamburgerLineActive]} />
            <View style={[styles.hamburgerLine, styles.hamburgerLineMiddle, menuVisible && styles.hamburgerLineMiddleActive]} />
            <View style={[styles.hamburgerLine, menuVisible && styles.hamburgerLineActive]} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nosotros</Text>
      </View>

      {/* Overlay y Menú Lateral */}
      {menuVisible && (
        <Modal transparent={true} visible={menuVisible} animationType="none">
          <View style={styles.modalContainer}>
            {/* Overlay oscuro */}
            <TouchableOpacity 
              style={styles.overlay} 
              activeOpacity={1} 
              onPress={toggleMenu}
            />
            
            {/* Menú lateral */}
            <Animated.View 
              style={[
                styles.sideMenu, 
                { 
                  transform: [{ translateX: slideAnimation }],
                  width: MENU_WIDTH,
                }
              ]}
            >
              {/* Header del menú */}
              <View style={styles.menuHeader}>
                <View style={styles.profileSection}>
                  <View style={styles.avatarContainer}>
                    <Ionicons name="paw" size={32} color="#000000" />
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.welcomeText}>¡Bienvenido!</Text>
                    <Text style={styles.appName}>Patitas Conectadas</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#000000" />
                </TouchableOpacity>
              </View>

              {/* Lista de menú */}
              <ScrollView 
                style={styles.menuScrollView}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.menuSection}>
                  <Text style={styles.sectionTitle}>NAVEGACIÓN</Text>
                  
                  {menuItems.map((item, index) => (
                    <Link href={item.route} key={index} asChild>
                      <TouchableOpacity 
                        style={styles.menuItem} 
                        onPress={toggleMenu}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                          <Ionicons name={item.icon} size={22} color="#fff" />
                        </View>
                        <Text style={styles.menuItemText}>{item.title}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#B0BEC5" />
                      </TouchableOpacity>
                    </Link>
                  ))}
                </View>

                {/* Sección de logout */}
                <View style={styles.logoutSection}>
                  <View style={styles.divider} />
                  <Link href="/inicio_sesion" asChild>
                    <TouchableOpacity 
                      style={styles.logoutItem} 
                      onPress={toggleMenu}
                      activeOpacity={0.7}
                    >
                      <View style={styles.logoutIconContainer}>
                        <Ionicons name="log-out-outline" size={22} color="#FF5252" />
                      </View>
                      <Text style={styles.logoutText}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                  </Link>
                </View>

                {/* Footer del menú */}
                <View style={styles.menuFooter}>
                  <Text style={styles.footerText}>Versión 1.0.0</Text>
                  <Text style={styles.footerSubtext}>Patitas Conectadas © 2024</Text>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* Contenido principal */}
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
        <Text style={styles.subtitulo}>Quienes Somos</Text>
        <Text style={styles.texto}>
          Patitas conectadas es un grupo de personas que busca ayudar a las asociaciones y animalitos que más lo necesitan.
        </Text>
        <Text style={styles.texto}></Text>
        <Image source={require('../assets/us.png')} style={styles.logo} />

        <Text style={styles.subtitulo}>Que buscamos</Text>
        <Text style={styles.texto}>
          Buscamos ayudar a los refugios a encontrar el hogar más adecuado a los animales que lo necesitan.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a2d2ff',
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  menuButton: {
    padding: 8,
    marginRight: 15,
  },
  
  hamburgerContainer: {
    width: 24,
    height: 20,
    justifyContent: 'space-between',
  },
  
  hamburgerLine: {
    width: 24,
    height: 3,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  
  hamburgerLineMiddle: {
    width: 20,
  },
  
  hamburgerLineActive: {
    backgroundColor: '#666',
  },
  
  hamburgerLineMiddleActive: {
    opacity: 0.5,
  },
  
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },

  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  sideMenu: {
    height: '100%',
    backgroundColor: '#fff',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },

  menuHeader: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  profileInfo: {
    flex: 1,
  },

  welcomeText: {
    fontSize: 14,
    color: '000000(28, 216, 53, 0.8)',
    marginBottom: 2,
  },

  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },

  closeButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  menuScrollView: {
    flex: 1,
  },

  menuSection: {
    paddingTop: 20,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    marginLeft: 20,
    marginBottom: 10,
    letterSpacing: 1,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#37474F',
  },

  logoutSection: {
    marginTop: 20,
  },

  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
    marginBottom: 10,
  },

  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 12,
  },

  logoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  logoutText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#FF5252',
  },

  menuFooter: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 20,
  },

  footerText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 4,
  },

  footerSubtext: {
    fontSize: 11,
    color: '#BDBDBD',
  },

  logo: {
    width: 350,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 10,
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
});