import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ImageBackground,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// ========================================================================================
// CONSTANTS AND CONFIGURATION
// ========================================================================================

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.65;

const API_BASE_URL = 'http://172.20.10.5:3000';

// ========================================================================================
// SERVICES
// ========================================================================================

class ApiService {
  static async getAsociaciones() {
    try {
      console.log('Intentando conectar a:', `${API_BASE_URL}/api/refugios`);
      
      const response = await fetch(`${API_BASE_URL}/api/refugios`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 segundos timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error en la respuesta del servidor');
      }

      return data.refugios || [];
    } catch (error) {
      console.error('Error en ApiService.getAsociaciones:', error);
      
      if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
        throw new Error(
          'No se puede conectar al servidor. Verifica que:\n' +
          '1. El servidor esté corriendo en el puerto 3000\n' +
          '2. La IP en API_BASE_URL sea correcta\n' +
          '3. Estés en la misma red WiFi'
        );
      }
      
      throw error;
    }
  }
}

class MenuService {
  static getMenuItems() {
    return [
      {
        title: 'Inicio',
        icon: 'people-outline',
        route: '/pantalla_inicio',
        color: '#A55EEA',
        gradient: ['#A55EEA', '#FD79A8']
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
        title: 'Catalogo Mascotas',
        icon: 'star-outline',
        route: '/CatalogoMascotas',
        color: '#26DE81',
        gradient: ['#26DE81', '#20BF55']
      },
      {
        title: 'Donación',
        icon: 'gift-outline',
        route: '/Donaciones',
        color: '#FD79A8',
        gradient: ['#FD79A8', '#FDBB2D']
      }
    ];
  }

  static getAppInfo() {
    return {
      name: 'Patitas Conectadas',
      version: '1.0.0',
      copyright: 'Patitas Conectadas © 2024',
      welcomeMessage: '¡Bienvenido!'
    };
  }

  static getBackgroundImage() {
    return require('../assets/Fondo.png');
  }
}

class AnimationService {
  static createMenuAnimation(initialValue = -MENU_WIDTH) {
    return new Animated.Value(initialValue);
  }

  static animateMenuOpen(animation) {
    return new Promise((resolve) => {
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(resolve);
    });
  }

