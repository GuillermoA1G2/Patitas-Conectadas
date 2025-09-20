import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// ============================================================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================================================
const API_BASE_URL = 'http://192.168.1.119:3000';

// ============================================================================
// BACKEND LOGIC
// ============================================================================

class HistorialDonacionesService {
  /**
   * Obtiene el historial de donaciones (monetarias y de insumos) RECIBIDAS por un refugio.
   * @param {string} idRefugio El ID del refugio.
   * @returns {Promise<{success: boolean, data?: object, error?: string}>} Resultado de la operación.
   */
  static async obtenerDonacionesRecibidasRefugio(idRefugio) {
    try {
      console.log(`[HistorialDonacionesService] Solicitando donaciones recibidas para refugio: ${idRefugio}`);
      const response = await fetch(`${API_BASE_URL}/api/refugio/${idRefugio}/donaciones`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`[HistorialDonacionesService] Response status (donaciones recibidas): ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[HistorialDonacionesService] Error response (donaciones recibidas):', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[HistorialDonacionesService] Datos recibidos (donaciones recibidas):', data);

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
          error: data.message || 'No se pudieron cargar las donaciones recibidas.'
        };
      }
    } catch (error) {
      console.error('[HistorialDonacionesService] Error al cargar donaciones recibidas:', error);
      return {
        success: false,
        error: `Error de conexión o servidor al cargar donaciones recibidas: ${error.message}`
      };
    }
  }

  /**
   * Obtiene las solicitudes de donaciones realizadas por un refugio.
   * @param {string} idRefugio El ID del refugio.
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>} Resultado de la operación.
   */
  static async obtenerSolicitudesDonacionRefugio(idRefugio) {
    try {
      console.log(`[HistorialDonacionesService] Solicitando solicitudes de donación para refugio: ${idRefugio}`);
      const response = await fetch(`${API_BASE_URL}/api/solicitudes-donaciones/refugio/${idRefugio}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`[HistorialDonacionesService] Response status (solicitudes): ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[HistorialDonacionesService] Error response (solicitudes):', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[HistorialDonacionesService] Datos recibidos (solicitudes):', data);

      if (data.success) {
        return {
          success: true,
          data: data.solicitudes || []
        };
      } else {
        return {
          success: false,
          error: data.message || 'No se pudieron cargar las solicitudes de donación.'
        };
      }
    } catch (error) {
      console.error('[HistorialDonacionesService] Error al cargar solicitudes de donación:', error);
      return {
        success: false,
        error: `Error de conexión o servidor al cargar solicitudes de donación: ${error.message}`
      };
    }
  }

  /**
   * Calcula estadísticas resumidas para el refugio.
   * @param {Array} solicitudesDonacion Lista de solicitudes de donación.
   * @param {Array} donacionesMonetariasRecibidas Lista de donaciones monetarias.
   * @param {Array} donacionesInsumosRecibidas Lista de donaciones de insumos.
   * @returns {object} Objeto con las estadísticas calculadas.
   */
  static calcularEstadisticasRefugio(solicitudesDonacion, donacionesMonetariasRecibidas, donacionesInsumosRecibidas) {
    const totalSolicitudes = solicitudesDonacion.length;
    const totalDonacionesMonetariasRecibidas = donacionesMonetariasRecibidas.length;
    const totalDonacionesInsumosRecibidas = donacionesInsumosRecibidas.length;

    const montoTotalMonetarioRecibido = donacionesMonetariasRecibidas.reduce((total, donacion) => {
      const cantidad = parseFloat(donacion.cantidad) || 0;
      return total + cantidad;
    }, 0);

    return {
      totalSolicitudes,
      totalDonacionesMonetariasRecibidas,
      totalDonacionesInsumosRecibidas,
      montoTotalMonetarioRecibido: montoTotalMonetarioRecibido.toFixed(2)
    };
  }

  /**
   * Formatea una fecha para su visualización.
   * @param {string | Date} fecha La fecha a formatear.
   * @returns {string} La fecha formateada o un mensaje de error.
   */
  static formatearFecha(fecha) {
    if (!fecha) return 'Fecha no disponible';

    try {
      const fechaObj = new Date(fecha);
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
      console.error('[HistorialDonacionesService] Error al formatear fecha:', error);
      return 'Fecha no disponible';
    }
  }

  /**
   * Valida y normaliza los parámetros de la entidad (usuario o refugio) de la ruta.
   * Proporciona un ID de refugio de ejemplo si no se encuentra uno válido (solo para desarrollo).
   * @param {object} params Los parámetros de la ruta.
   * @returns {{entidadId: string, entidadNombre: string, tipoEntidad: string}} Objeto con la información de la entidad validada.
   */
  static validarEntidad(params) {
    console.log('[HistorialDonacionesService] Parámetros recibidos para validación:', params);

    let entidadId = null;
    let entidadNombre = 'Entidad';
    let tipoEntidad = 'desconocido';

    // Priorizar refugioId si existe
    if (params?.refugioId) {
      entidadId = params.refugioId;
      entidadNombre = params.refugioNombre || 'Refugio';
      tipoEntidad = 'refugio';
    }
    // Si no es refugio, buscar idUsuario
    else if (params?.usuarioId || params?.idUsuario || params?.id || params?.userId) {
      entidadId = params.usuarioId || params.idUsuario || params.id || params.userId;
      entidadNombre = params.usuarioNombre || params.nombre || 'Usuario';
      tipoEntidad = 'usuario';
    }

    // Si no se encuentra ID válido, usar ID por defecto para testing (solo para desarrollo)
    if (!entidadId || (typeof entidadId === 'string' && entidadId.trim() === '')) {
      const isDevelopment = __DEV__; // Variable global de Expo para saber si estamos en desarrollo
      if (isDevelopment) {
        console.warn('[HistorialDonacionesService] ID de entidad no válido o vacío. Usando ID de refugio de ejemplo para desarrollo.');
        entidadId = '65e8a2a95a7122a521111111'; // ID de refugio de ejemplo
        entidadNombre = 'Refugio de Prueba (DEV)';
        tipoEntidad = 'refugio';
      } else {
        console.error('[HistorialDonacionesService] ID de entidad no válido en entorno de producción. Esto podría causar errores.');
        // En producción, podrías querer lanzar un error o redirigir.
        entidadId = null; // Asegurarse de que no se use un ID inválido
        entidadNombre = 'Refugio Desconocido';
        tipoEntidad = 'refugio'; // Asumir refugio para evitar más errores en la UI si se llega a este punto
      }
    }

    const resultado = {
      entidadId: entidadId,
      entidadNombre: entidadNombre,
      tipoEntidad: tipoEntidad
    };

    console.log('[HistorialDonacionesService] Entidad validada:', resultado);
    return resultado;
  }
}

// ============================================================================
// FRONTEND LOGIC - CUSTOM HOOKS & STATE MANAGEMENT
// ============================================================================

/**
 * Hook personalizado para gestionar el historial de donaciones de un refugio.
 * @param {{entidadId: string, entidadNombre: string, tipoEntidad: string}} entidad Objeto con el ID, nombre y tipo de la entidad.
 * @returns {{solicitudesDonacion: Array, donacionesMonetariasRecibidas: Array, donacionesInsumosRecibidas: Array, cargando: boolean, refrescando: boolean, error: string | null, onRefresh: Function, estadisticas: object}}
 */
const useHistorialDonacionesRefugio = (entidad) => {
  const [solicitudesDonacion, setSolicitudesDonacion] = useState([]);
  const [donacionesMonetariasRecibidas, setDonacionesMonetariasRecibidas] = useState([]);
  const [donacionesInsumosRecibidas, setDonacionesInsumosRecibidas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  const cargarHistorial = async () => {
    try {
      setError(null); // Limpiar errores previos
      console.log('[useHistorialDonacionesRefugio] Cargando historial para entidad:', entidad);

      if (entidad.tipoEntidad !== 'refugio') {
        const errorMessage = 'Esta pantalla es solo para refugios. Por favor, asegúrate de que el ID proporcionado sea de un refugio.';
        setError(errorMessage);
        Alert.alert('Error de Acceso', errorMessage);
        setCargando(false);
        setRefrescando(false);
        return;
      }

      if (!entidad.entidadId) {
        const errorMessage = 'No se pudo obtener un ID de refugio válido para cargar el historial.';
        setError(errorMessage);
        Alert.alert('Error de Configuración', errorMessage);
        setCargando(false);
        setRefrescando(false);
        return;
      }

      // Ejecutar ambas llamadas a la API en paralelo
      const [
        resultadoSolicitudes,
        resultadoDonacionesRecibidas
      ] = await Promise.all([
        HistorialDonacionesService.obtenerSolicitudesDonacionRefugio(entidad.entidadId),
        HistorialDonacionesService.obtenerDonacionesRecibidasRefugio(entidad.entidadId)
      ]);

      // Manejar el resultado de las solicitudes de donación
      if (resultadoSolicitudes.success) {
        setSolicitudesDonacion(resultadoSolicitudes.data);
      } else {
        console.error('[useHistorialDonacionesRefugio] Error al cargar solicitudes:', resultadoSolicitudes.error);
        setError(prevError => prevError ? `${prevError}\n${resultadoSolicitudes.error}` : resultadoSolicitudes.error);
        Alert.alert('Error al cargar solicitudes', resultadoSolicitudes.error);
      }

      // Manejar el resultado de las donaciones recibidas
      if (resultadoDonacionesRecibidas.success) {
        setDonacionesMonetariasRecibidas(resultadoDonacionesRecibidas.data.donacionesMonetarias);
        setDonacionesInsumosRecibidas(resultadoDonacionesRecibidas.data.donacionesInsumos);
      } else {
        console.error('[useHistorialDonacionesRefugio] Error al cargar donaciones recibidas:', resultadoDonacionesRecibidas.error);
        setError(prevError => prevError ? `${prevError}\n${resultadoDonacionesRecibidas.error}` : resultadoDonacionesRecibidas.error);
        Alert.alert('Error al cargar donaciones recibidas', resultadoDonacionesRecibidas.error);
      }

    } catch (err) {
      console.error('[useHistorialDonacionesRefugio] Error inesperado al cargar historial:', err);
      const errorMsg = `Error inesperado al cargar el historial del refugio: ${err.message}`;
      setError(errorMsg);
      Alert.alert('Error Inesperado', errorMsg);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const onRefresh = () => {
    console.log('[useHistorialDonacionesRefugio] Refrescando datos...');
    setRefrescando(true);
    cargarHistorial();
  };

  useEffect(() => {
    console.log('[useHistorialDonacionesRefugio] Efecto inicial - cargando historial del refugio');
    cargarHistorial();
  }, [entidad.entidadId]); // Recargar si el ID del refugio cambia

  return {
    solicitudesDonacion,
    donacionesMonetariasRecibidas,
    donacionesInsumosRecibidas,
    cargando,
    refrescando,
    error,
    onRefresh,
    estadisticas: HistorialDonacionesService.calcularEstadisticasRefugio(
      solicitudesDonacion,
      donacionesMonetariasRecibidas,
      donacionesInsumosRecibidas
    )
  };
};

// ========================================================================================
// FRONTEND COMPONENTS - UI COMPONENTS
// ========================================================================================

// Nuevo componente de encabezado con botón de retroceso
const Header = ({ screenTitle, onBackPress }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color="white" />
    </TouchableOpacity>
    <Text style={styles.headerScreenTitle}>{screenTitle}</Text>
  </View>
);

const LoadingScreen = () => (
  <View style={[styles.container, styles.centrado]}>
    <ActivityIndicator size="large" color="#a26b6c" />
    <Text style={styles.cargandoTexto}>Cargando historial del refugio...</Text>
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

const ResumenCard = ({ estadisticas }) => (
  <View style={styles.resumenCard}>
    <Text style={styles.resumenTitulo}>Resumen para el Refugio</Text>
    <View style={styles.resumenRow}>
      <Text style={styles.resumenTexto}>
        📝 Solicitudes de Donación: <Text style={styles.resumenValor}>{estadisticas.totalSolicitudes}</Text>
      </Text>
    </View>
    <View style={styles.resumenRow}>
      <Text style={styles.resumenTexto}>
        💰 Donaciones Monetarias Recibidas: <Text style={styles.resumenValor}>{estadisticas.totalDonacionesMonetariasRecibidas}</Text>
      </Text>
    </View>
    <View style={styles.resumenRow}>
      <Text style={styles.resumenTexto}>
        📦 Donaciones de Insumos Recibidas: <Text style={styles.resumenValor}>{estadisticas.totalDonacionesInsumosRecibidas}</Text>
      </Text>
    </View>
    <View style={styles.resumenRow}>
      <Text style={styles.resumenTexto}>
        💵 Total Monetario Recibido: <Text style={styles.resumenValor}>${estadisticas.montoTotalMonetarioRecibido}</Text>
      </Text>
    </View>
  </View>
);

const SolicitudDonacionCard = ({ solicitud }) => {
  const nombre = solicitud.nombre || 'Insumo no especificado';
  const descripcion = solicitud.descripcion;
  const cantidad = solicitud.cantidad || 1;
  const nivelUrgencia = solicitud.nivel_urgencia || 'Desconocido';
  const fechaSolicitud = solicitud.fecha_solicitud;
  const activa = solicitud.activa;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{nombre}</Text>
        <Text style={styles.cardDate}>
          {HistorialDonacionesService.formatearFecha(fechaSolicitud)}
        </Text>
      </View>
      {descripcion && (
        <Text style={styles.cardDescription}>
          📝 {descripcion}
        </Text>
      )}
      <Text style={styles.cardDetail}>
        Cantidad solicitada: <Text style={styles.cardDetailValue}>{cantidad}</Text>
      </Text>
      <Text style={styles.cardDetail}>
        Urgencia: <Text style={[styles.cardDetailValue, { color: nivelUrgencia === 'Alta' ? '#e74c3c' : nivelUrgencia === 'Media' ? '#f39c12' : '#27ae60' }]}>{nivelUrgencia}</Text>
      </Text>
      <View style={[
        styles.statusBadge,
        activa ? styles.statusPending : styles.statusCompleted
      ]}>
        <Text style={styles.statusText}>
          {activa ? '⏳ Activa' : '✅ Inactiva'}
        </Text>
      </View>
    </View>
  );
};

const DonacionMonetariaRecibidaCard = ({ donacion }) => {
  const cantidad = parseFloat(donacion.cantidad) || 0;
  const donanteNombre = donacion.nombre || 'Donante Anónimo';
  const donanteEmail = donacion.email || 'No disponible';
  const fecha = donacion.fecha;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Donación Monetaria</Text>
        <Text style={styles.cardDate}>
          {HistorialDonacionesService.formatearFecha(fecha)}
        </Text>
      </View>
      <Text style={styles.cardDetail}>
        Monto: <Text style={[styles.cardDetailValue, styles.moneyAmount]}>${cantidad.toFixed(2)}</Text>
      </Text>
      <Text style={styles.cardDetail}>
        👤 Donante: <Text style={styles.cardDetailValue}>{donanteNombre}</Text>
      </Text>
      <Text style={styles.cardDetail}>
        📧 Email: <Text style={styles.cardDetailValue}>{donanteEmail}</Text>
      </Text>
      <View style={[styles.statusBadge, styles.statusCompleted]}>
        <Text style={styles.statusText}>✅ Recibida</Text>
      </View>
    </View>
  );
};

const DonacionInsumoRecibidaCard = ({ insumo }) => {
  const nombre = insumo.nombre || 'Insumo no especificado';
  const descripcion = insumo.descripcion;
  const cantidad = insumo.cantidad || 1;
  const donanteNombre = insumo.nombre_donante || 'Donante Anónimo';
  const donanteTelefono = insumo.telefono_donante || 'No disponible';
  const completado = insumo.completado;
  const fecha = insumo.fecha_creacion;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{nombre}</Text>
        <Text style={styles.cardDate}>
          {HistorialDonacionesService.formatearFecha(fecha)}
        </Text>
      </View>
      {descripcion && (
        <Text style={styles.cardDescription}>
          📝 {descripcion}
        </Text>
      )}
      <Text style={styles.cardDetail}>
        Cantidad: <Text style={styles.cardDetailValue}>{cantidad}</Text>
      </Text>
      <Text style={styles.cardDetail}>
        👤 Donante: <Text style={styles.cardDetailValue}>{donanteNombre}</Text>
      </Text>
      <Text style={styles.cardDetail}>
        📞 Contacto: <Text style={styles.cardDetailValue}>{donanteTelefono}</Text>
      </Text>
      <View style={[
        styles.statusBadge,
        completado ? styles.statusCompleted : styles.statusPending
      ]}>
        <Text style={styles.statusText}>
          {completado ? '✅ Entregado' : '⏳ Pendiente de Recibir'}
        </Text>
      </View>
    </View>
  );
};

const SeccionDonaciones = ({ titulo, donaciones, tipo, ComponenteCard }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>
      {titulo}
    </Text>
    {donaciones.length === 0 ? (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          No hay {tipo} registradas.
        </Text>
      </View>
    ) : (
      donaciones.map((item) => (
        <ComponenteCard key={`${tipo}-${item.id || item._id}`} {...{ [tipo]: item }} />
      ))
    )}
  </View>
);

const MensajeSinActividad = () => (
  <View style={styles.noActivityContainer}>
    <Text style={styles.noActivityTitle}>¡Aún no hay actividad de donaciones!</Text>
    <Text style={styles.noActivityText}>
      Realiza tu primera solicitud o espera a recibir donaciones para verlas aquí. 🐾
    </Text>
  </View>
);

// ============================================================================
// MAIN COMPONENT - SCREEN COMPONENT
// ============================================================================

export default function HistorialDonacionesScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  console.log('[HistorialDonacionesScreen] Parámetros de ruta:', params);

  const entidad = HistorialDonacionesService.validarEntidad(params);

  const {
    solicitudesDonacion,
    donacionesMonetariasRecibidas,
    donacionesInsumosRecibidas,
    cargando,
    refrescando,
    error,
    onRefresh,
    estadisticas
  } = useHistorialDonacionesRefugio(entidad);

  const handleGoBack = () => {
    // Navegar de regreso a la pantalla del refugio, pasando el refugioId
    router.replace({
      pathname: '/refugio',
      params: {
        refugioId: entidad.entidadId,
        refugioNombre: entidad.entidadNombre,
        // Puedes pasar otros parámetros si son necesarios para la pantalla de refugio
      }
    });
  };

  if (cargando) {
    return (
      <SafeAreaView style={[styles.container, styles.centrado]}>
        <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />
        <LoadingScreen />
      </SafeAreaView>
    );
  }

  if (error && !refrescando) {
    return (
      <SafeAreaView style={[styles.container, styles.centrado]}>
        <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />
        <ErrorScreen error={error} onRefresh={onRefresh} />
      </SafeAreaView>
    );
  }

  const tieneAlgunaActividad =
    solicitudesDonacion.length > 0 ||
    donacionesMonetariasRecibidas.length > 0 ||
    donacionesInsumosRecibidas.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />

      {/* Nuevo Header con botón de retroceso */}
      <Header screenTitle={'Historial de Donaciones'} onBackPress={handleGoBack} />

      <ScrollView
        style={styles.scrollViewContent}
        contentContainerStyle={styles.scrollPadding}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={onRefresh} colors={['#a26b6c']} tintColor="#a26b6c" />
        }
      >
        <ResumenCard estadisticas={estadisticas} />

        <SeccionDonaciones
          titulo="📝 Solicitudes de Donación Realizadas"
          donaciones={solicitudesDonacion}
          tipo="solicitud"
          ComponenteCard={SolicitudDonacionCard}
        />

        <SeccionDonaciones
          titulo="💰 Donaciones Monetarias Recibidas"
          donaciones={donacionesMonetariasRecibidas}
          tipo="donacion"
          ComponenteCard={DonacionMonetariaRecibidaCard}
        />

        <SeccionDonaciones
          titulo="📦 Donaciones de Insumos Recibidas"
          donaciones={donacionesInsumosRecibidas}
          tipo="insumo"
          ComponenteCard={DonacionInsumoRecibidaCard}
        />

        {!tieneAlgunaActividad && <MensajeSinActividad />}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollViewContent: {
    flex: 1,
  },
  scrollPadding: {
    padding: 15,
  },
  centrado: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cargandoTexto: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  errorTexto: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  errorSubTexto: {
    color: '#0066ff',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 5,
  },

  // ========================================================================
  // ESTILOS DEL HEADER (MODIFICADOS)
  // ========================================================================
  header: {
    backgroundColor: '#a26b6c',
    paddingTop: 40, // Ajuste para StatusBar
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
  backButton: {
    marginRight: 15,
    padding: 5, // Para hacer el área táctil más grande
  },
  headerScreenTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // ========================================================================
  // FIN ESTILOS DEL HEADER
  // ========================================================================

  resumenCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#a26b6c',
  },
  resumenTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  resumenRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resumenTexto: {
    fontSize: 16,
    color: '#555',
    flex: 1,
  },
  resumenValor: {
    fontWeight: 'bold',
    color: '#a26b6c',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    paddingLeft: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#a26b6c',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  emptyStateText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#a26b6c',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  cardDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  cardDescription: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  cardDetail: {
    fontSize: 15,
    color: '#34495e',
    marginBottom: 5,
  },
  cardDetailValue: {
    fontWeight: '600',
    color: '#555',
  },
  moneyAmount: {
    color: '#27ae60',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 8,
  },
  statusCompleted: {
    backgroundColor: '#27ae60',
  },
  statusPending: {
    backgroundColor: '#f39c12',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noActivityContainer: {
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  noActivityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#a26b6c',
    marginBottom: 10,
    textAlign: 'center',
  },
  noActivityText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
});