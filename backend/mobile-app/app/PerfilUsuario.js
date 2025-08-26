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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function PerfilScreen() {
  const [userData, setUserData] = useState(null);
  const [editando, setEditando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevaImagen, setNuevaImagen] = useState(null);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [contenidoModal, setContenidoModal] = useState('');

  const navigation = useNavigation();
  const route = useRoute();
  
  const usuarioId = route.params?.usuarioId || route.params?.usuario?.idUsuario || 1;
  
  useEffect(() => {
    cargarDatosUsuario();
  }, []);

  const cargarDatosUsuario = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://192.168.1.119:3000/api/user/${usuarioId}`);
      
      setUserData(response.data);
      setNuevoNombre(response.data.name || '');
      setNuevaDireccion(response.data.direccion || '');
      setNuevoTelefono(response.data.telefono || '');
      setNuevaImagen(response.data.imagen || null);
      
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso denegado', 'Se necesita acceso a la galería');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8, // Reducir calidad para mejor rendimiento
      base64: true, // Necesario para enviar como base64
    });

    if (!resultado.canceled) {
      // Crear la cadena base64 completa
      const base64Image = `data:image/jpeg;base64,${resultado.assets[0].base64}`;
      setNuevaImagen(base64Image);
    }
  };

  const guardarCambios = async () => {
    try {
      const datosActualizados = {
        name: nuevoNombre.trim(),
        direccion: nuevaDireccion.trim(),
        telefono: nuevoTelefono.trim(),
        imagen: nuevaImagen
      };

      await axios.put(`http://192.168.1.119:3000/api/user/${usuarioId}`, datosActualizados);
      
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setEditando(false);
      
      // Recargar datos para mostrar los cambios
      await cargarDatosUsuario();
      
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    }
  };

  const cancelarEdicion = () => {
    // Restaurar valores originales
    setNuevoNombre(userData?.name || '');
    setNuevaDireccion(userData?.direccion || '');
    setNuevoTelefono(userData?.telefono || '');
    setNuevaImagen(userData?.imagen || null);
    setEditando(false);
  };

  const abrirModal = (tipo) => {
    let contenido = '';
    switch (tipo) {
      case 'notificaciones':
        contenido = '🔔 Tienes 2 nuevas notificaciones.';
        break;
      case 'privacidad':
        contenido = 'Funcionalidad para cambiar contraseña próximamente disponible.';
        break;
      case 'ayuda':
        contenido = '👨‍💻 Contacto: devs@patitasconectadas.com\nTel: +52 123 456 7890';
        break;
      case 'terminos':
        contenido = '📃 Al usar esta app aceptas nuestros términos y condiciones.';
        break;
      default:
        contenido = '';
    }

    setContenidoModal(contenido);
    setModalVisible(true);
  };

  const cerrarSesion = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí',
        onPress: () => {
          // Navegar a la pantalla de login y limpiar el stack
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Perfil</Text>
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
            <Text style={styles.cambiarImagenText}>Toca para cambiar</Text>
          )}
        </TouchableOpacity>

        {editando ? (
          <>
            <TextInput 
              style={styles.input} 
              value={nuevoNombre} 
              onChangeText={setNuevoNombre} 
              placeholder="Nombre completo" 
            />
            <TextInput 
              style={styles.input} 
              value={nuevaDireccion} 
              onChangeText={setNuevaDireccion} 
              placeholder="Dirección" 
              multiline
            />
            <TextInput 
              style={styles.input} 
              value={nuevoTelefono} 
              onChangeText={setNuevoTelefono} 
              placeholder="Teléfono" 
              keyboardType="phone-pad" 
            />
            <View style={styles.botonesEdicion}>
              <TouchableOpacity style={styles.botonCancelar} onPress={cancelarEdicion}>
                <Text style={styles.textoBoton}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botonGuardar} onPress={guardarCambios}>
                <Text style={styles.textoBoton}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.nombre}>{userData?.name || 'Sin nombre'}</Text>
            <Text style={styles.datos}>📧 {userData?.email || 'Sin email'}</Text>
            <Text style={styles.datos}>📍 {userData?.direccion || 'Sin dirección'}</Text>
            <Text style={styles.datos}>📞 {userData?.telefono || 'Sin teléfono'}</Text>
            <TouchableOpacity style={styles.botonEditar} onPress={() => setEditando(true)}>
              <Text style={styles.textoBoton}>Editar Perfil</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.opciones}>
        <BotonOpcion texto="🔔 Notificaciones" onPress={() => abrirModal('notificaciones')} />
        <BotonOpcion texto="🔒 Privacidad y Seguridad" onPress={() => abrirModal('privacidad')} />
        <BotonOpcion texto="❓ Ayuda y Soporte" onPress={() => abrirModal('ayuda')} />
        <BotonOpcion texto="📄 Términos y Condiciones" onPress={() => abrirModal('terminos')} />
        <BotonOpcion texto="🚪 Cerrar Sesión" onPress={cerrarSesion} color="#e63946" />
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            <Text style={{ fontSize: 16, marginBottom: 15 }}>{contenidoModal}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalBoton}>
              <Text style={{ color: 'white' }}>Cerrar</Text>
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
    backgroundColor: '#f5f5f5',
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
  },
  titulo: { 
    fontSize: 20, 
    fontWeight: 'bold',
    color: '#333'
  },
  perfil: { 
    alignItems: 'center', 
    marginTop: 20, 
    paddingBottom: 40,
    paddingHorizontal: 20
  },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#a2d2ff'
  },
  avatarPlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 40,
    color: '#888'
  },
  cambiarImagenText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10
  },
  nombre: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 10,
    textAlign: 'center'
  },
  datos: { 
    fontSize: 16, 
    color: '#555',
    marginBottom: 5,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    padding: 12,
    width: '100%',
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16
  },
  botonesEdicion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15
  },
  botonEditar: {
    backgroundColor: '#c77dff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 15,
  },
  botonGuardar: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    marginLeft: 5
  },
  botonCancelar: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    marginRight: 5
  },
  textoBoton: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  opciones: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  botonOpcion: {
    padding: 15,
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
    fontWeight: 'bold',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContenido: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    width: '85%',
    maxWidth: 350
  },
  modalBoton: {
    backgroundColor: '#0077b6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});