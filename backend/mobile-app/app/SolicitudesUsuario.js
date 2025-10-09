import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import axios from "axios";

const SolicitudesUsuario = ({ usuarioId }) => {
  const [solicitudes, setSolicitudes] = useState([]);

  useEffect(() => {
    axios
      .get(`http://192.168.56.1:3000/solicitudes/usuario/${usuarioId}`)
      .then(res => setSolicitudes(res.data))
      .catch(err => console.error(err));
  }, [usuarioId]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.titulo}>Solicitud de Adopción de {item.mascota}</Text>
      <Text style={styles.estado}>
        {item.estado === "recibido" && "📩 Se recibió tu solicitud"}
        {item.estado === "revisando" && "🔍 Se están revisando tus documentos"}
        {item.estado === "aprobado" && "✅ Tu solicitud fue aceptada"}
        {item.estado === "rechazado" && "❌ Tu solicitud fue rechazada"}
      </Text>
      <Text style={styles.refugio}>Refugio: {item.refugio.nombre}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {solicitudes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aún no has hecho solicitudes de Adopcion</Text>
        </View>
      ) : (
        <FlatList
          data={solicitudes}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  titulo: { fontSize: 16, fontWeight: "bold" },
  estado: { marginTop: 5, fontSize: 14, color: "#555" },
  refugio: { marginTop: 5, fontSize: 13, color: "#999" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
  },
});

export default SolicitudesUsuario;