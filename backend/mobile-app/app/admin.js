import React, { useState, useEffect } from 'react';
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
  FlatList,
} from 'react-native';

export default function PantallaAdmin() {
  const {
    adminId,
    adminNombre,
    adminEmail,
    usuarioTipo,
    id_rol
  } = useLocalSearchParams();

  const [estadisticas, setEstadisticas] = useState({});
  const [usuarios, setUsuarios] = useState([]);
  const [refugios, setRefugios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vistaActual, setVistaActual] = useState('dashboard'); // 'dashboard', 'usuarios', 'refugios'
  const router = useRouter();

  const cargarDatos = async () => {
    try {
      // Cargar estadísticas
      const responseStats = await axios.get('http://192.168.1.119:3000/api/admin/estadisticas');
      setEstadisticas(responseStats.data.estadisticas || {});

      // Cargar usuarios
      const responseUsuarios = await axios.get('http://192.168.1.119:3000/api/admin/usuarios');
      setUsuarios(responseUsuarios.data.usuarios || []);

      // Cargar refugios
      const responseRefugios = await axios.get('http://192.168.1.119:3000/api/admin/refugios');
      setRefugios(responseRefugios.data.refugios || []);

    } catch (error) {
      console.error('Error al cargar datos administrativos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del sistema');
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

  const renderUsuario = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.nombre} {item.apellido}</Text>
        <Text style={styles.itemSubtitle}>📧 {item.email}</Text>
        <Text style={styles.itemSubtitle}>📱 {item.telefono || 'Sin teléfono'}</Text>
        <Text style={styles.itemSubtitle}>🏠 {item.direccion || 'Sin dirección'}</Text>
        <Text style={styles.itemRol}>Rol: {item.rol || 'Usuario'}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Próximamente', 'Función de editar usuario en desarrollo')}
        >
          <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRefugio = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.nombre}</Text>
        <Text style={styles.itemSubtitle}>📧 {item.email}</Text>
        <Text style={styles.itemSubtitle}>📱 {item.telefono || 'Sin teléfono'}</Text>
        <Text style={styles.itemSubtitle}>🏢 {item.ciudad || 'Sin ciudad'}</Text>
        <Text style={styles.itemDescription}>{item.descripcion}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Próximamente', 'Función de editar refugio en desarrollo')}
        >
          <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (cargando) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#dc3545" />
        <Text style={styles.cargandoTexto}>Cargando panel administrativo...</Text>
      </View>
    );
  }

  const renderDashboard = () => (
    <ScrollView style={styles.content}>
      {/* Estadísticas principales */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{estadisticas.usuarios || 0}</Text>
          <Text style={styles.statLabel}>Usuarios Registrados</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{estadisticas.refugios || 0}</Text>
          <Text style={styles.statLabel}>Refugios Activos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{estadisticas.donaciones || 0}</Text>
          <Text style={styles.statLabel}>Donaciones Totales</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>${parseFloat(estadisticas.monto_total || 0).toFixed(2)}</Text>
          <Text style={styles.statLabel}>Monto Total Donado</Text>
        </View>
      </View>

      {/* Acciones administrativas */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Acciones Administrativas</Text>
        
        <TouchableOpacity 
          style={styles.adminAction}
          onPress={() => Alert.alert('Próximamente', 'Generación de reportes en desarrollo')}
        >
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>Generar Reportes</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.adminAction}
          onPress={() => Alert.alert('Próximamente', 'Configuración del sistema en desarrollo')}
        >
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionText}>Configuración del Sistema</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.adminAction}
          onPress={() => Alert.alert('Próximamente', 'Respaldos en desarrollo')}
        >
          <Text style={styles.actionIcon}>💾</Text>
          <Text style={styles.actionText}>Respaldos de Base de Datos</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.adminAction}
          onPress={() => Alert.alert('Próximamente', 'Logs del sistema en desarrollo')}
        >
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionText}>Ver Logs del Sistema</Text>
        </TouchableOpacity>
      </View>

      {/* Resumen de insumos */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Donaciones de Insumos</Text>
        <View style={styles.insumosSummary}>
          <Text style={styles.insumosText}>
            Total de insumos donados: {estadisticas.insumos || 0}
          </Text>
          <TouchableOpacity 
            style={styles.verDetallesBtn}
            onPress={() => Alert.alert('Próximamente', 'Detalles de insumos en desarrollo')}
          >
            <Text style={styles.verDetallesText}>Ver Detalles</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderUsuarios = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Usuarios Registrados ({usuarios.length})</Text>
      <FlatList
        data={usuarios}
        renderItem={renderUsuario}
        keyExtractor={(item) => item.idUsuario.toString()}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderRefugios = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Refugios Registrados ({refugios.length})</Text>
      <FlatList
        data={refugios}
        renderItem={renderRefugio}
        keyExtractor={(item) => item.idAsociacion.toString()}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.bienvenidaTexto}>Panel de Administración</Text>
        <Text style={styles.adminNombre}>{adminNombre}</Text>
        <Text style={styles.adminEmail}>{adminEmail}</Text>
        <TouchableOpacity style={styles.cerrarSesionBtn} onPress={cerrarSesion}>
          <Text style={styles.cerrarSesionTexto}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Navegación por tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, vistaActual === 'dashboard' && styles.tabActive]}
          onPress={() => setVistaActual('dashboard')}
        >
          <Text style={[styles.tabText, vistaActual === 'dashboard' && styles.tabTextActive]}>
            📊 Dashboard
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, vistaActual === 'usuarios' && styles.tabActive]}
          onPress={() => setVistaActual('usuarios')}
        >
          <Text style={[styles.tabText, vistaActual === 'usuarios' && styles.tabTextActive]}>
            👥 Usuarios
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, vistaActual === 'refugios' && styles.tabActive]}
          onPress={() => setVistaActual('refugios')}
        >
          <Text style={[styles.tabText, vistaActual === 'refugios' && styles.tabTextActive]}>
            🏠 Refugios
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido según vista activa */}
      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {vistaActual === 'dashboard' && renderDashboard()}
        {vistaActual === 'usuarios' && renderUsuarios()}
        {vistaActual === 'refugios' && renderRefugios()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#dc3545',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  bienvenidaTexto: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  adminNombre: {
    color: '#ffe6e6',
    fontSize: 16,
    fontWeight: '500',
  },
  adminEmail: {
    color: '#ffcccc',
    fontSize: 14,
    marginBottom: 10,
  },
  cerrarSesionBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  cerrarSesionTexto: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#dc3545',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#dc3545',
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  adminAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 30,
  },
  actionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  insumosSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insumosText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  verDetallesBtn: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  verDetallesText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  listItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  itemDescription: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 5,
    numberOfLines: 2,
  },
  itemRol: {
    fontSize: 12,
    color: '#dc3545',
    fontWeight: '600',
    marginTop: 5,
    backgroundColor: '#ffe6e6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 5,
    marginLeft: 5,
  },
  actionButtonText: {
    fontSize: 16,
  },
});