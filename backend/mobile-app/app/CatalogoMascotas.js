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
  StatusBar,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');
const API_BASE_URL = "http://192.168.1.119:3000";

// Utilidad para extraer userId de manera consistente
const extraerUserId = (params) => {
  console.log('🔍 Extrayendo userId de params:', params);
  if (!params) return null;
  
  // Verificar diferentes posibles nombres del parámetro
  const posiblesIds = [
    params.userId,
    params.id,
    params.usuarioId,
    params._id,
    params.idUsuario,
    params.user?.id,
    params.usuario?.id
  ];
  
  for (const id of posiblesIds) {
    if (id) {
      console.log('✅ UserId encontrado:', id);
      return id;
    }
  }
  
  console.log('❌ No se encontró userId en params');
  return null;
};

// Componente Header mejorado
const CustomHeader = ({ appName, screenTitle, onBackPress }) => ( // userId eliminado de props
  <View style={headerStyles.header}>
    <TouchableOpacity onPress={onBackPress} style={headerStyles.backButton}>
      <Ionicons name="arrow-back" size={24} color="#FFF" />
    </TouchableOpacity>
    <View style={headerStyles.titleContainer}>
      <Text style={headerStyles.headerAppName}>{appName}</Text>
      <Text style={headerStyles.headerScreenTitle}>{screenTitle}</Text>
    </View>
    {/* El apartado para mostrar userId ha sido eliminado */}
  </View>
);

export default function CatalogoMascotasScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = extraerUserId(params);

  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getBackgroundImage = () => {
    return require('../assets/Fondo.png');
  };

  // Función mejorada para manejar la navegación de regreso
  const handleBackPress = () => {
    console.log("🔙 Back button pressed. Current userId:", userId);
    
    if (!userId) {
      console.warn("⚠️ userId no encontrado. Mostrando alerta al usuario.");
      Alert.alert(
        'Error de sesión',
        'No se pudo identificar la sesión del usuario. Por favor, inicia sesión nuevamente.',
        [
          {
            text: 'Ir al Login',
            onPress: () => router.replace('inicio_sesion')
          },
          {
            text: 'Reintentar',
            onPress: () => router.back()
          }
        ]
      );
      return;
    }

    try {
      // Intentar diferentes rutas posibles para el perfil
      const posiblesRutas = ['PerfilUsuario', 'perfil_usuario', 'perfil'];
      
      // Usar replace en lugar de navigate para evitar acumulación en el stack
      router.replace({
        pathname: 'PerfilUsuario', // Ajusta esto según tu estructura de rutas
        params: { 
          userId: userId,
          // Agregar parámetros adicionales por compatibilidad
          id: userId,
          usuarioId: userId,
          idUsuario: userId
        }
      });
    } catch (error) {
      console.error('❌ Error al navegar de regreso:', error);
      // Fallback: usar router.back()
      router.back();
    }
  };

  // Función mejorada para navegar a perfil de mascota
  const navigateToPerfilMascota = (mascota) => {
    if (!userId) {
      Alert.alert('Error', 'Sesión no válida. Inicia sesión nuevamente.');
      return;
    }

    console.log("🐾 Navigating to perfil_mascota with userId:", userId);
    router.navigate({
      pathname: "perfil_mascota",
      params: {
        mascota: JSON.stringify(mascota),
        userId: userId,
        id: userId,
        usuarioId: userId
      }
    });
  };

  // Función mejorada para navegar a formulario de adopción
  const navigateToFormularioAdopcion = (mascota) => {
    if (!userId) {
      Alert.alert('Error', 'Sesión no válida. Inicia sesión nuevamente.');
      return;
    }

    console.log("📋 Navigating to formulario_adopcion with userId:", userId);
    router.navigate({
      pathname: "formulario_adopcion",
      params: {
        mascota: JSON.stringify(mascota),
        userId: userId,
        id: userId,
        usuarioId: userId
      }
    });
  };

  useEffect(() => {
    console.log("📱 CatalogoMascotasScreen mounted. Received params:", params);
    console.log("👤 Extracted userId:", userId);
    
    if (!userId) {
      console.error('❌ No userId provided');
      setError('No se pudo identificar el usuario. Los datos de sesión son inválidos.');
      setLoading(false);
      return;
    }

    fetchMascotas();
  }, [userId]);

  const fetchMascotas = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching mascotas...');
      const response = await fetch(`${API_BASE_URL}/api/animales`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 segundos timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 API Response:', data);

      if (data.success && Array.isArray(data.animales)) {
        const mascotasConUrlsCompletas = data.animales.map(animal => ({
          ...animal,
          imagen: animal.fotos && animal.fotos.length > 0
                    ? `${API_BASE_URL}${animal.fotos[0]}`
                    : 'https://via.placeholder.com/150?text=No+Image',
        }));
        
        console.log(`✅ ${mascotasConUrlsCompletas.length} mascotas cargadas`);
        setMascotas(mascotasConUrlsCompletas);
      } else {
        throw new Error(data.message || "Formato de respuesta inválido");
      }
    } catch (err) {
      console.error("💥 Error fetching mascotas:", err);
      const errorMessage = err.message.includes('fetch') 
        ? "No se pudo conectar con el servidor. Verifica tu conexión a internet."
        : err.message;
      
      setError(errorMessage);
      
      Alert.alert(
        "Error de conexión", 
        errorMessage + "\n\nVerifica que el servidor esté ejecutándose en " + API_BASE_URL,
        [
          { text: 'Reintentar', onPress: () => fetchMascotas() },
          { text: 'Volver', onPress: () => handleBackPress() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderMascota = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() => navigateToPerfilMascota(item)}
        style={styles.cardImageContainer}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.imagen }}
          style={styles.cardImage}
          onError={(e) => {
            console.log('❌ Error loading image:', e.nativeEvent.error, 'for URL:', item.imagen);
          }}
          onLoadStart={() => console.log('🔄 Loading image for:', item.nombre)}
          onLoadEnd={() => console.log('✅ Image loaded for:', item.nombre)}
        />
      </TouchableOpacity>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.nombre}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {item.especie} • {item.sexo} • {item.edad}
        </Text>
        
        {item.adoptado ? (
          <View style={styles.adoptedContainer}>
            <Ionicons name="checkmark-circle" size={16} color="#28a745" />
            <Text style={styles.adoptedText}>Ya adoptado</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.adoptButton}
            onPress={() => navigateToFormularioAdopcion(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="heart-outline" size={18} color="#666" style={styles.adoptButtonIcon} />
            <Text style={styles.adoptButtonText}>Adoptar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.centered}>
      <Ionicons name="paw-outline" size={64} color="#ccc" />
      <Text style={styles.emptyListText}>
        No hay mascotas disponibles para adopción en este momento.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchMascotas}>
        <Text style={styles.retryButtonText}>Actualizar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = () => (
    <ImageBackground source={getBackgroundImage()} style={styles.backgroundImage} resizeMode="cover">
      <StatusBar barStyle="dark-content" backgroundColor="#a26b6c" />
      <View style={styles.contentOverlay}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color="#dc3545" />
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.errorButtonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={fetchMascotas}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.retryButton, styles.backButton]} onPress={handleBackPress}>
              <Text style={styles.retryButtonText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );

  const renderLoading = () => (
    <ImageBackground source={getBackgroundImage()} style={styles.backgroundImage} resizeMode="cover">
      <StatusBar barStyle="dark-content" backgroundColor="#a26b6c" />
      <View style={styles.contentOverlay}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#a26b6c" />
          <Text style={styles.loadingText}>Cargando mascotas...</Text>
          <Text style={styles.loadingSubtext}>Conectando con {API_BASE_URL}</Text>
        </View>
      </View>
    </ImageBackground>
  );

  // Componente de carga
  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader
          appName="Patitas Conectadas"
          screenTitle="Catálogo de Mascotas"
          onBackPress={handleBackPress}
          // userId={userId} // userId ya no se pasa al CustomHeader
        />
        {renderLoading()}
      </View>
    );
  }

  // Componente de error
  if (error) {
    return (
      <View style={styles.container}>
        <CustomHeader
          appName="Patitas Conectadas"
          screenTitle="Catálogo de Mascotas"
          onBackPress={handleBackPress}
          // userId={userId} // userId ya no se pasa al CustomHeader
        />
        {renderError()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />

      <CustomHeader
        appName="Patitas Conectadas"
        screenTitle="Catálogo de Mascotas"
        onBackPress={handleBackPress}
        // userId={userId} // userId ya no se pasa al CustomHeader
      />

      <ImageBackground source={getBackgroundImage()} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.contentOverlay}>
          <FlatList
            data={mascotas}
            keyExtractor={(item) => item.idanimal?.toString() || Math.random().toString()}
            renderItem={renderMascota}
            contentContainerStyle={styles.listContent}
            numColumns={2}
            columnWrapperStyle={mascotas.length > 1 ? styles.row : null}
            ListEmptyComponent={renderEmptyList}
            onRefresh={fetchMascotas}
            refreshing={loading}
            showsVerticalScrollIndicator={false}
            getItemLayout={(data, index) => (
              { length: 240, offset: 240 * index, index }
            )}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        </View>
      </ImageBackground>
    </View>
  );
}

