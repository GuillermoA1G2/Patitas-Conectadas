import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import axios from "axios";

const SolicitudesRefugio = ({ refugioId }) => {
  const [solicitudes, setSolicitudes] = useState([]);

  useEffect(() => {
    axios
      .get(`http://TU_IP:3000/solicitudes/refugio/${refugioId}`)
      .then(res => setSolicitudes(res.data))
      .catch(err => console.error(err));
  }, [refugioId]);

  const actualizarEstado = async (id, estado) => {
    try {
      const res = await axios.patch(`http://TU_IP:3000/solicitudes/${id}`, { estado });
      setSolicitudes(solicitudes.map(s => (s._id === id ? res.data : s)));
    } catch (err) {
      console.error(err);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.titulo}>Solicitud de Adopción para {item.mascota}</Text>
      <Text>De: {item.usuario.nombre}</Text>
      {item.documentoUrl && (
        <Text style={{ color: "blue" }}>📂 Documento: {item.documentoUrl}</Text>
      )}
      <View style={styles.botones}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "green" }]}
          onPress={() => actualizarEstado(item._id, "aprobado")}
        >
          <Text style={styles.btnText}>Aceptar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "red" }]}
          onPress={() => actualizarEstado(item._id, "rechazado")}
        >
          <Text style={styles.btnText}>Rechazar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {solicitudes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>Aún no hay solicitudes</Text>
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
  },
  titulo: { fontSize: 16, fontWeight: "bold" },
  botones: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-between",
  },
  btn: {
    padding: 10,
    borderRadius: 8,
    width: "45%",
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
  },
});

export default SolicitudesRefugio;