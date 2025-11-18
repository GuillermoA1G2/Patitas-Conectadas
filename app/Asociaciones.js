import React, { useState, useEffect, useCallback } from 'react';
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
  StatusBar,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';

// ========================================================================================
// CONSTANTS AND CONFIGURATION
// ========================================================================================

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.65;

const API_BASE_URL = 'https://patitas-conectadas-nine.vercel.app'; 
const SERVER_BASE_URL = 'https://patitas-conectadas-nine.vercel.app';

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
        timeout: 10000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Error en la respuesta del servidor');
      }

      const refugiosConUrlsCompletas = data.refugios.map(refugio => ({
        ...refugio,
        logo: refugio.logo ? `${API_BASE_URL}${refugio.logo}` : null,
      }));

      return refugiosConUrlsCompletas || [];
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

  static async getSolicitudesDonacion(refugioId) {
    try {
      console.log('Obteniendo solicitudes de donación para refugio:', refugioId);

      const response = await fetch(`${API_BASE_URL}/api/solicitudes-donaciones/refugio/${refugioId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Error al obtener solicitudes');
      }

      return data.solicitudes || [];
    } catch (error) {
      console.error('Error en ApiService.getSolicitudesDonacion:', error);
      return []; // Retornar array vacío en caso de error
    }
  }
}

class MenuService {
  static getMenuItems() {
    return [
      {
        title: 'Perfil Usuario',
        icon: 'person-outline',
        route: 'PerfilUsuario',
        color: '#4ECDC4',
        gradient: ['#4ECDC4', '#44A08D']
      },
      {
        title: 'Catalogo Mascotas',
        icon: 'paw-outline',
        route: 'CatalogoMascotas',
        color: '#26DE81',
        gradient: ['#26DE81', '#20BF55']
      },
      {
        title: 'Donación',
        icon: 'gift-outline',
        route: 'Donaciones',
        color: '#FD79A8',
        gradient: ['#FD79A8', '#FDBB2D']
      },
      {
        title: 'Patitas Conectadas',
        icon: 'information-circle-outline',
        route: 'NosotrosScreen',
        color: '#A55EEA',
        gradient: ['#A55EEA', '#FD79A8']
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

const Header = ({ appName, screenTitle, menuVisible, onMenuToggle }) => (
  <View style={styles.header}>
    <HamburgerButton isActive={menuVisible} onPress={onMenuToggle} />
    <View>
      <Text style={styles.headerAppName}>{appName}</Text>
      <Text style={styles.headerScreenTitle}>{screenTitle}</Text>
    </View>
  </View>
);

const MenuHeader = ({ appInfo, onClose }) => (
  <View style={styles.menuHeader}>
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        <Ionicons name="paw" size={32} color="#fff" />
      </View>
      <View style={styles.profileInfo}>
        <Text style={styles.welcomeText}>{appInfo.welcomeMessage}</Text>
        <Text style={styles.appName}>{appInfo.name}</Text>
      </View>
    </View>
    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
      <Ionicons name="close" size={24} color="#fff" />
    </TouchableOpacity>
  </View>
);

const MenuItem = ({ item, onPress, userId }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    onPress();
    if (item.route) {
      navigation.navigate(item.route, { userId: userId });
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={22} color="#fff" />
      </View>
      <Text style={styles.menuItemText}>{item.title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#B0BEC5" />
    </TouchableOpacity>
  );
};

const MenuContent = ({ menuItems, appInfo, onMenuClose, userId }) => {
  const navigation = useNavigation();

  const handleLogout = () => {
    onMenuClose();
    navigation.reset({
      index: 0,
      routes: [{ name: 'inicio_sesion' }],
    });
  };

  return (
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
            userId={userId}
          />
        ))}
      </View>

      <View style={styles.logoutSection}>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.logoutItem}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View style={styles.logoutIconContainer}>
            <Ionicons name="log-out-outline" size={22} color="#FF5252" />
          </View>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuFooter}>
        <Text style={styles.footerText}>Versión {appInfo.version}</Text>
        <Text style={styles.footerSubtext}>{appInfo.copyright}</Text>
      </View>
    </ScrollView>
  );
};

const SideMenu = ({ visible, slideAnimation, menuItems, appInfo, onClose, userId }) => {
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
            userId={userId}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const AsociacionCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
    <Image
      source={item.logo ? { uri: item.logo } : require('../assets/logo.png')}
      style={styles.logo}
      onError={(e) => console.log('Error loading logo image:', e.nativeEvent.error, 'for URL:', item.logo)}
    />
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

// Componente para mostrar nivel de urgencia
const UrgenciaBadge = ({ nivel }) => {
  const getUrgenciaColor = () => {
    switch (nivel) {
      case 'Alta':
        return '#F44336';
      case 'Media':
        return '#FFA500';
      case 'Baja':
        return '#4CAF50';
      default:
        return '#777';
    }
  };

  return (
    <View style={[modalStyles.urgenciaBadge, { backgroundColor: getUrgenciaColor() }]}>
      <Text style={modalStyles.urgenciaText}>{nivel}</Text>
    </View>
  );
};

// Componente para cada solicitud de donación
const SolicitudDonacionCard = ({ solicitud }) => (
  <View style={modalStyles.solicitudCard}>
    <View style={modalStyles.solicitudHeader}>
      <View style={modalStyles.solicitudTitleContainer}>
        <Ionicons name="gift-outline" size={20} color="#a26b6c" />
        <Text style={modalStyles.solicitudNombre}>{solicitud.nombre}</Text>
      </View>
      <UrgenciaBadge nivel={solicitud.nivel_urgencia} />
    </View>
    
    {solicitud.descripcion && (
      <Text style={modalStyles.solicitudDescripcion}>{solicitud.descripcion}</Text>
    )}
    
    <View style={modalStyles.solicitudFooter}>
      <View style={modalStyles.cantidadContainer}>
        <Ionicons name="pricetag-outline" size={16} color="#666" />
        <Text style={modalStyles.cantidadText}>
          Cantidad: {solicitud.cantidad}
        </Text>
      </View>
      <Text style={modalStyles.fechaText}>
        {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-MX', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })}
      </Text>
    </View>

    {!solicitud.activa && (
      <View style={modalStyles.inactivaBadge}>
        <Text style={modalStyles.inactivaText}>Completada</Text>
      </View>
    )}
  </View>
);

// Componente mejorado para el modal de detalles del refugio
const RefugioDetailModal = ({ visible, onClose, refugio }) => {
  const [solicitudesDonacion, setSolicitudesDonacion] = useState([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);

  useEffect(() => {
    if (visible && refugio) {
      cargarSolicitudesDonacion();
    }
  }, [visible, refugio]);

  const cargarSolicitudesDonacion = async () => {
    if (!refugio?.idAsociacion) return;

    setLoadingSolicitudes(true);
    try {
      const solicitudes = await ApiService.getSolicitudesDonacion(refugio.idAsociacion);
      setSolicitudesDonacion(solicitudes);
    } catch (error) {
      console.error('Error al cargar solicitudes de donación:', error);
    } finally {
      setLoadingSolicitudes(false);
    }
  };

  if (!refugio) return null;

  const handleCall = () => {
    if (refugio.telefono) {
      Linking.openURL(`tel:${refugio.telefono}`);
    } else {
      Alert.alert('Información', 'Teléfono no disponible para este refugio.');
    }
  };

  const handleEmail = () => {
    if (refugio.email) {
      Linking.openURL(`mailto:${refugio.email}`);
    } else {
      Alert.alert('Información', 'Email no disponible para este refugio.');
    }
  };

  const solicitudesActivas = solicitudesDonacion.filter(s => s.activa);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle" size={30} color="#a26b6c" />
          </TouchableOpacity>

          <ScrollView 
            style={modalStyles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <Image
              source={refugio.logo ? { uri: refugio.logo } : require('../assets/logo.png')}
              style={modalStyles.refugioLogo}
              onError={(e) => console.log('Error loading modal logo image:', e.nativeEvent.error, 'for URL:', refugio.logo)}
            />
            <Text style={modalStyles.refugioName}>{refugio.nombre}</Text>
            
            {refugio.descripcion && (
              <Text style={modalStyles.refugioDescription}>{refugio.descripcion}</Text>
            )}

            <View style={modalStyles.detailsContainer}>
              <View style={modalStyles.detailRow}>
                <Ionicons name="mail-outline" size={20} color="#555" style={modalStyles.detailIcon} />
                <Text style={modalStyles.detailText}>{refugio.email}</Text>
              </View>
              {refugio.telefono && (
                <View style={modalStyles.detailRow}>
                  <Ionicons name="call-outline" size={20} color="#555" style={modalStyles.detailIcon} />
                  <Text style={modalStyles.detailText}>{refugio.telefono}</Text>
                </View>
              )}
              {(refugio.direccion || refugio.ciudad || refugio.municipio || refugio.codigoPostal) && (
                <View style={modalStyles.detailRow}>
                  <Ionicons name="location-outline" size={20} color="#555" style={modalStyles.detailIcon} />
                  <Text style={modalStyles.detailText}>
                    {refugio.direccion || 'Dirección no disponible'}
                    {refugio.ciudad ? `, ${refugio.ciudad}` : ''}
                    {refugio.municipio ? `, ${refugio.municipio}` : ''}
                    {refugio.codigoPostal ? ` C.P. ${refugio.codigoPostal}` : ''}
                  </Text>
                </View>
              )}
              {refugio.rfc && (
                <View style={modalStyles.detailRow}>
                  <Ionicons name="document-text-outline" size={20} color="#555" style={modalStyles.detailIcon} />
                  <Text style={modalStyles.detailText}>RFC: {refugio.rfc}</Text>
                </View>
              )}
            </View>

            <View style={modalStyles.actionButtonsContainer}>
              <TouchableOpacity style={modalStyles.actionButton} onPress={handleCall}>
                <Ionicons name="call" size={24} color="#fff" />
                <Text style={modalStyles.actionButtonText}>Llamar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.actionButton} onPress={handleEmail}>
                <Ionicons name="mail" size={24} color="#fff" />
                <Text style={modalStyles.actionButtonText}>Email</Text>
              </TouchableOpacity>
            </View>

            {/* NUEVA SECCIÓN: Solicitudes de Donación */}
            <View style={modalStyles.solicitudesSection}>
              <View style={modalStyles.solicitudesSectionHeader}>
                <Ionicons name="gift" size={24} color="#a26b6c" />
                <Text style={modalStyles.solicitudesSectionTitle}>
                  Solicitudes de Donación
                </Text>
              </View>

              {loadingSolicitudes ? (
                <View style={modalStyles.loadingContainer}>
                  <ActivityIndicator size="small" color="#a26b6c" />
                  <Text style={modalStyles.loadingText}>Cargando solicitudes...</Text>
                </View>
              ) : solicitudesActivas.length === 0 ? (
                <View style={modalStyles.emptySolicitudes}>
                  <Ionicons name="information-circle-outline" size={32} color="#999" />
                  <Text style={modalStyles.emptySolicitudesText}>
                    Este refugio no tiene solicitudes de donación activas
                  </Text>
                </View>
              ) : (
                <View style={modalStyles.solicitudesList}>
                  <Text style={modalStyles.solicitudesCount}>
                    {solicitudesActivas.length} solicitud{solicitudesActivas.length !== 1 ? 'es' : ''} activa{solicitudesActivas.length !== 1 ? 's' : ''}
                  </Text>
                  {solicitudesActivas.map((solicitud, index) => (
                    <SolicitudDonacionCard key={solicitud.id || index} solicitud={solicitud} />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ========================================================================================
// MAIN COMPONENT
// ========================================================================================

export default function AsociacionesScreen() {
  const [busqueda, setBusqueda] = useState('');
  const [selectedRefugio, setSelectedRefugio] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { menuVisible, slideAnimation, toggleMenu, closeMenu } = useMenuController();
  const { menuItems, appInfo, backgroundImage } = useAppData();
  const { asociaciones, loading, error, refreshing, refresh } = useAsociaciones();

  const route = useRoute();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (route.params?.userId) {
      setUserId(route.params.userId);
      console.log('AsociacionesScreen: userId recibido:', route.params.userId);
    } else {
      console.warn('AsociacionesScreen: No se recibió userId en los parámetros de la ruta.');
    }
  }, [route.params?.userId]);

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
    setSelectedRefugio(asociacion);
    setModalVisible(true);
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />

      <Header
        appName={appInfo.name}
        screenTitle="Asociaciones"
        menuVisible={menuVisible}
        onMenuToggle={toggleMenu}
      />

      <SideMenu
        visible={menuVisible}
        slideAnimation={slideAnimation}
        menuItems={menuItems}
        appInfo={appInfo}
        onClose={closeMenu}
        userId={userId}
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

      <RefugioDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        refugio={selectedRefugio}
      />
    </SafeAreaView>
  );
}

// ========================================================================================
// STYLES
// ========================================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  header: {
    backgroundColor: '#a26b6c',
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  menuButton: {
    marginRight: 15,
  },
  hamburgerContainer: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: '100%',
    height: 2,
    backgroundColor: 'white',
    borderRadius: 1,
  },
  hamburgerLineMiddle: {
    width: '80%',
  },
  hamburgerLineActive: {
    backgroundColor: 'white',
  },
  hamburgerLineMiddleActive: {
    width: '60%',
  },
  headerAppName: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 2,
  },
  headerScreenTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
    backgroundColor: '#a26b6c',
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
    overflow: 'hidden',
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#78909C',
    marginLeft: 20,
    marginBottom: 10,
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderLeftWidth: 4,
    borderLeftColor: '#a26b6c',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    elevation: 0,
    shadowColor: 'transparent',
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  logoutSection: {
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },
  logoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  logoutText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#FF5252',
  },
  menuFooter: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 10,
    alignItems: 'center',
  },
  footerText: {
    color: '#78909C',
    fontSize: 12,
    textAlign: 'center',
  },
  footerSubtext: {
    color: '#546E7A',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 5,
  },
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
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

// Estilos para el modal mejorado
const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '85%',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  scrollView: {
    width: '100%',
  },
  refugioLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    resizeMode: 'contain',
    borderWidth: 2,
    borderColor: '#a26b6c',
    alignSelf: 'center',
  },
  refugioName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  refugioDescription: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  detailIcon: {
    marginRight: 10,
  },
  detailText: {
    fontSize: 15,
    color: '#555',
    flexShrink: 1,
    flex: 1,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#a26b6c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Nuevos estilos para la sección de solicitudes
  solicitudesSection: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
  },
  solicitudesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  solicitudesSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#a26b6c',
    marginLeft: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  emptySolicitudes: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptySolicitudesText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  solicitudesList: {
    width: '100%',
  },
  solicitudesCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontWeight: '600',
  },
  solicitudCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#a26b6c',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  solicitudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  solicitudTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  solicitudNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  urgenciaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgenciaText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  solicitudDescripcion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  solicitudFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cantidadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cantidadText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 5,
    fontWeight: '600',
  },
  fechaText: {
    fontSize: 12,
    color: '#999',
  },
  inactivaBadge: {
    marginTop: 8,
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  inactivaText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
});