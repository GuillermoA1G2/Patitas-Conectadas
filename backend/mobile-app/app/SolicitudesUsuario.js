import React, { useEffect, useState, useCallback } from "react";
import { useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
  Image,
  SafeAreaView,
  StatusBar,
} from "react-native";
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';

//const API_BASE_URL = "http://192.168.1.119:3000";
const API_BASE_URL = "https://patitas-conectadas-nine.vercel.app";
const API_ENDPOINT = `${API_BASE_URL}/api/solicitudes-adopcion`;

// ==========================================
// UTILIDADES
// ==========================================

const UtilsExtraccion = {
  extraerIdUsuario: (params) => {
    if (!params) {
      console.warn('No hay parámetros disponibles');
      return null;
    }

    console.log('Intentando extraer userId de params:', JSON.stringify(params, null, 2));

    // Intentar múltiples formas de extraer el ID
    const posiblesIds = [
      params.userId,
      params.usuarioId,
      params.id,
      params._id,
      params.idUsuario,
      params.usuario?.id,
      params.usuario?.userId,
      params.usuario?.usuarioId,
      params.usuario?._id,
      params.user?.id,
      params.user?.userId,
      params.user?.usuarioId,
      params.user?._id,
    ];

    for (const id of posiblesIds) {
      if (id && String(id).trim() !== '') {
        console.log('userId encontrado:', id, 'tipo:', typeof id);
        return String(id).trim();
      }
    }

    console.warn('No se encontró userId en params');
    return null;
  },

  getImageUrl: (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    if (imagePath.startsWith('/uploads/')) {
      return `${API_BASE_URL}${imagePath}`;
    }

    return `${API_BASE_URL}/uploads/${imagePath}`;
  },

  getEstadoColor: (estado) => {
    const colores = {
      pendiente: "#FFA500",
      aprobada: "#4CAF50",
      rechazada: "#F44336",
    };
    return colores[estado] || "#777";
  },

  getEstadoIcono: (estado) => {
    const iconos = {
      pendiente: "⏳",
      aprobada: "✅",
      rechazada: "❌",
    };
    return iconos[estado] || "📋";
  },

  getEstadoTexto: (estado) => {
    const textos = {
      pendiente: "En revisión",
      aprobada: "Aprobada",
      rechazada: "Rechazada",
    };
    return textos[estado] || estado;
  },

  getEstadoMensaje: (estado) => {
    const mensajes = {
      pendiente: "Tu solicitud está siendo revisada por el refugio",
      aprobada: "¡Felicidades! Tu solicitud fue aprobada. Pronto te contactarán",
      rechazada: "Lamentablemente tu solicitud no fue aprobada en esta ocasión",
    };
    return mensajes[estado] || "";
  },
};

// ==========================================
// SERVICIO DE API
// ==========================================

