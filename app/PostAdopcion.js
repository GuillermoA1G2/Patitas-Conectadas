import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ==========================================
// CONFIGURACIÓN Y CONSTANTES
// ==========================================

const API_BASE_URL = 'https://patitas-conectadas-nine.vercel.app/api';
const SERVER_BASE_URL = 'https://patitas-conectadas-nine.vercel.app';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.65;

// ==========================================
// SERVICIOS
// ==========================================

class MenuService {
  static getMenuItems() {
    return [
      {
        title: 'Perfil Usuario',
        icon: 'person-outline',
        route: 'PerfilUsuario',
        color: '#4ECDC4',
      },
      {
        title: 'Asociaciones',
        icon: 'people-outline',
        route: 'Asociaciones',
        color: '#A55EEA',
      },
      {
        title: 'Catalogo Mascotas',
        icon: 'star-outline',
        route: 'CatalogoMascotas',
        color: '#26DE81',
      },
      {
        title: 'Donaciones',
        icon: 'gift-outline',
        route: 'Donaciones',
        color: '#FD79A8',
      },
      {
        title: 'Solicitudes de Adopción',
        icon: 'document-text-outline',
        route: 'SolicitudesUsuario',
        color: '#e9fd79ff',
      },
    ];
  }

  static getAppInfo() {
    return {
      name: 'Patitas Conectadas',
      version: '1.0.0',
      copyright: 'Patitas Conectadas © 2024',
      welcomeMessage: '¡Bienvenido!',
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

class PostAdopcionService {
  static async obtenerAdopcionesAprobadas(usuarioId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/solicitudes-adopcion/usuario/${usuarioId}`,
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      if (response.data && response.data.success) {
        const adopcionesAprobadas = response.data.solicitudes.filter(
          (sol) => sol.estado === 'aprobada'
        );
        return {
          exito: true,
          adopciones: adopcionesAprobadas,
        };
      }
      return { exito: false, error: 'No se pudieron obtener las adopciones' };
    } catch (error) {
      console.error('Error al obtener adopciones:', error);
      return { exito: false, error: 'Error de conexión' };
    }
  }

  static calcularProximaActualizacion(fechaAdopcion, frecuencia = 'mensual') {
    const fecha = new Date(fechaAdopcion);
    const hoy = new Date();
    
    if (frecuencia === 'mensual') {
      fecha.setMonth(fecha.getMonth() + 1);
    } else {
      fecha.setDate(fecha.getDate() + 7);
    }
    
    return fecha;
  }

  static diasRestantes(fechaProxima) {
    const hoy = new Date();
    const proxima = new Date(fechaProxima);
    const diff = proxima - hoy;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}

// ==========================================
// HOOKS PERSONALIZADOS
// ==========================================

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
    closeMenu,
  };
};

const useAppData = () => {
  const menuItems = MenuService.getMenuItems();
  const appInfo = MenuService.getAppInfo();
  const backgroundImage = MenuService.getBackgroundImage();

  return {
    menuItems,
    appInfo,
    backgroundImage,
  };
};

// ==========================================
// COMPONENTES
// ==========================================

const HamburgerButton = ({ isActive, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.menuButton}>
    <View style={styles.hamburgerContainer}>
      <View style={[styles.hamburgerLine, isActive && styles.hamburgerLineActive]} />
      <View
        style={[
          styles.hamburgerLine,
          styles.hamburgerLineMiddle,
          isActive && styles.hamburgerLineMiddleActive,
        ]}
      />
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
    }
  };

  return (
    <TouchableOpacity style={styles.menuItem} onPress={handlePress} activeOpacity={0.7}>
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
    <ScrollView style={styles.menuScrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>NAVEGACIÓN</Text>
        {menuItems.map((item, index) => (
          <MenuItem key={index} item={item} onPress={onMenuClose} userId={userId} />
        ))}
      </View>

      <View style={styles.logoutSection}>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.logoutItem} onPress={handleLogout} activeOpacity={0.7}>
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
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[
            styles.sideMenu,
            {
              transform: [{ translateX: slideAnimation }],
              width: MENU_WIDTH,
            },
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

// Componente principal de tarjeta de adopción
const AdopcionCard = ({ adopcion, onSubirFoto, onAgregarComentario, onChat }) => {
  const [comentario, setComentario] = useState('');
  const [mostrarComentarios, setMostrarComentarios] = useState(false);
  const [ultimaActualizacion] = useState(new Date());
  
  const proximaActualizacion = PostAdopcionService.calcularProximaActualizacion(
    adopcion.fechaCreacion,
    'mensual'
  );
  const diasRestantes = PostAdopcionService.diasRestantes(proximaActualizacion);
  
  const estadoActualizacion = diasRestantes > 7 ? 'Completado' : 'Pendiente';
  const colorEstado = estadoActualizacion === 'Completado' ? '#26DE81' : '#FD79A8';

  const fotoMascota = adopcion.fotos && adopcion.fotos.length > 0 
    ? `${SERVER_BASE_URL}${adopcion.fotos[0]}`
    : null;

  return (
    <View style={styles.adopcionCard}>
      {/* Foto de la mascota */}
      <View style={styles.fotoContainer}>
        {fotoMascota ? (
          <Image source={{ uri: fotoMascota }} style={styles.fotoMascota} />
        ) : (
          <View style={[styles.fotoMascota, styles.fotoPlaceholder]}>
            <Ionicons name="paw" size={50} color="#ccc" />
          </View>
        )}
        <View style={styles.infoMascotaOverlay}>
          <Text style={styles.nombreMascota}>{adopcion.mascota}</Text>
          <Text style={styles.especieMascota}>
            {adopcion.especie} {adopcion.raza && `• ${adopcion.raza}`}
          </Text>
        </View>
      </View>

      {/* Estado de actualización */}
      <View style={styles.estadoContainer}>
        <View style={[styles.estadoBadge, { backgroundColor: colorEstado }]}>
          <Ionicons
            name={estadoActualizacion === 'Completado' ? 'checkmark-circle' : 'time'}
            size={16}
            color="#fff"
          />
          <Text style={styles.estadoTexto}>{estadoActualizacion}</Text>
        </View>
      </View>

      {/* Calendario de actualizaciones */}
      <View style={styles.calendarioContainer}>
        <View style={styles.calendarioHeader}>
          <Ionicons name="calendar-outline" size={20} color="#a26b6c" />
          <Text style={styles.calendarioTitulo}>Próxima actualización</Text>
        </View>
        <View style={styles.calendarioInfo}>
          <Text style={styles.fechaTexto}>
            {proximaActualizacion.toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          <Text style={styles.diasRestantesTexto}>
            {diasRestantes > 0 ? `Faltan ${diasRestantes} días` : 'Actualización vencida'}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${Math.max(0, Math.min(100, 100 - (diasRestantes / 30) * 100))}%` },
            ]}
          />
        </View>
      </View>

      {/* Información del refugio */}
      <View style={styles.refugioInfo}>
        <Ionicons name="home-outline" size={18} color="#666" />
        <Text style={styles.refugioNombre}>{adopcion.refugio.nombre}</Text>
      </View>

      {/* Botones de acción */}
      <View style={styles.botonesContainer}>
        <TouchableOpacity
          style={[styles.botonAccion, styles.botonPrimario]}
          onPress={() => onSubirFoto(adopcion)}
        >
          <Ionicons name="camera" size={20} color="#fff" />
          <Text style={styles.botonTexto}>Subir foto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.botonAccion, styles.botonSecundario]}
          onPress={() => onChat(adopcion)}
        >
          <Ionicons name="chatbubbles" size={20} color="#a26b6c" />
          <Text style={[styles.botonTexto, styles.botonTextoSecundario]}>Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Sección de comentarios */}
      <TouchableOpacity
        style={styles.comentarioHeader}
        onPress={() => setMostrarComentarios(!mostrarComentarios)}
      >
        <Ionicons name="create-outline" size={18} color="#a26b6c" />
        <Text style={styles.comentarioHeaderTexto}>Agregar comentario o nota</Text>
        <Ionicons
          name={mostrarComentarios ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#999"
        />
      </TouchableOpacity>

      {mostrarComentarios && (
        <View style={styles.comentarioContainer}>
          <TextInput
            style={styles.comentarioInput}
            placeholder="Escribe aquí cómo va tu nueva mascota..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            value={comentario}
            onChangeText={setComentario}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={styles.botonEnviarComentario}
            onPress={() => {
              if (comentario.trim()) {
                onAgregarComentario(adopcion, comentario);
                setComentario('');
              }
            }}
          >
            <Ionicons name="send" size={18} color="#fff" />
            <Text style={styles.botonEnviarTexto}>Enviar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Última actualización */}
      <View style={styles.ultimaActualizacionContainer}>
        <Text style={styles.ultimaActualizacionTexto}>
          Última actualización: {ultimaActualizacion.toLocaleDateString('es-ES')}
        </Text>
      </View>
    </View>
  );
};

