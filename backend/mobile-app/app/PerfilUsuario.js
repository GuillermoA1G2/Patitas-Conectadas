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
import { useNavigation } from '@react-navigation/native';

export default function PerfilScreen() {
  const [userData, setUserData] = useState(null);
  const [editando, setEditando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevaImagen, setNuevaImagen] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [contenidoModal, setContenidoModal] = useState('');

  const navigation = useNavigation();

  useEffect(() => {
    axios.get('http://192.168.100.123:3000/api/user/1') // Tu API real aquí
      .then(response => {
        setUserData(response.data);
        setNuevoNombre(response.data.name);
        setNuevaDireccion(response.data.direccion);
        setNuevoTelefono(response.data.telefono);
        setNuevaImagen(response.data.imagen); // URL de imagen desde backend
      })
      .catch(error => {
        console.error(error);
        Alert.alert('Error', 'No se pudieron cargar los datos');
      });
  }, []);

  const seleccionarImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso denegado', 'Se necesita acceso a la galería');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!resultado.canceled) {
      setNuevaImagen(resultado.assets[0].uri);
    }
  };

  const guardarCambios = () => {
    axios.put('http://192.168.100.123:3000/api/user/1', {
      name: nuevoNombre,
      direccion: nuevaDireccion,
      telefono: nuevoTelefono,
      imagen: nuevaImagen,
    })
      .then(() => {
        Alert.alert('Éxito', 'Perfil actualizado');
        setEditando(false);
      })
      .catch(() => Alert.alert('Error', 'No se pudo actualizar el perfil'));
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
        contenido = '👨‍💻 Contacto: devs@miapp.com\nTel: +52 123 456 7890';
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
        onPress: () => navigation.replace('Login'), // Asegúrate de tener la pantalla Login
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Perfil</Text>
      </View>

      <View style={styles.perfil}>
        <TouchableOpacity onPress={seleccionarImagen}>
          {nuevaImagen ? (
            <Image source={{ uri: nuevaImagen }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
        </TouchableOpacity>

        {editando ? (
          <>
            <TextInput style={styles.input} value={nuevoNombre} onChangeText={setNuevoNombre} placeholder="Nombre" />
            <TextInput style={styles.input} value={nuevaDireccion} onChangeText={setNuevaDireccion} placeholder="Dirección" />
            <TextInput style={styles.input} value={nuevoTelefono} onChangeText={setNuevoTelefono} placeholder="Teléfono" keyboardType="phone-pad" />
            <TouchableOpacity style={styles.botonGuardar} onPress={guardarCambios}>
              <Text style={styles.textoBoton}>Guardar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.nombre}>{userData?.name || 'Cargando...'}</Text>
            <Text style={styles.datos}>📍 {userData?.direccion}</Text>
            <Text style={styles.datos}>📞 {userData?.telefono}</Text>
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
            <Text style={{ fontSize: 16 }}>{contenidoModal}</Text>
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
  container: { backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#a2d2ff',
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  titulo: { fontSize: 20, fontWeight: 'bold' },
  perfil: { alignItems: 'center', marginTop: 20, paddingBottom: 40 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ccc', marginBottom: 10 },
  nombre: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  datos: { fontSize: 16, color: '#555' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    width: '80%',
    borderRadius: 6,
    marginBottom: 10,
  },
  botonEditar: {
    backgroundColor: '#c77dff',
    padding: 10,
    borderRadius: 20,
    marginTop: 15,
  },
  botonGuardar: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 20,
    marginTop: 15,
  },
  textoBoton: {
    color: 'white',
    fontWeight: 'bold',
  },
  opciones: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  botonOpcion: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  opcionTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContenido: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 10,
    width: '80%',
  },
  modalBoton: {
    marginTop: 15,
    backgroundColor: '#0077b6',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
});
