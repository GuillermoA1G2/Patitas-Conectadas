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

const { width } = Dimensions.get('window');

export default function CatalogoMascotasScreen({ navigation }) {
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
      <Image
        source={{ uri: item.imagen }}
        style={styles.cardImage}
        onError={(e) => console.log('Error loading image:', e.nativeEvent.error)}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.nombre}</Text>
        <Text style={styles.cardText}>Especie: {item.especie}</Text>
        <Text style={styles.cardText}>Raza: {item.raza || "Desconocida"}</Text>
        <Text style={styles.cardText}>Edad: {item.edad || "Desconocida"}</Text>
        <Text style={styles.cardText}>Sexo: {item.sexo}</Text>
        <Text style={styles.cardDescription}>{item.descripcion}</Text>

        {item.adoptado ? (
          <Text style={styles.adoptedText}>Ya adoptado</Text>
        ) : (
          <TouchableOpacity
            style={styles.adoptButton}
            onPress={() => navigation.navigate("formulario_adopcion", { mascota: item })}
          >
            <Ionicons name="heart-outline" size={20} color="#fff" style={styles.adoptButtonIcon} />
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
              // Recargar la pantalla o la lógica de fetch
              // navigation.replace('CatalogoMascotas'); // Opción para recargar la pantalla
              // O llamar a la función de carga de nuevo si está disponible globalmente o con useCallback
              // fetchMascotas();
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
      {/* Encabezado similar al de NosotrosScreen */}
      <View style={styles.header}>
        {/* Puedes añadir un botón de retroceso si es necesario */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Catálogo de Mascotas</Text>
      </View>

      <ImageBackground source={getBackgroundImage()} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.contentOverlay}>
          <FlatList
            data={mascotas}
            keyExtractor={(item) => item.idanimal.toString()} // Asegurarse de que la key sea string
            renderItem={renderMascota}
            contentContainerStyle={styles.listContent}
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
  // Estilos de fondo
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // Un overlay más claro para mejor contraste
  },
  // Header styles (copiado y adaptado de NosotrosScreen)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a26b6c', // Color de NosotrosScreen
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
    color: '#333', // Color de texto del encabezado
    flex: 1, // Para que el título ocupe el espacio restante
    textAlign: 'center', // Centrar el título
    marginLeft: -40, // Ajuste para centrar si hay un botón de retroceso
  },
  listContent: {
    paddingVertical: 20, // Padding vertical para el scroll
    paddingHorizontal: 0, // Eliminamos el padding horizontal aquí ya que las tarjetas tienen su propio margen
    alignItems: 'center', // Centrar las tarjetas
  },
  card: {
    backgroundColor: '#FFFFFF', // Fondo blanco para la tarjeta
    borderRadius: 25, // Bordes redondeados
    padding: 20,
    marginHorizontal: 25, // Margen a los lados para que no ocupe todo el ancho
    marginBottom: 20, // Espacio entre tarjetas
    alignItems: 'center',
    elevation: 5, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    width: width * 0.9, // Ocupa el 90% del ancho de la pantalla
  },
  cardImage: {
    width: "100%",
    height: 220,
    borderRadius: 15, // Bordes redondeados para la imagen
    resizeMode: 'cover',
    marginBottom: 15,
  },
  cardContent: {
    width: '100%', // Asegura que el contenido ocupe todo el ancho de la tarjeta
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
    textAlign: 'center', // Centrar el título de la mascota
  },
  cardText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 3,
    textAlign: 'center', // Centrar el texto de la tarjeta
  },
  cardDescription: {
    fontSize: 15,
    color: "#666",
    marginTop: 8,
    lineHeight: 22,
    textAlign: 'center', // Centrar la descripción
    paddingHorizontal: 10, // Pequeño padding para la descripción
  },
  adoptButton: {
    backgroundColor: '#4ECDC4', // Color de NosotrosScreen (Perfil Usuario)
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: 'row', // Para alinear el icono y el texto
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  adoptButtonIcon: {
    marginRight: 8,
  },
  adoptButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  adoptedText: {
    color: "#D32F2F",
    marginTop: 15,
    fontSize: 16,
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
    backgroundColor: "#A55EEA", // Color de NosotrosScreen (Asociaciones)
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