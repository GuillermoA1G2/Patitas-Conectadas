import React, { useState, useEffect, useCallback } from 'react';
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
  FlatList,
  Modal,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

// ============================================================================
// BACKEND LOGIC SECTION
// ============================================================================

// Configuración del backend
const API_CONFIG = {
  BASE_URL: 'http://192.168.1.119:3000/api', // Asegúrate de que esta IP sea accesible desde tu dispositivo
  ENDPOINTS: {
    ESTADISTICAS: '/admin/estadisticas',
    USUARIOS: '/admin/usuarios',
    REFUGIOS: '/admin/refugios',
    INSUMOS: '/admin/insumos',
  }
};

// Servicio para manejo de APIs
const AdminService = {
  async obtenerEstadisticas() {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ESTADISTICAS}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return { success: false, error: error.response?.data?.message || 'No se pudieron cargar las estadísticas' };
    }
  },

  async obtenerUsuarios() {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USUARIOS}`);
      return { success: true, data: response.data.usuarios || [] };
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return { success: false, error: error.response?.data?.message || 'No se pudieron cargar los usuarios' };
    }
  },

  async obtenerRefugios() {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFUGIOS}`);
      return { success: true, data: response.data.refugios || [] };
    } catch (error) {
      console.error('Error al obtener refugios:', error);
      return { success: false, error: error.response?.data?.message || 'No se pudieron cargar los refugios' };
    }
  },

  async obtenerInsumos() {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INSUMOS}`);
      return { success: true, data: response.data.insumos || [] };
    } catch (error) {
      console.error('Error al obtener insumos:', error);
      return { success: false, error: error.response?.data?.message || 'No se pudieron cargar los insumos' };
    }
  },

  async cargarDatosDashboard() {
    try {
      const [estadisticasResult, usuariosResult, refugiosResult] = await Promise.all([
        this.obtenerEstadisticas(),
        this.obtenerUsuarios(),
        this.obtenerRefugios()
      ]);

      return {
        success: true,
        data: {
          estadisticas: estadisticasResult.success ? estadisticasResult.data : {},
          usuarios: usuariosResult.success ? usuariosResult.data : [],
          refugios: refugiosResult.success ? refugiosResult.data : []
        },
        errors: [
          !estadisticasResult.success ? estadisticasResult.error : null,
          !usuariosResult.success ? usuariosResult.error : null,
          !refugiosResult.success ? refugiosResult.error : null,
        ].filter(Boolean)
      };
    } catch (error) {
      console.error('Error general al cargar datos:', error);
      return { success: false, error: 'Error general del sistema' };
    }
  },

  async actualizarUsuario(id, datosUsuario, imagen) {
    try {
      const formData = new FormData();
      for (const key in datosUsuario) {
        formData.append(key, datosUsuario[key]);
      }
      if (imagen) {
        formData.append('imagen', {
          uri: imagen.uri,
          name: imagen.name,
          type: imagen.type,
        });
      }

      const response = await axios.put(`${API_CONFIG.BASE_URL}/usuarios/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, message: response.data.message, data: response.data.usuario };
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      return { success: false, error: error.response?.data?.message || 'Error al actualizar usuario' };
    }
  },

  async eliminarUsuario(id) {
    try {
      const response = await axios.delete(`${API_CONFIG.BASE_URL}/usuarios/${id}`);
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      return { success: false, error: error.response?.data?.message || 'Error al eliminar usuario' };
    }
  },

  async actualizarRefugio(id, datosRefugio, files) {
    try {
      const formData = new FormData();
      for (const key in datosRefugio) {
        formData.append(key, datosRefugio[key]);
      }
      if (files.logo) {
        formData.append('logo', {
          uri: files.logo.uri,
          name: files.logo.name,
          type: files.logo.type,
        });
      }
      if (files.documentos && files.documentos.length > 0) {
        files.documentos.forEach((doc) => {
          formData.append(`documentos`, {
            uri: doc.uri,
            name: doc.name,
            type: doc.type,
          });
        });
      }
      if (files.formularioAdopcion) {
        formData.append('formularioAdopcion', {
          uri: files.formularioAdopcion.uri,
          name: files.formularioAdopcion.name,
          type: files.formularioAdopcion.type,
        });
      }

      const response = await axios.put(`${API_CONFIG.BASE_URL}/refugio/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, message: response.data.message, data: response.data.refugio };
    } catch (error) {
      console.error('Error al actualizar refugio:', error);
      return { success: false, error: error.response?.data?.message || 'Error al actualizar refugio' };
    }
  },

  async eliminarRefugio(id) {
    try {
      const response = await axios.delete(`${API_CONFIG.BASE_URL}/refugios/${id}`);
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Error al eliminar refugio:', error);
      return { success: false, error: error.response?.data?.message || 'Error al eliminar refugio' };
    }
  },
};

// Hooks personalizados para manejo de estado y lógica
const useAdminData = () => {
  const [estadisticas, setEstadisticas] = useState({});
  const [usuarios, setUsuarios] = useState([]);
  const [refugios, setRefugios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargarDatos = useCallback(async () => {
    const resultado = await AdminService.cargarDatosDashboard();

    if (resultado.success) {
      setEstadisticas(resultado.data.estadisticas);
      // Filtrar usuarios para mostrar solo los de id_rol: 4
      setUsuarios(resultado.data.usuarios.filter(user => user.id_rol === 4));
      setRefugios(resultado.data.refugios);

      if (resultado.errors.length > 0) {
        Alert.alert('Advertencia', `Algunos datos no se cargaron correctamente:\n${resultado.errors.join('\n')}`);
      }
    } else {
      Alert.alert('Error', resultado.error || 'No se pudieron cargar los datos del sistema');
    }

    setCargando(false);
    setRefreshing(false);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarDatos();
  }, [cargarDatos]);

  return {
    estadisticas,
    usuarios,
    refugios,
    cargando,
    setCargando,
    refreshing,
    cargarDatos,
    onRefresh
  };
};

// Utilidades y funciones de negocio
const AdminUtils = {
  formatearMonto: (monto) => {
    return `$${parseFloat(monto || 0).toFixed(2)}`;
  },

  mostrarProximamente: (funcionalidad) => {
    Alert.alert('Próximamente', `${funcionalidad} en desarrollo`);
  },

  confirmarCerrarSesion: (onConfirm) => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, cerrar sesión',
          onPress: onConfirm
        }
      ]
    );
  },

  confirmarEliminacion: (tipo, nombre, onConfirm) => {
    Alert.alert(
      `Eliminar ${tipo}`,
      `¿Estás seguro de que deseas eliminar a ${nombre}? Esta acción es irreversible.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          onPress: onConfirm,
          style: 'destructive'
        }
      ]
    );
  }
};

