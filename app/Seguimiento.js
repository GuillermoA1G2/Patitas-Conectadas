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
  Platform,
  StatusBar,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

class MenuService {
  static getMenuItems(refugioId) {
    return [
      {
        title: 'Perfil del Refugio',
        icon: 'home-outline',
        route: 'refugio',
        params: { refugioId: refugioId },
        color: '#96CEB4',
      },
      {
        title: 'Registrar Animal',
        icon: 'add-circle-outline',
        route: 'registrar_animal',
        params: { refugioId: refugioId },
        color: '#96CEB4',
      },
      {
        title: 'Solicitudes Adopción',
        icon: 'list-outline',
        route: 'SolicitudesRefugio',
        params: { refugioId: refugioId },
        color: '#d5ea5eff',
      },
      {
        title: 'Historial de Donaciones',
        icon: 'gift-outline',
        route: 'HistorialDonaciones',
        params: { refugioId: refugioId },
        color: '#A55EEA',
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

// ==========================================
// COMPONENTES DE UI
// ==========================================

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

const MenuItem = ({ item, onPress }) => {
  const router = useRouter();

  const handlePress = () => {
    onPress();
    if (item.route) {
      router.push({ pathname: item.route, params: item.params });
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

const MenuContent = ({ menuItems, appInfo, onMenuClose, cerrarSesion }) => {
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

const SideMenu = ({ visible, slideAnimation, menuItems, appInfo, onClose, refugioData, cerrarSesion }) => {
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
            cerrarSesion={cerrarSesion}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

// Componente de tarjeta de adopción
const AdopcionCard = ({ adopcion, onVerDetalles, onToggleSeguimiento }) => {
  const proximaRevision = adopcion.proxima_revision 
    ? new Date(adopcion.proxima_revision).toLocaleDateString('es-MX') 
    : 'No programada';
  
  const diasRestantes = adopcion.proxima_revision 
    ? Math.ceil((new Date(adopcion.proxima_revision) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <View style={styles.adopcionCard}>
      <View style={styles.adopcionHeader}>
        <View style={styles.mascotaInfo}>
          <Ionicons name="paw" size={24} color="#a26b6c" />
          <View style={styles.mascotaTexto}>
            <Text style={styles.mascotaNombre}>{adopcion.mascota_nombre}</Text>
            <Text style={styles.mascotaEspecie}>{adopcion.mascota_especie}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => onToggleSeguimiento(adopcion._id, !adopcion.seguimiento_activo)}
          style={[
            styles.toggleButton,
            adopcion.seguimiento_activo ? styles.toggleButtonActive : styles.toggleButtonInactive
          ]}
        >
          <Ionicons 
            name={adopcion.seguimiento_activo ? "checkmark-circle" : "close-circle"} 
            size={24} 
            color={adopcion.seguimiento_activo ? "#4CAF50" : "#999"} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.adoptanteInfo}>
        <Ionicons name="person-outline" size={18} color="#666" />
        <Text style={styles.adoptanteNombre}>{adopcion.adoptante_nombre}</Text>
      </View>

      {adopcion.adoptante_telefono && (
        <View style={styles.contactoInfo}>
          <Ionicons name="call-outline" size={18} color="#666" />
          <Text style={styles.contactoTexto}>{adopcion.adoptante_telefono}</Text>
        </View>
      )}

      <View style={styles.revisionInfo}>
        <View style={styles.revisionItem}>
          <Ionicons name="calendar-outline" size={18} color="#2196F3" />
          <View style={styles.revisionTextos}>
            <Text style={styles.revisionLabel}>Próxima revisión</Text>
            <Text style={styles.revisionFecha}>{proximaRevision}</Text>
            {diasRestantes !== null && diasRestantes >= 0 && (
              <Text style={[
                styles.diasRestantes,
                diasRestantes <= 7 ? styles.diasRestantesUrgente : null
              ]}>
                {diasRestantes === 0 ? '¡Hoy!' : `${diasRestantes} días`}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.revisionItem}>
          <Ionicons name="clipboard-outline" size={18} color="#FF9800" />
          <View style={styles.revisionTextos}>
            <Text style={styles.revisionLabel}>Revisiones</Text>
            <Text style={styles.revisionCantidad}>{adopcion.total_revisiones || 0}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.verDetallesButton}
        onPress={() => onVerDetalles(adopcion)}
      >
        <Text style={styles.verDetallesText}>Ver Historial Completo</Text>
        <Ionicons name="chevron-forward" size={20} color="#a26b6c" />
      </TouchableOpacity>
    </View>
  );
};

// Modal de detalles de adopción
const DetallesModal = ({ visible, adopcion, onClose, onAgregarRevision }) => {
  if (!adopcion) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.detallesModalContainer}>
        <View style={styles.detallesModal}>
          <View style={styles.detallesHeader}>
            <Text style={styles.detallesTitulo}>Historial de {adopcion.mascota_nombre}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#a26b6c" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.detallesScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.detallesInfo}>
              <Text style={styles.detallesLabel}>Adoptante</Text>
              <Text style={styles.detallesValor}>{adopcion.adoptante_nombre}</Text>
            </View>

            <View style={styles.detallesInfo}>
              <Text style={styles.detallesLabel}>Contacto</Text>
              <Text style={styles.detallesValor}>{adopcion.adoptante_email}</Text>
              {adopcion.adoptante_telefono && (
                <Text style={styles.detallesValor}>📞 {adopcion.adoptante_telefono}</Text>
              )}
            </View>

            <View style={styles.detallesInfo}>
              <Text style={styles.detallesLabel}>Fecha de adopción</Text>
              <Text style={styles.detallesValor}>
                {new Date(adopcion.fecha_aprobacion).toLocaleDateString('es-MX')}
              </Text>
            </View>

            <View style={styles.dividerFull} />

            <Text style={styles.revisionesTitle}>Revisiones Realizadas</Text>

            {(!adopcion.revisiones || adopcion.revisiones.length === 0) ? (
              <View style={styles.emptyRevisiones}>
                <Ionicons name="document-text-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Sin revisiones registradas</Text>
              </View>
            ) : (
              adopcion.revisiones.map((revision, index) => (
                <View key={index} style={styles.revisionCard}>
                  <View style={styles.revisionCardHeader}>
                    <Text style={styles.revisionFechaDetalle}>
                      {new Date(revision.fecha).toLocaleDateString('es-MX')}
                    </Text>
                    <View style={[
                      styles.estadoBadge,
                      revision.aprobada ? styles.estadoAprobado : styles.estadoPendiente
                    ]}>
                      <Text style={styles.estadoTexto}>
                        {revision.aprobada ? '✓ Aprobada' : '⏳ Pendiente'}
                      </Text>
                    </View>
                  </View>
                  
                  {revision.notas && (
                    <Text style={styles.revisionNotas}>{revision.notas}</Text>
                  )}

                  {revision.fotos && revision.fotos.length > 0 && (
                    <ScrollView horizontal style={styles.fotosScroll}>
                      {revision.fotos.map((foto, fotoIndex) => (
                        <Image
                          key={fotoIndex}
                          source={{ uri: `${SERVER_BASE_URL}${foto}` }}
                          style={styles.revisionFoto}
                        />
                      ))}
                    </ScrollView>
                  )}
                </View>
              ))
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.agregarRevisionButton}
            onPress={() => onAgregarRevision(adopcion)}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.agregarRevisionText}>Agregar Nueva Revisión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Modal para agregar revisión
const AgregarRevisionModal = ({ visible, adopcion, onClose, onGuardar }) => {
  const [notas, setNotas] = useState('');
  const [aprobada, setAprobada] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    if (!notas.trim()) {
      Alert.alert('Error', 'Por favor agrega notas sobre la revisión');
      return;
    }

    setGuardando(true);
    try {
      await onGuardar(adopcion._id, { notas, aprobada });
      setNotas('');
      setAprobada(true);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la revisión');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.agregarModalContainer}>
        <View style={styles.agregarModal}>
          <View style={styles.agregarHeader}>
            <Text style={styles.agregarTitulo}>Nueva Revisión</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#a26b6c" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Notas de la revisión *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe el estado de la mascota, condiciones del hogar, observaciones..."
              multiline
              numberOfLines={6}
              value={notas}
              onChangeText={setNotas}
            />

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setAprobada(!aprobada)}
              >
                <Ionicons
                  name={aprobada ? "checkbox" : "square-outline"}
                  size={24}
                  color={aprobada ? "#4CAF50" : "#999"}
                />
                <Text style={styles.checkboxLabel}>Revisión aprobada</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.helperText}>
              Marca como aprobada si la mascota está en buenas condiciones
            </Text>
          </ScrollView>

          <View style={styles.botonesContainer}>
            <TouchableOpacity
              style={[styles.boton, styles.botonCancelar]}
              onPress={onClose}
              disabled={guardando}
            >
              <Text style={styles.botonTexto}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.boton, styles.botonGuardar]}
              onPress={handleGuardar}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.botonTexto, styles.botonGuardarTexto]}>Guardar</Text>
              )}
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

export default function Seguimiento() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const refugioId = params?.refugioId || params?.id || null;
  const refugioNombre = params?.refugioNombre || params?.nombre || 'Refugio';

  // Estados
  const [adopciones, setAdopciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refugioData, setRefugioData] = useState({ nombre: refugioNombre });
  const [detallesVisible, setDetallesVisible] = useState(false);
  const [adopcionSeleccionada, setAdopcionSeleccionada] = useState(null);
  const [agregarRevisionVisible, setAgregarRevisionVisible] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState('todos'); // todos, activos, proximas

  const { menuVisible, slideAnimation, toggleMenu, closeMenu } = useMenuController();
  const { menuItems, appInfo, backgroundImage } = useAppData(refugioId);

  // Cargar adopciones aprobadas
  const cargarAdopciones = async () => {
    if (!refugioId) {
      console.warn('No hay refugioId disponible');
      setAdopciones([]);
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/solicitudes-adopcion/refugio/${refugioId}`,
        { timeout: 10000 }
      );

      if (response.data?.success) {
        // Filtrar solo adopciones aprobadas
        const aprobadas = response.data.solicitudes
          .filter(sol => sol.estado === 'aprobada')
          .map(sol => ({
            _id: sol._id,
            mascota_nombre: sol.mascota,
            mascota_especie: sol.especie,
            adoptante_nombre: sol.usuario?.nombre || 'Adoptante',
            adoptante_email: sol.usuario?.email || '',
            adoptante_telefono: sol.usuario?.telefono || '',
            fecha_aprobacion: sol.fechaCreacion,
            seguimiento_activo: sol.seguimiento_activo !== false,
            proxima_revision: sol.proxima_revision || null,
            total_revisiones: sol.revisiones?.length || 0,
            revisiones: sol.revisiones || []
          }));

        setAdopciones(aprobadas);
      }
    } catch (error) {
      console.error('Error al cargar adopciones:', error);
      setAdopciones([]);
    }
  };

  const cargarDatosRefugio = async () => {
    if (!refugioId) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/refugio/${refugioId}`);
      if (response.data?.refugio) {
        setRefugioData({ nombre: response.data.refugio.nombre });
      }
    } catch (error) {
      console.error('Error al cargar refugio:', error);
    }
  };

