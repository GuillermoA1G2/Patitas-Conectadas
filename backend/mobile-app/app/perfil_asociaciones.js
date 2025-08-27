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
  Modal
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

export default function PantallaRefugio() {
  const {
    refugioId,
    refugioNombre,
    refugioEmail,
    refugioTelefono,
    usuarioTipo
  } = useLocalSearchParams();

  const [insumosPendientes, setInsumosPendientes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();

  // Ubicación para el mapa (se podría obtener de la base de datos)
  const ubicacion = {
    latitude: 20.6755,
    longitude: -103.3872,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const toggleMenu = () => setMenuVisible(!menuVisible);

  const cargarDatos = async () => {
    try {
      // Cargar insumos pendientes
      const responseInsumos = await axios.get(`http://192.168.1.119:3000/api/refugio/${refugioId}/insumos-pendientes`);
      setInsumosPendientes(responseInsumos.data.insumosPendientes || []);

      // Aquí podrías agregar más llamadas para estadísticas del refugio
      // Por ejemplo: número de animales, donaciones recibidas, etc.
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del refugio');
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    cargarDatos();
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
              const response = await axios.put(`http://192.168.1.119:3000/api/insumos/${idInsumo}/completar`, {
                id_refugio: refugioId
              });

              if (response.data) {
                Alert.alert('Éxito', 'Insumo marcado como recibido');
                cargarDatos(); // Recargar datos
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error al marcar insumo:', error);
      Alert.alert('Error', 'No se pudo actualizar el insumo');
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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header con menú */}
      <View style={styles.header}>
        <Text style={styles.bienvenidaTexto}>{refugioNombre}</Text>
        <TouchableOpacity onPress={toggleMenu}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Menú desplegable con scroll */}
      <Modal transparent={true} visible={menuVisible} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={toggleMenu}>
          <View style={styles.menu}>
            <ScrollView 
              style={styles.menuScrollContainer}
              contentContainerStyle={styles.menuContent}
              showsVerticalScrollIndicator={true}>

              <Link href="/pantalla_inicio" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Inicio</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />
              
              <Link href="/perfil_macota" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Perfil Mascota</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />

              <Link href="/registrar_animal" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Registro Animal</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />

              <Link href="/FormularioDonacionesAso" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Formulario Donaciones</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />

              <Link href="/HistorialDonaciones" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Historial de Donaciones</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />

              <Link href="/PublicarCaso" asChild>
                <TouchableOpacity style={styles.menuItemContainer} onPress={toggleMenu}>
                  <Text style={styles.menuItem}>Publicar Caso</Text>
                </TouchableOpacity>
              </Link>
              <View style={{ height: 8 }} />

              <TouchableOpacity style={styles.customButton} onPress={() => {
                toggleMenu();
                cerrarSesion();
              }}>
                <Ionicons name="arrow-back" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Cerrar Sesión</Text>
              </TouchableOpacity>
              <View style={{ height: 8 }} />

            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Logo y botón de editar perfil */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
        />
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editText}>Editar Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* Información del refugio */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acerca de nosotros</Text>
        <Text style={styles.sectionText}>
          Somos un refugio comprometido con el rescate y rehabilitación de animales abandonados. Nuestro objetivo es encontrar hogares amorosos para cada mascota.
        </Text>
      </View>

      {/* Contacto */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contacto</Text>
        <Text style={styles.sectionText}>📧 {refugioEmail}</Text>
        {refugioTelefono && <Text style={styles.sectionText}>📞 {refugioTelefono}</Text>}
        <Text style={styles.sectionText}>🆔 ID: {refugioId}</Text>
      </View>

      {/* Ubicación */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ubicación</Text>
        <Text style={styles.sectionText}>📍 Av. Circunvalación 123, Guadalajara.</Text>
        <MapView style={styles.map} region={ubicacion}>
          <Marker coordinate={ubicacion} title={refugioNombre} />
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
          style={styles.menuItem}
          onPress={() => {
            // Navegar a pantalla de gestión de animales
            Alert.alert('Próximamente', 'Función en desarrollo');
          }}
        >
          <Text style={styles.menuIcon}>🐕</Text>
          <Text style={styles.menuTexto}>Gestionar Animales</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            // Navegar a pantalla de donaciones recibidas
            Alert.alert('Próximamente', 'Función en desarrollo');
          }}
        >
          <Text style={styles.menuIcon}>💰</Text>
          <Text style={styles.menuTexto}>Donaciones Recibidas</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            // Navegar a pantalla de solicitudes de adopción
            Alert.alert('Próximamente', 'Función en desarrollo');
          }}
        >
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuTexto}>Solicitudes de Adopción</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            // Navegar a configuración del refugio
            Alert.alert('Próximamente', 'Función en desarrollo');
          }}
        >
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuTexto}>Configuración</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de insumos pendientes */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Insumos Pendientes de Recibir</Text>
        {insumosPendientes.length === 0 ? (
          <Text style={styles.noDataText}>No tienes insumos pendientes</Text>
        ) : (
          insumosPendientes.map((insumo) => (
            <View key={insumo.id} style={styles.insumoItem}>
              <View style={styles.insumoInfo}>
                <Text style={styles.insumoNombre}>{insumo.nombre}</Text>
                <Text style={styles.insumoDescripcion}>
                  Cantidad: {insumo.cantidad}
                </Text>
                <Text style={styles.insumoDescripcion}>
                  Descripción: {insumo.descripcion || 'Sin descripción'}
                </Text>
                <Text style={styles.donante}>
                  Donante: {insumo.nombre_donante} - {insumo.telefono_donante}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.completarBtn}
                onPress={() => marcarInsumoCompletado(insumo.id)}
              >
                <Text style={styles.completarBtnTexto}>✓ Recibido</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
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
    color: '#666',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#a2d2ff',
    padding: 20,
    paddingTop: 50,
    borderRadius: 10,
    marginBottom: 20,
  },
  bienvenidaTexto: {
    color: '#000000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuIcon: {
    fontSize: 26,
    marginRight: 15,
  },
  // Estilos para el menú desplegable
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  menu: {
    backgroundColor: 'white',
    borderRadius: 10,
    maxHeight: '80%',
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
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '45%',
    marginBottom: 10,
    elevation: 3,
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
  // Estilos para el logo y perfil
  logoContainer: {
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 15,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    borderRadius: 60,
    backgroundColor: '#ace2e1',
  },
  editButton: {
    backgroundColor: '#ff6b81',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
  },
  editText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Estilos para las secciones
  section: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  sectionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 10,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  // Estilos para estadísticas
  estadisticasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 15,
    marginBottom: 15,
  },
  estadisticaCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 3,
  },
  estadisticaNumero: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066ff',
  },
  estadisticaTexto: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  // Estilos para el menú de acciones
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginHorizontal: 15,
    marginBottom: 15,
  },
  menuTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  // Estilos para la tarjeta de insumos
  card: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
  insumoItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9500',
  },
  insumoInfo: {
    flex: 1,
    marginBottom: 10,
  },
  insumoNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  insumoDescripcion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  donante: {
    fontSize: 13,
    color: '#0066ff',
    fontWeight: '500',
    marginTop: 5,
  },
  completarBtn: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-end',
  },
  completarBtnTexto: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});