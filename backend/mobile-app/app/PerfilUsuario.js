import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
  ImageBackground, // Importar ImageBackground
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// ==========================================
// CONFIGURACIÓN Y CONSTANTES
// ==========================================

const API_BASE_URL = 'http://192.168.1.119:3000/api';
const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.80; // Aunque ya no es un menú lateral, mantenemos la constante por si se reutiliza.

// ==========================================
// SERVICIOS DE API
// ==========================================

class PerfilService {
  static configurarAxios() {
    axios.interceptors.request.handlers = [];
    axios.interceptors.response.handlers = [];

    axios.interceptors.request.use(
      (config) => {
        console.log('🚀 Request a:', config.url);
        return config;
      },
      (error) => {
        console.log('❌ Error en request:', error);
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      (response) => {
        console.log('✅ Respuesta de:', response.config.url);
        console.log('📊 Status:', response.status);
        return response;
      },
      (error) => {
        console.log('❌ Error en response:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  static async obtenerDatosUsuario(usuarioId) {
    try {
      this.configurarAxios();

      if (!usuarioId) {
        throw new Error('ID de usuario no proporcionado');
      }

      console.log('🔍 Obteniendo datos para usuario ID:', usuarioId);

      const response = await axios.get(`${API_BASE_URL}/usuarios/${usuarioId}`, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('📋 Respuesta completa del servidor:', response.data);

      if (response.data && response.data.success && response.data.usuario) {
        return {
          exito: true,
          datos: response.data.usuario
        };
      } else {
        throw new Error(response.data?.message || 'Respuesta del servidor no válida');
      }
    } catch (error) {
      console.log('💥 Error en obtenerDatosUsuario:', error);
      return {
        exito: false,
        error: this.manejarErrorAPI(error)
      };
    }
  }

  static async actualizarPerfil(usuarioId, datosActualizados) {
    try {
      this.configurarAxios();

      if (!usuarioId) {
        throw new Error('ID de usuario no proporcionado');
      }

      console.log('💾 Actualizando usuario:', usuarioId, 'con datos:', datosActualizados);

      const response = await axios.put(
        `${API_BASE_URL}/usuarios/${usuarioId}`,
        datosActualizados,
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('📋 Respuesta de actualización:', response.data);

      if (response.data && response.data.success) {
        return {
          exito: true,
          datos: response.data.usuario,
          mensaje: response.data.message
        };
      } else {
        throw new Error(response.data?.message || 'Error al actualizar perfil');
      }
    } catch (error) {
      console.log('💥 Error en actualizarPerfil:', error);
      return {
        exito: false,
        error: this.manejarErrorAPI(error)
      };
    }
  }

  static manejarErrorAPI(error) {
    console.log('🔧 Manejando error:', error);

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message;

      console.log('📊 Status del error:', status);
      console.log('📝 Mensaje del error:', message);

      switch (status) {
        case 401:
          return {
            mensaje: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
            esErrorSesion: true
          };
        case 403:
          return {
            mensaje: 'No tienes permisos para realizar esta acción.',
            esErrorSesion: false
          };
        case 404:
          return {
            mensaje: 'Usuario no encontrado. Verifica que tu cuenta esté activa.',
            esErrorSesion: true
          };
        case 400:
          return {
            mensaje: message || 'Datos inválidos. Verifica la información.',
            esErrorSesion: false
          };
        case 409:
          return {
            mensaje: 'Conflicto: ' + (message || 'Datos duplicados'),
            esErrorSesion: false
          };
        case 500:
          return {
            mensaje: 'Error del servidor. Inténtalo más tarde.' + (message ? ` (${message})` : ''),
            esErrorSesion: false
          };
        default:
          return {
            mensaje: message || `Error del servidor (${status})`,
            esErrorSesion: false
          };
      }
    } else if (error.request) {
      console.log('🌐 Error de conexión:', error.request);
      return {
        mensaje: 'No se pudo conectar con el servidor. Verifica tu conexión a internet y que el servidor esté ejecutándose en ' + API_BASE_URL.replace('/api', ''),
        esErrorSesion: false
      };
    } else {
      console.log('🔧 Error de configuración:', error.message);
      return {
        mensaje: error.message || 'Error inesperado',
        esErrorSesion: false
      };
    }
  }
}

// ==========================================
// UTILIDADES
// ==========================================

const UtilsUsuario = {
  extraerIdUsuario: (params) => {
    console.log('🔍 Extrayendo ID de usuario de params:', params);
    if (!params) return null;
    if (params.usuarioId) return params.usuarioId;
    if (params.id) return params.id;
    const posiblesIds = [
      params.idUsuario, params._id, params.usuario?.id, params.usuario?.usuarioId,
      params.usuario?._id, params.usuario?.idUsuario, params.user?.id,
      params.user?.usuarioId, params.user?._id
    ];
    for (const id of posiblesIds) {
      if (id) return id;
    }
    console.log('❌ No se encontró ID de usuario en params');
    return null;
  },

  normalizarDatosUsuario: (datos, idOriginal) => {
    if (!datos) return null;
    const id = datos.id || datos._id || datos.idUsuario || datos.usuarioId || idOriginal;
    return {
      ...datos,
      id: id,
      _id: id,
      idUsuario: id,
      usuarioId: id,
      nombre: datos.nombre || '',
      apellido: datos.apellido || '',
      email: datos.email || '',
      telefono: datos.telefono || '',
      direccion: datos.direccion || '',
      id_rol: datos.id_rol || datos.rol || 4, // Default a 4 (usuario normal)
      fecha_registro: datos.fecha_registro || new Date()
    };
  },

  validarUsuarioCompleto: (usuario) => {
    return usuario && usuario.id && usuario.email && (usuario.nombre || usuario.apellido);
  }
};

// ==========================================
// COMPONENTES AUXILIARES
// ==========================================

const CampoInfo = ({ icono, texto, mostrarSiVacio = false, label }) => {
  if (!texto && !mostrarSiVacio) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.iconContainerInfo}>
        <Text style={styles.iconInfo}>{icono}</Text>
      </View>
      <View style={styles.infoContent}>
        {label && <Text style={styles.infoLabel}>{label}</Text>}
        <Text style={styles.datos}>{texto || 'No especificado'}</Text>
      </View>
    </View>
  );
};

const LoadingOverlay = ({ visible, texto = 'Cargando...' }) => {
  if (!visible) return null;
  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a26b6c" />
        <Text style={styles.loadingText}>{texto}</Text>
      </View>
    </View>
  );
};

const EstadoConexion = ({ conectado, onReintento }) => {
  if (conectado) return null;
  return (
    <View style={styles.estadoConexion}>
      <Text style={styles.estadoConexionTexto}>
        ⚠️ Sin conexión al servidor
      </Text>
      <TouchableOpacity style={styles.botonReintento} onPress={onReintento}>
        <Text style={styles.textoBotonReintento}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function PerfilScreen() {
  const [userData, setUserData] = useState(null);
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [conectado, setConectado] = useState(true);

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoApellido, setNuevoApellido] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevaImagen, setNuevaImagen] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [contenidoModal, setContenidoModal] = useState('');
  const [tituloModal, setTituloModal] = useState('');

  // Estado para controlar si se muestra el menú de opciones o la información del perfil
  const [mostrarOpcionesMenu, setMostrarOpcionesMenu] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();

  const paramsUsuario = route.params || {};
  const usuarioId = UtilsUsuario.extraerIdUsuario(paramsUsuario);

  console.log('📱 Parámetros recibidos:', paramsUsuario);
  console.log('🆔 ID del usuario extraído:', usuarioId);

  // ==========================================
  // EFECTOS Y LIFECYCLE
  // ==========================================

  useEffect(() => {
    console.log('📱 PerfilScreen montado');
    console.log('👤 Parámetros completos:', JSON.stringify(paramsUsuario, null, 2));

    if (!usuarioId) {
      console.error('❌ No se encontró ID del usuario');
      mostrarErrorSesion('No se pudo identificar el usuario. Los datos de sesión son inválidos.');
      return;
    }

    cargarDatosUsuario();
  }, [usuarioId]);

  useFocusEffect(
    useCallback(() => {
      if (usuarioId && !editando && !loading && !refreshing) {
        console.log('🔄 Pantalla en foco, recargando datos...');
        cargarDatosUsuario(true);
      }
    }, [usuarioId, editando, loading, refreshing])
  );

  // ==========================================
  // FUNCIONES PRINCIPALES
  // ==========================================

  const cargarDatosUsuario = async (esRefresh = false) => {
    try {
      if (!esRefresh) setLoading(true);
      setConectado(true);

      console.log('📡 Cargando datos del usuario:', usuarioId);

      const resultado = await PerfilService.obtenerDatosUsuario(usuarioId);

      if (resultado.exito) {
        console.log('✅ Datos cargados exitosamente:', resultado.datos);
        const datosNormalizados = UtilsUsuario.normalizarDatosUsuario(resultado.datos, usuarioId);
        if (UtilsUsuario.validarUsuarioCompleto(datosNormalizados)) {
          setUserData(datosNormalizados);
          initializarFormulario(datosNormalizados);
          setConectado(true);
        } else {
          throw new Error('Datos de usuario incompletos recibidos del servidor');
        }
      } else {
        console.log('⚠️ Error al cargar desde servidor:', resultado.error);
        setConectado(false);
        if (resultado.error.esErrorSesion) {
          mostrarErrorSesion(resultado.error.mensaje);
        } else {
          const datosFallback = crearDatosFallback();
          if (datosFallback) {
            console.log('📄 Usando datos de fallback');
            setUserData(datosFallback);
            initializarFormulario(datosFallback);
            Alert.alert('Error de conexión',
              resultado.error.mensaje + '\n\nSe muestran los datos básicos. Conecta a internet para actualizar tu perfil.');
          } else {
            Alert.alert('Error de conexión',
              resultado.error.mensaje + '\n\nNo se pudieron cargar los datos del perfil.');
          }
        }
      }
    } catch (error) {
      console.error('💥 Error inesperado en cargarDatosUsuario:', error);
      setConectado(false);
      const datosFallback = crearDatosFallback();
      if (datosFallback) {
        setUserData(datosFallback);
        initializarFormulario(datosFallback);
        Alert.alert('Modo sin conexión',
          'Se muestran los datos almacenados localmente. Conecta a internet para actualizar.');
      } else {
        Alert.alert('Error', 'Ocurrió un error inesperado al cargar los datos');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const crearDatosFallback = () => {
    if (paramsUsuario.usuarioNombre || paramsUsuario.nombre ||
        (paramsUsuario.usuario && (paramsUsuario.usuario.nombre || paramsUsuario.usuario.usuarioNombre))) {
      const usuario = paramsUsuario.usuario || paramsUsuario;
      console.log('📄 Creando datos de fallback desde params:', usuario);
      return UtilsUsuario.normalizarDatosUsuario({
        id: usuarioId,
        nombre: usuario.usuarioNombre || usuario.nombre || '',
        apellido: usuario.usuarioApellido || usuario.apellido || '',
        email: usuario.usuarioEmail || usuario.email || '',
        telefono: usuario.usuarioTelefono || usuario.telefono || '',
        direccion: usuario.usuarioDireccion || usuario.direccion || '',
        id_rol: usuario.rol || usuario.id_rol || 4,
        fecha_registro: new Date()
      }, usuarioId);
    }
    return null;
  };

  const initializarFormulario = (datosUsuario) => {
    if (!datosUsuario) return;
    console.log('🔧 Inicializando formulario con:', datosUsuario);
    setNuevoNombre(datosUsuario.nombre || '');
    setNuevoApellido(datosUsuario.apellido || '');
    setNuevaDireccion(datosUsuario.direccion || '');
    setNuevoTelefono(datosUsuario.telefono || '');
  };

  const onRefresh = useCallback(() => {
    console.log('🔄 Ejecutando refresh...');
    setRefreshing(true);
    cargarDatosUsuario(true);
  }, [usuarioId]);

  // ==========================================
  // FUNCIONES DE VALIDACIÓN
  // ==========================================

  const validarDatos = () => {
    const nombre = nuevoNombre.trim();
    const apellido = nuevoApellido.trim();
    const telefono = nuevoTelefono.trim();

    if (!nombre || nombre.length < 2) {
      Alert.alert('Error de validación', 'El nombre debe tener al menos 2 caracteres');
      return false;
    }
    if (!apellido || apellido.length < 2) {
      Alert.alert('Error de validación', 'El apellido debe tener al menos 2 caracteres');
      return false;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
      Alert.alert('Error de validación', 'El nombre solo puede contener letras');
      return false;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellido)) {
      Alert.alert('Error de validación', 'El apellido solo puede contener letras');
      return false;
    }
    if (telefono && telefono.length < 10) {
      Alert.alert('Error de validación', 'El teléfono debe tener al menos 10 dígitos');
      return false;
    }
    if (telefono && !/^[\d\s\-\+\$\$]+$/.test(telefono)) { // Corregida la regex para incluir paréntesis
      Alert.alert('Error de validación', 'El teléfono solo puede contener números y los caracteres +, -, (, )');
      return false;
    }
    return true;
  };

  // ==========================================
  // FUNCIONES DE IMAGEN
  // ==========================================

  const seleccionarImagen = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert(
          'Permiso denegado',
          'Se necesita acceso a la galería para cambiar la foto de perfil'
        );
        return;
      }

      Alert.alert(
        'Cambiar foto de perfil',
        'Selecciona una opción',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Galería', onPress: () => abrirGaleria() },
          { text: 'Cámara', onPress: () => abrirCamara() }
        ]
      );
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo acceder a la galería');
    }
  };

