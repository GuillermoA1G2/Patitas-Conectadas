import React, { useEffect, useState, useMemo } from "react";
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
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');
//const API_BASE_URL = "http://192.168.1.119:3000";
const API_BASE_URL = "https://patitas-conectadas-nine.vercel.app";

// ========================================================================================
// UTILIDADES
// ========================================================================================

const extraerUserId = (params) => {
  console.log('🔍 Extrayendo userId de params:', params);
  if (!params) return null;
  
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

// ========================================================================================
// COMPONENTES
// ========================================================================================

const CustomHeader = ({ appName, screenTitle, onBackPress }) => (
  <View style={headerStyles.header}>
    <TouchableOpacity onPress={onBackPress} style={headerStyles.backButton}>
      <Ionicons name="arrow-back" size={24} color="#FFF" />
    </TouchableOpacity>
    <View style={headerStyles.titleContainer}>
      <Text style={headerStyles.headerAppName}>{appName}</Text>
      <Text style={headerStyles.headerScreenTitle}>{screenTitle}</Text>
    </View>
  </View>
);

// Nuevo componente: Barra de búsqueda
const SearchBar = ({ searchQuery, onSearchChange, onFilterPress }) => (
  <View style={styles.searchContainer}>
    <View style={styles.searchInputContainer}>
      <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por nombre, especie o raza..."
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={onSearchChange}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => onSearchChange('')} style={styles.clearButton}>
          <Ionicons name="close-circle" size={20} color="#999" />
        </TouchableOpacity>
      )}
    </View>
    <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
      <Ionicons name="options" size={24} color="#a26b6c" />
    </TouchableOpacity>
  </View>
);

