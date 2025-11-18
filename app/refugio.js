import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  StatusBar,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

// ==========================================
// CONFIGURACIÓN Y CONSTANTES
// ==========================================

const API_BASE_URL = 'https://patitas-conectadas-nine.vercel.app/api';
const SERVER_BASE_URL = 'https://patitas-conectadas-nine.vercel.app';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.65;

// ==========================================
// MODAL CONTENT SERVICE
// ==========================================

class ModalContentService {
  static getPrivacyContent() {
    return `Política de Privacidad Patitas Conectadas

Última actualización: 10 de octubre de 2025

1. Responsable del tratamiento
Patitas Conectadas con domicilio en Guadalajara, Jalisco, México, es responsable del uso y protección de los datos personales de sus usuarios.

2. Datos que recopilamos
• Nombre completo, correo, teléfono y dirección
• CURP o RFC (para verificación de refugios y usuarios)
• Datos sobre adopciones o mascotas registradas
• Datos técnicos del dispositivo (IP, sistema, uso)

3. Finalidades del tratamiento
• Facilitar procesos de adopción y registro
• Enviar recordatorios o seguimientos post-adopción
• Mejorar la experiencia del usuario
• Cumplir obligaciones legales y de seguridad
• No usamos tu información con fines comerciales sin consentimiento

4. Protección de la información
• Implementamos medidas técnicas, administrativas y físicas para proteger los datos
• Solo personal autorizado puede acceder a la información

5. Compartición de datos
• Con refugios o adoptantes directamente involucrados
• Por requerimiento de una autoridad
• Con proveedores de servicios tecnológicos necesarios

6. Derechos ARCO
Puedes ejercer tus derechos de Acceso, Rectificación, Cancelación u Oposición enviando un correo a:
📩 privacidad@patitasconectadas.mx

7. Conservación de datos
Los datos se conservarán solo por el tiempo necesario para cumplir las finalidades descritas y conforme a la ley.

8. Aceptación
Al usar la aplicación o el sitio web, confirmas que has leído y aceptado esta Política de Privacidad.`;
  }

  static getTermsContent() {
    return `Términos y Condiciones

1. Introducción
Bienvenido a Patitas Conectadas, una aplicación creada para facilitar la adopción responsable de perros y fortalecer la colaboración entre refugios, adoptantes y la comunidad de Zapopan. Al usar la app o el sitio web, aceptas estos Términos y Condiciones. Si no estás de acuerdo con alguno de ellos, te recomendamos no utilizar nuestros servicios.

2. Objeto
• Conectar refugios y adoptantes de forma segura
• Registrar y consultar perros disponibles para adopción
• Dar seguimiento al bienestar animal después de la adopción
• La aplicación actúa como un facilitador tecnológico, no como intermediario legal

3. Registro y uso de la cuenta
Los usuarios deben:
• Proporcionar información veraz y actualizada
• Mantener la confidencialidad de sus credenciales
• Ser mayor de edad o contar con supervisión de un tutor
• Patitas Conectadas puede suspender cuentas en caso de uso indebido o fraude

4. Responsabilidad de los usuarios
• Los refugios deben garantizar la veracidad de la información de los animales publicados
• Los adoptantes se comprometen con la tenencia responsable
• La aplicación no se hace responsable por acuerdos fuera de la plataforma

5. Propiedad intelectual
Todo el contenido, logotipos, textos, diseños y software pertenecen a Patitas Conectadas o a sus titulares. Queda prohibida su reproducción total o parcial sin autorización.

6. Limitación de responsabilidad
Patitas Conectadas no se responsabiliza por:
• Daños ocasionados por uso o imposibilidad de uso
• Información falsa proporcionada por usuarios o refugios
• Pérdida de datos o errores técnicos fuera de nuestro control

7. Modificaciones
Podremos actualizar estos Términos en cualquier momento. Las modificaciones se publicarán en esta misma sección.

8. Legislación aplicable
Estos términos se rigen por las leyes de los Estados Unidos Mexicanos y la LFPDPPP.`;
  }

  static getHelpContent() {
    return `Ayuda y Soporte

¿Tienes alguna pregunta o quieres colaborar con nosotros?

📞 Teléfono: (52) 33 14498999
📧 Correo: patitasconnected@gmail.com

Horario de atención:
Lunes a Viernes: 9:00 AM - 6:00 PM

Síguenos en redes sociales:
🐾 Facebook: @PatitasConectadas
🐾 Instagram: @patitas_conectadas

Para refugios:
Si necesitas ayuda con el registro de animales, gestión de donaciones o cualquier otra función, no dudes en contactarnos. Estamos aquí para apoyarte en tu importante labor.`;
  }
}

