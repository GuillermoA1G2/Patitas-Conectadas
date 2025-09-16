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

// ============================================================================
// BACKEND LOGIC SECTION
// ============================================================================

// Configuración del backend
const API_CONFIG = {
  BASE_URL: 'http://192.168.1.119:3000/api',
  ENDPOINTS: {
    ESTADISTICAS: '/admin/estadisticas', 
    USUARIOS: '/admin/usuarios',
    REFUGIOS: '/admin/refugios',
  }
};

// Servicio para manejo de APIs
const AdminService = {
  // Obtener estadísticas del sistema (placeholder, ya que la ruta no existe en server.js)
  async obtenerEstadisticas() {
    try {

      return {
        success: true,
        data: {
          usuarios: 0, // Se actualizará con el conteo real de usuarios
          refugios: 0, // Se actualizará con el conteo real de refugios
          donaciones: 0,
          monto_total: 0,
          insumos: 0,
        }
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        success: false,
        error: 'No se pudieron cargar las estadísticas'
      };
    }
  },

  // Obtener lista de usuarios
  async obtenerUsuarios() {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USUARIOS}`);
      return {
        success: true,
        data: response.data.usuarios || []
      };
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return {
        success: false,
        error: 'No se pudieron cargar los usuarios'
      };
    }
  },

  // Obtener lista de refugios
  async obtenerRefugios() {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFUGIOS}`);
      return {
        success: true,
        data: response.data.refugios || []
      };
    } catch (error) {
      console.error('Error al obtener refugios:', error);
      return {
        success: false,
        error: 'No se pudieron cargar los refugios'
      };
    }
  },

  // Cargar todos los datos del dashboard
  async cargarDatosDashboard() {
    try {
      const [estadisticasResult, usuariosResult, refugiosResult] = await Promise.all([
        this.obtenerEstadisticas(),
        this.obtenerUsuarios(),
        this.obtenerRefugios()
      ]);

      // Actualizar estadísticas con conteos reales de usuarios y refugios
      const estadisticasActualizadas = {
        ...estadisticasResult.data,
        usuarios: usuariosResult.data.length,
        refugios: refugiosResult.data.length,
      };

      return {
        success: true,
        data: {
          estadisticas: estadisticasActualizadas,
          usuarios: usuariosResult.success ? usuariosResult.data : [],
          refugios: refugiosResult.success ? refugiosResult.data : []
        },
        errors: [
          !estadisticasResult.success ? estadisticasResult.error : null,
          !usuariosResult.success ? usuariosResult.error : null,
          !refugiosResult.success ? refugiosResult.error : null,
        ].filter(Boolean)
      };
    } catch (error) {
      console.error('Error general al cargar datos:', error);
      return {
        success: false,
        error: 'Error general del sistema'
      };
    }
  }
};

// Hooks personalizados para manejo de estado y lógica
const useAdminData = () => {
  const [estadisticas, setEstadisticas] = useState({});
  const [usuarios, setUsuarios] = useState([]);
  const [refugios, setRefugios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargarDatos = async () => {
    const resultado = await AdminService.cargarDatosDashboard();
    
    if (resultado.success) {
      setEstadisticas(resultado.data.estadisticas);
      setUsuarios(resultado.data.usuarios);
      setRefugios(resultado.data.refugios);
      
      // Mostrar errores parciales si los hay
      if (resultado.errors.length > 0) {
        Alert.alert('Advertencia', `Algunos datos no se cargaron correctamente:\n${resultado.errors.join('\n')}`);
      }
    } else {
      Alert.alert('Error', resultado.error || 'No se pudieron cargar los datos del sistema');
    }
    
    setCargando(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  return {
    estadisticas,
    usuarios,
    refugios,
    cargando,
    refreshing,
    cargarDatos,
    onRefresh
  };
};

// Utilidades y funciones de negocio
const AdminUtils = {
  formatearMonto: (monto) => {
    return `$${parseFloat(monto || 0).toFixed(2)}`;
  },

  mostrarProximamente: (funcionalidad) => {
    Alert.alert('Próximamente', `${funcionalidad} en desarrollo`);
  },

  confirmarCerrarSesion: (onConfirm) => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, cerrar sesión',
          onPress: onConfirm
        }
      ]
    );
  }
};