// Estilos del encabezado
const headerStyles = StyleSheet.create({
  header: {
    backgroundColor: '#a26b6c',
    paddingTop: 40,
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
    padding: 5,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerAppName: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 2,
  },
  headerScreenTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // debugContainer y debugText han sido eliminados
});

// Estilos principales
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  listContent: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    flexGrow: 1,
  },
  row: {
    flex: 1,
    justifyContent: "space-around",
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 12,
    marginHorizontal: 5,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: width * 0.45,
    minHeight: 240,
    justifyContent: 'space-between',
  },
  cardImageContainer: {
    marginBottom: 8,
  },
  cardImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    resizeMode: 'cover',
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
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
    textAlign: 'center',
    lineHeight: 20,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  adoptButton: {
    backgroundColor: '#FFD6EC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: 'row',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 80,
  },
  adoptButtonIcon: {
    marginRight: 4,
  },
  adoptButtonText: {
    color: "#666",
    fontWeight: "bold",
    fontSize: 12,
  },
  adoptedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  adoptedText: {
    color: "#28a745",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#555",
    fontWeight: '500',
  },
  loadingSubtext: {
    marginTop: 5,
    fontSize: 12,
    color: "#777",
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
    marginVertical: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  emptyListText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginVertical: 15,
    lineHeight: 22,
  },
  errorButtonContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: "#a26b6c",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
    elevation: 2,
  },
  backButton: {
    backgroundColor: "#6c757d",
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});