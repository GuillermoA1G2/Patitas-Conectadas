import React, { useState, useEffect } from 'react';
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
  Platform
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.80; // 80% del ancho de la pantalla

export default function PantallaRefugio() {
  const {
    refugioId,
    refugioNombre,
    refugioEmail,
    refugioTelefono,
    usuarioTipo
  } = useLocalSearchParams();

  const [insumosPendientes, setInsumosPendientes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    totalAnimales: 0,
    animalesDisponibles: 0,
    animalesAdoptados: 0
  });
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [slideAnimation] = useState(new Animated.Value(-MENU_WIDTH));
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
  const router = useRouter();

  // Ubicación para el mapa (se podría obtener de la base de datos)
  const ubicacion = {
    latitude: 20.6755,
    longitude: -103.3872,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

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

  // Elementos del menú lateral
  const menuItems = [
    {
      title: 'Inicio',
      icon: 'home-outline',
      route: '/pantalla_inicio',
      color: '#FF6B6B',
      gradient: ['#FF6B6B', '#FF8E53']
    },
    {
      title: 'Perfil Mascota',
      icon: 'paw-outline',
      route: '/perfil_macota',
      color: '#4ECDC4',
      gradient: ['#4ECDC4', '#44A08D']
    },
    {
      title: 'Registro Animal',
      icon: 'add-circle-outline',
      route: '/registrar_animal',
      color: '#96CEB4',
      gradient: ['#96CEB4', '#FFECD2']
    },
    {
      title: 'Formulario Donaciones',
      icon: 'gift-outline',
      route: '/FormularioDonacionesAso',
      color: '#FECA57',
      gradient: ['#FECA57', '#FF9FF3']
    },
    {
      title: 'Historial de Donaciones',
      icon: 'list-outline',
      route: '/HistorialDonaciones',
      color: '#A55EEA',
      gradient: ['#A55EEA', '#FD79A8']
    },
  ];

  // Función para cargar estadísticas de animales
  const cargarEstadisticasAnimales = async () => {
    try {
      const id = refugioId;
      
      if (!id) {
        throw new Error('ID del refugio no disponible');
      }

      console.log('Cargando estadísticas de animales para refugio ID:', id);

      // Obtener todos los animales del refugio
      const responseAnimales = await axios.get(`http://192.168.1.119:3000/api/refugio/${id}/animales`);
      console.log('Respuesta animales:', responseAnimales.data);
      
      if (responseAnimales.data && responseAnimales.data.success) {
        const animales = responseAnimales.data.animales || [];
        
        // Calcular estadísticas
        const totalAnimales = animales.length;
        const animalesDisponibles = animales.filter(animal => !animal.adoptado).length;
        const animalesAdoptados = animales.filter(animal => animal.adoptado).length;
        
        setEstadisticas({
          totalAnimales,
          animalesDisponibles,
          animalesAdoptados
        });
        
        console.log('Estadísticas actualizadas:', {
          totalAnimales,
          animalesDisponibles,
          animalesAdoptados
        });
      }
      
    } catch (error) {
      console.error('Error al cargar estadísticas de animales:', error);
      console.error('Error details:', error.response?.data);
      // No mostrar alert aquí para evitar múltiples alerts si ya hay otros errores
    }
  };

  const cargarDatos = async () => {
    try {
      const id = refugioId;
      
      if (!id) {
        throw new Error('ID del refugio no disponible');
      }

      console.log('Cargando datos para refugio ID:', id);

      // Cargar insumos pendientes
      const responseInsumos = await axios.get(`http://192.168.1.119:3000/api/refugio/${id}/insumos-pendientes`);
      console.log('Respuesta insumos:', responseInsumos.data);
      
      setInsumosPendientes(responseInsumos.data.insumosPendientes || []);
      
      // Cargar estadísticas de animales
      await cargarEstadisticasAnimales();
      
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

      const response = await axios.get(`http://192.168.1.119:3000/api/refugio/${id}`);
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
      const response = await axios.put(`http://192.168.1.119:3000/api/refugio/${refugioId}`, refugioData);
      
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
                const response = await axios.put(`http://192.168.1.119:3000/api/insumos/${idInsumo}/completar`, {
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

  if (cargando) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0066ff" />
        <Text style={styles.cargandoTexto}>Cargando datos del refugio...</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>{refugioData.nombre}</Text>
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
                    <Ionicons name="paw" size={32} color="#fff" />
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.welcomeText}>¡Bienvenido!</Text>
                    <Text style={styles.appName}>{refugioData.nombre}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
                  <Ionicons name="close" size={12} color="#fff" />
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
                  <TouchableOpacity 
                    style={styles.logoutItem} 
                    onPress={() => {
                      toggleMenu();
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
                  <Text style={styles.footerText}>Versión 1.0.0</Text>
                  <Text style={styles.footerSubtext}>Patitas Conectadas © 2024</Text>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* Contenido principal */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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

        {/* Estadísticas rápidas actualizadas */}
        <View style={styles.estadisticasContainer}>
          <View style={styles.estadisticaCard}>
            <Text style={styles.estadisticaNumero}>{insumosPendientes.length}</Text>
            <Text style={styles.estadisticaTexto}>Insumos Pendientes</Text>
          </View>
          <View style={styles.estadisticaCard}>
            <Text style={styles.estadisticaNumero}>{estadisticas.totalAnimales}</Text>
            <Text style={styles.estadisticaTexto}>Animales Registrados</Text>
          </View>
          <View style={styles.estadisticaCard}>
            <Text style={styles.estadisticaNumero}>{estadisticas.animalesDisponibles}</Text>
            <Text style={styles.estadisticaTexto}>Disponibles</Text>
          </View>
        </View>

        {/* Menú de acciones */}
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuActionItem}
            onPress={() => router.push('/registrar_animal')}
          >
            <View style={styles.menuActionIcon}>
              <Ionicons name="add-circle" size={28} color="#4CAF50" />
            </View>
            <Text style={styles.menuActionText}>Registrar Animal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuActionItem}
            onPress={() => router.push('/FormularioDonacionesAso')}
          >
            <View style={styles.menuActionIcon}>
              <Ionicons name="gift" size={28} color="#FF9800" />
            </View>
            <Text style={styles.menuActionText}>Solicitar Donaciones</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuActionItem}
            onPress={() => router.push('/HistorialDonaciones')}
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
      </ScrollView>
    </View>
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
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  editButton: {
    backgroundColor: '#0066ff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
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
    marginHorizontal: 3,
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
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sideMenu: {
    backgroundColor: '#ffffff',
    height: '100%',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: '#1E2B3C',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  profileInfo: {
    flex: 3,
  },
  welcomeText: {
    color: '#B0BEC5',
    fontSize: 12,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuScrollView: {
    flex: 1,
  },
  menuSection: {
    paddingTop: 15,
    paddingBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 5,
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
    color: '#000000',
    fontSize: 14,
    flex: 1,
  },
  logoutSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  logoutText: {
    color: '#FF5252',
    fontSize: 14,
  },
  menuFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
  // Styles for edit modal
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
    height: '100%',
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
});