// ============================================================================
// FRONTEND SECTION
// ============================================================================

// Componente principal
export default function PantallaAdmin() {
  const { adminNombre } = useLocalSearchParams();
  const router = useRouter();

  const [vistaActual, setVistaActual] = useState('dashboard');

  const {
    estadisticas,
    usuarios,
    refugios,
    cargando,
    setCargando,
    refreshing,
    cargarDatos,
    onRefresh
  } = useAdminData();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para el formulario de edición de usuario
  const [editNombre, setEditNombre] = useState('');
  const [editApellido, setEditApellido] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editDireccion, setEditDireccion] = useState('');
  const [editCurp, setEditCurp] = useState('');
  const [editFotoPerfil, setEditFotoPerfil] = useState(null);
  const [currentFotoPerfil, setCurrentFotoPerfil] = useState(null);

  // Estados para el formulario de edición de refugio
  const [editRefugioNombre, setEditRefugioNombre] = useState('');
  const [editRefugioDescripcion, setEditRefugioDescripcion] = useState('');
  const [editRefugioEmail, setEditRefugioEmail] = useState('');
  const [editRefugioTelefono, setEditRefugioTelefono] = useState('');
  const [editRefugioDireccion, setEditRefugioDireccion] = useState('');
  const [editRefugioCiudad, setEditRefugioCiudad] = useState('');
  const [editRefugioCodigoPostal, setEditRefugioCodigoPostal] = useState('');
  const [editRefugioMunicipio, setEditRefugioMunicipio] = useState('');
  const [editRefugioRfc, setEditRefugioRfc] = useState('');
  const [editRefugioLogo, setEditRefugioLogo] = useState(null);
  const [currentRefugioLogo, setCurrentRefugioLogo] = useState(null);
  const [editRefugioDocumentos, setEditRefugioDocumentos] = useState([]);
  const [currentRefugioDocumentos, setCurrentRefugioDocumentos] = useState([]);
  const [editRefugioFormularioAdopcion, setEditRefugioFormularioAdopcion] = useState(null);
  const [currentRefugioFormularioAdopcion, setCurrentRefugioFormularioAdopcion] = useState(null);

  // Estados para el modal de detalles de insumos
  const [insumosModalVisible, setInsumosModalVisible] = useState(false);
  const [listaInsumos, setListaInsumos] = useState([]);
  const [cargandoInsumos, setCargandoInsumos] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleCerrarSesion = () => {
    AdminUtils.confirmarCerrarSesion(() => {
      router.replace('/inicio_sesion');
    });
  };

  const handleEdit = (item, type) => {
    setEditingItem(item);
    setEditingType(type);
    if (type === 'usuario') {
      setEditNombre(item.nombre || '');
      setEditApellido(item.apellido || '');
      setEditEmail(item.email || '');
      setEditTelefono(item.telefono || '');
      setEditDireccion(item.direccion || '');
      setEditCurp(item.curp || '');
      setCurrentFotoPerfil(item.foto_perfil);
      setEditFotoPerfil(null);
    } else if (type === 'refugio') {
      setEditRefugioNombre(item.nombre || '');
      setEditRefugioDescripcion(item.descripcion || '');
      setEditRefugioEmail(item.email || '');
      setEditRefugioTelefono(item.telefono || '');
      setEditRefugioDireccion(item.direccion || '');
      setEditRefugioCiudad(item.ciudad || '');
      setEditRefugioCodigoPostal(item.codigoPostal || '');
      setEditRefugioMunicipio(item.municipio || '');
      setEditRefugioRfc(item.rfc || '');
      setCurrentRefugioLogo(item.logo);
      setEditRefugioLogo(null);
      setCurrentRefugioDocumentos(item.documentos || []);
      setEditRefugioDocumentos([]);
      setCurrentRefugioFormularioAdopcion(item.formularioAdopcion);
      setEditRefugioFormularioAdopcion(null);
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingItem(null);
    setEditingType(null);
    setIsSubmitting(false);
    // Limpiar estados de edición de usuario
    setEditNombre(''); setEditApellido(''); setEditEmail(''); setEditTelefono(''); setEditDireccion(''); setEditCurp(''); setEditFotoPerfil(null); setCurrentFotoPerfil(null);
    // Limpiar estados de edición de refugio
    setEditRefugioNombre(''); setEditRefugioDescripcion(''); setEditRefugioEmail(''); setEditRefugioTelefono(''); setEditRefugioDireccion(''); setEditRefugioCiudad(''); setEditRefugioCodigoPostal(''); setEditRefugioMunicipio(''); setEditRefugioRfc(''); setEditRefugioLogo(null); setCurrentRefugioLogo(null); setEditRefugioDocumentos([]); setCurrentRefugioDocumentos([]); setEditRefugioFormularioAdopcion(null); setCurrentRefugioFormularioAdopcion(null);
  };

  const pickImage = async (setter) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;
      setter({ uri, name: filename, type });
    }
  };

  const pickDocument = async (setter, multiple = false) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: multiple,
      });

      if (!result.canceled) {
        if (multiple) {
          setter(result.assets.map(asset => ({
            uri: asset.uri,
            name: asset.name,
            type: asset.mimeType || 'application/octet-stream',
          })));
        } else {
          const asset = result.assets[0];
          setter({
            uri: asset.uri,
            name: asset.name,
            type: asset.mimeType || 'application/octet-stream',
          });
        }
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'No se pudo seleccionar el documento.');
    }
  };

  const handleSaveEdit = async () => {
    setIsSubmitting(true);
    setCargando(true);
    let result;
    try {
      if (editingType === 'usuario') {
        const datosUsuario = {
          nombre: editNombre,
          apellido: editApellido,
          email: editEmail,
          telefono: editTelefono,
          direccion: editDireccion,
          curp: editCurp,
        };
        result = await AdminService.actualizarUsuario(editingItem.idUsuario, datosUsuario, editFotoPerfil);
      } else if (editingType === 'refugio') {
        const datosRefugio = {
          nombre: editRefugioNombre,
          descripcion: editRefugioDescripcion,
          email: editRefugioEmail,
          telefono: editRefugioTelefono,
          direccion: editRefugioDireccion,
          ciudad: editRefugioCiudad,
          codigoPostal: editRefugioCodigoPostal,
          municipio: editRefugioMunicipio,
          rfc: editRefugioRfc,
        };
        const files = {
          logo: editRefugioLogo,
          documentos: editRefugioDocumentos,
          formularioAdopcion: editRefugioFormularioAdopcion,
        };
        result = await AdminService.actualizarRefugio(editingItem.idAsociacion, datosRefugio, files);
      }

      if (result.success) {
        Alert.alert('Éxito', result.message);
        handleCloseModal();
        cargarDatos();
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error al guardar edición:', error);
      Alert.alert('Error', 'Ocurrió un error al guardar los cambios.');
    } finally {
      setIsSubmitting(false);
      setCargando(false);
    }
  };

  const handleDelete = (id, type, nombre) => {
    AdminUtils.confirmarEliminacion(type === 'usuario' ? 'usuario' : 'refugio', nombre, async () => {
      setCargando(true);
      let result;
      try {
        if (type === 'usuario') {
          result = await AdminService.eliminarUsuario(id);
        } else if (type === 'refugio') {
          result = await AdminService.eliminarRefugio(id);
        }

        if (result.success) {
          Alert.alert('Éxito', result.message);
          cargarDatos();
        } else {
          Alert.alert('Error', result.error);
        }
      } catch (error) {
        console.error('Error al eliminar:', error);
        Alert.alert('Error', 'Ocurrió un error al intentar eliminar.');
      } finally {
        setCargando(false);
      }
    });
  };

  const handleVerDetallesInsumos = async () => {
    setCargandoInsumos(true);
    const result = await AdminService.obtenerInsumos();
    if (result.success) {
      setListaInsumos(result.data);
      setInsumosModalVisible(true);
    } else {
      Alert.alert('Error', result.error);
    }
    setCargandoInsumos(false);
  };

  const ComponenteCarga = () => (
    <View style={[styles.container, styles.centered]}>
      <ActivityIndicator size="large" color="#a26b6c" />
      <Text style={styles.cargandoTexto}>Cargando panel administrativo...</Text>
    </View>
  );

  const ComponenteHeader = () => (
    <View style={styles.header}>
      <Text style={styles.bienvenidaTexto}>Panel de Administración</Text>
      <Text style={styles.adminNombre}>{adminNombre}</Text>
      <TouchableOpacity style={styles.cerrarSesionBtn} onPress={handleCerrarSesion}>
        <Text style={styles.cerrarSesionTexto}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );

  const ComponenteTabs = () => {
    const tabs = [
      { key: 'dashboard', label: '📊 Dashboard' },
      { key: 'usuarios', label: '👥 Usuarios' },
      { key: 'refugios', label: '🏠 Refugios' }
    ];

    return (
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, vistaActual === tab.key && styles.tabActive]}
            onPress={() => setVistaActual(tab.key)}
          >
            <Text style={[styles.tabText, vistaActual === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const TarjetaEstadistica = ({ numero, etiqueta }) => (
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{numero}</Text>
      <Text style={styles.statLabel}>{etiqueta}</Text>
    </View>
  );

  const ComponenteDashboard = () => (
    <View style={styles.content}>
      <View style={styles.statsContainer}>
        <TarjetaEstadistica
          numero={estadisticas.usuarios || 0}
          etiqueta="Usuarios Registrados"
        />
        <TarjetaEstadistica
          numero={estadisticas.refugios || 0}
          etiqueta="Refugios Activos"
        />
        <TarjetaEstadistica
          numero={estadisticas.donaciones || 0}
          etiqueta="Donaciones Totales"
        />
        <TarjetaEstadistica
          numero={AdminUtils.formatearMonto(estadisticas.monto_total)}
          etiqueta="Monto Total Donado"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Donaciones de Insumos</Text>
        <View style={styles.insumosSummary}>
          <Text style={styles.insumosText}>
            Total de insumos donados: {estadisticas.insumos || 0}
          </Text>
          <TouchableOpacity
            style={styles.verDetallesBtn}
            onPress={handleVerDetallesInsumos}
          >
            <Text style={styles.verDetallesText}>Ver Detalles</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const ItemUsuario = ({ item, handleEdit, handleDelete }) => (
    <View style={styles.listItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.nombre} {item.apellido}</Text>
        <Text style={styles.itemSubtitle}>📧 {item.email}</Text>
        <Text style={styles.itemSubtitle}>📱 {item.telefono || 'Sin teléfono'}</Text>
        <Text style={styles.itemSubtitle}>🏠 {item.direccion || 'Sin dirección'}</Text>
        <Text style={styles.itemRol}>Rol: {item.rol}</Text>
        <Text style={styles.itemSubtitle}>Fecha de Registro: {new Date(item.fecha_registro).toLocaleDateString()}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEdit(item, 'usuario')}
        >
          <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item.idUsuario, 'usuario', `${item.nombre} ${item.apellido}`)}
        >
          <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const ComponenteUsuarios = ({ refreshing, onRefresh, usuarios, handleEdit, handleDelete }) => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Usuarios Registrados ({usuarios.length})</Text>
      <FlatList
        data={usuarios}
        renderItem={({ item }) => <ItemUsuario item={item} handleEdit={handleEdit} handleDelete={handleDelete} />}
        keyExtractor={(item) => item.idUsuario.toString()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <Text style={styles.emptyListText}>No hay usuarios registrados.</Text>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );

  const ItemRefugio = ({ item, handleEdit, handleDelete }) => (
    <View style={styles.listItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.nombre}</Text>
        <Text style={styles.itemSubtitle}>📧 {item.email}</Text>
        <Text style={styles.itemSubtitle}>📱 {item.telefono || 'Sin teléfono'}</Text>
        <Text style={styles.itemSubtitle}>🏢 {item.ciudad || 'Sin ciudad'}</Text>
        <Text style={styles.itemSubtitle}>📍 {item.direccion || 'Sin dirección'}</Text>
        <Text style={styles.itemDescription}>{item.descripcion || 'Sin descripción'}</Text>
        <Text style={styles.itemSubtitle}>Fecha de Registro: {new Date(item.fecha_registro).toLocaleDateString()}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEdit(item, 'refugio')}
        >
          <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item.idAsociacion, 'refugio', item.nombre)}
        >
          <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const ComponenteRefugios = ({ refreshing, onRefresh, refugios, handleEdit, handleDelete }) => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Refugios Registrados ({refugios.length})</Text>
      <FlatList
        data={refugios}
        renderItem={({ item }) => <ItemRefugio item={item} handleEdit={handleEdit} handleDelete={handleDelete} />}
        keyExtractor={(item) => item.idAsociacion.toString()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <Text style={styles.emptyListText}>No hay refugios registrados.</Text>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );

  const ItemInsumo = ({ item }) => (
    <View style={styles.insumoListItem}>
      <Text style={styles.insumoItemTitle}>{item.nombre} (x{item.cantidad})</Text>
      <Text style={styles.insumoItemSubtitle}>Refugio: {item.refugio}</Text>
      <Text style={styles.insumoItemSubtitle}>Donante: {item.donante}</Text>
      <Text style={styles.insumoItemStatus}>Estado: {item.completado ? 'Completado' : 'Pendiente'}</Text>
      <Text style={styles.insumoItemDate}>Fecha: {new Date(item.fecha_creacion).toLocaleDateString()}</Text>
    </View>
  );

  const renderizarContenido = () => {
    switch (vistaActual) {
      case 'dashboard':
        return (
          <ScrollView
            style={styles.scrollableContent} // Nuevo estilo para ScrollView interno
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <ComponenteDashboard />
          </ScrollView>
        );
      case 'usuarios':
        return (
          <ComponenteUsuarios
            refreshing={refreshing}
            onRefresh={onRefresh}
            usuarios={usuarios}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />
        );
      case 'refugios':
        return (
          <ComponenteRefugios
            refreshing={refreshing}
            onRefresh={onRefresh}
            refugios={refugios}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />
        );
      default:
        return (
          <ScrollView
            style={styles.scrollableContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <ComponenteDashboard />
          </ScrollView>
        );
    }
  };

  if (cargando) {
    return <ComponenteCarga />;
  }

  return (
    <View style={styles.container}>
      <ComponenteHeader />
      <ComponenteTabs />
      {renderizarContenido()} {/* Renderiza el contenido directamente */}

      {/* Modal de Edición */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay} // Usar el estilo de overlay de refugio.js
        >
          <View style={styles.editModalContainer}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>
                {editingType === 'usuario' ? 'Editar Usuario' : 'Editar Refugio'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalContent}>
              {editingType === 'usuario' && (
                <>
                  <Text style={styles.inputLabel}>Nombre *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre"
                    value={editNombre}
                    onChangeText={setEditNombre}
                  />
                  <Text style={styles.inputLabel}>Apellido *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Apellido"
                    value={editApellido}
                    onChangeText={setEditApellido}
                  />
                  <Text style={styles.inputLabel}>Email *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={editEmail}
                    onChangeText={setEditEmail}
                    keyboardType="email-address"
                    editable={false}
                  />
                  <Text style={styles.inputLabel}>Teléfono</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Teléfono"
                    value={editTelefono}
                    onChangeText={setEditTelefono}
                    keyboardType="phone-pad"
                  />
                  <Text style={styles.inputLabel}>Dirección</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Dirección"
                    value={editDireccion}
                    onChangeText={setEditDireccion}
                  />
                  <Text style={styles.inputLabel}>CURP</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="CURP"
                    value={editCurp}
                    onChangeText={setEditCurp}
                  />
                  <TouchableOpacity style={styles.filePickerButton} onPress={() => pickImage(setEditFotoPerfil)}>
                    <Text style={styles.filePickerButtonText}>Seleccionar Nueva Foto de Perfil</Text>
                  </TouchableOpacity>
                  {editFotoPerfil && <Text style={styles.fileName}>{editFotoPerfil.name}</Text>}
                  {currentFotoPerfil && !editFotoPerfil && (
                    <Image source={{ uri: `http://192.168.1.119:3000${currentFotoPerfil}` }} style={styles.profileImagePreview} />
                  )}
                  {editFotoPerfil && (
                    <Image source={{ uri: editFotoPerfil.uri }} style={styles.profileImagePreview} />
                  )}
                </>
              )}

              {editingType === 'refugio' && (
                <>
                  <Text style={styles.inputLabel}>Nombre del Refugio *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre del Refugio"
                    value={editRefugioNombre}
                    onChangeText={setEditRefugioNombre}
                  />
                  <Text style={styles.inputLabel}>Descripción</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Descripción"
                    value={editRefugioDescripcion}
                    onChangeText={setEditRefugioDescripcion}
                    multiline
                  />
                  <Text style={styles.inputLabel}>Email *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={editRefugioEmail}
                    onChangeText={setEditRefugioEmail}
                    keyboardType="email-address"
                    editable={false}
                  />
                  <Text style={styles.inputLabel}>Teléfono</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Teléfono"
                    value={editRefugioTelefono}
                    onChangeText={setEditRefugioTelefono}
                    keyboardType="phone-pad"
                  />
                  <Text style={styles.inputLabel}>Dirección</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Dirección"
                    value={editRefugioDireccion}
                    onChangeText={setEditRefugioDireccion}
                  />
                  <Text style={styles.inputLabel}>Ciudad</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ciudad"
                    value={editRefugioCiudad}
                    onChangeText={setEditRefugioCiudad}
                  />
                  <Text style={styles.inputLabel}>Código Postal</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Código Postal"
                    value={editRefugioCodigoPostal}
                    onChangeText={setEditRefugioCodigoPostal}
                    keyboardType="numeric"
                  />
                  <Text style={styles.inputLabel}>Municipio</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Municipio"
                    value={editRefugioMunicipio}
                    onChangeText={setEditRefugioMunicipio}
                  />
                  <Text style={styles.inputLabel}>RFC *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="RFC"
                    value={editRefugioRfc}
                    onChangeText={setEditRefugioRfc}
                  />

                  <TouchableOpacity style={styles.filePickerButton} onPress={() => pickImage(setEditRefugioLogo)}>
                    <Text style={styles.filePickerButtonText}>Seleccionar Nuevo Logo</Text>
                  </TouchableOpacity>
                  {editRefugioLogo && <Text style={styles.fileName}>{editRefugioLogo.name}</Text>}
                  {currentRefugioLogo && !editRefugioLogo && (
                    <Image source={{ uri: `http://192.168.1.119:3000${currentRefugioLogo}` }} style={styles.logoPreview} />
                  )}
                  {editRefugioLogo && (
                    <Image source={{ uri: editRefugioLogo.uri }} style={styles.logoPreview} />
                  )}

                  <TouchableOpacity style={styles.filePickerButton} onPress={() => pickDocument(setEditRefugioDocumentos, true)}>
                    <Text style={styles.filePickerButtonText}>Seleccionar Nuevos Documentos (Múltiples)</Text>
                  </TouchableOpacity>
                  {editRefugioDocumentos.length > 0 && (
                    <Text style={styles.fileName}>
                      {editRefugioDocumentos.map(doc => doc.name).join(', ')}
                    </Text>
                  )}
                  {currentRefugioDocumentos.length > 0 && editRefugioDocumentos.length === 0 && (
                    <Text style={styles.fileName}>
                      Documentos actuales: {currentRefugioDocumentos.map(doc => doc.split('/').pop()).join(', ')}
                    </Text>
                  )}

                  <TouchableOpacity style={styles.filePickerButton} onPress={() => pickDocument(setEditRefugioFormularioAdopcion)}>
                    <Text style={styles.filePickerButtonText}>Seleccionar Nuevo Formulario de Adopción</Text>
                  </TouchableOpacity>
                  {editRefugioFormularioAdopcion && <Text style={styles.fileName}>{editRefugioFormularioAdopcion.name}</Text>}
                  {currentRefugioFormularioAdopcion && !editRefugioFormularioAdopcion && (
                    <Text style={styles.fileName}>Formulario actual: {currentRefugioFormularioAdopcion.split('/').pop()}</Text>
                  )}
                </>
              )}
            </ScrollView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCloseModal}
                disabled={isSubmitting}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, isSubmitting && styles.disabledButton]}
                onPress={handleSaveEdit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de Detalles de Insumos */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={insumosModalVisible}
        onRequestClose={() => setInsumosModalVisible(false)}
      >
        <View style={styles.modalOverlay}> {/* Usar el estilo de overlay de refugio.js */}
          <View style={styles.modalContenido}> {/* Usar el estilo de modalContenido de refugio.js */}
            <Text style={styles.modalTitle}>Detalles de Insumos Donados</Text>
            {cargandoInsumos ? (
              <ActivityIndicator size="small" color="#a26b6c" />
            ) : (
              <FlatList
                data={listaInsumos}
                renderItem={({ item }) => <ItemInsumo item={item} />}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={() => (
                  <Text style={styles.emptyListText}>No hay insumos donados.</Text>
                )}
              />
            )}
            <TouchableOpacity
              style={styles.modalBoton} // Usar el estilo de modalBoton de refugio.js
              onPress={() => setInsumosModalVisible(false)}
            >
              <Text style={styles.modalBotonTexto}>Cerrar</Text> {/* Usar el estilo de modalBotonTexto de refugio.js */}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================================
// STYLES SECTION
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollableContent: { // Nuevo estilo para el ScrollView que envuelve el dashboard
    flex: 1,
    padding: 15,
  },
  content: { // Mantener para los componentes de FlatList
    flex: 1,
    paddingHorizontal: 15, // Solo padding horizontal para FlatList
  },

  cargandoTexto: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },

  header: {
    backgroundColor: '#a26b6c',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  bienvenidaTexto: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  adminNombre: {
    color: '#ffe6e6',
    fontSize: 16,
    fontWeight: '500',
  },
  adminEmail: {
    color: '#ffcccc',
    fontSize: 14,
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

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#a26b6c',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#a26b6c',
    fontWeight: 'bold',
  },

  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#a26b6c',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },

  insumosSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insumosText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  verDetallesBtn: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  verDetallesText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },

  listItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  itemDescription: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 5,
  },
  itemRol: {
    fontSize: 12,
    color: '#a26b6c',
    fontWeight: '600',
    marginTop: 5,
    backgroundColor: '#ffe6e6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 5,
    marginLeft: 5,
  },
  actionButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    marginLeft: 10,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },

  // Estilos del modal de edición (adaptados de refugio.js)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center', // Centrar el modal horizontalmente
    padding: 20,
  },
  editModalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%', // Ancho fijo para el modal
    maxHeight: '80%', // Altura máxima para el modal
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editModalContent: {
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  filePickerButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  filePickerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fileName: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
    textAlign: 'center',
  },
  profileImagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 15,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: '#eee',
  },
  logoPreview: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 15,
    resizeMode: 'contain',
    borderWidth: 1,
    borderColor: '#eee',
  },
  // Botones del modal de edición (adaptados de refugio.js)
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 0, // Ajustado para que no haya margen inferior excesivo
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#4CAF50', // Color de éxito
  },
  cancelButton: {
    backgroundColor: '#e0e0e0', // Color de cancelar de refugio.js
  },
  disabledButton: {
    backgroundColor: '#A5D6A7',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff', // Texto blanco para ambos botones
    fontWeight: 'bold',
  },

  // Estilos del modal de insumos (adaptados de refugio.js)
  modalContenido: { // Renombrado de modalContent a modalContenido para consistencia
    backgroundColor: 'white',
    borderRadius: 15, // Más redondeado
    padding: 25, // Más padding
    width: '90%',
    maxWidth: 400, // Ancho máximo
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#a26b6c',
  },
  insumoListItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  insumoItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  insumoItemSubtitle: {
    fontSize: 14,
    color: '#555',
  },
  insumoItemStatus: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#007bff',
  },
  insumoItemDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  // Botón de cerrar del modal de insumos (adaptado de refugio.js)
  modalBoton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  modalBotonTexto: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});