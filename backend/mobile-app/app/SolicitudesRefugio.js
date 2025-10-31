import React, { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams } from 'expo-router';
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
} from "react-native";
import axios from "axios";

const API_BASE_URL = "http://192.168.1.119:3000";
//const API_BASE_URL = "https://patitas-conectadas-dlpdjaiwf-patitas-conectadas-projects.vercel.app";

const SolicitudesRefugio = () => {
  const params = useLocalSearchParams();
  const refugioId = params.refugioId;
  
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

  // Función para cargar las solicitudes
  const cargarSolicitudes = useCallback(async () => {
    if (!refugioId) {
      console.error("No se proporcionó el ID del refugio");
      Alert.alert("Error", "No se proporcionó el ID del refugio");
      setLoading(false);
      return;
    }

    try {
      console.log("Cargando solicitudes para refugio ID:", refugioId);
      setLoading(true);
      
      const response = await axios.get(
        `${API_BASE_URL}/api/solicitudes-adopcion/refugio/${refugioId}`
      );
      
      console.log("Respuesta del servidor:", response.data);
      
      if (response.data.success) {
        setSolicitudes(response.data.solicitudes);
      } else {
        Alert.alert("Error", "No se pudieron cargar las solicitudes");
      }
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);
      console.error("Error details:", error.response?.data);
      
      Alert.alert(
        "Error",
        `No se pudieron cargar las solicitudes: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refugioId]);

  useEffect(() => {
    console.log("Parámetros recibidos en SolicitudesRefugio:", params);
    console.log("refugioId extraído:", refugioId);
    
    if (refugioId) {
      cargarSolicitudes();
    } else {
      console.warn("No se recibió refugioId en los parámetros");
      Alert.alert(
        "Advertencia",
        "No se recibió el ID del refugio. Verifica que estés navegando correctamente desde la pantalla anterior."
      );
      setLoading(false);
    }
  }, [refugioId, cargarSolicitudes]);

  // Función para refrescar
  const onRefresh = () => {
    setRefreshing(true);
    cargarSolicitudes();
  };

  // Función para actualizar el estado de la solicitud
  const actualizarEstado = async (id, nuevoEstado) => {
    try {
      console.log(`Actualizando solicitud ${id} a estado: ${nuevoEstado}`);
      
      const response = await axios.patch(
        `${API_BASE_URL}/api/solicitudes-adopcion/${id}`,
        { estado: nuevoEstado }
      );

      console.log("Respuesta de actualización:", response.data);

      if (response.data.success) {
        // Recargar todas las solicitudes para obtener datos actualizados
        await cargarSolicitudes();

        Alert.alert(
          "Éxito",
          `Solicitud ${nuevoEstado === "aprobada" ? "aprobada" : "rechazada"} correctamente`
        );
        
        setModalVisible(false);
      }
    } catch (error) {
      console.error("Error al actualizar solicitud:", error);
      console.error("Error details:", error.response?.data);
      
      Alert.alert(
        "Error", 
        `No se pudo actualizar el estado: ${error.response?.data?.message || error.message}`
      );
    }
  };

  // Función para confirmar acción
  const confirmarAccion = (id, estado) => {
    const mensaje =
      estado === "aprobada"
        ? "¿Estás seguro de aprobar esta solicitud? El animal será marcado como adoptado."
        : "¿Estás seguro de rechazar esta solicitud?";

    Alert.alert("Confirmar acción", mensaje, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: () => actualizarEstado(id, estado),
        style: estado === "aprobada" ? "default" : "destructive",
      },
    ]);
  };

  // Función para ver detalles
  const verDetalles = (solicitud) => {
    console.log("Ver detalles de solicitud:", solicitud);
    setSolicitudSeleccionada(solicitud);
    setModalVisible(true);
  };

  // Función para obtener el color según el estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case "pendiente":
        return "#FFA500";
      case "aprobada":
        return "#4CAF50";
      case "rechazada":
        return "#F44336";
      default:
        return "#777";
    }
  };

  // Función para obtener el texto del estado
  const getEstadoTexto = (estado) => {
    switch (estado) {
      case "pendiente":
        return "Pendiente";
      case "aprobada":
        return "Aprobada";
      case "rechazada":
        return "Rechazada";
      default:
        return estado;
    }
  };

  // Renderizar cada solicitud
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => verDetalles(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.mascotaInfo}>
          {item.fotos && item.fotos.length > 0 && (
            <Image
              source={{ uri: `${API_BASE_URL}${item.fotos[0]}` }}
              style={styles.mascotaImagen}
            />
          )}
          <View style={styles.mascotaTexto}>
            <Text style={styles.titulo}>🐾 {item.mascota}</Text>
            {item.especie && (
              <Text style={styles.especieText}>
                {item.especie} {item.raza ? `- ${item.raza}` : ''}
              </Text>
            )}
          </View>
        </View>
        <View
          style={[
            styles.estadoBadge,
            { backgroundColor: getEstadoColor(item.estado) },
          ]}
        >
          <Text style={styles.estadoText}>{getEstadoTexto(item.estado)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Solicitante:</Text>
        <Text style={styles.value}>{item.usuario?.nombre || 'No disponible'}</Text>
      </View>

      {item.usuario?.email && (
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{item.usuario.email}</Text>
        </View>
      )}

      {item.usuario?.telefono && (
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Teléfono:</Text>
          <Text style={styles.value}>{item.usuario.telefono}</Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Fecha:</Text>
        <Text style={styles.value}>
          {new Date(item.fechaCreacion).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </Text>
      </View>

      {item.motivo && (
        <View style={styles.motivoContainer}>
          <Text style={styles.label}>Motivo:</Text>
          <Text style={styles.motivoText} numberOfLines={2}>
            {item.motivo}
          </Text>
        </View>
      )}

      {item.estado === "pendiente" && (
        <View style={styles.botones}>
          <TouchableOpacity
            style={[styles.btn, styles.btnAprobar]}
            onPress={() => confirmarAccion(item._id, "aprobada")}
          >
            <Text style={styles.btnText}>✓ Aprobar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnRechazar]}
            onPress={() => confirmarAccion(item._id, "rechazada")}
          >
            <Text style={styles.btnText}>✗ Rechazar</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.btnDetalles}
        onPress={() => verDetalles(item)}
      >
        <Text style={styles.btnDetallesText}>Ver detalles completos →</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Modal de detalles
  const renderModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {solicitudSeleccionada && (
              <>
                <Text style={styles.modalTitulo}>
                  Detalles de la Solicitud
                </Text>

                {/* Información de la mascota */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>🐾 Mascota</Text>
                  {solicitudSeleccionada.fotos && solicitudSeleccionada.fotos.length > 0 && (
                    <ScrollView horizontal style={styles.fotosScroll}>
                      {solicitudSeleccionada.fotos.map((foto, index) => (
                        <Image
                          key={index}
                          source={{ uri: `${API_BASE_URL}${foto}` }}
                          style={styles.fotoModal}
                        />
                      ))}
                    </ScrollView>
                  )}
                  <Text style={styles.modalValue}>
                    {solicitudSeleccionada.mascota}
                    {solicitudSeleccionada.especie && ` (${solicitudSeleccionada.especie})`}
                  </Text>
                  {solicitudSeleccionada.raza && (
                    <Text style={styles.modalSubvalue}>
                      Raza: {solicitudSeleccionada.raza}
                    </Text>
                  )}
                </View>

                {/* Información del solicitante */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>👤 Solicitante</Text>
                  <Text style={styles.modalValue}>
                    {solicitudSeleccionada.usuario?.nombre || 'No disponible'}
                  </Text>
                  {solicitudSeleccionada.usuario?.email && (
                    <Text style={styles.modalSubvalue}>
                      📧 {solicitudSeleccionada.usuario.email}
                    </Text>
                  )}
                  {solicitudSeleccionada.usuario?.telefono && (
                    <Text style={styles.modalSubvalue}>
                      📱 {solicitudSeleccionada.usuario.telefono}
                    </Text>
                  )}
                </View>

                {/* Estado */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Estado</Text>
                  <View
                    style={[
                      styles.estadoBadge,
                      {
                        backgroundColor: getEstadoColor(
                          solicitudSeleccionada.estado
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.estadoText}>
                      {getEstadoTexto(solicitudSeleccionada.estado)}
                    </Text>
                  </View>
                </View>

                {/* Motivo */}
                {solicitudSeleccionada.motivo && (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>💭 Motivo de adopción</Text>
                    <Text style={styles.modalValue}>
                      {solicitudSeleccionada.motivo}
                    </Text>
                  </View>
                )}

                {/* Experiencia previa con mascotas */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>🐶 Experiencia previa</Text>
                  <Text style={styles.modalValue}>
                    ¿Ha adoptado antes?: {solicitudSeleccionada.ha_adoptado_antes === 'si' ? 'Sí' : 'No'}
                  </Text>
                  {solicitudSeleccionada.ha_adoptado_antes === 'si' && (
                    <>
                      <Text style={styles.modalSubvalue}>
                        Cantidad de mascotas anteriores: {solicitudSeleccionada.cantidad_mascotas_anteriores}
                      </Text>
                      {solicitudSeleccionada.fotos_mascotas_anteriores && 
                       solicitudSeleccionada.fotos_mascotas_anteriores.length > 0 && (
                        <>
                          <Text style={styles.modalLabel}>Fotos de mascotas anteriores:</Text>
                          <ScrollView horizontal style={styles.fotosScroll}>
                            {solicitudSeleccionada.fotos_mascotas_anteriores.map((foto, index) => (
                              <Image
                                key={index}
                                source={{ uri: `${API_BASE_URL}${foto}` }}
                                style={styles.fotoModal}
                              />
                            ))}
                          </ScrollView>
                        </>
                      )}
                    </>
                  )}
                </View>

                {/* Información de vivienda */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>🏠 Vivienda</Text>
                  <Text style={styles.modalValue}>
                    Tipo: {solicitudSeleccionada.tipo_vivienda === 'propio' ? 'Propio' : 'Renta'}
                  </Text>
                  {solicitudSeleccionada.tipo_vivienda === 'renta' && (
                    <Text style={styles.modalSubvalue}>
                      Permiso para mascotas: {solicitudSeleccionada.permiso_mascotas_renta === 'si' ? 'Sí' : 'No'}
                    </Text>
                  )}
                  {solicitudSeleccionada.fotos_espacio_mascota && 
                   solicitudSeleccionada.fotos_espacio_mascota.length > 0 && (
                    <>
                      <Text style={styles.modalLabel}>Fotos del espacio:</Text>
                      <ScrollView horizontal style={styles.fotosScroll}>
                        {solicitudSeleccionada.fotos_espacio_mascota.map((foto, index) => (
                          <Image
                            key={index}
                            source={{ uri: `${API_BASE_URL}${foto}` }}
                            style={styles.fotoModal}
                          />
                        ))}
                      </ScrollView>
                    </>
                  )}
                </View>

                {/* Documentos INE */}
                {solicitudSeleccionada.documentoINE && 
                 solicitudSeleccionada.documentoINE.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>📄 Documentos INE</Text>
                    <ScrollView horizontal style={styles.fotosScroll}>
                      {solicitudSeleccionada.documentoINE.map((doc, index) => (
                        <Image
                          key={index}
                          source={{ uri: `${API_BASE_URL}${doc}` }}
                          style={styles.documentoImagen}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Fecha */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>📅 Fecha de solicitud</Text>
                  <Text style={styles.modalValue}>
                    {new Date(
                      solicitudSeleccionada.fechaCreacion
                    ).toLocaleString("es-MX", {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>

                {/* Botones de acción */}
                {solicitudSeleccionada.estado === "pendiente" && (
                  <View style={styles.modalBotones}>
                    <TouchableOpacity
                      style={[styles.btn, styles.btnAprobar]}
                      onPress={() =>
                        confirmarAccion(solicitudSeleccionada._id, "aprobada")
                      }
                    >
                      <Text style={styles.btnText}>✓ Aprobar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btn, styles.btnRechazar]}
                      onPress={() =>
                        confirmarAccion(solicitudSeleccionada._id, "rechazada")
                      }
                    >
                      <Text style={styles.btnText}>✗ Rechazar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.btnCerrar}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.btnCerrarText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Pantalla de carga
  if (loading && solicitudes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Cargando solicitudes...</Text>
        {refugioId && (
          <Text style={styles.debugText}>Refugio ID: {refugioId}</Text>
        )}
      </View>
    );
  }

  // Pantalla vacía
  if (solicitudes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔭</Text>
        <Text style={styles.emptyText}>
          Aún no hay solicitudes de adopción
        </Text>
        <Text style={styles.emptySubtext}>
          Las solicitudes aparecerán aquí cuando los usuarios apliquen para
          adoptar
        </Text>
        {refugioId && (
          <Text style={styles.debugText}>Refugio ID: {refugioId}</Text>
        )}
        <TouchableOpacity style={styles.btnRefresh} onPress={onRefresh}>
          <Text style={styles.btnRefreshText}>🔄 Actualizar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Solicitudes de Adopción</Text>
        <Text style={styles.headerSubtitle}>
          {solicitudes.length} solicitud
          {solicitudes.length !== 1 ? "es" : ""}
        </Text>
      </View>

      <FlatList
        data={solicitudes}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF6B6B"]}
            tintColor="#FF6B6B"
          />
        }
      />

      {renderModal()}
    </View>
  );
};

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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  mascotaInfo: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  mascotaImagen: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
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
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  estadoText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 12,
  },
  infoContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    marginRight: 8,
  },
  value: {
    fontSize: 14,
    color: "#333",
    flex: 1,
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
  botones: {
    flexDirection: "row",
    marginTop: 15,
    justifyContent: "space-between",
  },
  btn: {
    padding: 12,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  btnAprobar: {
    backgroundColor: "#4CAF50",
  },
  btnRechazar: {
    backgroundColor: "#F44336",
  },
  btnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
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
  modalTitulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
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
  },
  documentoImagen: {
    width: 150,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
  },
  modalBotones: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 15,
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

export default SolicitudesRefugio;