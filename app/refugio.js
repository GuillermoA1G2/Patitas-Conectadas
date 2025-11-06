import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import axios from 'axios';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  Animated,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar, // Importar StatusBar
  SafeAreaView, // Importar SafeAreaView
  ImageBackground, // Importar ImageBackground
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

// ==========================================
// CONFIGURACIÓN Y CONSTANTES
// ==========================================

//const API_BASE_URL = 'http://192.168.1.119:3000/api';
//const SERVER_BASE_URL = 'http://192.168.1.119:3000';
const API_BASE_URL = 'https://patitas-conectadas-nine.vercel.app/api';
const SERVER_BASE_URL = 'https://patitas-conectadas-nine.vercel.app';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.65; // 65% del ancho de la pantalla, igual que PerfilUsuarioScreen

// ========================================================================================
// BACKEND LOGIC SECTION (Copiado de PerfilUsuario.js y adaptado)
// ========================================================================================

// Data Models and Business Logic
class MenuService {
  static getMenuItems(refugioId) {
    return [
      // Items específicos de Refugio
      {
        title: 'Registrar Animal',
        icon: 'add-circle-outline',
        route: 'registrar_animal',
        params: { refugioId: refugioId },
        color: '#96CEB4',
      },
      {
        title: 'Solicitar Donaciones',
        icon: 'gift-outline',
        route: 'DonacionesAso',
        params: { refugioId: refugioId },
        color: '#FECA57',
      },
      {
        title: 'Historial de Donaciones',
        icon: 'list-outline',
        route: 'HistorialDonaciones',
        params: { refugioId: refugioId },
        color: '#A55EEA',
      },
      {
        title: 'Solicitudes Adopción',
        icon: 'list-outline',
        route: 'SolicitudesRefugio',
        params: { refugioId: refugioId },
        color: '#d5ea5eff',
      },
      // Items adicionales que podrían ser modales o rutas genéricas
      {
        title: 'Notificaciones',
        icon: 'notifications-outline',
        action: 'showNotificationsModal',
        color: '#17a2b8',
      },
      {
        title: 'Ayuda y Soporte',
        icon: 'help-circle-outline',
        action: 'showHelpModal',
        color: '#fd7e14',
      },
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

// Animation Service (Copiado de PerfilUsuario.js)
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

// Custom Hooks (Business Logic Layer) (Copiado de PerfilUsuario.js)
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

const useAppData = (refugioId) => {
  const menuItems = MenuService.getMenuItems(refugioId);
  const appInfo = MenuService.getAppInfo();
  const backgroundImage = MenuService.getBackgroundImage();

  return {
    menuItems,
    appInfo,
    backgroundImage
  };
};

// ========================================================================================
// FRONTEND COMPONENTS SECTION (Copiado de PerfilUsuario.js y adaptado)
// ========================================================================================

// Component: Hamburger Menu Button (Copiado de PerfilUsuario.js)
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

// Component: Header (Copiado de PerfilUsuario.js)
const Header = ({ appName, screenTitle, menuVisible, onMenuToggle }) => (
  <View style={styles.header}>
    <HamburgerButton isActive={menuVisible} onPress={onMenuToggle} />
    <View>
      <Text style={styles.headerAppName}>{appName}</Text>
      <Text style={styles.headerScreenTitle}>{screenTitle}</Text>
    </View>
  </View>
);

// Component: Menu Header (Copiado de PerfilUsuario.js y adaptado para RefugioScreen)
const MenuHeader = ({ appInfo, onClose, refugioData }) => (
  <View style={styles.menuHeader}>
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        {/* Aquí podrías poner una imagen de perfil del refugio si tuvieras una */}
        <Ionicons name="paw" size={32} color="#fff" />
      </View>
      <View style={styles.profileInfo}>
        <Text style={styles.welcomeText}>{appInfo.welcomeMessage}</Text>
        <Text style={styles.appName}>{refugioData?.nombre || appInfo.name}</Text>
      </View>
    </View>
    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
      <Ionicons name="close" size={24} color="#fff" />
    </TouchableOpacity>
  </View>
);

// Component: Menu Item (Copiado de PerfilUsuario.js y adaptado para expo-router Link)
const MenuItem = ({ item, onPress, onAction }) => {
  const router = useRouter(); // Usar useRouter de expo-router

  const handlePress = () => {
    onPress(); // Cierra el menú
    if (item.route) {
      router.push({ pathname: item.route, params: item.params });
    } else if (item.action) {
      onAction(item.action); // Llama a la función de acción pasada por props
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

// Component: Menu Content (Copiado de PerfilUsuario.js y adaptado para expo-router)
const MenuContent = ({ menuItems, appInfo, onMenuClose, onAction, cerrarSesion }) => {
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
            onAction={onAction}
          />
        ))}
      </View>

      {/* Sección de logout */}
      <View style={styles.logoutSection}>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.logoutItem}
          onPress={() => {
            onMenuClose();
            cerrarSesion();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.logoutIconContainer}>
            <Ionicons name="log-out-outline" size={22} color="#FF5252" />
          </View>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Footer del menú */}
      <View style={styles.menuFooter}>
        <Text style={styles.footerText}>Versión {appInfo.version}</Text>
        <Text style={styles.footerSubtext}>{appInfo.copyright}</Text>
      </View>
    </ScrollView>
  );
};

// Component: Side Menu (Copiado de PerfilUsuario.js y adaptado)
const SideMenu = ({ visible, slideAnimation, menuItems, appInfo, onClose, refugioData, onAction, cerrarSesion }) => {
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
          <MenuHeader appInfo={appInfo} onClose={onClose} refugioData={refugioData} />
          <MenuContent
            menuItems={menuItems}
            appInfo={appInfo}
            onMenuClose={onClose}
            onAction={onAction}
            cerrarSesion={cerrarSesion}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function PantallaRefugio() {
  const {
    refugioId,
    refugioNombre,
    refugioEmail,
    refugioTelefono,
    usuarioTipo
  } = useLocalSearchParams();

  const [insumosPendientes, setInsumosPendientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [refugioData, setRefugioData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    descripcion: '',
    direccion: '',
    ciudad: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // Para modales de acciones del menú
  const [contenidoModal, setContenidoModal] = useState('');
  const [tituloModal, setTituloModal] = useState('');

  const router = useRouter();

  // Hooks para el menú lateral (copiados de PerfilUsuario.js)
  const { menuVisible, slideAnimation, toggleMenu, closeMenu } = useMenuController();
  const { menuItems, appInfo, backgroundImage } = useAppData(refugioId); // Pasar refugioId para items dinámicos

  // Ubicación para el mapa (se podría obtener de la base de datos)
  const ubicacion = {
    latitude: 20.6755,
    longitude: -103.3872,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const cargarDatos = async () => {
    try {
      const id = refugioId;

      if (!id) {
        throw new Error('ID del refugio no disponible');
      }

      console.log('Cargando datos para refugio ID:', id);

      // Cargar insumos pendientes
      const responseInsumos = await axios.get(`${API_BASE_URL}/refugio/${id}/insumos-pendientes`);
      console.log('Respuesta insumos:', responseInsumos.data);

      setInsumosPendientes(responseInsumos.data.insumosPendientes || []);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      console.error('Error details:', error.response?.data);
      Alert.alert('Error', `No se pudieron cargar los datos del refugio: ${error.message}`);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  };

  // Load complete refuge data
  const cargarDatosRefugio = async () => {
    try {
      const id = refugioId;

      if (!id) {
        throw new Error('ID del refugio no disponible');
      }

      console.log('Cargando datos completos del refugio ID:', id);

      const response = await axios.get(`${API_BASE_URL}/refugio/${id}`);
      console.log('Respuesta datos refugio:', response.data);

      if (response.data && response.data.refugio) {
        const data = response.data.refugio;
        setRefugioData({
          nombre: data.nombre || refugioNombre || 'Sin nombre',
          email: data.email || refugioEmail || 'Sin email',
          telefono: data.telefono || refugioTelefono || 'Sin teléfono',
          descripcion: data.descripcion || 'Sin descripción',
          direccion: data.direccion || 'Sin dirección',
          ciudad: data.ciudad || 'Sin ciudad'
        });
      } else {
        // Si no hay datos del servidor, usar los datos del login
        setRefugioData({
          nombre: refugioNombre || 'Sin nombre',
          email: refugioEmail || 'Sin email',
          telefono: refugioTelefono || 'Sin teléfono',
          descripcion: 'Sin descripción',
          direccion: 'Sin dirección',
          ciudad: 'Sin ciudad'
        });
      }
    } catch (error) {
      console.error('Error al cargar datos del refugio:', error);
      console.error('Error details:', error.response?.data);

      // Si hay error, usar los datos que llegaron del login
      setRefugioData({
        nombre: refugioNombre || 'Sin nombre',
        email: refugioEmail || 'Sin email',
        telefono: refugioTelefono || 'Sin teléfono',
        descripcion: 'Sin descripción disponible',
        direccion: 'Sin dirección disponible',
        ciudad: 'Sin ciudad disponible'
      });
    }
  };

  useEffect(() => {
    const inicializar = async () => {
      console.log('Parámetros recibidos:', {
        refugioId,
        refugioNombre,
        refugioEmail,
        refugioTelefono,
        usuarioTipo
      });

      // Si no hay refugioId, mostrar error
      if (!refugioId) {
        Alert.alert('Error', 'No se recibió el ID del refugio correctamente');
        setCargando(false);
        return;
      }

      // Cargar datos del refugio primero
      await cargarDatosRefugio();

      // Luego cargar insumos y otros datos
      await cargarDatos();
    };

    inicializar();
  }, [refugioId, refugioNombre, refugioEmail, refugioTelefono]);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatosRefugio();
    await cargarDatos();
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setRefugioData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Submit updated profile
  const handleSubmitProfile = async () => {
    if (!refugioData.nombre || !refugioData.email) {
      Alert.alert('Error', 'El nombre y email son obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/refugio/${refugioId}`, refugioData);

      if (response.data && response.data.success) {
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
        setEditModalVisible(false);
        // Refresh data
        await onRefresh();
      } else {
        Alert.alert('Error', 'No se pudo actualizar el perfil');
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar el perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  const marcarInsumoCompletado = async (idInsumo) => {
    try {
      Alert.alert(
        'Confirmar',
        '¿Marcar este insumo como recibido?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sí, confirmar',
            onPress: async () => {
              try {
                const response = await axios.put(`${API_BASE_URL}/insumos/${idInsumo}/completar`, {
                  id_refugio: refugioId
                });

                if (response.data && response.data.success) {
                  Alert.alert('Éxito', 'Insumo marcado como recibido');
                  await cargarDatos(); // Recargar datos
                } else {
                  Alert.alert('Error', 'No se pudo actualizar el insumo');
                }
              } catch (error) {
                console.error('Error al marcar insumo:', error);
                Alert.alert('Error', 'No se pudo actualizar el insumo');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error al mostrar confirmación:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    }
  };

  const cerrarSesion = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, cerrar sesión',
          onPress: () => {
            router.replace('/inicio_sesion');
          }
        }
      ]
    );
  };

  const handleMenuAction = (actionType) => {
    closeMenu();
    let titulo = '';
    let contenido = '';

    switch (actionType) {
      case 'showNotificationsModal':
        titulo = 'Notificaciones';
        contenido = 'No tienes notificaciones nuevas.\n\nAquí aparecerán las actualizaciones sobre tus donaciones y actividades en la plataforma.';
        break;
      case 'showHelpModal':
        titulo = 'Ayuda y Soporte';
        contenido = '¿Necesitas ayuda?\n\n📧 Email: devs@patitasconectadas.com\n📞 Teléfono: +52 123 456 7890\n\nEstamos aquí para ayudarte con cualquier problema o pregunta.';
        break;
      default:
        contenido = '';
    }

    setTituloModal(titulo);
    setContenidoModal(contenido);
    setModalVisible(true);
  };

  if (cargando) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />
        <ActivityIndicator size="large" color="#a26b6c" />
        <Text style={styles.cargandoTexto}>Cargando datos del refugio...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />

      {/* Header (Ahora usando el componente Header de PerfilUsuario.js) */}
      <Header
        appName={appInfo.name}
        screenTitle={'Perfil del Refugio'}
        menuVisible={menuVisible}
        onMenuToggle={toggleMenu}
      />

      {/* Side Menu (Ahora usando el componente SideMenu de PerfilUsuario.js) */}
      <SideMenu
        visible={menuVisible}
        slideAnimation={slideAnimation}
        menuItems={menuItems}
        appInfo={appInfo}
        onClose={closeMenu}
        refugioData={refugioData}
        onAction={handleMenuAction}
        cerrarSesion={cerrarSesion}
      />

      <ImageBackground
        source={backgroundImage}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.contentOverlay}>
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scroll}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#a26b6c']} tintColor="#a26b6c" />
            }
          >
            {/* Logo y botón de editar perfil */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.logo}
              />
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditModalVisible(true)}
              >
                <Text style={styles.editText}>Editar Perfil</Text>
              </TouchableOpacity>
            </View>

            {/* Información del refugio */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Acerca de nosotros</Text>
              <Text style={styles.sectionText}>
                {refugioData.descripcion || 'Somos un refugio comprometido con el rescate y rehabilitación de animales abandonados. Nuestro objetivo es encontrar hogares amorosos para cada mascota.'}
              </Text>
            </View>

            {/* Contacto */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contacto</Text>
              <Text style={styles.sectionText}>📧 {refugioData.email}</Text>
              {refugioData.telefono && refugioData.telefono !== 'Sin teléfono' && (
                <Text style={styles.sectionText}>📞 {refugioData.telefono}</Text>
              )}
              {refugioData.direccion && refugioData.direccion !== 'Sin dirección' && (
                <Text style={styles.sectionText}>🏠 {refugioData.direccion}</Text>
              )}
              {refugioData.ciudad && refugioData.ciudad !== 'Sin ciudad' && (
                <Text style={styles.sectionText}>🌆 {refugioData.ciudad}</Text>
              )}
            </View>

            {/* Ubicación */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ubicación</Text>
              <Text style={styles.sectionText}>
                📍 {refugioData.direccion && refugioData.direccion !== 'Sin dirección'
                  ? refugioData.direccion
                  : 'Av. Circunvalación 123, Guadalajara.'}
              </Text>
              <MapView style={styles.map} region={ubicacion}>
                <Marker coordinate={ubicacion} title={refugioData.nombre} />
              </MapView>
            </View>

            {/* Estadísticas rápidas */}
            <View style={styles.estadisticasContainer}>
              <View style={styles.estadisticaCard}>
                <Text style={styles.estadisticaNumero}>{insumosPendientes.length}</Text>
                <Text style={styles.estadisticaTexto}>Insumos Pendientes</Text>
              </View>
              <View style={styles.estadisticaCard}>
                <Text style={styles.estadisticaNumero}>0</Text>
                <Text style={styles.estadisticaTexto}>Animales Registrados</Text>
              </View>
            </View>

            {/* Menú de acciones */}
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuActionItem}
                onPress={() => router.push({
                  pathname: '/registrar_animal',
                  params: { refugioId: refugioId }
                })}
              >
                <View style={styles.menuActionIcon}>
                  <Ionicons name="add-circle" size={28} color="#4CAF50" />
                </View>
                <Text style={styles.menuActionText}>Registrar Animal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuActionItem}
                onPress={() => router.push({
                  pathname: '/DonacionesAso',
                  params: { refugioId: refugioId }
                })}
              >
                <View style={styles.menuActionIcon}>
                  <Ionicons name="gift" size={28} color="#FF9800" />
                </View>
                <Text style={styles.menuActionText}>Solicitar Donaciones</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuActionItem}
                onPress={() => router.push({
                  pathname: '/HistorialDonaciones',
                  params: { refugioId: refugioId }
                })}
              >
                <View style={styles.menuActionIcon}>
                  <Ionicons name="list" size={28} color="#2196F3" />
                </View>
                <Text style={styles.menuActionText}>Ver Donaciones</Text>
              </TouchableOpacity>
            </View>

            {/* Insumos pendientes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Insumos Pendientes</Text>

              {insumosPendientes.length === 0 ? (
                <Text style={styles.emptyText}>No hay insumos pendientes por recibir</Text>
              ) : (
                insumosPendientes.map((insumo, index) => (
                  <View key={index} style={styles.insumoCard}>
                    <View style={styles.insumoInfo}>
                      <Text style={styles.insumoNombre}>{insumo.nombre}</Text>
                      <Text style={styles.insumoDetalle}>Cantidad: {insumo.cantidad}</Text>
                      <Text style={styles.insumoDetalle}>
                        Donante: {insumo.nombre_donante || 'Anónimo'}
                      </Text>
                      {insumo.telefono_donante && (
                        <Text style={styles.insumoDetalle}>
                          Contacto: {insumo.telefono_donante}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.insumoButton}
                      onPress={() => marcarInsumoCompletado(insumo.id)}
                    >
                      <Text style={styles.insumoButtonText}>Recibido</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </ImageBackground>

      {/* Modal para editar perfil */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "position"}
          style={styles.modalOverlay}
        >
          <View style={styles.editModalContainer}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalContent}>
              <Text style={styles.inputLabel}>Nombre del Refugio *</Text>
              <TextInput
                style={styles.input}
                value={refugioData.nombre}
                onChangeText={(text) => handleInputChange('nombre', text)}
                placeholder="Nombre del refugio"
              />

              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                value={refugioData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                placeholder="Email de contacto"
                keyboardType="email-address"
              />

              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={refugioData.telefono === 'Sin teléfono' ? '' : refugioData.telefono}
                onChangeText={(text) => handleInputChange('telefono', text)}
                placeholder="Teléfono de contacto"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={refugioData.descripcion === 'Sin descripción' ? '' : refugioData.descripcion}
                onChangeText={(text) => handleInputChange('descripcion', text)}
                placeholder="Descripción del refugio"
                multiline={true}
                numberOfLines={4}
              />

              <Text style={styles.inputLabel}>Dirección</Text>
              <TextInput
                style={styles.input}
                value={refugioData.direccion === 'Sin dirección' ? '' : refugioData.direccion}
                onChangeText={(text) => handleInputChange('direccion', text)}
                placeholder="Dirección física"
              />

              <Text style={styles.inputLabel}>Ciudad</Text>
              <TextInput
                style={styles.input}
                value={refugioData.ciudad === 'Sin ciudad' ? '' : refugioData.ciudad}
                onChangeText={(text) => handleInputChange('ciudad', text)}
                placeholder="Ciudad"
              />

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.saveButton, isSubmitting && styles.disabledButton]}
                  onPress={handleSubmitProfile}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal para opciones (se mantiene para las acciones del menú lateral) */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>{tituloModal}</Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTexto}>{contenidoModal}</Text>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalBoton}
            >
              <Text style={styles.modalBotonTexto}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cargandoTexto: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  // Header styles (Copiado de PerfilUsuario.js)
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

  // Side Menu styles (Copiado de PerfilUsuario.js)
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
  avatarMenuImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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

  // Estilos específicos del contenido del refugio (ajustados para consistencia)
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  scrollContainer: {
    flex: 1,
  },
  scroll: {
    padding: 15,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    borderWidth: 4,
    borderColor: '#a26b6c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  editButton: {
    backgroundColor: '#0066ff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    marginTop: 10,
  },
  editText: {
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 20,
  },
  map: {
    height: 200,
    marginTop: 10,
    borderRadius: 8,
  },
  estadisticasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  estadisticaCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  estadisticaNumero: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  estadisticaTexto: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  menuContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  menuActionItem: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  menuActionIcon: {
    marginBottom: 8,
  },
  menuActionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  insumoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  insumoInfo: {
    flex: 1,
  },
  insumoNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  insumoDetalle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  insumoButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  insumoButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 15,
  },
  // Styles for edit modal (mantener los existentes)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  editModalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editModalContent: {
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#A5D6A7',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Modal para acciones del menú (copiado de PerfilUsuario.js)
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContenido: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalTexto: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'left',
  },
  modalBoton: {
    backgroundColor: '#0066ff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  modalBotonTexto: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});