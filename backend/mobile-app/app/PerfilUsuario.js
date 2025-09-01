import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';

// Cambia esta IP por la IP de tu servidor
const API_BASE_URL = 'http://192.168.1.119:3000';

export default function PerfilScreen() {
  const [userData, setUserData] = useState(null);
  const [editando, setEditando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoApellido, setNuevoApellido] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevaImagen, setNuevaImagen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [contenidoModal, setContenidoModal] = useState('');

  const navigation = useNavigation();
  const route = useRoute();
  
  // Obtener los datos del usuario desde los parámetros de navegación
  const usuario = route.params?.usuario;
  const usuarioId = usuario?.id || usuario?.idUsuario || usuario?._id;

  useEffect(() => {
    if (usuario && usuarioId) {
      console.log('Datos del usuario recibidos:', usuario);
      console.log('ID del usuario:', usuarioId);
      cargarDatosUsuario();
    } else {
      console.error('No se encontró información del usuario o ID');
      Alert.alert(
        'Error', 
        'No se pudieron obtener los datos del usuario. Por favor, inicia sesión nuevamente.',
        [
          {
            text: 'Ir al Login',
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })
          }
        ]
      );
      setLoading(false);
    }
  }, [usuario, usuarioId]);

  const cargarDatosUsuario = async () => {
    try {
      setLoading(true);
      
      // Intentar obtener datos actualizados del servidor
      const response = await axios.get(`${API_BASE_URL}/api/usuario/${usuarioId}`);
      
      if (response.data.success) {
        const datosActualizados = response.data.usuario;
        setUserData(datosActualizados);
        initializarFormulario(datosActualizados);
      } else {
        // Si no hay endpoint específico, usar los datos de navegación
        console.log('Usando datos de navegación como fallback');
        setUserData(usuario);
        initializarFormulario(usuario);
      }
    } catch (error) {
      console.log('Error al cargar desde servidor, usando datos locales:', error.message);
      
      // Fallback: usar datos de navegación si hay error de conexión
      if (usuario) {
        setUserData(usuario);
        initializarFormulario(usuario);
      } else {
        Alert.alert('Error', 'No se pudieron cargar los datos del usuario');
        navigation.goBack();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const initializarFormulario = (datosUsuario) => {
    if (!datosUsuario) return;
    
    setNuevoNombre(datosUsuario.nombre || '');
    setNuevoApellido(datosUsuario.apellido || '');
    setNuevaDireccion(datosUsuario.direccion || '');
    setNuevoTelefono(datosUsuario.telefono || '');
    setNuevaImagen(datosUsuario.imagen || null);
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarDatosUsuario();
  };

  const seleccionarImagen = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la galería para cambiar la foto de perfil');
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!resultado.canceled && resultado.assets[0]) {
        const base64Image = `data:image/jpeg;base64,${resultado.assets[0].base64}`;
        setNuevaImagen(base64Image);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const validarDatos = () => {
    const nombre = nuevoNombre.trim();
    const apellido = nuevoApellido.trim();
    
    if (!nombre || nombre.length < 2) {
      Alert.alert('Error de validación', 'El nombre debe tener al menos 2 caracteres');
      return false;
    }
    
    if (!apellido || apellido.length < 2) {
      Alert.alert('Error de validación', 'El apellido debe tener al menos 2 caracteres');
      return false;
    }
    
    if (nuevoTelefono.trim() && nuevoTelefono.trim().length < 10) {
      Alert.alert('Error de validación', 'El teléfono debe tener al menos 10 dígitos');
      return false;
    }
    
    return true;
  };

  const guardarCambios = async () => {
    if (!validarDatos()) return;
    
    try {
      setLoading(true);
      
      const datosActualizados = {
        nombre: nuevoNombre.trim(),
        apellido: nuevoApellido.trim(),
        telefono: nuevoTelefono.trim(),
        direccion: nuevaDireccion.trim(),
      };

      console.log('Actualizando usuario con ID:', usuarioId);
      console.log('Datos a enviar:', datosActualizados);

      const response = await axios.put(
        `${API_BASE_URL}/api/usuarios/${usuarioId}`, 
        datosActualizados,
        {
          timeout: 10000, // 10 segundos de timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
        
        // Actualizar los datos locales con la respuesta del servidor
        const datosActualizadosCompletos = {
          ...userData,
          ...datosActualizados,
          // Mantener campos que no se actualizan
          id: userData.id,
          _id: userData._id,
          email: userData.email,
          id_rol: userData.id_rol,
          fecha_registro: userData.fecha_registro
        };
        
        setUserData(datosActualizadosCompletos);
        setEditando(false);
        
        // Actualizar los parámetros de navegación
        navigation.setParams({
          usuario: datosActualizadosCompletos
        });
      } else {
        Alert.alert('Error', response.data.message || 'No se pudo actualizar el perfil');
      }
      
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      
      let mensajeError = 'No se pudo actualizar el perfil';
      
      if (error.response) {
        // Error de respuesta del servidor
        const status = error.response.status;
        const message = error.response.data?.message;
        
        switch (status) {
          case 404:
            mensajeError = 'Usuario no encontrado';
            break;
          case 400:
            mensajeError = message || 'Datos inválidos';
            break;
          case 409:
            mensajeError = 'Conflicto: ' + (message || 'Datos duplicados');
            break;
          case 500:
            mensajeError = 'Error del servidor. Inténtalo más tarde';
            break;
          default:
            mensajeError = message || `Error del servidor (${status})`;
        }
      } else if (error.request) {
        // Error de red
        mensajeError = 'No se pudo conectar con el servidor. Verifica tu conexión a internet';
      }
      
      Alert.alert('Error', mensajeError);
    } finally {
      setLoading(false);
    }
  };

  const cancelarEdicion = () => {
    // Restaurar valores originales
    if (userData) {
      initializarFormulario(userData);
    }
    setEditando(false);
  };

  const abrirModal = (tipo) => {
    let contenido = '';
    switch (tipo) {
      case 'notificaciones':
        contenido = '🔔 No tienes notificaciones nuevas.';
        break;
      case 'privacidad':
        contenido = '🔒 Funcionalidad para cambiar contraseña próximamente disponible.';
        break;
      case 'ayuda':
        contenido = '👨‍💻 Contacto: devs@patitasconectadas.com\nTel: +52 123 456 7890';
        break;
      case 'terminos':
        contenido = '📃 Al usar esta app aceptas nuestros términos y condiciones de uso.';
        break;
      default:
        contenido = '';
    }

    setContenidoModal(contenido);
    setModalVisible(true);
  };

  const cerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión', 
      '¿Estás seguro que deseas cerrar sesión?', 
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, cerrar sesión',
          style: 'destructive',
          onPress: () => {
            // Navegar a la pantalla de login y limpiar el stack
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>No se pudieron cargar los datos del usuario</Text>
        <TouchableOpacity style={styles.retryButton} onPress={cargarDatosUsuario}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.retryButton, styles.goBackButton]} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Volver</Text>
        </TouchableOpacity>
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
      <View style={styles.header}>
        <Text style={styles.titulo}>Mi Perfil</Text>
      </View>

      <View style={styles.perfil}>
        <TouchableOpacity onPress={editando ? seleccionarImagen : null}>
          {nuevaImagen ? (
            <Image source={{ uri: nuevaImagen }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
          )}
          {editando && (
            <Text style={styles.cambiarImagenText}>Toca para cambiar foto</Text>
          )}
        </TouchableOpacity>

        {editando ? (
          <>
            <TextInput 
              style={styles.input} 
              value={nuevoNombre} 
              onChangeText={setNuevoNombre} 
              placeholder="Nombre *" 
              maxLength={50}
              editable={!loading}
            />
            <TextInput 
              style={styles.input} 
              value={nuevoApellido} 
              onChangeText={setNuevoApellido} 
              placeholder="Apellido *" 
              maxLength={50}
              editable={!loading}
            />
            <TextInput 
              style={styles.input} 
              value={nuevoTelefono} 
              onChangeText={setNuevoTelefono} 
              placeholder="Teléfono" 
              keyboardType="phone-pad" 
              maxLength={15}
              editable={!loading}
            />
            <TextInput 
              style={[styles.input, styles.inputMultiline]} 
              value={nuevaDireccion} 
              onChangeText={setNuevaDireccion} 
              placeholder="Dirección" 
              multiline
              numberOfLines={3}
              maxLength={200}
              editable={!loading}
            />
            <Text style={styles.camposObligatorios}>* Campos obligatorios</Text>
            <View style={styles.botonesEdicion}>
              <TouchableOpacity 
                style={[styles.botonCancelar, loading && styles.botonDeshabilitado]} 
                onPress={cancelarEdicion}
                disabled={loading}
              >
                <Text style={styles.textoBoton}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.botonGuardar, loading && styles.botonDeshabilitado]} 
                onPress={guardarCambios}
                disabled={loading}
              >
                <Text style={styles.textoBoton}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.nombre}>
              {`${userData.nombre || ''} ${userData.apellido || ''}`.trim() || 'Sin nombre'}
            </Text>
            <Text style={styles.datos}>📧 {userData.email || 'Sin email'}</Text>
            {userData.telefono && (
              <Text style={styles.datos}>📞 {userData.telefono}</Text>
            )}
            {userData.direccion && (
              <Text style={styles.datos}>📍 {userData.direccion}</Text>
            )}
            <Text style={styles.fechaRegistro}>
              👤 Usuario desde: {new Date(userData.fecha_registro || Date.now()).toLocaleDateString('es-ES')}
            </Text>
            <TouchableOpacity style={styles.botonEditar} onPress={() => setEditando(true)}>
              <Text style={styles.textoBoton}>✏️ Editar Perfil</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.opciones}>
        <Text style={styles.tituloOpciones}>Opciones</Text>
        <BotonOpcion texto="🔔 Notificaciones" onPress={() => abrirModal('notificaciones')} />
        <BotonOpcion texto="🔒 Privacidad y Seguridad" onPress={() => abrirModal('privacidad')} />
        <BotonOpcion texto="❓ Ayuda y Soporte" onPress={() => abrirModal('ayuda')} />
        <BotonOpcion texto="📄 Términos y Condiciones" onPress={() => abrirModal('terminos')} />
        <BotonOpcion texto="🚪 Cerrar Sesión" onPress={cerrarSesion} color="#e63946" />
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTexto}>{contenidoModal}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalBoton}>
              <Text style={styles.modalBotonTexto}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const BotonOpcion = ({ texto, onPress, color = '#4a4e69' }) => (
  <TouchableOpacity style={[styles.botonOpcion, { backgroundColor: color }]} onPress={onPress}>
    <Text style={styles.opcionTexto}>{texto}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { 
    backgroundColor: '#f8f9fa',
    flex: 1
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    backgroundColor: '#a2d2ff',
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titulo: { 
    fontSize: 22, 
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  perfil: { 
    alignItems: 'center', 
    marginTop: 30, 
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    marginHorizontal: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    marginBottom: 15,
    marginTop: 20,
    borderWidth: 4,
    borderColor: '#a2d2ff'
  },
  avatarPlaceholder: {
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 50,
    color: '#6c757d'
  },
  cambiarImagenText: {
    fontSize: 14,
    color: '#007bff',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500'
  },
  nombre: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 15,
    textAlign: 'center',
    color: '#2c3e50'
  },
  datos: { 
    fontSize: 16, 
    color: '#495057',
    marginBottom: 8,
    textAlign: 'center'
  },
  fechaRegistro: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 5,
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic'
  },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: 'white',
    padding: 15,
    width: '100%',
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: '#495057'
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top'
  },
  camposObligatorios: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic'
  },
  botonesEdicion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15
  },
  botonEditar: {
    backgroundColor: '#c77dff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  botonGuardar: {
    backgroundColor: '#28a745',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    flex: 1,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  botonCancelar: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    flex: 1,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  botonDeshabilitado: {
    opacity: 0.6
  },
  textoBoton: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16
  },
  opciones: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  tituloOpciones: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center'
  },
  botonOpcion: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  opcionTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContenido: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20,
    width: '85%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTexto: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#495057',
    lineHeight: 22
  },
  modalBoton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBotonTexto: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d'
  },
  errorText: {
    fontSize: 16,
    color: '#e63946',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10
  },
  goBackButton: {
    backgroundColor: '#6c757d'
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});