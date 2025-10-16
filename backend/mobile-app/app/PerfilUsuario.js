import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  ImageBackground,
  Animated, // Importar Animated para el menú lateral
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// ==========================================
// CONFIGURACIÓN Y CONSTANTES
// ==========================================

const API_BASE_URL = 'http://192.168.1.119:3000/api';
const SERVER_BASE_URL = 'http://192.168.1.119:3000';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.65; // 65% del ancho de la pantalla, igual que NosotrosScreen

// ========================================================================================
// BACKEND LOGIC SECTION (Copiado de NosotrosScreen.js y adaptado)
// ========================================================================================

// Data Models and Business Logic
class MenuService {
  static getMenuItems() {
    return [
      {
        title: 'Patitas Conectadas',
        icon: 'person-outline',
        route: 'NosotrosScreen',
        color: '#4ECDC4',
        gradient: ['#4ECDC4', '#44A08D']
      },
      {
        title: 'Asociaciones',
        icon: 'people-outline',
        route: 'Asociaciones',
        color: '#A55EEA',
        gradient: ['#A55EEA', '#FD79A8']
      },
      {
        title: 'Catalogo Mascotas',
        icon: 'star-outline',
        route: 'CatalogoMascotas',
        color: '#26DE81',
        gradient: ['#26DE81', '#20BF55']
      },
      {
        title: 'Donaciones',
        icon: 'gift-outline',
        route: 'Donaciones',
        color: '#FD79A8',
        gradient: ['#FD79A8', '#FDBB2D']
      },
      {
        title: 'Notificaciones',
        icon: 'notifications-outline',
        action: 'showNotificationsModal',
        color: '#17a2b8',
      },
      {
        title: 'ChatBot',
        icon: 'information-circle-outline',
        route: 'chatbot',
        color: '#FD79A8',
        gradient: ['#FD79A8', '#FDBB2D']
      },
      //SolicitudesUsuario
      {
        title: 'Solicitudes de Adopción',
        icon: 'information-circle-outline',
        route: 'SolicitudesUsuario',
        color: '#e9fd79ff',
        gradient: ['#FD79A8', '#FDBB2D']
      },
      {
        title: 'Privacidad y Seguridad',
        icon: 'lock-closed-outline',
        action: 'showPrivacyModal',
        color: '#6f42c1',
      },
      {
        title: 'Ayuda y Soporte',
        icon: 'help-circle-outline',
        action: 'showHelpModal',
        color: '#fd7e14',
      },
      {
        title: 'Términos y Condiciones',
        icon: 'document-text-outline',
        action: 'showTermsModal',
        color: '#6c757d',
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

// Animation Service (Copiado de NosotrosScreen.js)
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

// Custom Hooks (Business Logic Layer) (Copiado de NosotrosScreen.js)
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

// ========================================================================================
// FRONTEND COMPONENTS SECTION
// ========================================================================================

// Component: Hamburger Menu Button (Copiado de NosotrosScreen.js)
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

// Component: Header (Copiado de NosotrosScreen.js)
const Header = ({ appName, screenTitle, menuVisible, onMenuToggle }) => (
  <View style={styles.header}>
    <HamburgerButton isActive={menuVisible} onPress={onMenuToggle} />
    <View>
      <Text style={styles.headerAppName}>{appName}</Text>
      <Text style={styles.headerScreenTitle}>{screenTitle}</Text>
    </View>
  </View>
);

// Component: Menu Header (Copiado de NosotrosScreen.js y adaptado para PerfilScreen)
const MenuHeader = ({ appInfo, onClose, userData, fotoPerfilActual }) => (
  <View style={styles.menuHeader}>
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        {fotoPerfilActual ? (
          <Image source={{ uri: fotoPerfilActual }} style={styles.avatarMenuImage} />
        ) : (
          <Ionicons name="person" size={32} color="#fff" />
        )}
      </View>
      <View style={styles.profileInfo}>
        <Text style={styles.welcomeText}>{appInfo.welcomeMessage}</Text>
        <Text style={styles.appName}>
          {`${userData?.nombre || ''} ${userData?.apellido || ''}`.trim() || appInfo.name}
        </Text>
      </View>
    </View>
    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
      <Ionicons name="close" size={24} color="#fff" />
    </TouchableOpacity>
  </View>
);

// Component: Menu Item (Copiado de NosotrosScreen.js y adaptado para acciones de modal)
const MenuItem = ({ item, onPress, userId, onAction }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    onPress();
    if (item.route) {
      navigation.navigate(item.route, { userId: userId });
    } else if (item.action) {
      onAction(item.action);
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

// Component: Menu Content (Copiado de NosotrosScreen.js y adaptado para acciones de modal)
const MenuContent = ({ menuItems, appInfo, onMenuClose, userId, onAction }) => {
  const navigation = useNavigation();

  const handleLogout = () => {
    onMenuClose(); // Cierra el menú
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
            onAction={onAction} // Pasa la función de acción
          />
        ))}
      </View>

      {/* Sección de logout */}
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

      {/* Footer del menú */}
      <View style={styles.menuFooter}>
        <Text style={styles.footerText}>Versión {appInfo.version}</Text>
        <Text style={styles.footerSubtext}>{appInfo.copyright}</Text>
      </View>
    </ScrollView>
  );
};

// Component: Side Menu (Copiado de NosotrosScreen.js y adaptado)
const SideMenu = ({ visible, slideAnimation, menuItems, appInfo, onClose, userId, userData, fotoPerfilActual, onAction }) => {
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
          <MenuHeader appInfo={appInfo} onClose={onClose} userData={userData} fotoPerfilActual={fotoPerfilActual} />
          <MenuContent
            menuItems={menuItems}
            appInfo={appInfo}
            onMenuClose={onClose}
            userId={userId}
            onAction={onAction} // Pasa la función de acción al MenuContent
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

// ==========================================
// SERVICIOS DE API
// ==========================================

class PerfilService {
  static configurarAxios() {
    axios.interceptors.request.handlers = [];
    axios.interceptors.response.handlers = [];

    axios.interceptors.request.use(
      (config) => {
        console.log('🚀 Request a:', config.url);
        return config;
      },
      (error) => {
        console.log('❌ Error en request:', error);
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      (response) => {
        console.log('✅ Respuesta de:', response.config.url);
        console.log('📊 Status:', response.status);
        return response;
      },
      (error) => {
        console.log('❌ Error en response:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  static async obtenerDatosUsuario(usuarioId) {
    try {
      this.configurarAxios();

      if (!usuarioId) {
        throw new Error('ID de usuario no proporcionado');
      }

      console.log('🔍 Obteniendo datos para usuario ID:', usuarioId);

      const response = await axios.get(`${API_BASE_URL}/usuarios/${usuarioId}`, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('📋 Respuesta completa del servidor:', response.data);

      if (response.data && response.data.success && response.data.usuario) {
        return {
          exito: true,
          datos: response.data.usuario
        };
      } else {
        throw new Error(response.data?.message || 'Respuesta del servidor no válida');
      }
    } catch (error) {
      console.log('💥 Error en obtenerDatosUsuario:', error);
      return {
        exito: false,
        error: this.manejarErrorAPI(error)
      };
    }
  }

  static async actualizarPerfil(usuarioId, datosActualizados) {
    try {
      this.configurarAxios();

      if (!usuarioId) {
        throw new Error('ID de usuario no proporcionado');
      }

      console.log('💾 Actualizando usuario:', usuarioId, 'con datos:', datosActualizados);

      const response = await axios.put(
        `${API_BASE_URL}/usuarios/${usuarioId}`,
        datosActualizados,
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('📋 Respuesta de actualización:', response.data);

      if (response.data && response.data.success) {
        return {
          exito: true,
          datos: response.data.usuario,
          mensaje: response.data.message
        };
      } else {
        throw new Error(response.data?.message || 'Error al actualizar perfil');
      }
    } catch (error) {
      console.log('💥 Error en actualizarPerfil:', error);
      return {
        exito: false,
        error: this.manejarErrorAPI(error)
      };
    }
  }

  static async actualizarFotoPerfil(usuarioId, imagenUri) {
    try {
      this.configurarAxios();

      if (!usuarioId) {
        throw new Error('ID de usuario no proporcionado');
      }
      if (!imagenUri) {
        throw new Error('URI de imagen no proporcionada');
      }

      console.log('📸 Subiendo foto de perfil para usuario:', usuarioId, 'desde URI:', imagenUri);

      const formData = new FormData();
      formData.append('foto_perfil', {
        uri: imagenUri,
        name: `profile_${usuarioId}_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });

      const response = await axios.put(
        `${API_BASE_URL}/usuarios/${usuarioId}/foto`,
        formData,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          }
        }
      );

      console.log('📋 Respuesta de actualización de foto:', response.data);

      if (response.data && response.data.success) {
        return {
          exito: true,
          datos: response.data.usuario,
          mensaje: response.data.message,
          foto_perfil_url: response.data.foto_perfil_url
        };
      } else {
        throw new Error(response.data?.message || 'Error al actualizar la foto de perfil');
      }
    } catch (error) {
      console.log('💥 Error en actualizarFotoPerfil:', error);
      return {
        exito: false,
        error: this.manejarErrorAPI(error)
      };
    }
  }

  static manejarErrorAPI(error) {
    console.log('🔧 Manejando error:', error);

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message;

      console.log('📊 Status del error:', status);
      console.log('📝 Mensaje del error:', message);

      switch (status) {
        case 401:
          return {
            mensaje: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
            esErrorSesion: true
          };
        case 403:
          return {
            mensaje: 'No tienes permisos para realizar esta acción.',
            esErrorSesion: false
          };
        case 404:
          return {
            mensaje: 'Usuario no encontrado. Verifica que tu cuenta esté activa.',
            esErrorSesion: true
          };
        case 400:
          return {
            mensaje: message || 'Datos inválidos. Verifica la información.',
            esErrorSesion: false
          };
        case 409:
          return {
            mensaje: 'Conflicto: ' + (message || 'Datos duplicados'),
            esErrorSesion: false
          };
        case 500:
          return {
            mensaje: 'Error del servidor. Inténtalo más tarde.' + (message ? ` (${message})` : ''),
            esErrorSesion: false
          };
        default:
          return {
            mensaje: message || `Error del servidor (${status})`,
            esErrorSesion: false
          };
      }
    } else if (error.request) {
      console.log('🌐 Error de conexión:', error.request);
      return {
        mensaje: 'No se pudo conectar con el servidor. Verifica tu conexión a internet y que el servidor esté ejecutándose en ' + SERVER_BASE_URL,
        esErrorSesion: false
      };
    } else {
      console.log('🔧 Error de configuración:', error.message);
      return {
        mensaje: error.message || 'Error inesperado',
        esErrorSesion: false
      };
    }
  }
}

// ==========================================
// UTILIDADES
// ==========================================

const UtilsUsuario = {
  extraerIdUsuario: (params) => {
    console.log('🔍 Extrayendo ID de usuario de params:', params);
    if (!params) return null;
    if (params.userId) return params.userId;
    if (params.id) return params.id;
    if (params.usuarioId) return params.usuarioId;
    const posiblesIds = [
      params._id, params.usuario?.id, params.usuario?.usuarioId,
      params.usuario?._id, params.usuario?.idUsuario, params.user?.id,
      params.user?.usuarioId, params.user?._id
    ];
    for (const id of posiblesIds) {
      if (id) return id;
    }
    console.log('❌ No se encontró ID de usuario en params');
    return null;
  },

  normalizarDatosUsuario: (datos, idOriginal) => {
    if (!datos) return null;
    const id = datos.id || datos._id || datos.idUsuario || datos.usuarioId || idOriginal;
    return {
      ...datos,
      id: id,
      _id: id,
      idUsuario: id,
      usuarioId: id,
      nombre: datos.nombre || '',
      apellido: datos.apellido || '',
      email: datos.email || '',
      telefono: datos.telefono || '',
      direccion: datos.direccion || '',
      foto_perfil: datos.foto_perfil || null,
      id_rol: datos.id_rol || datos.rol || 4,
      fecha_registro: datos.fecha_registro || new Date()
    };
  },

  validarUsuarioCompleto: (usuario) => {
    return usuario && usuario.id && usuario.email && (usuario.nombre || usuario.apellido);
  }
};

// ==========================================
// COMPONENTES AUXILIARES
// ==========================================

const CampoInfo = ({ icono, texto, mostrarSiVacio = false, label }) => {
  if (!texto && !mostrarSiVacio) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.iconContainerInfo}>
        <Text style={styles.iconInfo}>{icono}</Text>
      </View>
      <View style={styles.infoContent}>
        {label && <Text style={styles.infoLabel}>{label}</Text>}
        <Text style={styles.datos}>{texto || 'No especificado'}</Text>
      </View>
    </View>
  );
};

const LoadingOverlay = ({ visible, texto = 'Cargando...' }) => {
  if (!visible) return null;
  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a26b6c" />
        <Text style={styles.loadingText}>{texto}</Text>
      </View>
    </View>
  );
};

const EstadoConexion = ({ conectado, onReintento }) => {
  if (conectado) return null;
  return (
    <View style={styles.estadoConexion}>
      <Text style={styles.estadoConexionTexto}>
        ⚠️ Sin conexión al servidor
      </Text>
      <TouchableOpacity style={styles.botonReintento} onPress={onReintento}>
        <Text style={styles.textoBotonReintento}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function PerfilScreen() {
  const [userData, setUserData] = useState(null);
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [conectado, setConectado] = useState(true);

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoApellido, setNuevoApellido] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevaImagen, setNuevaImagen] = useState(null);
  const [fotoPerfilActual, setFotoPerfilActual] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [contenidoModal, setContenidoModal] = useState('');
  const [tituloModal, setTituloModal] = useState('');

  // Hooks para el menú lateral (copiados de NosotrosScreen)
  const { menuVisible, slideAnimation, toggleMenu, closeMenu } = useMenuController();
  const { menuItems, appInfo, backgroundImage } = useAppData();

  const navigation = useNavigation();
  const route = useRoute();

  const paramsUsuario = route.params || {};
  const usuarioId = UtilsUsuario.extraerIdUsuario(paramsUsuario);

  console.log('📱 Parámetros recibidos:', paramsUsuario);
  console.log('🆔 ID del usuario extraído:', usuarioId);

  // ==========================================
  // EFECTOS Y LIFECYCLE
  // ==========================================

  useEffect(() => {
    console.log('📱 PerfilScreen montado');
    console.log('👤 Parámetros completos:', JSON.stringify(paramsUsuario, null, 2));

    if (!usuarioId) {
      console.error('❌ No se encontró ID del usuario');
      mostrarErrorSesion('No se pudo identificar el usuario. Los datos de sesión son inválidos.');
      return;
    }

    cargarDatosUsuario();
  }, [usuarioId]);

  useFocusEffect(
    useCallback(() => {
      if (usuarioId && !editando && !loading && !refreshing) {
        console.log('🔄 Pantalla en foco, recargando datos...');
        cargarDatosUsuario(true);
      }
    }, [usuarioId, editando, loading, refreshing])
  );

  // ==========================================
  // FUNCIONES PRINCIPALES
  // ==========================================

  const cargarDatosUsuario = async (esRefresh = false) => {
    try {
      if (!esRefresh) setLoading(true);
      setConectado(true);

      console.log('📡 Cargando datos del usuario:', usuarioId);

      const resultado = await PerfilService.obtenerDatosUsuario(usuarioId);

      if (resultado.exito) {
        console.log('✅ Datos cargados exitosamente:', resultado.datos);
        const datosNormalizados = UtilsUsuario.normalizarDatosUsuario(resultado.datos, usuarioId);
        if (UtilsUsuario.validarUsuarioCompleto(datosNormalizados)) {
          setUserData(datosNormalizados);
          initializarFormulario(datosNormalizados);
          setConectado(true);
        } else {
          throw new Error('Datos de usuario incompletos recibidos del servidor');
        }
      } else {
        console.log('⚠️ Error al cargar desde servidor:', resultado.error);
        setConectado(false);
        if (resultado.error.esErrorSesion) {
          mostrarErrorSesion(resultado.error.mensaje);
        } else {
          const datosFallback = crearDatosFallback();
          if (datosFallback) {
            console.log('📄 Usando datos de fallback');
            setUserData(datosFallback);
            initializarFormulario(datosFallback);
            Alert.alert('Error de conexión',
              resultado.error.mensaje + '\n\nSe muestran los datos básicos. Conecta a internet para actualizar tu perfil.');
          } else {
            Alert.alert('Error de conexión',
              resultado.error.mensaje + '\n\nNo se pudieron cargar los datos del perfil.');
          }
        }
      }
    } catch (error) {
      console.error('💥 Error inesperado en cargarDatosUsuario:', error);
      setConectado(false);
      const datosFallback = crearDatosFallback();
      if (datosFallback) {
        setUserData(datosFallback);
        initializarFormulario(datosFallback);
        Alert.alert('Modo sin conexión',
          'Se muestran los datos almacenados localmente. Conecta a internet para actualizar.');
      } else {
        Alert.alert('Error', 'Ocurrió un error inesperado al cargar los datos');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const crearDatosFallback = () => {
    if (paramsUsuario.usuarioNombre || paramsUsuario.nombre ||
        (paramsUsuario.usuario && (paramsUsuario.usuario.nombre || paramsUsuario.usuario.usuarioNombre))) {
      const usuario = paramsUsuario.usuario || paramsUsuario;
      console.log('📄 Creando datos de fallback desde params:', usuario);
      return UtilsUsuario.normalizarDatosUsuario({
        id: usuarioId,
        nombre: usuario.usuarioNombre || usuario.nombre || '',
        apellido: usuario.usuarioApellido || usuario.apellido || '',
        email: usuario.usuarioEmail || usuario.email || '',
        telefono: usuario.usuarioTelefono || usuario.telefono || '',
        direccion: usuario.usuarioDireccion || usuario.direccion || '',
        foto_perfil: usuario.foto_perfil || null,
        id_rol: usuario.rol || usuario.id_rol || 4,
        fecha_registro: new Date()
      }, usuarioId);
    }
    return null;
  };

  const initializarFormulario = (datosUsuario) => {
    if (!datosUsuario) return;
    console.log('🔧 Inicializando formulario con:', datosUsuario);
    setNuevoNombre(datosUsuario.nombre || '');
    setNuevoApellido(datosUsuario.apellido || '');
    setNuevaDireccion(datosUsuario.direccion || '');
    setNuevoTelefono(datosUsuario.telefono || '');
    if (datosUsuario.foto_perfil) {
      setFotoPerfilActual(`${SERVER_BASE_URL}/uploads/${datosUsuario.foto_perfil}`);
    } else {
      setFotoPerfilActual(null);
    }
    setNuevaImagen(null);
  };

  const onRefresh = useCallback(() => {
    console.log('🔄 Ejecutando refresh...');
    setRefreshing(true);
    cargarDatosUsuario(true);
  }, [usuarioId]);

  // ==========================================
  // FUNCIONES DE VALIDACIÓN
  // ==========================================

  const validarDatos = () => {
    const nombre = nuevoNombre.trim();
    const apellido = nuevoApellido.trim();
    const telefono = nuevoTelefono.trim();

    if (!nombre || nombre.length < 2) {
      Alert.alert('Error de validación', 'El nombre debe tener al menos 2 caracteres');
      return false;
    }
    if (!apellido || apellido.length < 2) {
      Alert.alert('Error de validación', 'El apellido debe tener al menos 2 caracteres');
      return false;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
      Alert.alert('Error de validación', 'El nombre solo puede contener letras');
      return false;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellido)) {
      Alert.alert('Error de validación', 'El apellido solo puede contener letras');
      return false;
    }
    if (telefono && telefono.length < 10) {
      Alert.alert('Error de validación', 'El teléfono debe tener al menos 10 dígitos');
      return false;
    }
    if (telefono && !/^[\d\s\-\+\$\$]+$/.test(telefono)) { // Corregida la regex para incluir paréntesis
      Alert.alert('Error de validación', 'El teléfono solo puede contener números y los caracteres +, -, (, )');
      return false;
    }
    return true;
  };

  // ==========================================
  // FUNCIONES DE IMAGEN
  // ==========================================

  const seleccionarImagen = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert(
          'Permiso denegado',
          'Se necesita acceso a la galería para cambiar la foto de perfil'
        );
        return;
      }

      Alert.alert(
        'Cambiar foto de perfil',
        'Selecciona una opción',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Galería', onPress: () => abrirGaleria() },
          { text: 'Cámara', onPress: () => abrirCamara() }
        ]
      );
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo acceder a la galería');
    }
  };

  const abrirGaleria = async () => {
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: false,
      });

      if (!resultado.canceled && resultado.assets && resultado.assets[0]) {
        setNuevaImagen(resultado.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al abrir galería:', error);
      Alert.alert('Error', 'No se pudo abrir la galería');
    }
  };

  const abrirCamara = async () => {
    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara');
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: false,
      });

      if (!resultado.canceled && resultado.assets && resultado.assets[0]) {
        setNuevaImagen(resultado.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al abrir cámara:', error);
      Alert.alert('Error', 'No se pudo abrir la cámara');
    }
  };

  // ==========================================
  // FUNCIONES DE CRUD
  // ==========================================

  const guardarCambios = async () => {
    if (!validarDatos()) return;
    if (!conectado) {
      Alert.alert('Sin conexión', 'Necesitas conexión a internet para guardar los cambios.');
      return;
    }

    try {
      setGuardando(true);
      console.log('💾 Guardando cambios...');

      const datosActualizados = {
        nombre: nuevoNombre.trim(),
        apellido: nuevoApellido.trim(),
        telefono: nuevoTelefono.trim(),
        direccion: nuevaDireccion.trim(),
      };

      let perfilActualizadoExito = false;
      let fotoActualizadaExito = false;

      const resultadoPerfil = await PerfilService.actualizarPerfil(usuarioId, datosActualizados);

      if (resultadoPerfil.exito) {
        console.log('✅ Perfil de texto actualizado exitosamente');
        perfilActualizadoExito = true;
        setUserData(prevData => UtilsUsuario.normalizarDatosUsuario({
          ...prevData,
          ...datosActualizados
        }, usuarioId));
      } else {
        console.log('❌ Error al actualizar perfil de texto:', resultadoPerfil.error);
        if (resultadoPerfil.error.esErrorSesion) {
          mostrarErrorSesion(resultadoPerfil.error.mensaje);
          return;
        } else {
          setConectado(false);
          Alert.alert('Error', resultadoPerfil.error.mensaje);
        }
      }

      if (nuevaImagen) {
        console.log('📸 Subiendo nueva imagen de perfil...');
        const resultadoFoto = await PerfilService.actualizarFotoPerfil(usuarioId, nuevaImagen);

        if (resultadoFoto.exito) {
          console.log('✅ Foto de perfil actualizada exitosamente');
          fotoActualizadaExito = true;
          const nuevaFotoUrlCompleta = `${SERVER_BASE_URL}/uploads/${resultadoFoto.foto_perfil_url}`;
          setFotoPerfilActual(nuevaFotoUrlCompleta);
          setNuevaImagen(null);
          setUserData(prevData => UtilsUsuario.normalizarDatosUsuario({
            ...prevData,
            foto_perfil: resultadoFoto.foto_perfil_url
          }, usuarioId));
        } else {
          console.log('❌ Error al actualizar foto de perfil:', resultadoFoto.error);
          setConectado(false);
          Alert.alert('Error', `Error al actualizar la foto: ${resultadoFoto.error.mensaje}`);
        }
      }

      if (perfilActualizadoExito || fotoActualizadaExito) {
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
        setEditando(false);
        setConectado(true);
        setTimeout(() => {
          cargarDatosUsuario();
        }, 500);
      } else if (!nuevaImagen) {
        Alert.alert('Información', 'No se realizaron cambios en el perfil.');
        setEditando(false);
      }

    } catch (error) {
      console.error('💥 Error inesperado al guardar:', error);
      setConectado(false);
      Alert.alert('Error', 'Ocurrió un error inesperado al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  const cancelarEdicion = () => {
    console.log('❌ Cancelando edición');
    if (userData) {
      initializarFormulario(userData);
    }
    setEditando(false);
    setNuevaImagen(null);
  };

  // ==========================================
  // FUNCIONES DE UI
  // ==========================================

  const handleMenuAction = (actionType) => {
    closeMenu();
    let titulo = '';
    let contenido = '';

    switch (actionType) {
      case 'showNotificationsModal':
        titulo = 'Notificaciones';
        contenido = 'No tienes notificaciones nuevas.\n\nAquí aparecerán las actualizaciones sobre tus donaciones y actividades en la plataforma.';
        break;
      case 'showPrivacyModal':
        titulo = 'Privacidad y Seguridad';
        contenido = 'Funcionalidad para cambiar contraseña.\n\nTu información está protegida y solo tú puedes modificarla.';
        break;
      case 'showHelpModal':
        titulo = 'Ayuda y Soporte';
        contenido = '¿Necesitas ayuda?\n\n📧 Email: devs@patitasconectadas.com\n📞 Teléfono: +52 123 456 7890\n\nEstamos aquí para ayudarte con cualquier problema o pregunta.';
        break;
      case 'showTermsModal':
        titulo = 'Términos y Condiciones';
        contenido = 'Al usar esta aplicación, aceptas:\n\n• Usar la plataforma de manera responsable\n• Proporcionar información veraz\n• Respetar a los refugios y otros usuarios\n• No usar la app para fines comerciales no autorizados';
        break;
      default:
        contenido = '';
    }

    setTituloModal(titulo);
    setContenidoModal(contenido);
    setModalVisible(true);
  };

  const mostrarErrorSesion = (mensaje = 'No se pudieron obtener los datos del usuario. Por favor, inicia sesión nuevamente.') => {
    Alert.alert(
      'Error de sesión',
      mensaje,
      [
        {
          text: 'Ir al Login',
          onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: 'inicio_sesion' }],
          })
        }
      ],
      { cancelable: false }
    );
  };

  const reintentar = () => {
    console.log('🔄 Reintentando conexión...');
    cargarDatosUsuario();
  };

  // ==========================================
  // RENDER CONDICIONAL
  // ==========================================

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />
        <ActivityIndicator size="large" color="#a26b6c" />
        <Text style={styles.cargandoTexto}>Cargando perfil...</Text>
        <Text style={styles.cargandoSubtexto}>ID Usuario: {usuarioId || 'No disponible'}</Text>
      </SafeAreaView>
    );
  }

  if (!userData && !loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />
        <Text style={styles.errorText}>No se pudieron cargar los datos del perfil</Text>
        <Text style={styles.errorSubtext}>Usuario ID: {usuarioId || 'No disponible'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => cargarDatosUsuario()}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.retryButton, styles.goBackButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ==========================================
  // RENDER PRINCIPAL
  // ==========================================

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />

      {/* Header (Ahora usando el componente Header de NosotrosScreen) */}
      <Header
        appName={appInfo.name}
        screenTitle={'Mi Perfil'}
        menuVisible={menuVisible}
        onMenuToggle={toggleMenu}
      />

      {/* Side Menu (Ahora usando el componente SideMenu de NosotrosScreen) */}
      <SideMenu
        visible={menuVisible}
        slideAnimation={slideAnimation}
        menuItems={menuItems}
        appInfo={appInfo}
        onClose={closeMenu}
        userId={usuarioId}
        userData={userData}
        fotoPerfilActual={fotoPerfilActual}
        onAction={handleMenuAction} // Pasa la función para manejar acciones de modal
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
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#a26b6c']}
                tintColor="#a26b6c"
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Estado de conexión */}
            <EstadoConexion conectado={conectado} onReintento={reintentar} />

            {/* Sección de Perfil (información del usuario) */}
            <View style={styles.section}>
              <View style={styles.logoContainer}>
                <TouchableOpacity
                  onPress={editando ? seleccionarImagen : null}
                  activeOpacity={editando ? 0.7 : 1}
                >
                  {nuevaImagen ? (
                    <Image source={{ uri: nuevaImagen }} style={styles.logo} />
                  ) : fotoPerfilActual ? (
                    <Image source={{ uri: fotoPerfilActual }} style={styles.logo} />
                  ) : (
                    <View style={[styles.logo, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarText}>
                        {userData?.nombre ? userData.nombre.charAt(0).toUpperCase() : '👤'}
                      </Text>
                    </View>
                  )}
                  {editando && (
                    <Text style={styles.cambiarImagenText}>Toca para cambiar foto</Text>
                  )}
                </TouchableOpacity>
              </View>

              {editando ? (
                <KeyboardAvoidingView
                  behavior={Platform.OS === "ios" ? "padding" : "height"}
                  style={styles.formularioWrapper}
                >
                  <View style={styles.formularioContainer}>
                    <Text style={styles.sectionTitle}>Editar información personal</Text>

                    <Text style={styles.inputLabel}>Nombre *</Text>
                    <TextInput
                      style={styles.input}
                      value={nuevoNombre}
                      onChangeText={setNuevoNombre}
                      placeholder="Ingresa tu nombre"
                      maxLength={50}
                      editable={!guardando}
                      autoCapitalize="words"
                    />

                    <Text style={styles.inputLabel}>Apellido *</Text>
                    <TextInput
                      style={styles.input}
                      value={nuevoApellido}
                      onChangeText={setNuevoApellido}
                      placeholder="Ingresa tu apellido"
                      maxLength={50}
                      editable={!guardando}
                      autoCapitalize="words"
                    />

                    <Text style={styles.inputLabel}>Teléfono</Text>
                    <TextInput
                      style={styles.input}
                      value={nuevoTelefono}
                      onChangeText={setNuevoTelefono}
                      placeholder="Ej: +52 123 456 7890"
                      keyboardType="phone-pad"
                      maxLength={15}
                      editable={!guardando}
                    />

                    <Text style={styles.inputLabel}>Dirección</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={nuevaDireccion}
                      onChangeText={setNuevaDireccion}
                      placeholder="Ingresa tu dirección completa"
                      multiline
                      numberOfLines={3}
                      maxLength={200}
                      editable={!guardando}
                      textAlignVertical="top"
                    />

                    <Text style={styles.camposObligatorios}>* Campos obligatorios</Text>
                  </View>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton, guardando && styles.disabledButton]}
                      onPress={cancelarEdicion}
                      disabled={guardando}
                    >
                      <Text style={styles.buttonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.saveButton, guardando && styles.disabledButton]}
                      onPress={guardarCambios}
                      disabled={guardando}
                    >
                      {guardando ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text style={styles.buttonText}>Guardar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </KeyboardAvoidingView>
              ) : (
                <>
                  <Text style={styles.nombre}>
                    {`${userData.nombre || ''} ${userData.apellido || ''}`.trim() || 'Usuario sin nombre'}
                  </Text>

                  <TouchableOpacity
                    style={[styles.editButton, !conectado && styles.disabledButton]}
                    onPress={() => setEditando(true)}
                    disabled={!conectado}
                  >
                    <Text style={styles.editText}>✏️ Editar Perfil</Text>
                  </TouchableOpacity>

                  <View style={styles.infoContainer}>
                    <CampoInfo
                      icono="📧"
                      texto={userData.email}
                      label="Email"
                      mostrarSiVacio={true}
                    />
                    <CampoInfo
                      icono="📞"
                      texto={userData.telefono}
                      label="Teléfono"
                    />
                    <CampoInfo
                      icono="📍"
                      texto={userData.direccion}
                      label="Dirección"
                    />
                    <CampoInfo
                      icono="🏷️"
                      texto={userData.id_rol === 5 ? 'Administrador' : 'Usuario'}
                      label="Tipo de cuenta"
                      mostrarSiVacio={true}
                    />

                    <View style={styles.infoRow}>
                      <View style={styles.iconContainerInfo}>
                        <Text style={styles.iconInfo}>📅</Text>
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Miembro desde</Text>
                        <Text style={styles.datos}>
                          {new Date(userData.fecha_registro || Date.now()).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {!conectado && (
                    <Text style={styles.avisoSinConexion}>
                      Conecta a internet para editar tu perfil
                    </Text>
                  )}
                </>
              )}
            </View>

            {/* Espaciado inferior */}
            <View style={styles.espaciadoInferior} />
          </ScrollView>
        </View>
      </ImageBackground>

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

      {/* Loading overlay */}
      <LoadingOverlay visible={guardando} texto="Guardando cambios..." />
    </SafeAreaView>
  );
}

// ==========================================
// ESTILOS (Ajustados para coincidir con NosotrosScreen.js)
// ==========================================

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
  cargandoSubtexto: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },

  // Header styles (Copiado de NosotrosScreen.js)
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

  // Side Menu styles (Copiado de NosotrosScreen.js)
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
    overflow: 'hidden', // Para que la imagen se recorte dentro del círculo
  },
  avatarMenuImage: { // Nuevo estilo para la imagen del avatar en el menú
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
  sectionTitle: { // Reutilizado para el menú lateral
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

  // Estilos específicos del contenido del perfil
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
  avatarPlaceholder: {
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 40,
    color: '#6c757d',
    fontWeight: 'bold'
  },
  cambiarImagenText: {
    fontSize: 14,
    color: '#0066ff',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500'
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
    marginHorizontal: 0,
  },
  nombre: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoContainer: {
    width: '100%',
    marginTop: 15,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#a26b6c',
  },
  iconContainerInfo: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#a26b6c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    marginTop: 2,
  },
  iconInfo: {
    fontSize: 16,
    color: 'white',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  datos: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    lineHeight: 22,
  },
  formularioWrapper: {
    width: '100%',
  },
  formularioContainer: {
    width: '100%',
    marginBottom: 20,
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
  camposObligatorios: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
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
  avisoSinConexion: {
    fontSize: 12,
    color: '#e63946',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  estadoConexion: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    padding: 10,
    marginVertical: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  estadoConexionTexto: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  botonReintento: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  textoBotonReintento: {
    color: '#212529',
    fontSize: 12,
    fontWeight: 'bold',
  },
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
    fontWeight: '600',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#0066ff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
  },
  goBackButton: {
    backgroundColor: '#6c757d',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  espaciadoInferior: {
    height: 30,
  },
});