// ========================================================================================
// BACKEND LOGIC SECTION
// ========================================================================================

class MenuService {
  static getMenuItems(refugioId) {
    return [
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
      {
        title: 'Seguimiento Adopción',
        icon: 'document-text-outline',
        route: 'Seguimiento',
        params: { refugioId: refugioId },
        color: '#6c757d',
      },
      {
        title: 'Notificaciones',
        icon: 'notifications-outline',
        action: 'showNotificationsModal',
        color: '#17a2b8',
      },
      {
        title: 'Política de Privacidad',
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

// Custom Hooks
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
// FRONTEND COMPONENTS SECTION
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

const MenuHeader = ({ appInfo, onClose, refugioData }) => (
  <View style={styles.menuHeader}>
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
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

const MenuItem = ({ item, onPress, onAction }) => {
  const router = useRouter();

  const handlePress = () => {
    onPress();
    if (item.route) {
      router.push({ pathname: item.route, params: item.params });
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

      <View style={styles.menuFooter}>
        <Text style={styles.footerText}>Versión {appInfo.version}</Text>
        <Text style={styles.footerSubtext}>{appInfo.copyright}</Text>
      </View>
    </ScrollView>
  );
};

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

// Component: Info Modal (NUEVO - Basado en PerfilUsuario.js)
const InfoModal = ({ visible, title, content, onClose }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalFondo}>
      <View style={styles.modalContenido}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitulo}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close-circle" size={28} color="#a26b6c" />
          </TouchableOpacity>
        </View>
        <ScrollView 
          style={styles.modalScroll} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.modalScrollContent}
        >
          <Text style={styles.modalTexto}>{content}</Text>
        </ScrollView>
        <TouchableOpacity onPress={onClose} style={styles.modalBoton}>
          <Text style={styles.modalBotonTexto}>Entendido</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// ========================================================================================
// MAIN COMPONENT
// ========================================================================================

export default function PantallaRefugio() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // Validación y normalización de parámetros
  const refugioId = params?.refugioId || params?.id || null;
  const refugioNombre = params?.refugioNombre || params?.nombre || 'Refugio';
  const refugioEmail = params?.refugioEmail || params?.email || '';
  const refugioTelefono = params?.refugioTelefono || params?.telefono || '';

  // Estados
  const [insumosPendientes, setInsumosPendientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [refugioData, setRefugioData] = useState({
    nombre: refugioNombre,
    email: refugioEmail,
    telefono: refugioTelefono,
    descripcion: '',
    direccion: '',
    ciudad: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [contenidoModal, setContenidoModal] = useState('');
  const [tituloModal, setTituloModal] = useState('');
  const [error, setError] = useState(null);

  // Hooks del menú
  const { menuVisible, slideAnimation, toggleMenu, closeMenu } = useMenuController();
  const { menuItems, appInfo, backgroundImage } = useAppData(refugioId);

  // Ubicación por defecto
  const ubicacion = {
    latitude: 20.6755,
    longitude: -103.3872,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  // Función de carga mejorada con manejo de errores
  const cargarDatosRefugio = async () => {
    if (!refugioId) {
      console.warn('No hay refugioId disponible');
      return;
    }

    try {
      console.log('Cargando datos del refugio:', refugioId);
      const response = await axios.get(`${API_BASE_URL}/refugio/${refugioId}`, {
        timeout: 10000,
      });

      console.log('Respuesta API refugio:', response.data);

      if (response.data?.refugio) {
        const data = response.data.refugio;
        setRefugioData({
          nombre: data.nombre || refugioNombre,
          email: data.email || refugioEmail,
          telefono: data.telefono || refugioTelefono,
          descripcion: data.descripcion || 'Sin descripción',
          direccion: data.direccion || 'Sin dirección',
          ciudad: data.ciudad || 'Sin ciudad'
        });
      } else {
        setRefugioData({
          nombre: refugioNombre,
          email: refugioEmail,
          telefono: refugioTelefono,
          descripcion: 'Sin descripción',
          direccion: 'Sin dirección',
          ciudad: 'Sin ciudad'
        });
      }
    } catch (error) {
      console.error('Error al cargar refugio:', error.message);
      setRefugioData({
        nombre: refugioNombre,
        email: refugioEmail,
        telefono: refugioTelefono,
        descripcion: 'Sin descripción disponible',
        direccion: 'Sin dirección disponible',
        ciudad: 'Sin ciudad disponible'
      });
    }
  };

  // Función de carga de insumos mejorada
  const cargarInsumos = async () => {
    if (!refugioId) {
      console.warn('No hay refugioId para cargar insumos');
      setInsumosPendientes([]);
      return;
    }

    try {
      console.log('Cargando insumos para refugio:', refugioId);
      const response = await axios.get(
        `${API_BASE_URL}/refugio/${refugioId}/insumos-pendientes`,
        { timeout: 10000 }
      );

      console.log('Respuesta API insumos:', response.data);
      setInsumosPendientes(response.data?.insumosPendientes || []);
    } catch (error) {
      console.error('Error al cargar insumos:', error.message);
      setInsumosPendientes([]);
    }
  };

  // useEffect mejorado con mejor manejo de errores
  useEffect(() => {
    let isMounted = true;

    const inicializarPantalla = async () => {
      try {
        console.log('Inicializando pantalla con parámetros:', {
          refugioId,
          refugioNombre,
          refugioEmail,
          refugioTelefono
        });

        if (!refugioId) {
          setError('No se recibió el ID del refugio');
          setCargando(false);
          return;
        }

        if (isMounted) {
          await cargarDatosRefugio();
        }
        
        if (isMounted) {
          await cargarInsumos();
        }

        if (isMounted) {
          setError(null);
        }
      } catch (error) {
        console.error('Error en inicialización:', error);
        if (isMounted) {
          setError('Error al cargar datos');
        }
      } finally {
        if (isMounted) {
          setCargando(false);
        }
      }
    };

    inicializarPantalla();

    return () => {
      isMounted = false;
    };
  }, [refugioId]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await cargarDatosRefugio();
      await cargarInsumos();
    } catch (error) {
      console.error('Error en refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleInputChange = (field, value) => {
    setRefugioData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitProfile = async () => {
    if (!refugioData.nombre || !refugioData.email) {
      Alert.alert('Error', 'El nombre y email son obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/refugio/${refugioId}`,
        refugioData,
        { timeout: 10000 }
      );

      if (response.data?.success) {
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
        setEditModalVisible(false);
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
    Alert.alert(
      'Confirmar',
      '¿Marcar este insumo como recibido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, confirmar',
          onPress: async () => {
            try {
              const response = await axios.put(
                `${API_BASE_URL}/insumos/${idInsumo}/completar`,
                { id_refugio: refugioId },
                { timeout: 10000 }
              );

              if (response.data?.success) {
                Alert.alert('Éxito', 'Insumo marcado como recibido');
                await cargarInsumos();
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

  // Función mejorada para manejar las acciones del menú
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
        titulo = 'Política de Privacidad';
        contenido = ModalContentService.getPrivacyContent();
        break;
      case 'showHelpModal':
        titulo = 'Ayuda y Soporte';
        contenido = ModalContentService.getHelpContent();
        break;
      case 'showTermsModal':
        titulo = 'Términos y Condiciones';
        contenido = ModalContentService.getTermsContent();
        break;
      default:
        contenido = '';
    }

    setTituloModal(titulo);
    setContenidoModal(contenido);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTituloModal('');
    setContenidoModal('');
  };

  // Pantalla de error mejorada
  if (error && !cargando) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />
        <Ionicons name="alert-circle" size={64} color="#FF5252" />
        <Text style={styles.errorTitle}>Error al cargar datos</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setCargando(true);
            onRefresh();
          }}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => router.replace('/inicio_sesion')}
        >
          <Text style={styles.logoutButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (cargando) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />
        <ActivityIndicator size="large" color="#a26b6c" />
        <Text style={styles.cargandoTexto}>Cargando perfil del refugio...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />

      <Header
        appName={appInfo.name}
        screenTitle={'Perfil del Refugio'}
        menuVisible={menuVisible}
        onMenuToggle={toggleMenu}
      />

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
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#a26b6c']}
                tintColor="#a26b6c"
              />
            }
          >
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

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Acerca de nosotros</Text>
              <Text style={styles.sectionText}>
                {refugioData.descripcion || 'Somos un refugio comprometido con el rescate y rehabilitación de animales abandonados.'}
              </Text>
            </View>

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

      {/* Modal de edición */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
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

      {/* Modal de información - REEMPLAZADO CON InfoModal */}
      <InfoModal
        visible={modalVisible}
        title={tituloModal}
        content={contenidoModal}
        onClose={closeModal}
      />
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
    padding: 20,
  },
  cargandoTexto: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5252',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#a26b6c',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
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
  // ESTILOS PARA INFOMODAL - NUEVOS
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
    padding: 20,
    width: '95%',
    maxWidth: 500,
    maxHeight: '85%',
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
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#a26b6c',
    flex: 1,
  },
  modalCloseButton: {
    padding: 5,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalScrollContent: {
    paddingBottom: 10,
  },
  modalTexto: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    textAlign: 'left',
  },
  modalBoton: {
    backgroundColor: '#a26b6c',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  modalBotonTexto: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});