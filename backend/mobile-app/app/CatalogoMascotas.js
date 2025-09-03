import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity } from "react-native";

export default function CatalogoMascotasScreen({ navigation }) {
  const [mascotas, setMascotas] = useState([]);

  useEffect(() => {
    fetch("http://10.0.2.2:5000/mascotas") 
      .then((res) => res.json())
      .then((data) => setMascotas(data))
      .catch((error) => console.error(error));
  }, []);

  const renderMascota = ({ item }) => (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
      }}
    >
      <Image
        source={{ uri: item.imagen }}
        style={{ width: "100%", height: 200, borderRadius: 12 }}
      />
      <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 10 }}>
        {item.nombre}
      </Text>
      <Text>Edad: {item.edad}</Text>
      <Text>Raza: {item.raza}</Text>
      <Text style={{ marginTop: 5 }}>{item.descripcion}</Text>

      {item.disponible ? (
        <TouchableOpacity
          style={{
            backgroundColor: "#4CAF50",
            padding: 10,
            borderRadius: 8,
            marginTop: 10,
            alignItems: "center",
          }}
          onPress={() => navigation.navigate("DetalleMascota", { mascota: item })}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Adoptar</Text>
        </TouchableOpacity>
      ) : (
        <Text style={{ color: "red", marginTop: 10 }}>Ya adoptado</Text>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#F5F5F5" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Catálogo de Mascotas
      </Text>
      <FlatList
        data={mascotas}
        keyExtractor={(item) => item._id}
        renderItem={renderMascota}
      />
    </View>
  );
}