// Modal de subir foto
const ModalSubirFoto = ({ visible, onClose, onConfirmar, mascota }) => {
  const [imagen, setImagen] = useState(null);

  const seleccionarImagen = async (tipo) => {
    try {
      let resultado;
      
      if (tipo === 'camara') {
        const permiso = await ImagePicker.requestCameraPermissionsAsync();
        if (!permiso.granted) {
          Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara');
          return;
        }
        resultado = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });
      } else {
        const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permiso.granted) {
          Alert.alert('Permiso denegado', 'Se necesita acceso a la galería');
          return;
        }
        resultado = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });
      }

      if (!resultado.canceled && resultado.assets && resultado.assets[0]) {
        setImagen(resultado.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo acceder a la imagen');
    }
  };

  const handleConfirmar = () => {
    if (imagen) {
      onConfirmar(imagen);
      setImagen(null);
    }
  };

  const handleCerrar = () => {
    setImagen(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalFondo}>
        <View style={styles.modalContenido}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Subir foto de {mascota}</Text>
            <TouchableOpacity onPress={handleCerrar}>
              <Ionicons name="close-circle" size={28} color="#a26b6c" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {imagen ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imagen }} style={styles.imagenPreview} />
                <TouchableOpacity
                  style={styles.botonCambiarImagen}
                  onPress={() => setImagen(null)}
                >
                  <Text style={styles.botonCambiarTexto}>Cambiar imagen</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.opcionesImagenContainer}>
                <Text style={styles.instruccionTexto}>
                  Selecciona cómo quieres agregar la foto:
                </Text>
                <TouchableOpacity
                  style={styles.opcionImagen}
                  onPress={() => seleccionarImagen('camara')}
                >
                  <Ionicons name="camera" size={40} color="#a26b6c" />
                  <Text style={styles.opcionTexto}>Tomar foto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.opcionImagen}
                  onPress={() => seleccionarImagen('galeria')}
                >
                  <Ionicons name="images" size={40} color="#a26b6c" />
                  <Text style={styles.opcionTexto}>Elegir de galería</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalBotones}>
            <TouchableOpacity
              style={[styles.modalBoton, styles.modalBotonCancelar]}
              onPress={handleCerrar}
            >
              <Text style={styles.modalBotonTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalBoton,
                styles.modalBotonConfirmar,
                !imagen && styles.modalBotonDeshabilitado,
              ]}
              onPress={handleConfirmar}
              disabled={!imagen}
            >
              <Text style={[styles.modalBotonTexto, styles.modalBotonConfirmarTexto]}>
                Subir
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function PostAdopcionScreen() {
  const [adopciones, setAdopciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalFotoVisible, setModalFotoVisible] = useState(false);
  const [adopcionSeleccionada, setAdopcionSeleccionada] = useState(null);

  const { menuVisible, slideAnimation, toggleMenu, closeMenu } = useMenuController();
  const { menuItems, appInfo, backgroundImage } = useAppData();

  const navigation = useNavigation();
  const route = useRoute();
  const userId = route.params?.userId;

  const cargarAdopciones = async () => {
    try {
      setLoading(true);
      const resultado = await PostAdopcionService.obtenerAdopcionesAprobadas(userId);

      if (resultado.exito) {
        setAdopciones(resultado.adopciones);
      } else {
        Alert.alert('Error', resultado.error);
      }
    } catch (error) {
      console.error('Error al cargar adopciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las adopciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) {
      cargarAdopciones();
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        cargarAdopciones();
      }
    }, [userId])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarAdopciones();
  }, [userId]);

  const handleSubirFoto = (adopcion) => {
    setAdopcionSeleccionada(adopcion);
    setModalFotoVisible(true);
  };

  const handleConfirmarFoto = async (imagenUri) => {
    Alert.alert('Éxito', 'Foto subida correctamente');
    setModalFotoVisible(false);
    setAdopcionSeleccionada(null);
  };

  const handleAgregarComentario = (adopcion, comentario) => {
    Alert.alert('Comentario agregado', 'Tu comentario ha sido registrado');
  };

  const handleChat = (adopcion) => {
    Alert.alert(
      'Chat con refugio',
      `Próximamente podrás chatear con ${adopcion.refugio.nombre}`
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />
        <ActivityIndicator size="large" color="#a26b6c" />
        <Text style={styles.cargandoTexto}>Cargando adopciones...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />

      <Header
        appName={appInfo.name}
        screenTitle="Post-Adopción"
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

      <ImageBackground source={backgroundImage} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.contentOverlay}>
          {adopciones.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="paw" size={80} color="#ccc" />
              <Text style={styles.emptyTitulo}>No tienes adopciones aprobadas</Text>
              <Text style={styles.emptySubtitulo}>
                Una vez que se apruebe tu solicitud, aparecerá aquí
              </Text>
            </View>
          ) : (
            <FlatList
              data={adopciones}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <AdopcionCard
                  adopcion={item}
                  onSubirFoto={handleSubirFoto}
                  onAgregarComentario={handleAgregarComentario}
                  onChat={handleChat}
                />
              )}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#a26b6c']}
                  tintColor="#a26b6c"
                />
              }
            />
          )}
        </View>
      </ImageBackground>

      <ModalSubirFoto
        visible={modalFotoVisible}
        onClose={() => {
          setModalFotoVisible(false);
          setAdopcionSeleccionada(null);
        }}
        onConfirmar={handleConfirmarFoto}
        mascota={adopcionSeleccionada?.mascota || ''}
      />
    </SafeAreaView>
  );
}