// Nuevo componente: Modal de filtros
const FilterModal = ({ visible, onClose, filters, onApplyFilters, mascotas }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  // Extraer opciones únicas de las mascotas
  const especies = useMemo(() => {
    const uniqueEspecies = [...new Set(mascotas.map(m => m.especie).filter(Boolean))];
    return uniqueEspecies.sort();
  }, [mascotas]);

  const razas = useMemo(() => {
    const uniqueRazas = [...new Set(mascotas.map(m => m.raza).filter(Boolean))];
    return uniqueRazas.sort();
  }, [mascotas]);

  const edades = useMemo(() => {
    const uniqueEdades = [...new Set(mascotas.map(m => m.edad).filter(Boolean))];
    return uniqueEdades.sort();
  }, [mascotas]);

  const sexos = ['Macho', 'Hembra'];
  const tamanos = ['Pequeño', 'Mediano', 'Grande'];

  const handleFilterChange = (filterType, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? '' : value
    }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters = {
      especie: '',
      raza: '',
      edad: '',
      sexo: '',
      tamano: ''
    };
    setLocalFilters(clearedFilters);
    onApplyFilters(clearedFilters);
  };

  const renderFilterSection = (title, options, filterKey) => (
    <View style={filterStyles.section}>
      <Text style={filterStyles.sectionTitle}>{title}</Text>
      <View style={filterStyles.optionsContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              filterStyles.optionButton,
              localFilters[filterKey] === option && filterStyles.optionButtonActive
            ]}
            onPress={() => handleFilterChange(filterKey, option)}
          >
            <Text style={[
              filterStyles.optionText,
              localFilters[filterKey] === option && filterStyles.optionTextActive
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={filterStyles.modalOverlay}>
        <View style={filterStyles.modalContent}>
          <View style={filterStyles.modalHeader}>
            <Text style={filterStyles.modalTitle}>Filtros</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={filterStyles.scrollView} showsVerticalScrollIndicator={false}>
            {especies.length > 0 && renderFilterSection('Especie', especies, 'especie')}
            {razas.length > 0 && renderFilterSection('Raza', razas, 'raza')}
            {edades.length > 0 && renderFilterSection('Edad', edades, 'edad')}
            {renderFilterSection('Sexo', sexos, 'sexo')}
            {renderFilterSection('Tamaño', tamanos, 'tamano')}
          </ScrollView>

          <View style={filterStyles.buttonContainer}>
            <TouchableOpacity style={filterStyles.clearButton} onPress={handleClear}>
              <Text style={filterStyles.clearButtonText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={filterStyles.applyButton} onPress={handleApply}>
              <Text style={filterStyles.applyButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Componente: Badge de filtros activos
const ActiveFiltersBadge = ({ activeFiltersCount, onPress }) => {
  if (activeFiltersCount === 0) return null;

  return (
    <TouchableOpacity style={styles.filterBadge} onPress={onPress}>
      <Text style={styles.filterBadgeText}>
        {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} activo{activeFiltersCount > 1 ? 's' : ''}
      </Text>
      <Ionicons name="close-circle" size={16} color="#fff" style={{ marginLeft: 5 }} />
    </TouchableOpacity>
  );
};

// ========================================================================================
// COMPONENTE PRINCIPAL
// ========================================================================================

export default function CatalogoMascotasScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = extraerUserId(params);

  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados de búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    especie: '',
    raza: '',
    edad: '',
    sexo: '',
    tamano: ''
  });

  const getBackgroundImage = () => {
    return require('../assets/Fondo.png');
  };

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
      router.replace({
        pathname: 'PerfilUsuario',
        params: { 
          userId: userId,
          id: userId,
          usuarioId: userId,
          idUsuario: userId
        }
      });
    } catch (error) {
      console.error('❌ Error al navegar de regreso:', error);
      router.back();
    }
  };

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
        timeout: 10000
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

  // Función de filtrado y búsqueda optimizada con useMemo
  const mascotasFiltradas = useMemo(() => {
    let resultado = [...mascotas];

    // Aplicar búsqueda por texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      resultado = resultado.filter(mascota => {
        const nombre = mascota.nombre?.toLowerCase() || '';
        const especie = mascota.especie?.toLowerCase() || '';
        const raza = mascota.raza?.toLowerCase() || '';
        
        return nombre.includes(query) || 
               especie.includes(query) || 
               raza.includes(query);
      });
    }

    // Aplicar filtros
    if (filters.especie) {
      resultado = resultado.filter(m => m.especie === filters.especie);
    }
    if (filters.raza) {
      resultado = resultado.filter(m => m.raza === filters.raza);
    }
    if (filters.edad) {
      resultado = resultado.filter(m => m.edad === filters.edad);
    }
    if (filters.sexo) {
      resultado = resultado.filter(m => m.sexo === filters.sexo);
    }
    if (filters.tamano) {
      resultado = resultado.filter(m => m.tamaño === filters.tamano);
    }

    return resultado;
  }, [mascotas, searchQuery, filters]);

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value !== '').length;
  }, [filters]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearAllFilters = () => {
    setFilters({
      especie: '',
      raza: '',
      edad: '',
      sexo: '',
      tamano: ''
    });
    setSearchQuery('');
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
        {searchQuery || activeFiltersCount > 0
          ? 'No se encontraron mascotas con los criterios seleccionados.'
          : 'No hay mascotas disponibles para adopción en este momento.'}
      </Text>
      {(searchQuery || activeFiltersCount > 0) && (
        <TouchableOpacity style={styles.retryButton} onPress={handleClearAllFilters}>
          <Text style={styles.retryButtonText}>Limpiar Búsqueda</Text>
        </TouchableOpacity>
      )}
      {!searchQuery && activeFiltersCount === 0 && (
        <TouchableOpacity style={styles.retryButton} onPress={fetchMascotas}>
          <Text style={styles.retryButtonText}>Actualizar</Text>
        </TouchableOpacity>
      )}
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

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader
          appName="Patitas Conectadas"
          screenTitle="Catálogo de Mascotas"
          onBackPress={handleBackPress}
        />
        {renderLoading()}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <CustomHeader
          appName="Patitas Conectadas"
          screenTitle="Catálogo de Mascotas"
          onBackPress={handleBackPress}
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
      />

      <ImageBackground source={getBackgroundImage()} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.contentOverlay}>
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onFilterPress={() => setShowFilterModal(true)}
          />

          <ActiveFiltersBadge
            activeFiltersCount={activeFiltersCount}
            onPress={handleClearAllFilters}
          />

          <FlatList
            data={mascotasFiltradas}
            keyExtractor={(item) => item.idanimal?.toString() || Math.random().toString()}
            renderItem={renderMascota}
            contentContainerStyle={styles.listContent}
            numColumns={2}
            columnWrapperStyle={mascotasFiltradas.length > 1 ? styles.row : null}
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

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        mascotas={mascotas}
      />
    </View>
  );
}

// ========================================================================================
// ESTILOS
// ========================================================================================

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
});

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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    marginLeft: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a26b6c',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 15,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 10,
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

const filterStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: '#a26b6c',
    borderColor: '#a26b6c',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 10,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#a26b6c',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});