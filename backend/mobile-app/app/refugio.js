import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

export default function PantallaRefugio() {
  const {
    refugioId,
    refugioNombre,
    refugioEmail,
    refugioTelefono,
    usuarioTipo
  } = useLocalSearchParams();

  const [insumosPendientes, setInsumosPendientes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const cargarDatos = async () => {
    try {
      // Cargar insumos pendientes
      const responseInsumos = await axios.get(`http://192.168.1.119:3000/api/refugio/${refugioId}/insumos-pendientes`);
      setInsumosPendientes(responseInsumos.data.insumosPendientes || []);

      // Aquí podrías agregar más llamadas para estadísticas del refugio
      // Por ejemplo: número de animales, donaciones recibidas, etc.
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del refugio');
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  const marcarInsumoCompletado = async (idInsumo) => {
    try {
      Alert.alert(
        'Confirmar',
        '¿Marcar este insumo como recibido?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sí, confirmar',
            onPress: async () => {
              const response = await axios.put(`http://192.168.1.119:3000/api/insumos/${idInsumo}/completar`, {
                id_refugio: refugioId
              });

              if (response.data) {
                Alert.alert('Éxito', 'Insumo marcado como recibido');
                cargarDatos(); // Recargar datos
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error al marcar insumo:', error);
      Alert.alert('Error', 'No se pudo actualizar el insumo');
    }
  };

  const cerrarSesion = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, cerrar sesión',
          onPress: () => {
            router.replace('/inicio_sesion');
          }
        }
      ]
    );
  };

  if (cargando) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0066ff" />
        <Text style={styles.cargandoTexto}>Cargando datos del refugio...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.bienvenidaTexto}>¡Hola, {refugioNombre}!</Text>
        <Text style={styles.tipoUsuario}>Panel de Refugio</Text>
        <TouchableOpacity style={styles.cerrarSesionBtn} onPress={cerrarSesion}>
          <Text style={styles.cerrarSesionTexto}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Información del refugio */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Información del Refugio</Text>
        <Text style={styles.infoTexto}>📧 {refugioEmail}</Text>
        {refugioTelefono && <Text style={styles.infoTexto}>📱 {refugioTelefono}</Text>}
        <Text style={styles.infoTexto}>🆔 ID: {refugioId}</Text>
      </View>

      {/* Estadísticas rápidas */}
      <View style={styles.estadisticasContainer}>
        <View style={styles.estadisticaCard}>
          <Text style={styles.estadisticaNumero}>{insumosPendientes.length}</Text>
          <Text style={styles.estadisticaTexto}>Insumos Pendientes</Text>
        </View>
        <View style={styles.estadisticaCard}>
          <Text style={styles.estadisticaNumero}>0</Text>
          <Text style={styles.estadisticaTexto}>Animales Registrados</Text>
        </View>
      </View>

      {/* Menú de acciones */}
      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            // Navegar a pantalla de gestión de animales
            Alert.alert('Próximamente', 'Función en desarrollo');
          }}
        >
          <Text style={styles.menuIcon}>🐕</Text>
          <Text style={styles.menuTexto}>Gestionar Animales</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            // Navegar a pantalla de donaciones recibidas
            Alert.alert('Próximamente', 'Función en desarrollo');
          }}
        >
          <Text style={styles.menuIcon}>💰</Text>
          <Text style={styles.menuTexto}>Donaciones Recibidas</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            // Navegar a pantalla de solicitudes de adopción
            Alert.alert('Próximamente', 'Función en desarrollo');
          }}
        >
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuTexto}>Solicitudes de Adopción</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            // Navegar a configuración del refugio
            Alert.alert('Próximamente', 'Función en desarrollo');
          }}
        >
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuTexto}>Configuración</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de insumos pendientes */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Insumos Pendientes de Recibir</Text>
        {insumosPendientes.length === 0 ? (
          <Text style={styles.noDataText}>No tienes insumos pendientes</Text>
        ) : (
          insumosPendientes.map((insumo) => (
            <View key={insumo.id} style={styles.insumoItem}>
              <View style={styles.insumoInfo}>
                <Text style={styles.insumoNombre}>{insumo.nombre}</Text>
                <Text style={styles.insumoDescripcion}>
                  Cantidad: {insumo.cantidad}
                </Text>
                <Text style={styles.insumoDescripcion}>
                  Descripción: {insumo.descripcion || 'Sin descripción'}
                </Text>
                <Text style={styles.donante}>
                  Donante: {insumo.nombre_donante} - {insumo.telefono_donante}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.completarBtn}
                onPress={() => marcarInsumoCompletado(insumo.id)}
              >
                <Text style={styles.completarBtnTexto}>✓ Recibido</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cargandoTexto: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#0066ff',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  bienvenidaTexto: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tipoUsuario: {
    color: '#cce7ff',
    fontSize: 16,
    marginBottom: 10,
  },
  cerrarSesionBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  cerrarSesionTexto: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoTexto: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  estadisticasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 15,
    marginBottom: 15,
  },
  estadisticaCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 3,
  },
  estadisticaNumero: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066ff',
  },
  estadisticaTexto: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginHorizontal: 15,
    marginBottom: 15,
  },
  menuItem: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '45%',
    marginBottom: 10,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  menuTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
  insumoItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9500',
  },
  insumoInfo: {
    flex: 1,
    marginBottom: 10,
  },
  insumoNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  insumoDescripcion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  donante: {
    fontSize: 13,
    color: '#0066ff',
    fontWeight: '500',
    marginTop: 5,
  },
  completarBtn: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-end',
  },
  completarBtnTexto: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});