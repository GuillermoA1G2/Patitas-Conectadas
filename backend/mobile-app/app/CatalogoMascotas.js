import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Dimensions,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function CatalogoMascotasScreen() {
  const router = useRouter();
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getBackgroundImage = () => {
    return require('../assets/Fondo.png');
  };

  useEffect(() => {
    const fetchMascotas = async () => {
      try {
        const API_BASE_URL = "http://192.168.1.119:3000";
        const response = await fetch(`${API_BASE_URL}/api/animales`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          const mascotasConUrlsCompletas = data.animales.map(animal => ({
            ...animal,
            imagen: animal.fotos && animal.fotos.length > 0
                      ? `${API_BASE_URL}/uploads/${animal.fotos[0]}`
                      : 'https://via.placeholder.com/150?text=No+Image',
          }));
          setMascotas(mascotasConUrlsCompletas);
        } else {
          setError(data.message || "Error al cargar las mascotas.");
        }
      } catch (err) {
        console.error("Error fetching mascotas:", err);
        setError("No se pudieron cargar las mascotas. Inténtalo de nuevo más tarde.");
        Alert.alert("Error", "No se pudieron cargar las mascotas. Por favor, verifica tu conexión o inténtalo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchMascotas();
  }, []);

  const renderMascota = ({ item }) => (
    <View style={styles.card}>
      {/* La imagen del animal como botón */}
      <TouchableOpacity
        onPress={() => router.navigate("perfil_mascota", { mascota: JSON.stringify(item) })}
        style={styles.cardImageContainer}
      >
        <Image
          source={{ uri: item.imagen }}
          style={styles.cardImage}
          onError={(e) => console.log('Error loading image:', e.nativeEvent.error)}
        />
      </TouchableOpacity>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.nombre}</Text>
        {item.adoptado ? (
          <Text style={styles.adoptedText}>Ya adoptado</Text>
        ) : (
          <TouchableOpacity
            style={styles.adoptButton}
            onPress={() => router.navigate("formulario_adopcion", { mascota: JSON.stringify(item) })}
          >
            <Ionicons name="heart-outline" size={20} color="#666" style={styles.adoptButtonIcon} />
            <Text style={styles.adoptButtonText}>Adoptar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <ImageBackground source={getBackgroundImage()} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.contentOverlay}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#a26b6c" />
            <Text style={styles.loadingText}>Cargando mascotas...</Text>
          </View>
        </View>
      </ImageBackground>
    );
  }

  if (error) {
    return (
      <ImageBackground source={getBackgroundImage()} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.contentOverlay}>
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => {
              setLoading(true);
              setError(null);
              // Recargar la pantalla completamente para reintentar la carga
              router.replace('/CatalogoMascotas');
            }}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Flecha para regresar a la pantalla anterior (PerfilUsuario si está en la pila) */}
        <TouchableOpacity onPress={() => router.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Catálogo de Mascotas</Text>
      </View>

      <ImageBackground source={getBackgroundImage()} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.contentOverlay}>
          <FlatList
            data={mascotas}
            keyExtractor={(item) => item.idanimal.toString()}
            renderItem={renderMascota}
            contentContainerStyle={styles.listContent}
            numColumns={2} // Para mostrar dos columnas de tarjetas
            columnWrapperStyle={styles.row}
            ListEmptyComponent={() => (
              <View style={styles.centered}>
                <Text style={styles.emptyListText}>No hay mascotas disponibles para adopción en este momento.</Text>
              </View>
            )}
          />
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a26b6c',
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginLeft: -40,
  },
  listContent: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  row: {
    flex: 1,
    justifyContent: "space-around",
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 10,
    marginHorizontal: 5,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    width: width * 0.45,
    height: 220,
    justifyContent: 'space-between',
  },
  cardImageContainer: {
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: 'cover',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#a26b6c',
  },
  cardContent: {
    width: '100%',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
    textAlign: 'center',
  },
  adoptButton: {
    backgroundColor: '#FFD6EC',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: 'row',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  adoptButtonIcon: {
    marginRight: 5,
  },
  adoptButtonText: {
    color: "#666",
    fontWeight: "bold",
    fontSize: 14,
  },
  adoptedText: {
    color: "#D32F2F",
    marginTop: 10,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginBottom: 20,
  },
  emptyListText: {
    fontSize: 18,
    color: "#777",
    textAlign: "center",
    marginTop: 50,
  },
  retryButton: {
    backgroundColor: "#A55EEA",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});