// ==========================================
// ESTILOS
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

  // Header
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

  // Menu
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

  // Background
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },

  // Lista
  listContainer: {
    padding: 15,
    paddingBottom: 30,
  },

  // Tarjeta de adopción
  adopcionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Foto de mascota
  fotoContainer: {
    position: 'relative',
    height: 220,
    backgroundColor: '#f0f0f0',
  },
  fotoMascota: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fotoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
  },
  infoMascotaOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 15,
  },
  nombreMascota: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  especieMascota: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Estado
  estadoContainer: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  estadoTexto: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Calendario
  calendarioContainer: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  calendarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  calendarioTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  calendarioInfo: {
    marginBottom: 10,
  },
  fechaTexto: {
    fontSize: 15,
    color: '#555',
    marginBottom: 4,
  },
  diasRestantesTexto: {
    fontSize: 13,
    color: '#999',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#a26b6c',
    borderRadius: 3,
  },

  // Refugio info
  refugioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 8,
  },
  refugioNombre: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  // Botones de acción
  botonesContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  botonAccion: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  botonPrimario: {
    backgroundColor: '#a26b6c',
  },
  botonSecundario: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#a26b6c',
  },
  botonTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  botonTextoSecundario: {
    color: '#a26b6c',
  },

  // Comentarios
  comentarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  comentarioHeaderTexto: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  comentarioContainer: {
    padding: 15,
    backgroundColor: '#fff',
  },
  comentarioInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  botonEnviarComentario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#a26b6c',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  botonEnviarTexto: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Última actualización
  ultimaActualizacionContainer: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  ultimaActualizacionTexto: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitulo: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Modal subir foto
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContenido: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '95%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a26b6c',
    flex: 1,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imagenPreview: {
    width: '100%',
    height: 300,
    borderRadius: 15,
    resizeMode: 'cover',
    marginBottom: 15,
  },
  botonCambiarImagen: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  botonCambiarTexto: {
    fontSize: 14,
    color: '#a26b6c',
    fontWeight: '600',
  },
  opcionesImagenContainer: {
    paddingVertical: 20,
  },
  instruccionTexto: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  opcionImagen: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  opcionTexto: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginTop: 10,
  },
  modalBotones: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  modalBoton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBotonCancelar: {
    backgroundColor: '#e0e0e0',
  },
  modalBotonConfirmar: {
    backgroundColor: '#a26b6c',
  },
  modalBotonDeshabilitado: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  modalBotonTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBotonConfirmarTexto: {
    color: '#fff',
  },
});