  const abrirGaleria = async () => {
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: false,
      });

      if (!resultado.canceled && resultado.assets && resultado.assets[0]) {
        setNuevaImagen(resultado.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al abrir galería:', error);
      Alert.alert('Error', 'No se pudo abrir la galería');
    }
  };

  const abrirCamara = async () => {
    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara');
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: false,
      });

      if (!resultado.canceled && resultado.assets && resultado.assets[0]) {
        setNuevaImagen(resultado.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al abrir cámara:', error);
      Alert.alert('Error', 'No se pudo abrir la cámara');
    }
  };

  // ==========================================
  // FUNCIONES DE CRUD
  // ==========================================

  const guardarCambios = async () => {
    if (!validarDatos()) return;
    if (!conectado) {
      Alert.alert('Sin conexión', 'Necesitas conexión a internet para guardar los cambios.');
      return;
    }

    try {
      setGuardando(true);
      console.log('💾 Guardando cambios...');

      const datosActualizados = {
        nombre: nuevoNombre.trim(),
        apellido: nuevoApellido.trim(),
        telefono: nuevoTelefono.trim(),
        direccion: nuevaDireccion.trim(),
      };

      console.log('📦 Datos a enviar:', datosActualizados);

      const resultado = await PerfilService.actualizarPerfil(usuarioId, datosActualizados);

      if (resultado.exito) {
        console.log('✅ Perfil actualizado exitosamente');
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
        const datosActualizadosCompletos = UtilsUsuario.normalizarDatosUsuario({
          ...userData,
          ...datosActualizados
        }, usuarioId);
        setUserData(datosActualizadosCompletos);
        setEditando(false);
        setConectado(true);
        setTimeout(() => {
          cargarDatosUsuario();
        }, 1000);
      } else {
        console.log('❌ Error al actualizar:', resultado.error);
        if (resultado.error.esErrorSesion) {
          mostrarErrorSesion(resultado.error.mensaje);
        } else {
          setConectado(false);
          Alert.alert('Error', resultado.error.mensaje);
        }
      }
    } catch (error) {
      console.error('💥 Error inesperado al guardar:', error);
      setConectado(false);
      Alert.alert('Error', 'Ocurrió un error inesperado al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  const cancelarEdicion = () => {
    console.log('❌ Cancelando edición');
    if (userData) {
      initializarFormulario(userData);
    }
    setEditando(false);
  };

  // ==========================================
  // FUNCIONES DE UI
  // ==========================================

  const toggleMostrarOpcionesMenu = () => {
    setMostrarOpcionesMenu(!mostrarOpcionesMenu);
  };

  const menuItems = [
    {
      title: 'Inicio',
      icon: 'home-outline',
      route: 'NosotrosScreen',
      color: '#FF6B6B',
    },
    {
      title: 'Mascotas',
      icon: 'home-outline',
      route: 'CatalogoMascotas',
      color: '#A4645E',
    },
    {
      title: 'Donaciones',
      icon: 'gift-outline',
      route: 'Donaciones',
      color: '#28a745',
    },
    {
      title: 'Notificaciones',
      icon: 'notifications-outline',
      action: () => abrirModal('notificaciones'),
      color: '#17a2b8',
    },
    {
      title: 'Privacidad y Seguridad',
      icon: 'lock-closed-outline',
      action: () => abrirModal('privacidad'),
      color: '#6f42c1',
    },
    {
      title: 'Ayuda y Soporte',
      icon: 'help-circle-outline',
      action: () => abrirModal('ayuda'),
      color: '#fd7e14',
    },
    {
      title: 'Términos y Condiciones',
      icon: 'document-text-outline',
      action: () => abrirModal('terminos'),
      color: '#6c757d',
    },
  ];

  const abrirModal = (tipo) => {
    let titulo = '';
    let contenido = '';

    switch (tipo) {
      case 'notificaciones':
        titulo = 'Notificaciones';
        contenido = 'No tienes notificaciones nuevas.\n\nAquí aparecerán las actualizaciones sobre tus donaciones y actividades en la plataforma.';
        break;
      case 'privacidad':
        titulo = 'Privacidad y Seguridad';
        contenido = 'Funcionalidad para cambiar contraseña.\n\nTu información está protegida y solo tú puedes modificarla.';
        break;
      case 'ayuda':
        titulo = 'Ayuda y Soporte';
        contenido = '¿Necesitas ayuda?\n\n📧 Email: devs@patitasconectadas.com\n📞 Teléfono: +52 123 456 7890\n\nEstamos aquí para ayudarte con cualquier problema o pregunta.';
        break;
      case 'terminos':
        titulo = 'Términos y Condiciones';
        contenido = 'Al usar esta aplicación, aceptas:\n\n• Usar la plataforma de manera responsable\n• Proporcionar información veraz\n• Respetar a los refugios y otros usuarios\n• No usar la app para fines comerciales no autorizados';
        break;
      default:
        contenido = '';
    }

    setTituloModal(titulo);
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
            console.log('🚪 Cerrando sesión...');
            navigation.reset({
              index: 0,
              routes: [{ name: 'inicio_sesion' }],
            });
          },
        },
      ]
    );
  };

  const mostrarErrorSesion = (mensaje = 'No se pudieron obtener los datos del usuario. Por favor, inicia sesión nuevamente.') => {
    Alert.alert(
      'Error de sesión',
      mensaje,
      [
        {
          text: 'Ir al Login',
          onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: 'inicio_sesion' }],
          })
        }
      ],
      { cancelable: false }
    );
  };

  const reintentar = () => {
    console.log('🔄 Reintentando conexión...');
    cargarDatosUsuario();
  };

  // ==========================================
  // RENDER CONDICIONAL
  // ==========================================

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />
        <ActivityIndicator size="large" color="#a26b6c" />
        <Text style={styles.cargandoTexto}>Cargando perfil...</Text>
        <Text style={styles.cargandoSubtexto}>ID Usuario: {usuarioId || 'No disponible'}</Text>
      </SafeAreaView>
    );
  }

  if (!userData && !loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />
        <Text style={styles.errorText}>No se pudieron cargar los datos del perfil</Text>
        <Text style={styles.errorSubtext}>Usuario ID: {usuarioId || 'No disponible'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => cargarDatosUsuario()}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.retryButton, styles.goBackButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ==========================================
  // RENDER PRINCIPAL
  // ==========================================

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMostrarOpcionesMenu} style={styles.menuButton}>
          <View style={styles.hamburgerContainer}>
            <View style={[styles.hamburgerLine, mostrarOpcionesMenu && styles.hamburgerLineActive]} />
            <View style={[styles.hamburgerLine, styles.hamburgerLineMiddle, mostrarOpcionesMenu && styles.hamburgerLineMiddleActive]} />
            <View style={[styles.hamburgerLine, mostrarOpcionesMenu && styles.hamburgerLineActive]} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mostrarOpcionesMenu ? 'Menú' : 'Mi Perfil'}
        </Text>
      </View>

      <ImageBackground
        source={require('../assets/Fondo.png')} // Asegúrate de que la ruta sea correcta
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.contentOverlay}>
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scroll}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#a26b6c']}
                tintColor="#a26b6c"
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Estado de conexión */}
            <EstadoConexion conectado={conectado} onReintento={reintentar} />

            {mostrarOpcionesMenu ? (
              // Contenido del menú de opciones
              <View style={styles.menuOpcionesContainer}>
                <View style={styles.menuHeaderOpciones}>
                  <View style={styles.profileSectionOpciones}>
                    <View style={styles.avatarContainerMenuOpciones}>
                      <Ionicons name="person" size={32} color="#fff" />
                    </View>
                    <View style={styles.profileInfoOpciones}>
                      <Text style={styles.welcomeTextOpciones}>¡Hola!</Text>
                      <Text style={styles.appNameOpciones}>
                        {`${userData?.nombre || ''} ${userData?.apellido || ''}`.trim() || 'Usuario'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.menuSectionOpciones}>
                  <Text style={styles.sectionTitleMenuOpciones}>NAVEGACIÓN</Text>

                  {menuItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.menuItemOpciones}
                      onPress={() => {
                        toggleMostrarOpcionesMenu(); // Cierra el menú al seleccionar una opción
                        if (item.route) {
                          navigation.navigate(item.route);
                        } else if (item.action) {
                          item.action();
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.iconContainerOpciones, { backgroundColor: item.color }]}>
                        <Ionicons name={item.icon} size={22} color="#fff" />
                      </View>
                      <Text style={styles.menuItemTextOpciones}>{item.title}</Text>
                      <Ionicons name="chevron-forward" size={20} color="#B0BEC5" />
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.logoutSectionOpciones}>
                  <View style={styles.dividerOpciones} />
                  <TouchableOpacity
                    style={styles.logoutItemOpciones}
                    onPress={() => {
                      toggleMostrarOpcionesMenu();
                      cerrarSesion();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.logoutIconContainerOpciones}>
                      <Ionicons name="log-out-outline" size={22} color="#FF5252" />
                    </View>
                    <Text style={styles.logoutTextOpciones}>Cerrar Sesión</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.menuFooterOpciones}>
                  <Text style={styles.footerTextOpciones}>Versión 1.0.0</Text>
                  <Text style={styles.footerSubtextOpciones}>Patitas Conectadas © 2024</Text>
                </View>
              </View>
            ) : (
              // Sección de Perfil (información del usuario)
              <View style={styles.section}>
                <View style={styles.logoContainer}>
                  <TouchableOpacity
                    onPress={editando ? seleccionarImagen : null}
                    activeOpacity={editando ? 0.7 : 1}
                  >
                    {nuevaImagen ? (
                      <Image source={{ uri: nuevaImagen }} style={styles.logo} />
                    ) : (
                      <View style={[styles.logo, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarText}>
                          {userData.nombre ? userData.nombre.charAt(0).toUpperCase() : '👤'}
                        </Text>
                      </View>
                    )}
                    {editando && (
                      <Text style={styles.cambiarImagenText}>Toca para cambiar foto</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {editando ? (
                  <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.formularioWrapper}
                  >
                    <View style={styles.formularioContainer}>
                      <Text style={styles.sectionTitle}>Editar información personal</Text>

                      <Text style={styles.inputLabel}>Nombre *</Text>
                      <TextInput
                        style={styles.input}
                        value={nuevoNombre}
                        onChangeText={setNuevoNombre}
                        placeholder="Ingresa tu nombre"
                        maxLength={50}
                        editable={!guardando}
                        autoCapitalize="words"
                      />

                      <Text style={styles.inputLabel}>Apellido *</Text>
                      <TextInput
                        style={styles.input}
                        value={nuevoApellido}
                        onChangeText={setNuevoApellido}
                        placeholder="Ingresa tu apellido"
                        maxLength={50}
                        editable={!guardando}
                        autoCapitalize="words"
                      />

                      <Text style={styles.inputLabel}>Teléfono</Text>
                      <TextInput
                        style={styles.input}
                        value={nuevoTelefono}
                        onChangeText={setNuevoTelefono}
                        placeholder="Ej: +52 123 456 7890"
                        keyboardType="phone-pad"
                        maxLength={15}
                        editable={!guardando}
                      />

                      <Text style={styles.inputLabel}>Dirección</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={nuevaDireccion}
                        onChangeText={setNuevaDireccion}
                        placeholder="Ingresa tu dirección completa"
                        multiline
                        numberOfLines={3}
                        maxLength={200}
                        editable={!guardando}
                        textAlignVertical="top"
                      />

                      <Text style={styles.camposObligatorios}>* Campos obligatorios</Text>
                    </View>

                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={[styles.button, styles.cancelButton, guardando && styles.disabledButton]}
                        onPress={cancelarEdicion}
                        disabled={guardando}
                      >
                        <Text style={styles.buttonText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, styles.saveButton, guardando && styles.disabledButton]}
                        onPress={guardarCambios}
                        disabled={guardando}
                      >
                        {guardando ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <Text style={styles.buttonText}>Guardar</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </KeyboardAvoidingView>
                ) : (
                  <>
                    <Text style={styles.nombre}>
                      {`${userData.nombre || ''} ${userData.apellido || ''}`.trim() || 'Usuario sin nombre'}
                    </Text>

                    <TouchableOpacity
                      style={[styles.editButton, !conectado && styles.disabledButton]}
                      onPress={() => setEditando(true)}
                      disabled={!conectado}
                    >
                      <Text style={styles.editText}>✏️ Editar Perfil</Text>
                    </TouchableOpacity>

                    <View style={styles.infoContainer}>
                      <CampoInfo
                        icono="📧"
                        texto={userData.email}
                        label="Email"
                        mostrarSiVacio={true}
                      />
                      <CampoInfo
                        icono="📞"
                        texto={userData.telefono}
                        label="Teléfono"
                      />
                      <CampoInfo
                        icono="📍"
                        texto={userData.direccion}
                        label="Dirección"
                      />
                      <CampoInfo
                        icono="🏷️"
                        texto={userData.id_rol === 5 ? 'Administrador' : 'Usuario'}
                        label="Tipo de cuenta"
                        mostrarSiVacio={true}
                      />

                      <View style={styles.infoRow}>
                        <View style={styles.iconContainerInfo}>
                          <Text style={styles.iconInfo}>📅</Text>
                        </View>
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Miembro desde</Text>
                          <Text style={styles.datos}>
                            {new Date(userData.fecha_registro || Date.now()).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {!conectado && (
                      <Text style={styles.avisoSinConexion}>
                        Conecta a internet para editar tu perfil
                      </Text>
                    )}
                  </>
                )}
              </View>
            )}

            {/* Espaciado inferior */}
            <View style={styles.espaciadoInferior} />
          </ScrollView>
        </View>
      </ImageBackground>

      {/* Modal para opciones */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>{tituloModal}</Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTexto}>{contenidoModal}</Text>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalBoton}
            >
              <Text style={styles.modalBotonTexto}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Loading overlay */}
      <LoadingOverlay visible={guardando} texto="Guardando cambios..." />
    </SafeAreaView>
  );
}