// ============================================================================
// FRONTEND SECTION
// ============================================================================

// Componente principal
export default function PantallaAdmin() {
  // Parámetros de navegación
  const {
    adminId,
    adminNombre,
    adminEmail,
    usuarioTipo,
    id_rol
  } = useLocalSearchParams();
  
  const router = useRouter();
  
  // Estado de la vista actual
  const [vistaActual, setVistaActual] = useState('dashboard');
  
  // Hook personalizado para datos del admin
  const {
    estadisticas,
    usuarios,
    refugios,
    cargando,
    refreshing,
    cargarDatos,
    onRefresh
  } = useAdminData();

  // Efecto para cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  // Handlers de eventos
  const handleCerrarSesion = () => {
    AdminUtils.confirmarCerrarSesion(() => {
      router.replace('/inicio_sesion');
    });
  };

  // Componente de carga
  const ComponenteCarga = () => (
    <View style={[styles.container, styles.centered]}>
      <ActivityIndicator size="large" color="#dc3545" />
      <Text style={styles.cargandoTexto}>Cargando panel administrativo...</Text>
    </View>
  );

  // Componente del header
  const ComponenteHeader = () => (
    <View style={styles.header}>
      <Text style={styles.bienvenidaTexto}>Panel de Administración</Text>
      <Text style={styles.adminNombre}>{adminNombre}</Text>
      <TouchableOpacity style={styles.cerrarSesionBtn} onPress={handleCerrarSesion}>
        <Text style={styles.cerrarSesionTexto}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );

  // Componente de navegación por tabs
  const ComponenteTabs = () => {
    const tabs = [
      { key: 'dashboard', label: '📊 Dashboard' },
      { key: 'usuarios', label: '👥 Usuarios' },
      { key: 'refugios', label: '🏠 Refugios' }
    ];

    return (
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, vistaActual === tab.key && styles.tabActive]}
            onPress={() => setVistaActual(tab.key)}
          >
            <Text style={[styles.tabText, vistaActual === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Componente de tarjeta de estadística
  const TarjetaEstadistica = ({ numero, etiqueta }) => (
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{numero}</Text>
      <Text style={styles.statLabel}>{etiqueta}</Text>
    </View>
  );

  // Componente del dashboard
  const ComponenteDashboard = () => (
    <ScrollView style={styles.content}>
      {/* Estadísticas principales */}
      <View style={styles.statsContainer}>
        <TarjetaEstadistica 
          numero={estadisticas.usuarios || 0} 
          etiqueta="Usuarios Registrados" 
        />
        <TarjetaEstadistica 
          numero={estadisticas.refugios || 0} 
          etiqueta="Refugios Activos" 
        />
        <TarjetaEstadistica 
          numero={estadisticas.donaciones || 0} 
          etiqueta="Donaciones Totales" 
        />
        <TarjetaEstadistica 
          numero={AdminUtils.formatearMonto(estadisticas.monto_total)} 
          etiqueta="Monto Total Donado" 
        />
      </View>

      {/* Acciones administrativas */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Acciones Administrativas</Text>
        
        <AccionAdministrativa 
          icono="📊" 
          texto="Generar Reportes"
          onPress={() => AdminUtils.mostrarProximamente('Generación de reportes')}
        />
        <AccionAdministrativa 
          icono="⚙️" 
          texto="Configuración del Sistema"
          onPress={() => AdminUtils.mostrarProximamente('Configuración del sistema')}
        />
        <AccionAdministrativa 
          icono="💾" 
          texto="Respaldos de Base de Datos"
          onPress={() => AdminUtils.mostrarProximamente('Respaldos')}
        />
        <AccionAdministrativa 
          icono="📋" 
          texto="Ver Logs del Sistema"
          onPress={() => AdminUtils.mostrarProximamente('Logs del sistema')}
        />
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
            onPress={() => AdminUtils.mostrarProximamente('Detalles de insumos')}
          >
            <Text style={styles.verDetallesText}>Ver Detalles</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  // Componente de acción administrativa
  const AccionAdministrativa = ({ icono, texto, onPress }) => (
    <TouchableOpacity style={styles.adminAction} onPress={onPress}>
      <Text style={styles.actionIcon}>{icono}</Text>
      <Text style={styles.actionText}>{texto}</Text>
    </TouchableOpacity>
  );

  // Componente de item de usuario
  const ItemUsuario = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.nombre} {item.apellido}</Text>
        <Text style={styles.itemSubtitle}>📧 {item.email}</Text>
        <Text style={styles.itemSubtitle}>📱 {item.telefono || 'Sin teléfono'}</Text>
        <Text style={styles.itemSubtitle}>🏠 {item.direccion || 'Sin dirección'}</Text>
        <Text style={styles.itemRol}>Rol: {item.rol}</Text> {/* Muestra el rol legible */}
        <Text style={styles.itemSubtitle}>Fecha de Registro: {new Date(item.fecha_registro).toLocaleDateString()}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => AdminUtils.mostrarProximamente(`Editar usuario ${item.nombre}`)}
        >
          <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Componente de usuarios
  const ComponenteUsuarios = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Usuarios Registrados ({usuarios.length})</Text>
      <FlatList
        data={usuarios}
        renderItem={({ item }) => <ItemUsuario item={item} />}
        keyExtractor={(item) => item.idUsuario.toString()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <Text style={styles.emptyListText}>No hay usuarios registrados.</Text>
        )}
      />
    </View>
  );

  // Componente de item de refugio
  const ItemRefugio = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.nombre}</Text>
        <Text style={styles.itemSubtitle}>📧 {item.email}</Text>
        <Text style={styles.itemSubtitle}>📱 {item.telefono || 'Sin teléfono'}</Text>
        <Text style={styles.itemSubtitle}>🏢 {item.ciudad || 'Sin ciudad'}</Text>
        <Text style={styles.itemSubtitle}>📍 {item.direccion || 'Sin dirección'}</Text>
        <Text style={styles.itemDescription}>{item.descripcion || 'Sin descripción'}</Text>
        <Text style={styles.itemSubtitle}>Fecha de Registro: {new Date(item.fecha_registro).toLocaleDateString()}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => AdminUtils.mostrarProximamente(`Editar refugio ${item.nombre}`)}
        >
          <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Componente de refugios
  const ComponenteRefugios = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Refugios Registrados ({refugios.length})</Text>
      <FlatList
        data={refugios}
        renderItem={({ item }) => <ItemRefugio item={item} />}
        keyExtractor={(item) => item.idAsociacion.toString()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <Text style={styles.emptyListText}>No hay refugios registrados.</Text>
        )}
      />
    </View>
  );

  // Función para renderizar el contenido según la vista activa
  const renderizarContenido = () => {
    switch (vistaActual) {
      case 'dashboard':
        return <ComponenteDashboard />;
      case 'usuarios':
        return <ComponenteUsuarios />;
      case 'refugios':
        return <ComponenteRefugios />;
      default:
        return <ComponenteDashboard />;
    }
  };

  // Render principal
  if (cargando) {
    return <ComponenteCarga />;
  }

  return (
    <View style={styles.container}>
      <ComponenteHeader />
      <ComponenteTabs />
      
      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderizarContenido()}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// STYLES SECTION
// ============================================================================

const styles = StyleSheet.create({
  // Contenedores principales
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 15,
  },

  // Estados de carga
  cargandoTexto: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },

  // Header
  header: {
    backgroundColor: '#a26b6c',
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

  // Navegación por tabs
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
    borderBottomColor: '#a26b6c',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#a26b6c',
    fontWeight: 'bold',
  },

  // Tarjetas de estadísticas
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
    color: '#a26b6c',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  // Tarjetas generales
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

  // Acciones administrativas
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

  // Sección de insumos
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

  // Títulos de sección
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },

  // Items de listas
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
    // numberOfLines: 2, // Esto es una prop de Text, no de StyleSheet
  },
  itemRol: {
    fontSize: 12,
    color: '#a26b6c',
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
  emptyListText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});