class SolicitudesService {
  static async cargarSolicitudes(usuarioId, timeout = 15000) {
    try {
      if (!usuarioId || String(usuarioId).trim() === '') {
        throw new Error('ID de usuario inválido o vacío');
      }

      console.log('Realizando petición a:', `${API_ENDPOINT}/usuario/${usuarioId}`);

      const response = await axios.get(
        `${API_ENDPOINT}/usuario/${usuarioId}`,
        {
          timeout,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('Respuesta del servidor:', response.data);

      if (response.data && response.data.success) {
        return {
          exito: true,
          solicitudes: response.data.solicitudes || [],
          mensaje: response.data.message
        };
      } else {
        throw new Error(response.data?.message || 'Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('Error en cargarSolicitudes:', error);
      return {
        exito: false,
        solicitudes: [],
        error: this.manejarErrorAPI(error)
      };
    }
  }

  static manejarErrorAPI(error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message;

      console.log('Error de respuesta:', status, message);

      switch (status) {
        case 401:
          return {
            mensaje: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
            esErrorSesion: true
          };
        case 404:
          return {
            mensaje: 'No se encontraron solicitudes para este usuario.',
            esErrorSesion: false
          };
        case 400:
          return {
            mensaje: message || 'Datos inválidos. Verifica la información.',
            esErrorSesion: false
          };
        case 500:
          return {
            mensaje: 'Error del servidor. Intenta más tarde.' + (message ? ` (${message})` : ''),
            esErrorSesion: false
          };
        default:
          return {
            mensaje: message || `Error del servidor (${status})`,
            esErrorSesion: false
          };
      }
    } else if (error.request) {
      console.log('Error de conexión:', error.request);
      return {
        mensaje: `No se pudo conectar con el servidor. Verifica tu conexión a internet y que el servidor esté ejecutándose en ${API_BASE_URL}`,
        esErrorSesion: false
      };
    } else {
      console.log('Error de configuración:', error.message);
      return {
        mensaje: error.message || 'Error inesperado',
        esErrorSesion: false
      };
    }
  }
}

// ==========================================
// COMPONENTES
// ==========================================

const SolicitudCard = ({ item, onPress }) => {
  const primeraFoto = item.fotos && item.fotos.length > 0 ? item.fotos[0] : null;
  const nombreMascota = item.mascota || "Mascota sin nombre";
  const nombreRefugio = item.refugio?.nombre || "No disponible";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.mascotaInfo}>
          {primeraFoto ? (
            <Image
              source={{ uri: UtilsExtraccion.getImageUrl(primeraFoto) }}
              style={styles.mascotaImagen}
              onError={(e) => console.log("Error cargando imagen:", e.nativeEvent.error)}
            />
          ) : (
            <View style={[styles.mascotaImagen, styles.placeholderImagen]}>
              <Text style={styles.placeholderText}>🐾</Text>
            </View>
          )}
          <View style={styles.mascotaTexto}>
            <Text style={styles.titulo}>🐾 {nombreMascota}</Text>
            {item.especie && (
              <Text style={styles.especieText}>
                {item.especie} {item.raza ? `- ${item.raza}` : ""}
              </Text>
            )}
            <Text style={styles.refugioText}>🏠 {nombreRefugio}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.estadoContainer}>
        <View
          style={[
            styles.estadoBadge,
            { backgroundColor: UtilsExtraccion.getEstadoColor(item.estado) },
          ]}
        >
          <Text style={styles.estadoIcono}>{UtilsExtraccion.getEstadoIcono(item.estado)}</Text>
          <Text style={styles.estadoText}>{UtilsExtraccion.getEstadoTexto(item.estado)}</Text>
        </View>
        <Text style={styles.estadoMensaje}>
          {UtilsExtraccion.getEstadoMensaje(item.estado)}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoContainer}>
        <Text style={styles.label}>📅 Fecha de solicitud:</Text>
        <Text style={styles.value}>
          {new Date(item.fechaCreacion).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </Text>
      </View>

      {item.refugio?.telefono && (
        <View style={styles.infoContainer}>
          <Text style={styles.label}>📱 Teléfono del refugio:</Text>
          <Text style={styles.value}>{item.refugio.telefono}</Text>
        </View>
      )}

      {item.motivo && (
        <View style={styles.motivoContainer}>
          <Text style={styles.label}>💭 Tu motivo de adopción:</Text>
          <Text style={styles.motivoText} numberOfLines={2}>
            {item.motivo}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.btnDetalles} onPress={onPress}>
        <Text style={styles.btnDetallesText}>Ver detalles completos →</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const DetallesModal = ({ visible, solicitud, onClose }) => {
  if (!solicitud) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Detalles de tu Solicitud</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalEstadoContainer}>
              <View
                style={[
                  styles.estadoBadgeLarge,
                  {
                    backgroundColor: UtilsExtraccion.getEstadoColor(solicitud.estado),
                  },
                ]}
              >
                <Text style={styles.estadoIconoLarge}>
                  {UtilsExtraccion.getEstadoIcono(solicitud.estado)}
                </Text>
                <Text style={styles.estadoTextLarge}>
                  {UtilsExtraccion.getEstadoTexto(solicitud.estado)}
                </Text>
              </View>
              <Text style={styles.estadoMensajeLarge}>
                {UtilsExtraccion.getEstadoMensaje(solicitud.estado)}
              </Text>
            </View>

            {/* Mascota */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>🐾 Mascota</Text>
              {solicitud.fotos && solicitud.fotos.length > 0 && (
                <ScrollView
                  horizontal
                  style={styles.fotosScroll}
                  showsHorizontalScrollIndicator={false}
                >
                  {solicitud.fotos.map((foto, index) => (
                    <Image
                      key={index}
                      source={{ uri: UtilsExtraccion.getImageUrl(foto) }}
                      style={styles.fotoModal}
                      onError={(e) =>
                        console.log("Error cargando foto modal:", e.nativeEvent.error)
                      }
                    />
                  ))}
                </ScrollView>
              )}
              <Text style={styles.modalValue}>
                {solicitud.mascota || "Sin nombre"}
                {solicitud.especie && ` (${solicitud.especie})`}
              </Text>
              {solicitud.raza && (
                <Text style={styles.modalSubvalue}>
                  Raza: {solicitud.raza}
                </Text>
              )}
            </View>

            {/* Refugio */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>🏠 Refugio</Text>
              <Text style={styles.modalValue}>
                {solicitud.refugio?.nombre || "No disponible"}
              </Text>
              {solicitud.refugio?.email && (
                <Text style={styles.modalSubvalue}>
                  📧 {solicitud.refugio.email}
                </Text>
              )}
              {solicitud.refugio?.telefono && (
                <Text style={styles.modalSubvalue}>
                  📱 {solicitud.refugio.telefono}
                </Text>
              )}
            </View>

            {/* Motivo */}
            {solicitud.motivo && (
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>💭 Tu motivo de adopción</Text>
                <Text style={styles.modalValue}>
                  {solicitud.motivo}
                </Text>
              </View>
            )}

            {/* Experiencia previa */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>🐶 Tu experiencia previa</Text>
              <Text style={styles.modalValue}>
                ¿Has adoptado antes?: {solicitud.ha_adoptado_antes === "si" ? "Sí" : "No"}
              </Text>
              {solicitud.ha_adoptado_antes === "si" && (
                <>
                  <Text style={styles.modalSubvalue}>
                    Cantidad de mascotas anteriores: {solicitud.cantidad_mascotas_anteriores || 0}
                  </Text>
                  {solicitud.fotos_mascotas_anteriores &&
                    solicitud.fotos_mascotas_anteriores.length > 0 && (
                      <>
                        <Text style={styles.modalLabel}>
                          Fotos de tus mascotas anteriores:
                        </Text>
                        <ScrollView
                          horizontal
                          style={styles.fotosScroll}
                          showsHorizontalScrollIndicator={false}
                        >
                          {solicitud.fotos_mascotas_anteriores.map((foto, index) => (
                            <Image
                              key={index}
                              source={{ uri: UtilsExtraccion.getImageUrl(foto) }}
                              style={styles.fotoModal}
                              onError={(e) =>
                                console.log("Error cargando foto mascota anterior:", e)
                              }
                            />
                          ))}
                        </ScrollView>
                      </>
                    )}
                </>
              )}
            </View>

            {/* Vivienda */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>🏡 Tu vivienda</Text>
              <Text style={styles.modalValue}>
                Tipo: {solicitud.tipo_vivienda === "propio" ? "Propio" : "Renta"}
              </Text>
              {solicitud.tipo_vivienda === "renta" && (
                <Text style={styles.modalSubvalue}>
                  Permiso para mascotas: {solicitud.permiso_mascotas_renta === "si" ? "Sí" : "No"}
                </Text>
              )}
              {solicitud.fotos_espacio_mascota &&
                solicitud.fotos_espacio_mascota.length > 0 && (
                  <>
                    <Text style={styles.modalLabel}>
                      Fotos del espacio para la mascota:
                    </Text>
                    <ScrollView
                      horizontal
                      style={styles.fotosScroll}
                      showsHorizontalScrollIndicator={false}
                    >
                      {solicitud.fotos_espacio_mascota.map((foto, index) => (
                        <Image
                          key={index}
                          source={{ uri: UtilsExtraccion.getImageUrl(foto) }}
                          style={styles.fotoModal}
                          onError={(e) =>
                            console.log("Error cargando foto espacio:", e)
                          }
                        />
                      ))}
                    </ScrollView>
                  </>
                )}
            </View>

            {/* Documentos */}
            {solicitud.documentoINE && solicitud.documentoINE.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>📄 Tus documentos INE</Text>
                <ScrollView
                  horizontal
                  style={styles.fotosScroll}
                  showsHorizontalScrollIndicator={false}
                >
                  {solicitud.documentoINE.map((doc, index) => (
                    <Image
                      key={index}
                      source={{ uri: UtilsExtraccion.getImageUrl(doc) }}
                      style={styles.documentoImagen}
                      onError={(e) =>
                        console.log("Error cargando documento INE:", e)
                      }
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Fecha */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>📅 Fecha de solicitud</Text>
              <Text style={styles.modalValue}>
                {new Date(solicitud.fechaCreacion).toLocaleString(
                  "es-MX",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </Text>
            </View>

            {/* Info box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>ℹ️ Información</Text>
              {solicitud.estado === "pendiente" && (
                <Text style={styles.infoBoxText}>
                  El refugio revisará tu solicitud y te contactará pronto. Mantén tu teléfono disponible.
                </Text>
              )}
              {solicitud.estado === "aprobada" && (
                <Text style={styles.infoBoxText}>
                  ¡Felicidades! El refugio aprobó tu solicitud. Pronto te contactarán para coordinar la entrega de tu nueva mascota.
                </Text>
              )}
              {solicitud.estado === "rechazada" && (
                <Text style={styles.infoBoxText}>
                  No te desanimes, puedes aplicar para otras mascotas. Cada refugio tiene diferentes requisitos.
                </Text>
              )}
            </View>

            <View style={styles.modalSpacer} />
          </ScrollView>

          <TouchableOpacity
            style={styles.btnCerrar}
            onPress={onClose}
          >
            <Text style={styles.btnCerrarText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function SolicitudesUsuario() {
  const route = useRoute();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [usuarioId, setUsuarioId] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);

  // Extraer usuarioId de route.params
  useEffect(() => {
    console.log('=== SolicitudesUsuario montado ===');
    console.log('Parámetros de route:', JSON.stringify(route.params, null, 2));

    const idExtraido = UtilsExtraccion.extraerIdUsuario(route.params);
    
    if (idExtraido) {
      console.log('✓ usuarioId extraído exitosamente:', idExtraido);
      setUsuarioId(idExtraido);
      setErrorCarga(null);
    } else {
      console.error('✗ No se pudo extraer el usuarioId');
      setErrorCarga('No se encontró el ID del usuario. Por favor, intenta navegar desde la pantalla anterior.');
      setLoading(false);
    }
  }, [route.params]);

  // Cargar solicitudes cuando se tiene el usuarioId
  useEffect(() => {
    if (usuarioId) {
      cargarSolicitudes();
    }
  }, [usuarioId]);

  const cargarSolicitudes = useCallback(async () => {
    try {
      setLoading(true);
      setErrorCarga(null);

      console.log('📋 Cargando solicitudes para usuario:', usuarioId);

      const resultado = await SolicitudesService.cargarSolicitudes(usuarioId);

      if (resultado.exito) {
        console.log('✓ Solicitudes cargadas exitosamente:', resultado.solicitudes.length);
        setSolicitudes(resultado.solicitudes);
      } else {
        console.error('✗ Error al cargar solicitudes:', resultado.error);
        setErrorCarga(resultado.error.mensaje);

        if (resultado.error.esErrorSesion) {
          // Aquí podrías redirigir al login
          Alert.alert(
            'Error de Sesión',
            resultado.error.mensaje,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', resultado.error.mensaje);
        }
      }
    } catch (error) {
      console.error('Error inesperado en cargarSolicitudes:', error);
      setErrorCarga('Error inesperado al cargar las solicitudes');
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [usuarioId]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarSolicitudes();
  };

  const verDetalles = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setModalVisible(true);
  };

  // Pantalla de carga inicial
  if (loading && solicitudes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Cargando tus solicitudes...</Text>
          {usuarioId && <Text style={styles.debugText}>ID: {usuarioId}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  // Pantalla de error
  if (errorCarga && solicitudes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{errorCarga}</Text>
          <TouchableOpacity style={styles.btnRefresh} onPress={cargarSolicitudes}>
            <Text style={styles.btnRefreshText}>🔄 Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Pantalla vacía
  if (solicitudes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mis Solicitudes de Adopción</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>
            Aún no has hecho solicitudes de adopción
          </Text>
          <Text style={styles.emptySubtext}>
            Cuando apliques para adoptar una mascota, tus solicitudes aparecerán aquí
          </Text>
          <TouchableOpacity style={styles.btnRefresh} onPress={onRefresh}>
            <Text style={styles.btnRefreshText}>🔄 Actualizar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Pantalla principal
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Solicitudes de Adopción</Text>
        <Text style={styles.headerSubtitle}>
          {solicitudes.length} solicitud{solicitudes.length !== 1 ? "es" : ""}
        </Text>
      </View>

      <FlatList
        data={solicitudes}
        keyExtractor={(item) => item._id || Math.random().toString()}
        renderItem={({ item }) => (
          <SolicitudCard
            item={item}
            onPress={() => verDetalles(item)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF6B6B"]}
            tintColor="#FF6B6B"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay solicitudes disponibles</Text>
          </View>
        }
      />

      <DetallesModal
        visible={modalVisible}
        solicitud={solicitudSeleccionada}
        onClose={() => setModalVisible(false)}
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
    backgroundColor: "#F5F5F5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#A4645E",
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#FFF",
    marginTop: 5,
    opacity: 0.9,
  },
  listContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  mascotaInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  mascotaImagen: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
    backgroundColor: "#E0E0E0",
  },
  placeholderImagen: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 28,
  },
  mascotaTexto: {
    flex: 1,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  especieText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  refugioText: {
    fontSize: 13,
    color: "#999",
    marginTop: 4,
  },
  estadoContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  estadoBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  estadoIcono: {
    fontSize: 18,
    marginRight: 8,
  },
  estadoText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  estadoMensaje: {
    fontSize: 13,
    color: "#555",
    textAlign: "center",
    paddingHorizontal: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 12,
  },
  infoContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: "#333",
  },
  motivoContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
  },
  motivoText: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  btnDetalles: {
    marginTop: 10,
    alignItems: "center",
    paddingVertical: 8,
  },
  btnDetallesText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  debugText: {
    marginTop: 10,
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#F5F5F5",
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  btnRefresh: {
    marginTop: 20,
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnRefreshText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  // Estilos del Modal
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  modalEstadoContainer: {
    alignItems: "center",
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
  },
  estadoBadgeLarge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  estadoIconoLarge: {
    fontSize: 24,
    marginRight: 10,
  },
  estadoTextLarge: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  estadoMensajeLarge: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginTop: 5,
  },
  modalSection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginBottom: 10,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 5,
    marginTop: 10,
  },
  modalValue: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
    lineHeight: 22,
  },
  modalSubvalue: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  fotosScroll: {
    marginTop: 10,
    marginBottom: 10,
  },
  fotoModal: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: "#E0E0E0",
  },
  documentoImagen: {
    width: 150,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: "#E0E0E0",
  },
  infoBox: {
    backgroundColor: "#E3F2FD",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  infoBoxTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 14,
    color: "#424242",
    lineHeight: 20,
  },
  modalSpacer: {
    height: 20,
  },
  btnCerrar: {
    marginTop: 10,
    backgroundColor: "#777",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  btnCerrarText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});