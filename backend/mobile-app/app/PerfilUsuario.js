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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';

// ==========================================
// CONFIGURACIÓN Y CONSTANTES
// ==========================================

const API_BASE_URL = 'http://192.168.1.119:3000/api';

// ==========================================
// SERVICIOS DE API
// ==========================================

class PerfilService {
  static configurarAxios() {
    // Limpiar interceptores anteriores para evitar duplicados
    axios.interceptors.request.handlers = [];
    axios.interceptors.response.handlers = [];

    axios.interceptors.request.use(
      (config) => {
        console.log('🚀 Request a:', config.url);
        console.log('📦 Datos:', config.data);
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
        console.log('📄 Data:', response.data);
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
            mensaje: 'Error del servidor. Inténtalo más tarde.',
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
        mensaje: 'No se pudo conectar con el servidor. Verifica tu conexión a internet y que el servidor esté ejecutándose en http://192.168.1.119:3000',
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
  // Extrae el ID del usuario desde diferentes fuentes posibles
  extraerIdUsuario: (params) => {
    console.log('🔍 Extrayendo ID de usuario de params:', params);
    
    if (!params) return null;
    
    // Buscar en diferentes ubicaciones posibles
    const posiblesIds = [
      params.usuarioId,
      params.id,
      params.idUsuario,
      params._id,
      params.usuario?.id,
      params.usuario?.usuarioId,
      params.usuario?._id,
      params.usuario?.idUsuario,
      // Para mantener compatibilidad con navegación desde login
      params.user?.id,
      params.user?.usuarioId,
      params.user?._id
    ];
    
    for (const id of posiblesIds) {
      if (id) {
        console.log('✅ ID encontrado:', id);
        return id;
      }
    }
    
    console.log('❌ No se encontró ID de usuario en params');
    return null;
  },

  // Normaliza los datos del usuario para consistencia
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
      id_rol: datos.id_rol || datos.rol || 4,
      fecha_registro: datos.fecha_registro || new Date()
    };
  },

  // Valida que el objeto usuario tenga los campos mínimos necesarios
  validarUsuarioCompleto: (usuario) => {
    return usuario && 
           usuario.id && 
           usuario.email && 
           (usuario.nombre || usuario.apellido);
  }
};

// ==========================================
// COMPONENTES AUXILIARES
// ==========================================

const BotonOpcion = ({ texto, onPress, color = '#4a4e69' }) => {
  const partes = texto.split(' ');
  const emoji = partes[0];
  const textoSinEmoji = partes.slice(1).join(' ');
  
  return (
    <TouchableOpacity 
      style={[styles.botonOpcion, { backgroundColor: color }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.opcionEmoji}>{emoji}</Text>
      <Text style={styles.opcionTexto}>{textoSinEmoji}</Text>
    </TouchableOpacity>
  );
};

const CampoInfo = ({ icono, texto, mostrarSiVacio = false, label }) => {
  if (!texto && !mostrarSiVacio) return null;
  
  return (
    <View style={styles.infoRow}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icono}</Text>
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
        <ActivityIndicator size="large" color="#4361ee" />
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
  // Estados principales
  const [userData, setUserData] = useState(null);
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [conectado, setConectado] = useState(true);
  
  // Estados del formulario
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoApellido, setNuevoApellido] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevaImagen, setNuevaImagen] = useState(null);
  
  // Estados del modal
  const [modalVisible, setModalVisible] = useState(false);
  const [contenidoModal, setContenidoModal] = useState('');
  const [tituloModal, setTituloModal] = useState('');

  const navigation = useNavigation();
  const route = useRoute();
  
  // Extraer datos del usuario desde los parámetros
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

