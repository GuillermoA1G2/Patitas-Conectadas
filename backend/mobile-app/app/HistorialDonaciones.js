import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';

// ============================================================================
// BACKEND LOGIC
// ============================================================================

const API_BASE_URL = 'http://192.168.1.119:3000';

class HistorialDonacionesService {
  // Obtener historial de donaciones del usuario - CORREGIDO
  static async obtenerHistorialDonaciones(idUsuario) {
    try {
      console.log(`Solicitando donaciones para usuario: ${idUsuario}`);
      
      // Endpoint corregido para coincidir con server.js
      const response = await fetch(`${API_BASE_URL}/api/usuario/${idUsuario}/donaciones`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Datos recibidos:', data);
      
      if (data.success) {
        return {
          success: true,
          data: {
            donacionesMonetarias: data.donacionesMonetarias || [],
            donacionesInsumos: data.donacionesInsumos || []
          }
        };
      } else {
        return {
          success: false,
          error: data.message || 'No se pudo cargar el historial de donaciones'
        };
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
      return {
        success: false,
        error: `Error de conexión: ${error.message}`
      };
    }
  }

  // Calcular estadísticas de donaciones
  static calcularEstadisticas(donacionesMonetarias, donacionesInsumos) {
    const totalDonacionesMonetarias = donacionesMonetarias.length;
    const totalDonacionesInsumos = donacionesInsumos.length;
    
    // Manejo seguro de números para evitar NaN
    const montoTotalDonado = donacionesMonetarias.reduce((total, donacion) => {
      const cantidad = parseFloat(donacion.cantidad) || 0;
      return total + cantidad;
    }, 0);

    return {
      totalDonacionesMonetarias,
      totalDonacionesInsumos,
      montoTotalDonado: montoTotalDonado.toFixed(2)
    };
  }

  // Formatear fecha para display - MEJORADO
  static formatearFecha(fecha) {
    if (!fecha) return 'Fecha no disponible';
    
    try {
      const fechaObj = new Date(fecha);
      
      // Validar que la fecha sea válida
      if (isNaN(fechaObj.getTime())) {
        return 'Fecha inválida';
      }
      
      return fechaObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha no disponible';
    }
  }

  // Validar y normalizar datos del usuario - MEJORADO
  static validarUsuario(usuario) {
    console.log('Usuario recibido:', usuario);
    
    // Buscar idUsuario en diferentes posibles ubicaciones
    let idUsuario = null;
    
    if (usuario) {
      idUsuario = usuario.idUsuario || usuario.id || usuario.ID || usuario.userId;
    }
    
    // Si no se encuentra ID válido, usar ID por defecto para testing
    if (!idUsuario || isNaN(parseInt(idUsuario))) {
      console.warn('ID de usuario no válido, usando ID por defecto');
      idUsuario = 1;
    }
    
    const resultado = {
      idUsuario: parseInt(idUsuario),
      nombre: usuario?.nombre || 'Usuario'
    };
    
    console.log('Usuario validado:', resultado);
    return resultado;
  }
}

// ============================================================================
// FRONTEND LOGIC - CUSTOM HOOKS & STATE MANAGEMENT
// ============================================================================

const useHistorialDonaciones = (usuario) => {
  const [donacionesMonetarias, setDonacionesMonetarias] = useState([]);
  const [donacionesInsumos, setDonacionesInsumos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  const cargarHistorial = async () => {
    try {
      setError(null);
      const usuarioValidado = HistorialDonacionesService.validarUsuario(usuario);
      console.log('Cargando historial para usuario:', usuarioValidado);
      
      const resultado = await HistorialDonacionesService.obtenerHistorialDonaciones(usuarioValidado.idUsuario);
      
      if (resultado.success) {
        console.log('Historial cargado exitosamente');
        setDonacionesMonetarias(resultado.data.donacionesMonetarias);
        setDonacionesInsumos(resultado.data.donacionesInsumos);
      } else {
        console.error('Error al cargar historial:', resultado.error);
        setError(resultado.error);
        Alert.alert('Error', resultado.error);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      const errorMsg = 'Error inesperado al cargar el historial';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const onRefresh = () => {
    console.log('Refrescando datos...');
    setRefrescando(true);
    cargarHistorial();
  };

  useEffect(() => {
    console.log('Efecto inicial - cargando historial');
    cargarHistorial();
  }, []);

  return {
    donacionesMonetarias,
    donacionesInsumos,
    cargando,
    refrescando,
    error,
    onRefresh,
    estadisticas: HistorialDonacionesService.calcularEstadisticas(donacionesMonetarias, donacionesInsumos)
  };
};

// ============================================================================
// FRONTEND COMPONENTS - UI COMPONENTS
// ============================================================================

const LoadingScreen = () => (
  <View style={[styles.container, styles.centrado]}>
    <ActivityIndicator size="large" color="#ff69b4" />
    <Text style={styles.cargandoTexto}>Cargando historial...</Text>
  </View>
);

const ErrorScreen = ({ error, onRefresh }) => (
  <View style={[styles.container, styles.centrado]}>
    <Text style={styles.errorTexto}>Error: {error}</Text>
    <Text style={styles.errorSubTexto} onPress={onRefresh}>
      Toca aquí para reintentar
    </Text>
  </View>
);

const HeaderSection = ({ usuario }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>Donaciones</Text>
    <Text style={styles.userInfo}>
      Hola, {usuario.nombre} (ID: {usuario.idUsuario})
    </Text>
  </View>
);

const ResumenCard = ({ estadisticas }) => (
  <View style={styles.resumenCard}>
    <Text style={styles.resumenTitulo}>Resumen</Text>
    <View style={styles.resumenRow}>
      <Text style={styles.resumenTexto}>
        💰 Donaciones monetarias: {estadisticas.totalDonacionesMonetarias}
      </Text>
    </View>
    <View style={styles.resumenRow}>
      <Text style={styles.resumenTexto}>
        📦 Donaciones de insumos: {estadisticas.totalDonacionesInsumos}
      </Text>
    </View>
    <View style={styles.resumenRow}>
      <Text style={styles.resumenTexto}>
        💵 Total donado: ${estadisticas.montoTotalDonado}
      </Text>
    </View>
  </View>
);

const DonacionMonetariaCard = ({ donacion }) => {
  // Manejo seguro de datos
  const cantidad = parseFloat(donacion.cantidad) || 0;
  const refugioNombre = donacion.refugio_nombre || 'Refugio no especificado';
  const fecha = donacion.fecha;
  
  return (
    <View style={styles.donacionCard}>
      <View style={styles.donacionHeader}>
        <Text style={styles.donacionMonto}>
          ${cantidad.toFixed(2)}
        </Text>
        <Text style={styles.donacionFecha}>
          {HistorialDonacionesService.formatearFecha(fecha)}
        </Text>
      </View>
      <Text style={styles.donacionRefugio}>
        🏠 {refugioNombre}
      </Text>
      <View style={styles.estadoBadge}>
        <Text style={styles.estadoTexto}>✅ Registrada</Text>
      </View>
    </View>
  );
};

const DonacionInsumoCard = ({ insumo }) => {
  // Manejo seguro de datos
  const nombre = insumo.nombre || 'Insumo no especificado';
  const descripcion = insumo.descripcion;
  const cantidad = insumo.cantidad || 1;
  const refugioNombre = insumo.refugio_nombre || 'Refugio no especificado';
  const completado = Boolean(insumo.completado);
  
  return (
    <View style={styles.donacionCard}>
      <View style={styles.donacionHeader}>
        <Text style={styles.insumoNombre}>{nombre}</Text>
        <Text style={styles.insumoCantidad}>
          Cant: {cantidad}
        </Text>
      </View>
      {descripcion && (
        <Text style={styles.insumoDescripcion}>
          📝 {descripcion}
        </Text>
      )}
      <Text style={styles.donacionRefugio}>
        🏠 {refugioNombre}
      </Text>
      <View style={[
        styles.estadoBadge, 
        completado ? styles.estadoCompletado : styles.estadoPendiente
      ]}>
        <Text style={styles.estadoTexto}>
          {completado ? '✅ Entregado' : '⏳ Pendiente'}
        </Text>
      </View>
    </View>
  );
};

const SeccionDonaciones = ({ titulo, donaciones, tipo, ComponenteCard }) => (
  <View style={styles.seccion}>
    <Text style={styles.seccionTitulo}>{titulo}</Text>
    {donaciones.length === 0 ? (
      <View style={styles.sinDatos}>
        <Text style={styles.sinDatosTexto}>
          No tienes donaciones de {tipo}
        </Text>
      </View>
    ) : (
      donaciones.map((item) => (
        <ComponenteCard key={`${tipo}-${item.id}`} {...{ [tipo]: item }} />
      ))
    )}
  </View>
);

const MensajeSinDonaciones = () => (
  <View style={styles.sinDonaciones}>
    <Text style={styles.sinDonacionesTitulo}>¡Aún no has hecho donaciones!</Text>
    <Text style={styles.sinDonacionesTexto}>
      Tu primera donación puede marcar la diferencia en la vida de muchos animalitos 🐾
    </Text>
  </View>
);

// ============================================================================
// MAIN COMPONENT - SCREEN COMPONENT
// ============================================================================

export default function HistorialDonacionesScreen({ route }) {
  // Debug: verificar parámetros recibidos
  console.log('Parámetros de ruta:', route?.params);
  
  const usuario = HistorialDonacionesService.validarUsuario(route?.params?.usuario);
  
  const {
    donacionesMonetarias,
    donacionesInsumos,
    cargando,
    refrescando,
    error,
    onRefresh,
    estadisticas
  } = useHistorialDonaciones(usuario);

  if (cargando) {
    return <LoadingScreen />;
  }

  if (error && !refrescando) {
    return <ErrorScreen error={error} onRefresh={onRefresh} />;
  }

  const tieneAlgunaDonacion = donacionesMonetarias.length > 0 || donacionesInsumos.length > 0;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refrescando} onRefresh={onRefresh} />
      }
    >
      <HeaderSection usuario={usuario} />
      <ResumenCard estadisticas={estadisticas} />

      <SeccionDonaciones
        titulo="💰 Donaciones Monetarias"
        donaciones={donacionesMonetarias}
        tipo="donacion"
        ComponenteCard={DonacionMonetariaCard}
      />

      <SeccionDonaciones
        titulo="📦 Donaciones de Insumos"
        donaciones={donacionesInsumos}
        tipo="insumo"
        ComponenteCard={DonacionInsumoCard}
      />

      {!tieneAlgunaDonacion && <MensajeSinDonaciones />}
    </ScrollView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 20,
  },
  centrado: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cargandoTexto: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorTexto: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubTexto: {
    color: '#3498db',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  header: {
    backgroundColor: '#a2d2ff',
    paddingTop: 50,
    paddingBottom: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  userInfo: {
    fontSize: 14,
    color: '#2c3e50',
    marginTop: 5,
  },
  resumenCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resumenTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  resumenRow: {
    marginBottom: 8,
  },
  resumenTexto: {
    fontSize: 16,
    color: '#34495e',
  },
  seccion: {
    marginBottom: 25,
  },
  seccionTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  sinDatos: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  sinDatosTexto: {
    color: '#7f8c8d',
    fontSize: 16,
    fontStyle: 'italic',
  },
  donacionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  donacionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  donacionMonto: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  donacionFecha: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  donacionRefugio: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
  },
  insumoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textTransform: 'capitalize',
    flex: 1,
  },
  insumoCantidad: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  insumoDescripcion: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  estadoBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: '#3498db',
  },
  estadoCompletado: {
    backgroundColor: '#27ae60',
  },
  estadoPendiente: {
    backgroundColor: '#f39c12',
  },
  estadoTexto: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sinDonaciones: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  sinDonacionesTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  sinDonacionesTexto: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
});