  static animateMenuClose(animation) {
    return new Promise((resolve) => {
      Animated.timing(animation, {
        toValue: -MENU_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start(resolve);
    });
  }
}

// ========================================================================================
// CUSTOM HOOKS
// ========================================================================================

const useMenuController = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [slideAnimation] = useState(AnimationService.createMenuAnimation());

  const openMenu = async () => {
    setMenuVisible(true);
    await AnimationService.animateMenuOpen(slideAnimation);
  };

  const closeMenu = async () => {
    await AnimationService.animateMenuClose(slideAnimation);
    setMenuVisible(false);
  };

  const toggleMenu = () => {
    if (menuVisible) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  return {
    menuVisible,
    slideAnimation,
    toggleMenu,
    closeMenu
  };
};

const useAppData = () => {
  const menuItems = MenuService.getMenuItems();
  const appInfo = MenuService.getAppInfo();
  const backgroundImage = MenuService.getBackgroundImage();

  return {
    menuItems,
    appInfo,
    backgroundImage
  };
};

const useAsociaciones = () => {
  const [asociaciones, setAsociaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAsociaciones = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      
      const data = await ApiService.getAsociaciones();
      setAsociaciones(data);
      
    } catch (e) {
      console.error("Error fetching asociaciones:", e);
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAsociaciones();
  }, []);

  const refresh = () => fetchAsociaciones(true);

  return {
    asociaciones,
    loading,
    error,
    refreshing,
    refresh
  };
};

// ========================================================================================
// COMPONENTS
// ========================================================================================

const HamburgerButton = ({ isActive, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.menuButton}>
    <View style={styles.hamburgerContainer}>
      <View style={[styles.hamburgerLine, isActive && styles.hamburgerLineActive]} />
      <View style={[
        styles.hamburgerLine,
        styles.hamburgerLineMiddle,
        isActive && styles.hamburgerLineMiddleActive
      ]} />
      <View style={[styles.hamburgerLine, isActive && styles.hamburgerLineActive]} />
    </View>
  </TouchableOpacity>
);

const Header = ({ title, menuVisible, onMenuToggle }) => (
  <View style={styles.header}>
    <HamburgerButton isActive={menuVisible} onPress={onMenuToggle} />
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

const MenuHeader = ({ appInfo, onClose }) => (
  <View style={styles.menuHeader}>
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        <Ionicons name="paw" size={32} color="#000000" />
      </View>
      <View style={styles.profileInfo}>
        <Text style={styles.welcomeText}>{appInfo.welcomeMessage}</Text>
        <Text style={styles.appName}>{appInfo.name}</Text>
      </View>
    </View>
    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
      <Ionicons name="close" size={24} color="#000000" />
    </TouchableOpacity>
  </View>
);

const MenuItem = ({ item, onPress }) => (
  <Link href={item.route} asChild>
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={22} color="#fff" />
      </View>
      <Text style={styles.menuItemText}>{item.title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#B0BEC5" />
    </TouchableOpacity>
  </Link>
);

const MenuContent = ({ menuItems, appInfo, onMenuClose }) => (
  <ScrollView
    style={styles.menuScrollView}
    showsVerticalScrollIndicator={false}
  >
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>NAVEGACIÓN</Text>

      {menuItems.map((item, index) => (
        <MenuItem
          key={index}
          item={item}
          onPress={onMenuClose}
        />
      ))}
    </View>

    <View style={styles.logoutSection}>
      <View style={styles.divider} />
      <Link href="/inicio_sesion" asChild>
        <TouchableOpacity
          style={styles.logoutItem}
          onPress={onMenuClose}
          activeOpacity={0.7}
        >
          <View style={styles.logoutIconContainer}>
            <Ionicons name="log-out-outline" size={22} color="#FF5252" />
          </View>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </Link>
    </View>

    <View style={styles.menuFooter}>
      <Text style={styles.footerText}>Versión {appInfo.version}</Text>
      <Text style={styles.footerSubtext}>{appInfo.copyright}</Text>
    </View>
  </ScrollView>
);

const SideMenu = ({ visible, slideAnimation, menuItems, appInfo, onClose }) => {
  if (!visible) return null;

  return (
    <Modal transparent={true} visible={visible} animationType="none">
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.sideMenu,
            {
              transform: [{ translateX: slideAnimation }],
              width: MENU_WIDTH,
            }
          ]}
        >
          <MenuHeader appInfo={appInfo} onClose={onClose} />
          <MenuContent
            menuItems={menuItems}
            appInfo={appInfo}
            onMenuClose={onClose}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const AsociacionCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
    <Image source={require('../assets/logo.png')} style={styles.logo} />
    <View style={styles.info}>
      <Text style={styles.nombre}>{item.nombre}</Text>
      <Text style={styles.detalle}>
        {item.ciudad || 'Ciudad no disponible'} - {item.direccion || 'Dirección no disponible'}
      </Text>
      <Text style={styles.disponibles}>
        Email: {item.email}
      </Text>
      {item.telefono && (
        <Text style={styles.disponibles}>
          Teléfono: {item.telefono}
        </Text>
      )}
    </View>
    <Ionicons name="chevron-forward" size={24} color="#B0BEC5" />
  </TouchableOpacity>
);

const LoadingState = () => (
  <View style={styles.centerContent}>
    <ActivityIndicator size="large" color="#a26b6c" />
    <Text style={styles.messageText}>Cargando asociaciones...</Text>
  </View>
);

const ErrorState = ({ error, onRetry }) => (
  <View style={styles.centerContent}>
    <Ionicons name="alert-circle-outline" size={48} color="#FF5252" />
    <Text style={styles.errorText}>{error}</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Reintentar</Text>
    </TouchableOpacity>
  </View>
);

const EmptyState = () => (
  <View style={styles.centerContent}>
    <Ionicons name="business-outline" size={48} color="#B0BEC5" />
    <Text style={styles.messageText}>No se encontraron asociaciones</Text>
  </View>
);

// ========================================================================================
// MAIN COMPONENT
// ========================================================================================

export default function AsociacionesScreen({ navigation }) {
  const [busqueda, setBusqueda] = useState('');

  // Custom hooks
  const { menuVisible, slideAnimation, toggleMenu, closeMenu } = useMenuController();
  const { menuItems, appInfo, backgroundImage } = useAppData();
  const { asociaciones, loading, error, refreshing, refresh } = useAsociaciones();

  const asociacionesFiltradas = React.useMemo(() => {
    if (!busqueda.trim()) return asociaciones;
    
    const searchTerm = busqueda.toLowerCase().trim();
    return asociaciones.filter(a =>
      a.nombre.toLowerCase().includes(searchTerm) ||
      (a.ciudad && a.ciudad.toLowerCase().includes(searchTerm)) ||
      (a.descripcion && a.descripcion.toLowerCase().includes(searchTerm))
    );
  }, [asociaciones, busqueda]);

  const abrirPerfil = (asociacion) => {
    Alert.alert(
      asociacion.nombre,
      `Descripción: ${asociacion.descripcion || 'No disponible'}\n` +
      `Email: ${asociacion.email}\n` +
      `Teléfono: ${asociacion.telefono || 'No disponible'}\n` +
      `Dirección: ${asociacion.direccion || 'No disponible'}\n` +
      `Ciudad: ${asociacion.ciudad || 'No disponible'}`,
      [{ text: 'OK' }]
    );
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return <LoadingState />;
    }

    if (error) {
      return <ErrorState error={error} onRetry={refresh} />;
    }

    if (asociacionesFiltradas.length === 0 && !loading) {
      return <EmptyState />;
    }

    return (
      <FlatList
        data={asociacionesFiltradas}
        keyExtractor={(item) => item.idAsociacion?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <AsociacionCard item={item} onPress={abrirPerfil} />
        )}
        contentContainerStyle={styles.flatListContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={['#a26b6c']}
            tintColor="#a26b6c"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Asociaciones"
        menuVisible={menuVisible}
        onMenuToggle={toggleMenu}
      />

      <SideMenu
        visible={menuVisible}
        slideAnimation={slideAnimation}
        menuItems={menuItems}
        appInfo={appInfo}
        onClose={closeMenu}
      />

      <ImageBackground 
        source={backgroundImage} 
        style={styles.backgroundImage} 
        resizeMode="cover"
      >
        <View style={styles.contentOverlay}>
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Buscar asociaciones..."
              value={busqueda}
              onChangeText={setBusqueda}
              style={styles.buscador}
              placeholderTextColor="#666"
              returnKeyType="search"
            />
          </View>

          {renderContent()}
        </View>
      </ImageBackground>
    </View>
  );
}

// ========================================================================================
// STYLES
// ========================================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Background styles
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  contentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a26b6c',
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

  // Modal and Side Menu styles
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
    backgroundColor: '#667eea',
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
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },

  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
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

  // Search styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },

  buscador: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    fontSize: 16,
    color: '#333',
  },

  // Content styles
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  // Card styles
  card: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    marginVertical: 8,
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  logo: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 15,
    resizeMode: 'contain',
  },

  info: {
    flex: 1,
  },

  nombre: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
    marginBottom: 4,
  },

  detalle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },

  disponibles: {
    fontSize: 13,
    color: '#777',
  },

  flatListContent: {
    paddingBottom: 20,
  },

  // Message styles
  messageText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },

  errorText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    color: '#FF5252',
    marginHorizontal: 20,
  },

  // Button styles
  retryButton: {
    marginTop: 15,
    backgroundColor: '#a26b6c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },

  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});