  // Recargar datos cuando la pantalla vuelva al foco
  useFocusEffect(
    useCallback(() => {
      if (usuarioId && !editando && !loading) {
        console.log('🔄 Pantalla en foco, recargando datos...');
        cargarDatosUsuario();
      }
    }, [usuarioId, editando, loading])
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
          // Intentar usar datos de parámetros como fallback
          const datosFallback = crearDatosFallback();
          if (datosFallback) {
            console.log('📄 Usando datos de fallback');
            setUserData(datosFallback);
            initializarFormulario(datosFallback);
          } else {
            Alert.alert('Error de conexión', 
              resultado.error.mensaje + '\n\nPuedes ver los datos básicos, pero necesitarás conexión para actualizar tu perfil.');
          }
        }
      }
    } catch (error) {
      console.error('💥 Error inesperado:', error);
      setConectado(false);
      
      // Intentar fallback antes de mostrar error
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
    // Crear datos básicos desde parámetros si están disponibles
    if (paramsUsuario.nombre || paramsUsuario.usuarioNombre || 
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
    setNuevaImagen(datosUsuario.fotoPerfil || datosUsuario.imagen || null);
  };

  const onRefresh = useCallback(() => {
    console.log('🔄 Ejecutando refresh...');
    setRefreshing(true);
    cargarDatosUsuario(true);
  }, []);

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
    
    // Validar nombre y apellido que no contengan números
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
      Alert.alert('Error de validación', 'El nombre solo puede contener letras');
      return false;
    }
    
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellido)) {
      Alert.alert('Error de validación', 'El apellido solo puede contener letras');
      return false;
    }
    
    // Validar teléfono si se proporciona
    if (telefono && telefono.length < 10) {
      Alert.alert('Error de validación', 'El teléfono debe tener al menos 10 dígitos');
      return false;
    }
    
    if (telefono && !/^[\d\s\-\+\(\)]+$/.test(telefono)) {
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
        base64: false, // Cambiar a false para mejor rendimiento
      });

      if (!resultado.canceled && resultado.assets[0]) {
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

      if (!resultado.canceled && resultado.assets[0]) {
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
        
        // Actualizar datos locales
        const datosActualizadosCompletos = UtilsUsuario.normalizarDatosUsuario({
          ...userData,
          ...datosActualizados
        }, usuarioId);
        
        setUserData(datosActualizadosCompletos);
        setEditando(false);
        setConectado(true);
        
        // Recargar datos del servidor para confirmar
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
    setNuevaImagen(userData?.fotoPerfil || userData?.imagen || null);
  };

  // ==========================================
  // FUNCIONES DE UI
  // ==========================================

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
        contenido = 'Funcionalidad para cambiar contraseña próximamente disponible.\n\nTu información está protegida y solo tú puedes modificarla.';
        break;
      case 'ayuda':
        titulo = 'Ayuda y Soporte';
        contenido = '¿Necesitas ayuda?\n\n📧 Email: devs@patitasconectadas.com\n📞 Teléfono: +52 123 456 7890\n\nEstamos aquí para ayudarte con cualquier problema o pregunta.';
        break;
      case 'terminos':
        titulo = 'Términos y Condiciones';
        contenido = 'Al usar esta aplicación, aceptas:\n\n• Usar la plataforma de manera responsable\n• Proporcionar información veraz\n• Respetar a los refugios y otros usuarios\n• No usar la app para fines comerciales no autorizados';
        break;
      case 'donaciones':
        titulo = 'Mis Donaciones';
        contenido = 'Funcionalidad para ver el historial de donaciones próximamente disponible.';
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
        <StatusBar barStyle="dark-content" backgroundColor="#a2d2ff" />
        <ActivityIndicator size="large" color="#4361ee" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
        <Text style={styles.loadingSubtext}>ID Usuario: {usuarioId}</Text>
      </SafeAreaView>
    );
  }

  if (!userData && !loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <StatusBar barStyle="dark-content" backgroundColor="#a2d2ff" />
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
      <StatusBar barStyle="dark-content" backgroundColor="#a2d2ff" />
      
      {/* Estado de conexión */}
      <EstadoConexion conectado={conectado} onReintento={reintentar} />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#4361ee']}
            tintColor="#4361ee"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.titulo}>Mi Perfil</Text>
          {!conectado && (
            <Text style={styles.modoSinConexion}>Modo sin conexión</Text>
          )}
        </View>

        {/* Sección de Perfil */}
        <View style={styles.perfil}>
          {/* Avatar */}
          <TouchableOpacity 
            onPress={editando ? seleccionarImagen : null}
            activeOpacity={editando ? 0.7 : 1}
          >
            {nuevaImagen ? (
              <Image source={{ uri: nuevaImagen }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {userData.nombre ? userData.nombre.charAt(0).toUpperCase() : '👤'}
                </Text>
              </View>
            )}
            {editando && (
              <Text style={styles.cambiarImagenText}>Toca para cambiar foto</Text>
            )}
          </TouchableOpacity>

          {editando ? (
            // Modo edición
            <>
              <View style={styles.formularioContainer}>
                <Text style={styles.tituloFormulario}>Editar información personal</Text>
                
                <View style={styles.campoContainer}>
                  <Text style={styles.labelCampo}>Nombre *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={nuevoNombre} 
                    onChangeText={setNuevoNombre} 
                    placeholder="Ingresa tu nombre" 
                    maxLength={50}
                    editable={!guardando}
                    autoCapitalize="words"
                  />
                </View>
                
                <View style={styles.campoContainer}>
                  <Text style={styles.labelCampo}>Apellido *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={nuevoApellido} 
                    onChangeText={setNuevoApellido} 
                    placeholder="Ingresa tu apellido" 
                    maxLength={50}
                    editable={!guardando}
                    autoCapitalize="words"
                  />
                </View>
                
                <View style={styles.campoContainer}>
                  <Text style={styles.labelCampo}>Teléfono</Text>
                  <TextInput 
                    style={styles.input} 
                    value={nuevoTelefono} 
                    onChangeText={setNuevoTelefono} 
                    placeholder="Ej: +52 123 456 7890" 
                    keyboardType="phone-pad" 
                    maxLength={15}
                    editable={!guardando}
                  />
                </View>
                
                <View style={styles.campoContainer}>
                  <Text style={styles.labelCampo}>Dirección</Text>
                  <TextInput 
                    style={[styles.input, styles.inputMultiline]} 
                    value={nuevaDireccion} 
                    onChangeText={setNuevaDireccion} 
                    placeholder="Ingresa tu dirección completa" 
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                    editable={!guardando}
                    textAlignVertical="top"
                  />
                </View>
                
                <Text style={styles.camposObligatorios}>* Campos obligatorios</Text>
              </View>
              
              {/* Botones de edición */}
              <View style={styles.botonesEdicion}>
                <TouchableOpacity 
                  style={[styles.botonCancelar, guardando && styles.botonDeshabilitado]} 
                  onPress={cancelarEdicion}
                  disabled={guardando}
                >
                  <Text style={styles.textoBoton}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]} 
                  onPress={guardarCambios}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.textoBoton}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // Modo visualización
            <>
              <View style={styles.infoContainer}>
                <Text style={styles.nombre}>
                  {`${userData.nombre || ''} ${userData.apellido || ''}`.trim() || 'Usuario sin nombre'}
                </Text>
                
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
                  <View style={styles.iconContainer}>
                    <Text style={styles.icon}>📅</Text>
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Miembro desde</Text>
                    <Text style={styles.fechaRegistro}>
                      {new Date(userData.fecha_registro || Date.now()).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.botonEditar, !conectado && styles.botonDeshabilitado]} 
                onPress={() => setEditando(true)}
                disabled={!conectado}
              >
                <Text style={styles.textoBoton}>✏️ Editar Perfil</Text>
              </TouchableOpacity>
              
              {!conectado && (
                <Text style={styles.avisoSinConexion}>
                  Conecta a internet para editar tu perfil
                </Text>
              )}
            </>
          )}
        </View>

        {/* Opciones */}
        <View style={styles.opciones}>
          <Text style={styles.tituloOpciones}>Opciones de cuenta</Text>
          
          <BotonOpcion 
            texto="💰 Mis Donaciones" 
            onPress={() => abrirModal('donaciones')} 
            color="#28a745"
          />
          <BotonOpcion 
            texto="🔔 Notificaciones" 
            onPress={() => abrirModal('notificaciones')} 
            color="#17a2b8"
          />
          <BotonOpcion 
            texto="🔒 Privacidad y Seguridad" 
            onPress={() => abrirModal('privacidad')} 
            color="#6f42c1"
          />
          <BotonOpcion 
            texto="❓ Ayuda y Soporte" 
            onPress={() => abrirModal('ayuda')} 
            color="#fd7e14"
          />
          <BotonOpcion 
            texto="📄 Términos y Condiciones" 
            onPress={() => abrirModal('terminos')} 
            color="#6c757d"
          />
          <BotonOpcion 
            texto="🚪 Cerrar Sesión" 
            onPress={cerrarSesion} 
            color="#dc3545" 
          />
        </View>

        {/* Información de debug (solo en desarrollo) */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugTitle}>Debug Info</Text>
            <Text style={styles.debugText}>Usuario ID: {usuarioId}</Text>
            <Text style={styles.debugText}>Conectado: {conectado ? 'Sí' : 'No'}</Text>
            <Text style={styles.debugText}>Datos cargados: {userData ? 'Sí' : 'No'}</Text>
          </View>
        )}

        {/* Espaciado inferior */}
        <View style={styles.espaciadoInferior} />
      </ScrollView>

      {/* Modal */}
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
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#a2d2ff',
    paddingTop: 20,
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
  modoSinConexion: {
    fontSize: 12,
    color: '#e63946',
    fontWeight: '500',
    marginTop: 5,
  },
  perfil: { 
    alignItems: 'center', 
    marginTop: 20, 
    paddingBottom: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: 'white',
    marginHorizontal: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#a2d2ff',
  },
  iconContainer: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#a2d2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    marginTop: 2,
  },
  icon: {
    fontSize: 16,
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
  fechaRegistro: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  avatar: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    marginBottom: 15,
    borderWidth: 4,
    borderColor: '#a2d2ff',
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
    color: '#007bff',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500'
  },
  nombre: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  formularioContainer: {
    width: '100%',
    marginBottom: 20,
  },
  tituloFormulario: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    textAlign: 'center',
    marginBottom: 20,
  },
  campoContainer: {
    marginBottom: 15,
  },
  labelCampo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 5,
    marginLeft: 5,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
    fontSize: 16,
    color: '#495057',
  },
  inputMultiline: {
    minHeight: 80,
    maxHeight: 120,
  },
  camposObligatorios: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
  botonesEdicion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  botonCancelar: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  botonGuardar: {
    flex: 1,
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
  },
  botonEditar: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoBoton: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  avisoSinConexion: {
    fontSize: 12,
    color: '#e63946',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  opciones: {
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tituloOpciones: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  botonOpcion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  opcionEmoji: {
    fontSize: 20,
    marginRight: 15,
    width: 30,
    textAlign: 'center',
  },
  opcionTexto: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  estadoConexion: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    padding: 10,
    margin: 15,
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
    backgroundColor: '#007bff',
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
  loadingSubtext: {
    marginTop: 10,
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
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
    backgroundColor: '#007bff',
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
  debugInfo: {
    margin: 15,
    padding: 15,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    borderColor: '#f5c6cb',
    borderWidth: 1,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#721c24',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#721c24',
    marginBottom: 2,
  },
  espaciadoInferior: {
    height: 30,
  },
});