import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';

const API_BASE_URL = 'http://192.168.1.119:3000';

export default function HistorialDonacionesScreen({ route }) {
  const usuario = route?.params?.usuario || { idUsuario: 1 };
  
  const [donacionesMonetarias, setDonacionesMonetarias] = useState([]);
  const [donacionesInsumos, setDonacionesInsumos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  useEffect(() => {
    cargarHistorialDonaciones();
  }, []);

  const cargarHistorialDonaciones = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/donaciones/usuario/${usuario.idUsuario}`);
      const data = await response.json();
      
      if (response.ok) {
        setDonacionesMonetarias(data.donacionesMonetarias || []);
        setDonacionesInsumos(data.donacionesInsumos || []);
      } else {
        Alert.alert('Error', 'No se pudo cargar el historial de donaciones');
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const onRefresh = () => {
    setRefrescando(true);
    cargarHistorialDonaciones();
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (cargando) {
    return (
      <View style={[styles.container, styles.centrado]}>
        <ActivityIndicator size="large" color="#ff69b4" />
        <Text style={styles.cargandoTexto}>Cargando historial...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refrescando} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Donaciones</Text>
        <Text style={styles.userInfo}>
          {usuario.nombre ? `Hola, ${usuario.nombre}` : 'Usuario'}
        </Text>
      </View>

      {/* Resumen */}
      <View style={styles.resumenCard}>
        <Text style={styles.resumenTitulo}>Resumen</Text>
        <View style={styles.resumenRow}>
          <Text style={styles.resumenTexto}>
            💰 Donaciones monetarias: {donacionesMonetarias.length}
          </Text>
        </View>
        <View style={styles.resumenRow}>
          <Text style={styles.resumenTexto}>
            📦 Donaciones de insumos: {donacionesInsumos.length}
          </Text>
        </View>
        <View style={styles.resumenRow}>
          <Text style={styles.resumenTexto}>
            💵 Total donado: $
            {donacionesMonetarias.reduce((total, d) => total + parseFloat(d.cantidad), 0).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Donaciones Monetarias */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>💰 Donaciones Monetarias</Text>
        {donacionesMonetarias.length === 0 ? (
          <View style={styles.sinDatos}>
            <Text style={styles.sinDatosTexto}>No tienes donaciones monetarias</Text>
          </View>
        ) : (
          donacionesMonetarias.map((donacion) => (
            <View key={donacion.id} style={styles.donacionCard}>
              <View style={styles.donacionHeader}>
                <Text style={styles.donacionMonto}>${parseFloat(donacion.cantidad).toFixed(2)}</Text>
                <Text style={styles.donacionFecha}>
                  {formatearFecha(donacion.fecha)}
                </Text>
              </View>
              <Text style={styles.donacionRefugio}>
                🏠 {donacion.nombre_refugio}
              </Text>
              <View style={styles.estadoBadge}>
                <Text style={styles.estadoTexto}>✅ Registrada</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Donaciones de Insumos */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>📦 Donaciones de Insumos</Text>
        {donacionesInsumos.length === 0 ? (
          <View style={styles.sinDatos}>
            <Text style={styles.sinDatosTexto}>No tienes donaciones de insumos</Text>
          </View>
        ) : (
          donacionesInsumos.map((insumo) => (
            <View key={insumo.id} style={styles.donacionCard}>
              <View style={styles.donacionHeader}>
                <Text style={styles.insumoNombre}>{insumo.nombre}</Text>
                <Text style={styles.insumoCantidad}>
                  Cant: {insumo.cantidad}
                </Text>
              </View>
              {insumo.descripcion && (
                <Text style={styles.insumoDescripcion}>
                  📝 {insumo.descripcion}
                </Text>
              )}
              <Text style={styles.donacionRefugio}>
                🏠 {insumo.nombre_refugio}
              </Text>
              <View style={[styles.estadoBadge, 
                insumo.completado ? styles.estadoCompletado : styles.estadoPendiente
              ]}>
                <Text style={styles.estadoTexto}>
                  {insumo.completado ? '✅ Entregado' : '⏳ Pendiente'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Mensaje si no hay donaciones */}
      {donacionesMonetarias.length === 0 && donacionesInsumos.length === 0 && (
        <View style={styles.sinDonaciones}>
          <Text style={styles.sinDonacionesTitulo}>¡Aún no has hecho donaciones!</Text>
          <Text style={styles.sinDonacionesTexto}>
            Tu primera donación puede marcar la diferencia en la vida de muchos animalitos 🐾
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 20,
  },
  centrado: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cargandoTexto: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#a2d2ff',
    paddingTop: 50,
    paddingBottom: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  userInfo: {
    fontSize: 14,
    color: '#2c3e50',
    marginTop: 5,
  },
  resumenCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resumenTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  resumenRow: {
    marginBottom: 8,
  },
  resumenTexto: {
    fontSize: 16,
    color: '#34495e',
  },
  seccion: {
    marginBottom: 25,
  },
  seccionTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  sinDatos: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  sinDatosTexto: {
    color: '#7f8c8d',
    fontSize: 16,
    fontStyle: 'italic',
  },
  donacionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  donacionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  donacionMonto: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  donacionFecha: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  donacionRefugio: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
  },
  insumoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textTransform: 'capitalize',
  },
  insumoCantidad: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  insumoDescripcion: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  estadoBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: '#3498db',
  },
  estadoCompletado: {
    backgroundColor: '#27ae60',
  },
  estadoPendiente: {
    backgroundColor: '#f39c12',
  },
  estadoTexto: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sinDonaciones: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  sinDonacionesTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  sinDonacionesTexto: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
});