// ==========================================
// ESTILOS
// ==========================================

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
    fontSize: 16,
    color: '#666',
  },
  cargandoSubtexto: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
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
  menuButton: {
    marginRight: 15,
  },
  hamburgerContainer: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: '100%',
    height: 2,
    backgroundColor: 'white',
    borderRadius: 1,
  },
  hamburgerLineMiddle: {
    width: '80%',
  },
  hamburgerLineActive: {
    backgroundColor: 'white',
  },
  hamburgerLineMiddleActive: {
    width: '60%',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  scrollContainer: {
    flex: 1,
  },
  scroll: {
    padding: 15,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    borderWidth: 4,
    borderColor: '#a26b6c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  avatarPlaceholder: {
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 40,
    color: '#6c757d',
    fontWeight: 'bold'
  },
  cambiarImagenText: {
    fontSize: 14,
    color: '#0066ff',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500'
  },
  editButton: {
    backgroundColor: '#0066ff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    marginTop: 10,
  },
  editText: {
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    marginHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  nombre: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoContainer: {
    width: '100%',
    marginTop: 15,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#a26b6c',
  },
  iconContainerInfo: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#a26b6c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    marginTop: 2,
  },
  iconInfo: {
    fontSize: 16,
    color: 'white',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  datos: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    lineHeight: 22,
  },
  formularioWrapper: {
    width: '100%',
  },
  formularioContainer: {
    width: '100%',
    marginBottom: 20,
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
  camposObligatorios: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#A5D6A7',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  avisoSinConexion: {
    fontSize: 12,
    color: '#e63946',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  estadoConexion: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    padding: 10,
    marginVertical: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  estadoConexionTexto: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  botonReintento: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  textoBotonReintento: {
    color: '#212529',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContenido: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalTexto: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'left',
  },
  modalBoton: {
    backgroundColor: '#0066ff',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
    fontWeight: '600',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#0066ff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
  },
  goBackButton: {
    backgroundColor: '#6c757d',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  espaciadoInferior: {
    height: 30,
  },

  // Estilos para el menú de opciones integrado
  menuOpcionesContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    marginHorizontal: 0,
  },
  menuHeaderOpciones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: '#a26b6c', // Color de fondo del header
    borderRadius: 8,
    marginBottom: 15,
  },
  profileSectionOpciones: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainerMenuOpciones: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498DB', // Color de avatar
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  profileInfoOpciones: {
    flex: 1,
  },
  welcomeTextOpciones: {
    color: '#B0BEC5',
    fontSize: 12,
  },
  appNameOpciones: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuSectionOpciones: {
    paddingTop: 15,
    paddingBottom: 10,
  },
  sectionTitleMenuOpciones: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#78909C',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  menuItemOpciones: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 5,
    backgroundColor: '#f9f9f9', // Fondo más claro para ítems
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#a26b6c',
  },
  iconContainerOpciones: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemTextOpciones: {
    color: '#000000',
    fontSize: 14,
    flex: 1,
  },
  logoutSectionOpciones: {
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  dividerOpciones: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  logoutItemOpciones: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },
  logoutIconContainerOpciones: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  logoutTextOpciones: {
    color: '#FF5252',
    fontSize: 14,
  },
  menuFooterOpciones: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 10,
    alignItems: 'center',
  },
  footerTextOpciones: {
    color: '#78909C',
    fontSize: 12,
    textAlign: 'center',
  },
  footerSubtextOpciones: {
    color: '#546E7A',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 5,
  },
});