  useEffect(() => {
    const inicializar = async () => {
      if (!refugioId) {
        setCargando(false);
        return;
      }

      await cargarDatosRefugio();
      await cargarAdopciones();
      setCargando(false);
    };

    inicializar();
  }, [refugioId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarAdopciones();
    setRefreshing(false);
  };

  const handleToggleSeguimiento = async (adopcionId, nuevoEstado) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/solicitudes-adopcion/${adopcionId}`,
        { seguimiento_activo: nuevoEstado }
      );
      
      Alert.alert(
        'Éxito',
        `Seguimiento ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`
      );
      
      await cargarAdopciones();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el seguimiento');
    }
  };

  const handleVerDetalles = (adopcion) => {
    setAdopcionSeleccionada(adopcion);
    setDetallesVisible(true);
  };

  const handleAgregarRevision = (adopcion) => {
    setDetallesVisible(false);
    setAdopcionSeleccionada(adopcion);
    setAgregarRevisionVisible(true);
  };

  const handleGuardarRevision = async (adopcionId, datosRevision) => {
    try {
      const nuevaRevision = {
        fecha: new Date().toISOString(),
        notas: datosRevision.notas,
        aprobada: datosRevision.aprobada,
        fotos: []
      };

      await axios.post(
        `${API_BASE_URL}/solicitudes-adopcion/${adopcionId}/revisiones`,
        nuevaRevision
      );

      Alert.alert('Éxito', 'Revisión registrada correctamente');
      await cargarAdopciones();
    } catch (error) {
      console.error('Error al guardar revisión:', error);
      throw error;
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
          onPress: () => router.replace('/inicio_sesion')
        }
      ]
    );
  };

  // Filtrar adopciones
  const adopcionesFiltradas = adopciones.filter(adopcion => {
    if (filtroActivo === 'activos') return adopcion.seguimiento_activo;
    if (filtroActivo === 'proximas') {
      if (!adopcion.proxima_revision) return false;
      const dias = Math.ceil((new Date(adopcion.proxima_revision) - new Date()) / (1000 * 60 * 60 * 24));
      return dias <= 7 && dias >= 0;
    }
    return true;
  });

  if (cargando) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />
        <ActivityIndicator size="large" color="#a26b6c" />
        <Text style={styles.cargandoTexto}>Cargando seguimientos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />

      <Header
        appName={appInfo.name}
        screenTitle="Seguimiento de Adopciones"
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
        cerrarSesion={cerrarSesion}
      />

      <ImageBackground
        source={backgroundImage}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.contentOverlay}>
          {/* Estadísticas */}
          <View style={styles.estadisticasTop}>
            <View style={styles.estadisticaTopCard}>
              <Ionicons name="heart" size={24} color="#4CAF50" />
              <Text style={styles.estadisticaTopNumero}>{adopciones.length}</Text>
              <Text style={styles.estadisticaTopTexto}>Total</Text>
            </View>
            <View style={styles.estadisticaTopCard}>
              <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
              <Text style={styles.estadisticaTopNumero}>
                {adopciones.filter(a => a.seguimiento_activo).length}
              </Text>
              <Text style={styles.estadisticaTopTexto}>Activos</Text>
            </View>
            <View style={styles.estadisticaTopCard}>
              <Ionicons name="calendar" size={24} color="#FF9800" />
              <Text style={styles.estadisticaTopNumero}>
                {adopciones.filter(a => {
                  if (!a.proxima_revision) return false;
                  const dias = Math.ceil((new Date(a.proxima_revision) - new Date()) / (1000 * 60 * 60 * 24));
                  return dias <= 7 && dias >= 0;
                }).length}
              </Text>
              <Text style={styles.estadisticaTopTexto}>Próximas</Text>
            </View>
          </View>

          {/* Filtros */}
          <View style={styles.filtrosContainer}>
            <TouchableOpacity
              style={[styles.filtroButton, filtroActivo === 'todos' && styles.filtroButtonActive]}
              onPress={() => setFiltroActivo('todos')}
            >
              <Text style={[styles.filtroText, filtroActivo === 'todos' && styles.filtroTextActive]}>
                Todos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filtroButton, filtroActivo === 'activos' && styles.filtroButtonActive]}
              onPress={() => setFiltroActivo('activos')}
            >
              <Text style={[styles.filtroText, filtroActivo === 'activos' && styles.filtroTextActive]}>
                Activos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filtroButton, filtroActivo === 'proximas' && styles.filtroButtonActive]}
              onPress={() => setFiltroActivo('proximas')}
            >
              <Text style={[styles.filtroText, filtroActivo === 'proximas' && styles.filtroTextActive]}>
                Próximas
              </Text>
            </TouchableOpacity>
          </View>

          {/* Lista de adopciones */}
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#a26b6c']}
                tintColor="#a26b6c"
              />
            }
          >
            {adopcionesFiltradas.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="paw-outline" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>
                  {filtroActivo === 'todos' 
                    ? 'No hay adopciones aprobadas' 
                    : filtroActivo === 'activos'
                    ? 'No hay seguimientos activos'
                    : 'No hay revisiones próximas'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {filtroActivo === 'todos'
                    ? 'Las adopciones aprobadas aparecerán aquí'
                    : 'Ajusta los filtros para ver más resultados'}
                </Text>
              </View>
            ) : (
              adopcionesFiltradas.map((adopcion) => (
                <AdopcionCard
                  key={adopcion._id}
                  adopcion={adopcion}
                  onVerDetalles={handleVerDetalles}
                  onToggleSeguimiento={handleToggleSeguimiento}
                />
              ))
            )}
          </ScrollView>
        </View>
      </ImageBackground>

      {/* Modales */}
      <DetallesModal
        visible={detallesVisible}
        adopcion={adopcionSeleccionada}
        onClose={() => setDetallesVisible(false)}
        onAgregarRevision={handleAgregarRevision}
      />

      <AgregarRevisionModal
        visible={agregarRevisionVisible}
        adopcion={adopcionSeleccionada}
        onClose={() => setAgregarRevisionVisible(false)}
        onGuardar={handleGuardarRevision}
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
    padding: 20,
  },
  cargandoTexto: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  estadisticasTop: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  estadisticaTopCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  estadisticaTopNumero: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  estadisticaTopTexto: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  filtrosContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtroButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filtroButtonActive: {
    backgroundColor: '#a26b6c',
    borderColor: '#a26b6c',
  },
  filtroText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filtroTextActive: {
    color: 'white',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
  },
  adopcionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#a26b6c',
  },
  adopcionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mascotaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mascotaTexto: {
    marginLeft: 10,
  },
  mascotaNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mascotaEspecie: {
    fontSize: 14,
    color: '#666',
  },
  toggleButton: {
    padding: 5,
  },
  toggleButtonActive: {
    opacity: 1,
  },
  toggleButtonInactive: {
    opacity: 0.5,
  },
  adoptanteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 5,
  },
  adoptanteNombre: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  contactoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 5,
  },
  contactoTexto: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  revisionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  revisionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  revisionTextos: {
    marginLeft: 8,
    flex: 1,
  },
  revisionLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  revisionFecha: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  revisionCantidad: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  diasRestantes: {
    fontSize: 11,
    color: '#2196F3',
    marginTop: 2,
    fontWeight: '500',
  },
  diasRestantesUrgente: {
    color: '#FF5252',
  },
  verDetallesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 10,
  },
  verDetallesText: {
    fontSize: 14,
    color: '#a26b6c',
    fontWeight: '500',
    marginRight: 5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  detallesModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detallesModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 20,
  },
  detallesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detallesTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  detallesScroll: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  detallesInfo: {
    marginBottom: 15,
  },
  detallesLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detallesValor: {
    fontSize: 15,
    color: '#333',
    marginBottom: 2,
  },
  dividerFull: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  revisionesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  emptyRevisiones: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  revisionCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  revisionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  revisionFechaDetalle: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoAprobado: {
    backgroundColor: '#E8F5E9',
  },
  estadoPendiente: {
    backgroundColor: '#FFF3E0',
  },
  estadoTexto: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  revisionNotas: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 10,
  },
  fotosScroll: {
    marginTop: 10,
  },
  revisionFoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  agregarRevisionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  agregarRevisionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  agregarModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  agregarModal: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
  },
  agregarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  agregarTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 15,
  },
  checkboxContainer: {
    marginVertical: 15,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: -10,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  botonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  boton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  botonCancelar: {
    backgroundColor: '#e0e0e0',
  },
  botonGuardar: {
    backgroundColor: '#4CAF50',
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  botonGuardarTexto: {
    color: 'white',
  },
});