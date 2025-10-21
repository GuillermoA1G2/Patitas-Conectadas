import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function PerfilAnimal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [mascota, setMascota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  
  // useRef para evitar ejecutar el efecto múltiples veces
  const hasLoadedRef = useRef(false);

  const API_BASE_URL = "http://192.168.1.119:3000";
  //const API_BASE_URL = "hhttps://patitas-conectadas-dlpdjaiwf-patitas-conectadas-projects.vercel.app/api0";

  useEffect(() => {
    // Si ya se cargó, no ejecutar de nuevo
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadMascotaAndUser = async () => {
      try {
        console.log("Parámetros recibidos en PerfilAnimal:", params);

        // Obtener userId
        let currentUserId = params.userId || null;
        if (!currentUserId) {
          const storedUserId = await AsyncStorage.getItem('userId');
          if (storedUserId) {
            currentUserId = storedUserId;
            console.log("ID de Usuario cargado desde AsyncStorage:", storedUserId);
          } else {
            console.warn("No se encontró userId");
          }
        } else {
          console.log("ID de Usuario obtenido de parámetros:", currentUserId);
        }
        setUserId(currentUserId);

        // Obtener mascota
        if (params.mascota) {
          try {
            const parsedMascota = JSON.parse(params.mascota);
            setMascota(parsedMascota);
            console.log("Mascota parseada:", parsedMascota);
          } catch (parseError) {
            console.error("Error al parsear mascota:", parseError);
            Alert.alert("Error", "No se pudo procesar la información de la mascota.");
            router.back();
          }
        } else {
          Alert.alert("Error", "No se recibió información de la mascota.");
          router.back();
        }
      } catch (e) {
        console.error("Error al cargar datos:", e);
        Alert.alert("Error", "No se pudo cargar la información de la mascota.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadMascotaAndUser();
  }, []); // Dependencia vacía - ejecutar solo una vez

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a26b6c" />
        <Text style={styles.loadingText}>Cargando perfil de mascota...</Text>
      </View>
    );
  }

  if (!mascota) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No se pudo cargar la información de la mascota.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Volver al Catálogo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imageUrl = mascota.fotos && mascota.fotos.length > 0
                   ? `${API_BASE_URL}${mascota.fotos[0]}`
                   : 'https://via.placeholder.com/150?text=No+Image';

  const handleAdoptarPress = () => {
    if (!userId) {
      Alert.alert(
        "Error de Sesión",
        "Para adoptar, necesitas iniciar sesión. Serás redirigido a la pantalla de inicio de sesión.",
        [{ text: "OK", onPress: () => router.replace("inicio_sesion") }]
      );
      return;
    }
    router.navigate({
      pathname: "formulario_adopcion",
      params: {
        mascota: JSON.stringify(mascota),
        userId: userId
      }
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil de {mascota.nombre}</Text>
        <View style={{ width: 28 }} />
      </View>

      <Image
        source={{ uri: imageUrl }}
        style={styles.fotoAnimal}
        onError={(e) => console.error("Error al cargar imagen:", e.nativeEvent.error)}
      />

      <View style={styles.infoContainer}>
        <Text style={styles.nombre}>{mascota.nombre}</Text>
        <View style={styles.datosBox}>
          <Text style={styles.label}>Edad: <Text style={styles.valor}>{mascota.edad || 'No especificado'}</Text></Text>
        </View>
        <View style={styles.datosBox}>
          <Text style={styles.label}>Raza: <Text style={styles.valor}>{mascota.raza || 'Mestiza'}</Text></Text>
        </View>
        <View style={styles.datosBox}>
          <Text style={styles.label}>Tamaño: <Text style={styles.valor}>{mascota.tamaño || 'No especificado'}</Text></Text>
        </View>
        <View style={styles.datosBox}>
          <Text style={styles.label}>Género: <Text style={styles.valor}>{mascota.sexo || 'No especificado'}</Text></Text>
        </View>
        <View style={styles.datosBox}>
          <Text style={styles.label}>Esterilizada: <Text style={styles.valor}>{mascota.esterilizacion ? 'Sí' : 'No'}</Text></Text>
        </View>
        <View style={styles.datosBox}>
          <Text style={styles.label}>Refugio: <Text style={styles.valor}>{mascota.refugio_nombre || 'Desconocido'}</Text></Text>
        </View>
      </View>

      <View style={styles.descripcionContainer}>
        <Text style={styles.tituloSeccion}>Descripción</Text>
        <Text style={styles.descripcion}>
          {mascota.descripcion || 'No hay descripción disponible para esta mascota.'}
        </Text>
      </View>

      {mascota.adoptado ? (
        <View style={styles.adoptedButton}>
          <Text style={styles.adoptedButtonText}>¡Ya fue adoptado!</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.botonAdoptar} onPress={handleAdoptarPress}>
          <Ionicons name="heart-outline" size={20} color="#fff" style={styles.adoptButtonIcon} />
          <Text style={styles.textoBoton}>Adoptar</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#a26b6c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#a26b6c',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fotoAnimal: {
    width: '100%',
    height: 250,
    borderRadius: 15,
    marginBottom: 20,
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  infoContainer: {
    marginBottom: 20,
  },
  nombre: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  datosBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
  },
  valor: {
    fontWeight: 'normal',
    color: '#555',
  },
  descripcionContainer: {
    marginBottom: 30,
    backgroundColor: '#fff7f9',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffccd5',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tituloSeccion: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  descripcion: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  botonAdoptar: {
    backgroundColor: '#339c23',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  adoptButtonIcon: {
    marginRight: 10,
  },
  textoBoton: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  adoptedButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  adoptedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});