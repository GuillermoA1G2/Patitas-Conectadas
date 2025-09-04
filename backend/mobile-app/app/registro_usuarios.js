import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';

// ========================================
// SISTEMA DE NOTIFICACIONES CON SONIDO PERSONALIZADO
// ========================================

// Configuración de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  // Reproducir sonido personalizado - NUEVA FUNCIÓN
  static async reproducirSonidoGato() {
    try {
      console.log('Reproduciendo sonido gato.mp3...');
      
      // Configurar el modo de audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Cargar y reproducir el sonido
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/gato.mp3'),
        { shouldPlay: true, volume: 1.0 }
      );

      // Reproducir el sonido
      await sound.playAsync();

      // Liberar recursos después de la reproducción
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });

      console.log('Sonido gato.mp3 reproducido exitosamente');
    } catch (error) {
      console.error('Error al reproducir sonido gato.mp3:', error);
    }
  }

  // Inicializar permisos de notificaciones - ACTUALIZADO CON SONIDO PERSONALIZADO
  static async inicializarPermisos() {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('registro', {
          name: 'Registro de Usuarios',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0066ff',
          // Nota: Para sonidos personalizados en notificaciones, necesitamos usar el sistema de archivos
          // Por ahora, usaremos el sonido por defecto en las notificaciones
          // y reproduciremos el sonido personalizado por separado
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permisos de notificación no otorgados');
        return false;
      }

      console.log('Permisos de notificación otorgados');
      return true;
    } catch (error) {
      console.error('Error al inicializar permisos:', error);
      return false;
    }
  }

  // Enviar notificación de registro exitoso - USUARIO CON SONIDO
  static async notificarRegistroUsuario(nombreUsuario) {
    try {
      // PRIMERO: Reproducir sonido personalizado
      await this.reproducirSonidoGato();

      // SEGUNDO: Mostrar notificación
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 ¡Registro Exitoso!',
          body: `Bienvenido/a ${nombreUsuario}. Tu cuenta de usuario ha sido creada correctamente.`,
          sound: 'default', // Mantener sonido por defecto para la notificación
          badge: 1,
          categoryIdentifier: 'registro_usuario',
          data: {
            tipo: 'registro_usuario',
            timestamp: new Date().toISOString(),
            usuario: nombreUsuario
          },
        },
        trigger: { seconds: 0.5 }, // Mostrar después del sonido
      });
      console.log('Notificación de registro de usuario enviada con sonido gato.mp3');
    } catch (error) {
      console.error('Error al enviar notificación de usuario:', error);
    }
  }

  // Enviar notificación de registro exitoso - ASOCIACIÓN CON SONIDO
  static async notificarRegistroAsociacion(nombreAsociacion) {
    try {
      // PRIMERO: Reproducir sonido personalizado
      await this.reproducirSonidoGato();

      // SEGUNDO: Mostrar notificación
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏢 ¡Asociación Registrada!',
          body: `${nombreAsociacion} ha sido registrada exitosamente. ¡Gracias por unirte a nuestra comunidad!`,
          sound: 'default',
          badge: 1,
          categoryIdentifier: 'registro_asociacion',
          data: {
            tipo: 'registro_asociacion',
            timestamp: new Date().toISOString(),
            asociacion: nombreAsociacion
          },
        },
        trigger: { seconds: 0.5 },
      });
      console.log('Notificación de registro de asociación enviada con sonido gato.mp3');
    } catch (error) {
      console.error('Error al enviar notificación de asociación:', error);
    }
  }

  // Notificación de error en registro - SIN SONIDO PERSONALIZADO
  static async notificarErrorRegistro(tipoRegistro = 'usuario') {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Error en Registro',
          body: `Hubo un problema al registrar el ${tipoRegistro}. Por favor, intenta nuevamente.`,
          sound: 'default',
          categoryIdentifier: 'error_registro',
          data: {
            tipo: 'error_registro',
            timestamp: new Date().toISOString(),
            tipoRegistro: tipoRegistro
          },
        },
        trigger: { seconds: 1 },
      });
      console.log('Notificación de error enviada');
    } catch (error) {
      console.error('Error al enviar notificación de error:', error);
    }
  }

  // Notificación de problema de conexión - SIN SONIDO PERSONALIZADO
  static async notificarProblemaConexion() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔌 Problema de Conexión',
          body: 'No se pudo conectar al servidor. Verifica tu conexión a internet.',
          sound: 'default',
          categoryIdentifier: 'conexion_error',
          data: {
            tipo: 'conexion_error',
            timestamp: new Date().toISOString()
          },
        },
        trigger: { seconds: 1 },
      });
    } catch (error) {
      console.error('Error al enviar notificación de conexión:', error);
    }
  }

  // Limpiar todas las notificaciones
  static async limpiarNotificaciones() {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error al limpiar notificaciones:', error);
    }
  }
}

// ========================================
// BACKEND
// ========================================

// Configuración de la API
const API_CONFIG = {
  BASE_URL: 'http://192.168.1.119:3000',
  ENDPOINTS: {
    USUARIOS: '/api/usuarios',
    ASOCIACIONES: '/api/asociaciones'
  }
};

// Servicios de Backend
class BackendServices {
  
  // Servicio para registrar usuario - OPTIMIZADO CON NOTIFICACIONES Y SONIDO
  static async registrarUsuario(datosUsuario) {
    try {
      console.log('Enviando datos al servidor...');
      
      // Mapear datos del frontend a los campos de la base de datos
      const datosParaMySQL = {
        nombre: datosUsuario.nombre.trim(),
        apellido: datosUsuario.apellidos.trim(), // 'apellidos' -> 'apellido' (singular en DB)
        email: datosUsuario.correo.toLowerCase().trim(),
        password: datosUsuario.contrasena, // Sin encriptar en el frontend
        telefono: datosUsuario.numero.trim(),
        direccion: datosUsuario.direccion.trim()
        // Nota: fotoPerfil se maneja separadamente en el servidor
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USUARIOS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosParaMySQL),
      });

      const resultado = await response.json();
      
      // Manejar respuestas del servidor CON NOTIFICACIONES Y SONIDO
      if (response.ok) {
        // Enviar notificación de éxito CON SONIDO GATO.MP3
        await NotificationService.notificarRegistroUsuario(datosUsuario.nombre);
        
        return {
          success: true,
          data: resultado,
          mensaje: resultado.message || 'Usuario registrado correctamente'
        };
      } else {
        // Enviar notificación de error (sin sonido personalizado)
        await NotificationService.notificarErrorRegistro('usuario');
        
        return {
          success: false,
          data: null,
          mensaje: resultado.message || 'Error al registrar usuario'
        };
      }
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      
      // Enviar notificación de problema de conexión
      await NotificationService.notificarProblemaConexion();
      
      return {
        success: false,
        data: null,
        mensaje: 'No se pudo conectar con el servidor. Verifica tu conexión y que el servidor esté corriendo en http://192.168.1.119:3000'
      };
    }
  }

  // Servicio para registrar asociación - OPTIMIZADO CON NOTIFICACIONES Y SONIDO
  static async registrarAsociacion(datosAsociacion) {
    try {
      console.log('Enviando datos de asociación al servidor...');
      
      // Mapear datos del frontend a los campos de la base de datos refugios
      const datosParaMySQL = {
        nombre: datosAsociacion.nombre.trim(),
        descripcion: datosAsociacion.descripcion.trim(),
        email: datosAsociacion.correo.toLowerCase().trim(),
        password: datosAsociacion.contrasena, // Sin encriptar en el frontend
        telefono: datosAsociacion.telefono.trim(),
        direccion: datosAsociacion.direccion.trim(),
        ciudad: datosAsociacion.ciudad.trim()
        // Campos adicionales como rfc, documentos_legales se pueden agregar después
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ASOCIACIONES}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosParaMySQL),
      });

      const resultado = await response.json();
      
      // Manejar respuestas del servidor CON NOTIFICACIONES Y SONIDO
      if (response.ok) {
        // Enviar notificación de éxito CON SONIDO GATO.MP3
        await NotificationService.notificarRegistroAsociacion(datosAsociacion.nombre);
        
        return {
          success: true,
          data: resultado,
          mensaje: resultado.message || 'Asociación registrada correctamente'
        };
      } else {
        // Enviar notificación de error (sin sonido personalizado)
        await NotificationService.notificarErrorRegistro('asociación');
        
        return {
          success: false,
          data: null,
          mensaje: resultado.message || 'Error al registrar asociación'
        };
      }
    } catch (error) {
      console.error('Error al registrar asociación:', error);
      
      // Enviar notificación de problema de conexión
      await NotificationService.notificarProblemaConexion();
      
      return {
        success: false,
        data: null,
        mensaje: 'No se pudo conectar con el servidor. Verifica tu conexión y que el servidor esté corriendo en http://192.168.1.119:3000'
      };
    }
  }

  // Servicio para procesar imagen - SIMPLIFICADO
  static async procesarImagen() {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        return {
          success: false,
          mensaje: 'Se requiere permiso para acceder a la galería'
        };
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false, // Simplificado - no necesitamos base64 por ahora
      });

      if (resultado.canceled) {
        return {
          success: false,
          mensaje: 'Selección cancelada'
        };
      }

      return {
        success: true,
        data: resultado.assets[0]
      };
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      return {
        success: false,
        mensaje: 'No se pudo seleccionar la imagen'
      };
    }
  }

  // Servicio para procesar documentos - SIMPLIFICADO
  static async procesarDocumentos() {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (resultado.canceled || !resultado.assets) {
        return {
          success: false,
          mensaje: 'Selección cancelada'
        };
      }

      return {
        success: true,
        data: resultado.assets
      };
    } catch (error) {
      console.error('Error al seleccionar documentos:', error);
      return {
        success: false,
        mensaje: 'No se pudieron seleccionar los documentos'
      };
    }
  }

  // Test de conexión con el servidor
  static async testConexion() {
    try {
      console.log('Probando conexión con servidor...');
      const response = await fetch(`${API_CONFIG.BASE_URL}/`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        console.log('Conexión exitosa con el servidor');
        return { success: true };
      } else {
        console.log('Servidor responde pero con error:', response.status);
        return { success: false, mensaje: `Servidor responde con error: ${response.status}` };
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      return { success: false, mensaje: 'No se puede conectar al servidor' };
    }
  }
}

// Validadores de Backend - OPTIMIZADOS
class Validadores {
  
  static validarEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validarContrasena(contrasena, confirmarContrasena) {
    if (!contrasena || !confirmarContrasena) {
      return { valido: false, mensaje: 'Las contraseñas son obligatorias' };
    }
    if (contrasena !== confirmarContrasena) {
      return { valido: false, mensaje: 'Las contraseñas no coinciden' };
    }
    if (contrasena.length < 6) {
      return { valido: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' };
    }
    return { valido: true };
  }

  static validarTelefono(telefono) {
    // Validar que contenga solo números y tenga al menos 10 dígitos
    const telefonoLimpio = telefono.replace(/\D/g, '');
    if (telefonoLimpio.length < 10) {
      return { valido: false, mensaje: 'El teléfono debe tener al menos 10 dígitos' };
    }
    return { valido: true };
  }

  // Validación básica para CURP (opcional ahora)
  static validarCURP(curp) {
    if (!curp) {
      return { valido: true }; // Opcional
    }
    if (curp.length !== 18) {
      return { valido: false, mensaje: 'El CURP debe tener exactamente 18 caracteres' };
    }
    return { valido: true };
  }

  // Validación básica para RFC (opcional ahora)
  static validarRFC(rfc) {
    if (!rfc) {
      return { valido: true }; // Opcional
    }
    if (rfc.length < 12 || rfc.length > 13) {
      return { valido: false, mensaje: 'El RFC debe tener entre 12 y 13 caracteres' };
    }
    return { valido: true };
  }

  // Validación optimizada para formulario de usuario
  static validarFormularioUsuario(datos) {
    const { nombre, apellidos, direccion, correo, contrasena, confirmarContrasena, numero } = datos;
    
    // Campos obligatorios básicos
    if (!nombre || !apellidos || !direccion || !correo || !contrasena || !confirmarContrasena || !numero) {
      return { valido: false, mensaje: 'Por favor completa todos los campos obligatorios' };
    }

    // Validar longitudes mínimas
    if (nombre.trim().length < 2) {
      return { valido: false, mensaje: 'El nombre debe tener al menos 2 caracteres' };
    }

    if (apellidos.trim().length < 2) {
      return { valido: false, mensaje: 'Los apellidos deben tener al menos 2 caracteres' };
    }

    // Validar email
    if (!this.validarEmail(correo)) {
      return { valido: false, mensaje: 'Por favor ingresa un correo electrónico válido' };
    }

    // Validar contraseña
    const validacionContrasena = this.validarContrasena(contrasena, confirmarContrasena);
    if (!validacionContrasena.valido) {
      return validacionContrasena;
    }

    // Validar teléfono
    const validacionTelefono = this.validarTelefono(numero);
    if (!validacionTelefono.valido) {
      return validacionTelefono;
    }

    // Validar CURP si se proporciona
    if (datos.curp) {
      const validacionCURP = this.validarCURP(datos.curp);
      if (!validacionCURP.valido) {
        return validacionCURP;
      }
    }

    return { valido: true };
  }

  // Validación optimizada para formulario de asociación
  static validarFormularioAsociacion(datos) {
    const { nombre, descripcion, responsable, direccion, ciudad, correo, contrasena, confirmarContrasena, telefono } = datos;
    
    // Campos obligatorios básicos
    if (!nombre || !descripcion || !direccion || !ciudad || !correo || !contrasena || !confirmarContrasena || !telefono) {
      return { valido: false, mensaje: 'Por favor completa todos los campos obligatorios' };
    }

    // Validar longitudes mínimas
    if (nombre.trim().length < 3) {
      return { valido: false, mensaje: 'El nombre de la asociación debe tener al menos 3 caracteres' };
    }

    if (descripcion.trim().length < 10) {
      return { valido: false, mensaje: 'La descripción debe tener al menos 10 caracteres' };
    }

    // Validar email
    if (!this.validarEmail(correo)) {
      return { valido: false, mensaje: 'Por favor ingresa un correo electrónico válido' };
    }

    // Validar contraseña
    const validacionContrasena = this.validarContrasena(contrasena, confirmarContrasena);
    if (!validacionContrasena.valido) {
      return validacionContrasena;
    }

    // Validar teléfono
    const validacionTelefono = this.validarTelefono(telefono);
    if (!validacionTelefono.valido) {
      return validacionTelefono;
    }

    // Validar RFC si se proporciona
    if (datos.rfc) {
      const validacionRFC = this.validarRFC(datos.rfc);
      if (!validacionRFC.valido) {
        return validacionRFC;
      }
    }

    return { valido: true };
  }
}

// ========================================
// FRONTEND
// ========================================

// Componente principal de selección - CON INICIALIZACIÓN DE NOTIFICACIONES
export default function App({ navigation }) {
  const [tipo, setTipo] = useState(null); 
  const [conexionProbada, setConexionProbada] = useState(false);
  const [notificacionesInicializadas, setNotificacionesInicializadas] = useState(false);

  // Inicializar notificaciones y probar conexión al montar el componente
  useEffect(() => {
    inicializarApp();
  }, []);

  const inicializarApp = async () => {
    // Inicializar notificaciones
    const permisosOtorgados = await NotificationService.inicializarPermisos();
    setNotificacionesInicializadas(permisosOtorgados);

    // Probar conexión
    await probarConexion();

    // Limpiar notificaciones anteriores
    await NotificationService.limpiarNotificaciones();
  };

  const probarConexion = async () => {
    const resultado = await BackendServices.testConexion();
    setConexionProbada(resultado.success);
    
    if (!resultado.success) {
      console.warn('Problema de conexión:', resultado.mensaje);
      Alert.alert(
        'Problema de Conexión',
        'No se puede conectar al servidor. Verifica que esté corriendo y que la IP sea correcta.\n\nIP actual: ' + API_CONFIG.BASE_URL,
        [{ text: 'OK' }]
      );
    }
  };

  const regresar = () => setTipo(null);

  if (!tipo) {
    return (
      <PantallaSeleccion 
        onSeleccionTipo={setTipo} 
        conexionOK={conexionProbada}
        notificacionesOK={notificacionesInicializadas}
      />
    );
  }

  if (tipo === 'usuario') {
    return <FormularioUsuario onBack={regresar} navigation={navigation} />;
  }
  
  if (tipo === 'asociacion') {
    return <FormularioAsociacion onBack={regresar} navigation={navigation} />;
  }
}

// Componente de pantalla de selección - CON INDICADORES DE CONEXIÓN Y NOTIFICACIONES
function PantallaSeleccion({ onSeleccionTipo, conexionOK, notificacionesOK }) {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <Text style={styles.titulo}>¿Quién eres?</Text>
      
      {/* Indicadores de estado */}
      <View style={styles.estadoContainer}>
        <View style={[styles.conexionIndicator, { backgroundColor: conexionOK ? '#4CAF50' : '#f44336' }]}>
          <Text style={styles.conexionTexto}>
            {conexionOK ? '✓ Conectado al servidor' : '✗ Sin conexión al servidor'}
          </Text>
        </View>
        
        <View style={[styles.conexionIndicator, { backgroundColor: notificacionesOK ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.conexionTexto}>
            {notificacionesOK ? '🔔 Notificaciones habilitadas' : '🔕 Notificaciones deshabilitadas'}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.boton} onPress={() => onSeleccionTipo('usuario')}>
        <Text style={styles.botonTexto}>Usuario</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.boton} onPress={() => onSeleccionTipo('asociacion')}>
        <Text style={styles.botonTexto}>Asociación</Text>
      </TouchableOpacity>
      
      <Text style={styles.politicas}>
        By clicking continue, you agree to our{' '}
        <Text style={{ textDecorationLine: 'underline' }}>Terms of Service</Text> and{' '}
        <Text style={{ textDecorationLine: 'underline' }}>Privacy Policy</Text>
      </Text>
    </View>
  );
}

// ===  FRONTEND - FORMULARIO USUARIO === (OPTIMIZADO CON NOTIFICACIONES Y SONIDO)
function FormularioUsuario({ onBack, navigation }) {
  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    direccion: '',
    correo: '',
    contrasena: '',
    confirmarContrasena: '',
    numero: '',
    curp: '', // Opcional ahora
  });
  const [imagen, setImagen] = useState(null);
  const [cargando, setCargando] = useState(false);

  // Función para actualizar datos del formulario
  const actualizarCampo = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  // Función para seleccionar imagen (Frontend que llama al Backend)
  const seleccionarImagen = async () => {
    const resultado = await BackendServices.procesarImagen();
    
    if (resultado.success) {
      setImagen(resultado.data);
    } else {
      Alert.alert('Error', resultado.mensaje);
    }
  };

  // Función para registrar usuario - OPTIMIZADA CON NOTIFICACIONES Y SONIDO
  const registrar = async () => {
    // Validación en Frontend
    const validacion = Validadores.validarFormularioUsuario(formData);
    if (!validacion.valido) {
      Alert.alert('Error de Validación', validacion.mensaje);
      return;
    }

    setCargando(true);

    try {
      // *** REPRODUCIR SONIDO AL PRESIONAR REGISTRAR ***
      console.log('🎵 Reproduciendo sonido gato.mp3 al presionar Registrar...');
      await NotificationService.reproducirSonidoGato();

      // Llamada al Backend OPTIMIZADA (ya incluye notificaciones y sonido adicional)
      const resultado = await BackendServices.registrarUsuario(formData);

      if (resultado.success) {
        Alert.alert(
          '🎉 Registro Exitoso', 
          `¡Bienvenido/a ${formData.nombre}! Tu cuenta ha sido creada correctamente. Recibirás una notificación de confirmación.`, 
          [
            {
              text: 'OK',
              onPress: () => {
                limpiarFormulario();
                if (navigation && navigation.navigate) {
                  navigation.navigate('InicioSesion');
                } else {
                  onBack(); // Fallback si navigation no está disponible
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Error de Registro', resultado.mensaje);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado. Por favor intenta de nuevo.');
      
      // Notificación de error inesperado
      await NotificationService.notificarErrorRegistro('usuario');
    } finally {
      setCargando(false);
    }
  };

  // Función para limpiar formulario
  const limpiarFormulario = () => {
    setFormData({
      nombre: '',
      apellidos: '',
      direccion: '',
      correo: '',
      contrasena: '',
      confirmarContrasena: '',
      numero: '',
      curp: '',
    });
    setImagen(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.formContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logoSmall} />
        <Text style={styles.titulo}>Registro de Usuario</Text>

        {/* Selector de imagen - OPCIONAL AHORA */}
        <TouchableOpacity style={styles.imagePicker} onPress={seleccionarImagen}>
          {imagen ? (
            <Image source={{ uri: imagen.uri }} style={styles.imagenSeleccionada} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.textoSubir}>📄 Subir Foto de Perfil (Opcional)</Text>
              <Text style={styles.textoSubirSecundario}>Toca para seleccionar</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Campos del formulario */}
        <CampoFormulario
          label="Nombre *"
          placeholder="Ingresa tu nombre"
          value={formData.nombre}
          onChangeText={(valor) => actualizarCampo('nombre', valor)}
          editable={!cargando}
        />

        <CampoFormulario
          label="Apellidos *"
          placeholder="Ingresa tus apellidos"
          value={formData.apellidos}
          onChangeText={(valor) => actualizarCampo('apellidos', valor)}
          editable={!cargando}
        />

        <CampoFormulario
          label="Dirección *"
          placeholder="Ingresa tu dirección"
          value={formData.direccion}
          onChangeText={(valor) => actualizarCampo('direccion', valor)}
          editable={!cargando}
        />

        <CampoFormulario
          label="Correo electrónico *"
          placeholder="email@mail.com"
          value={formData.correo}
          onChangeText={(valor) => actualizarCampo('correo', valor)}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!cargando}
        />

        <CampoFormulario
          label="Contraseña *"
          placeholder="Mínimo 6 caracteres"
          value={formData.contrasena}
          onChangeText={(valor) => actualizarCampo('contrasena', valor)}
          secureTextEntry
          editable={!cargando}
        />

        <CampoFormulario
          label="Confirmar Contraseña *"
          placeholder="Repite la contraseña"
          value={formData.confirmarContrasena}
          onChangeText={(valor) => actualizarCampo('confirmarContrasena', valor)}
          secureTextEntry
          editable={!cargando}
        />

        <CampoFormulario
          label="Número de teléfono *"
          placeholder="Ingresa tu número"
          value={formData.numero}
          onChangeText={(valor) => actualizarCampo('numero', valor)}
          keyboardType="phone-pad"
          editable={!cargando}
        />

        <CampoFormulario
          label="CURP (Opcional)"
          placeholder="Ingresa tu CURP (18 caracteres)"
          value={formData.curp}
          onChangeText={(valor) => actualizarCampo('curp', valor)}
          autoCapitalize="characters"
          maxLength={18}
          editable={!cargando}
        />

        {/* Botones */}
        <BotonPrincipal
          titulo={cargando ? "Registrando..." : "Registrar"}
          onPress={registrar}
          disabled={cargando}
          mostrarIndicador={cargando}
        />
        
        <BotonSecundario
          titulo="Regresar"
          onPress={onBack}
          disabled={cargando}
        />
      </View>
    </ScrollView>
  );
}

// ===  FRONTEND - FORMULARIO ASOCIACIÓN === (OPTIMIZADO CON NOTIFICACIONES Y SONIDO)
function FormularioAsociacion({ onBack, navigation }) {
  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    responsable: '', // Opcional ahora
    direccion: '',
    ciudad: '',
    correo: '',
    contrasena: '',
    confirmarContrasena: '',
    telefono: '',
    rfc: '', // Opcional ahora
  });
  const [archivosDocumentos, setArchivosDocumentos] = useState([]);
  const [logo, setLogo] = useState(null);
  const [cargando, setCargando] = useState(false);

  // Función para actualizar datos del formulario
  const actualizarCampo = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  // Función para seleccionar logo (Frontend que llama al Backend)
  const seleccionarLogo = async () => {
    const resultado = await BackendServices.procesarImagen();
    
    if (resultado.success) {
      setLogo(resultado.data);
    } else {
      Alert.alert('Error', resultado.mensaje);
    }
  };

  // Función para seleccionar documentos (Frontend que llama al Backend)
  const seleccionarDocumentos = async () => {
    const resultado = await BackendServices.procesarDocumentos();
    
    if (resultado.success) {
      setArchivosDocumentos(prevArchivos => [...prevArchivos, ...resultado.data]);
    } else if (resultado.mensaje !== 'Selección cancelada') {
      Alert.alert('Error', resultado.mensaje);
    }
  };

  // Función para eliminar documento
  const eliminarDocumento = (index) => {
    setArchivosDocumentos(prevArchivos => 
      prevArchivos.filter((_, i) => i !== index)
    );
  };

  // Función para registrar asociación - OPTIMIZADA CON NOTIFICACIONES Y SONIDO
  const registrar = async () => {
    // Validación en Frontend
    const validacion = Validadores.validarFormularioAsociacion(formData);
    if (!validacion.valido) {
      Alert.alert('Error de Validación', validacion.mensaje);
      return;
    }

    setCargando(true);

    try {
      // *** REPRODUCIR SONIDO AL PRESIONAR REGISTRAR ***
      console.log('🎵 Reproduciendo sonido gato.mp3 al presionar Registrar...');
      await NotificationService.reproducirSonidoGato();

      // Llamada al Backend OPTIMIZADA (ya incluye notificaciones y sonido adicional)
      const resultado = await BackendServices.registrarAsociacion(formData);

      if (resultado.success) {
        Alert.alert(
          '🏢 Registro Exitoso', 
          `¡Bienvenidos ${formData.nombre}! Su asociación ha sido registrada correctamente. Recibirán una notificación de confirmación.`, 
          [
            {
              text: 'OK',
              onPress: () => {
                limpiarFormulario();
                if (navigation && navigation.navigate) {
                  navigation.navigate('InicioSesion');
                } else {
                  onBack(); // Fallback si navigation no está disponible
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Error de Registro', resultado.mensaje);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado. Por favor intenta de nuevo.');
      
      // Notificación de error inesperado
      await NotificationService.notificarErrorRegistro('asociación');
    } finally {
      setCargando(false);
    }
  };

  // Función para limpiar formulario
  const limpiarFormulario = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      responsable: '',
      direccion: '',
      ciudad: '',
      correo: '',
      contrasena: '',
      confirmarContrasena: '',
      telefono: '',
      rfc: '',
    });
    setArchivosDocumentos([]);
    setLogo(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.formContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logoSmall} />
        <Text style={styles.titulo}>Registro de Asociación</Text>

        {/* Selector de logo - OPCIONAL AHORA */}
        <TouchableOpacity style={styles.imagePicker} onPress={seleccionarLogo}>
          {logo ? (
            <Image source={{ uri: logo.uri }} style={styles.imagenSeleccionada} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.textoSubir}>📄 Subir Logo (Opcional)</Text>
              <Text style={styles.textoSubirSecundario}>Toca para seleccionar</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Campos del formulario */}
        <CampoFormulario
          label="Nombre de la Asociación *"
          placeholder="Nombre de la asociación"
          value={formData.nombre}
          onChangeText={(valor) => actualizarCampo('nombre', valor)}
          editable={!cargando}
        />

        <CampoFormulario
          label="Descripción *"
          placeholder="Descripción de la asociación"
          value={formData.descripcion}
          onChangeText={(valor) => actualizarCampo('descripcion', valor)}
          multiline
          numberOfLines={3}
          style={styles.inputMultilinea}
          editable={!cargando}
        />

        <CampoFormulario
          label="Nombre del Responsable (Opcional)"
          placeholder="Nombre del responsable"
          value={formData.responsable}
          onChangeText={(valor) => actualizarCampo('responsable', valor)}
          editable={!cargando}
        />

        <CampoFormulario
          label="Dirección *"
          placeholder="Dirección completa"
          value={formData.direccion}
          onChangeText={(valor) => actualizarCampo('direccion', valor)}
          editable={!cargando}
        />

        <CampoFormulario
          label="Ciudad *"
          placeholder="Ciudad"
          value={formData.ciudad}
          onChangeText={(valor) => actualizarCampo('ciudad', valor)}
          editable={!cargando}
        />

        <CampoFormulario
          label="Correo electrónico *"
          placeholder="email@mail.com"
          value={formData.correo}
          onChangeText={(valor) => actualizarCampo('correo', valor)}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!cargando}
        />

        <CampoFormulario
          label="Contraseña *"
          placeholder="Mínimo 6 caracteres"
          value={formData.contrasena}
          onChangeText={(valor) => actualizarCampo('contrasena', valor)}
          secureTextEntry
          editable={!cargando}
        />

        <CampoFormulario
          label="Confirmar Contraseña *"
          placeholder="Repite la contraseña"
          value={formData.confirmarContrasena}
          onChangeText={(valor) => actualizarCampo('confirmarContrasena', valor)}
          secureTextEntry
          editable={!cargando}
        />

        <CampoFormulario
          label="Teléfono *"
          placeholder="Número de teléfono"
          value={formData.telefono}
          onChangeText={(valor) => actualizarCampo('telefono', valor)}
          keyboardType="phone-pad"
          editable={!cargando}
        />

        <CampoFormulario
          label="RFC (Opcional)"
          placeholder="RFC de la asociación (12-13 caracteres)"
          value={formData.rfc}
          onChangeText={(valor) => actualizarCampo('rfc', valor)}
          autoCapitalize="characters"
          maxLength={13}
          editable={!cargando}
        />

        {/* Selector de documentos - OPCIONAL AHORA */}
        <Text style={styles.label}>Documentos Legales (Opcional)</Text>
        <Text style={styles.labelSecundario}>(Ej: Acta constitutiva, RFC, etc.)</Text>
        <TouchableOpacity 
          style={styles.documentPicker} 
          onPress={seleccionarDocumentos}
          disabled={cargando}
        >
          <Text style={styles.textoSubir}>📎 Seleccionar Archivos PDF</Text>
          <Text style={styles.textoSubirSecundario}>
            {archivosDocumentos.length > 0 
              ? `${archivosDocumentos.length} archivo(s) seleccionado(s)` 
              : 'Toca para seleccionar múltiples PDFs'
            }
          </Text>
        </TouchableOpacity>

        {/* Lista de documentos */}
        <ListaDocumentos 
          documentos={archivosDocumentos}
          onEliminar={eliminarDocumento}
        />

        {/* Botones */}
        <BotonPrincipal
          titulo={cargando ? "Registrando..." : "Registrar"}
          onPress={registrar}
          disabled={cargando}
          mostrarIndicador={cargando}
        />
        
        <BotonSecundario
          titulo="Regresar"
          onPress={onBack}
          disabled={cargando}
        />
      </View>
    </ScrollView>
  );
}

// Componente para campo de formulario
function CampoFormulario({ label, style, ...props }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput 
        style={[styles.input, style]} 
        {...props}
      />
    </>
  );
}

// Componente para botón principal
function BotonPrincipal({ titulo, onPress, disabled, mostrarIndicador }) {
  return (
    <TouchableOpacity 
      style={[styles.boton, disabled && styles.botonDeshabilitado]} 
      onPress={onPress}
      disabled={disabled}
    >
      {mostrarIndicador ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={styles.botonTexto}>{titulo}</Text>
      )}
    </TouchableOpacity>
  );
}

// Componente para botón secundario
function BotonSecundario({ titulo, onPress, disabled }) {
  return (
    <TouchableOpacity 
      style={[styles.boton, styles.botonSecundario, disabled && styles.botonDeshabilitado]} 
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.botonTextoSecundario, disabled && { color: '#FFD6EC' }]}>{titulo}</Text>
    </TouchableOpacity>
  );
}

// Componente para lista de documentos
function ListaDocumentos({ documentos, onEliminar }) {
  if (documentos.length === 0) return null;

  return (
    <View style={styles.documentosLista}>
      <Text style={styles.label}>Documentos seleccionados:</Text>
      {documentos.map((documento, index) => (
        <View key={index} style={styles.documentoItem}>
          <Text style={styles.documentoNombre} numberOfLines={1}>
            📄 {documento.name}
          </Text>
          <TouchableOpacity 
            onPress={() => onEliminar(index)}
            style={styles.eliminarBoton}
          >
            <Text style={styles.eliminarTexto}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  // Pantalla principal de selección
  container: {
    flex: 1,
    backgroundColor: '#A4645E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  logoSmall: {
    width: 80,
    height: 80,
    borderRadius: 40,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 10,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#ffffff',
  },
  
  // Container para indicadores de estado - NUEVO
  estadoContainer: {
    width: '100%',
    marginBottom: 20,
  },
  
  // Indicador de conexión - ACTUALIZADO
  conexionIndicator: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  conexionTexto: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // ScrollView y formularios
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#A4645E',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    justifyContent: 'center',
  },
  
  // Labels y inputs
  label: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    marginTop: 10,
    color: '#ffffff',
    fontWeight: '500',
  },
  labelSecundario: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    color: '#ffffff',
    fontSize: 12,
    fontStyle: 'italic',
  },
  input: {
    width: '100%',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputMultilinea: {
    height: 80,
    textAlignVertical: 'top',
  },
  
  // Botones
  boton: {
    backgroundColor: '#FFD6EC',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginTop: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  botonDeshabilitado: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  botonTexto: {
    color: '#900B09',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  botonSecundario: {
    backgroundColor: '#FFD6EC',
    borderWidth: 2,
    borderColor: '#FFD6EC',
    marginTop: 0,
  },
  botonTextoSecundario: {
    color: '#900B09',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Selector de imagen
  imagePicker: {
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 2,
    borderColor: '#0066ff',
    borderStyle: 'dashed',
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  documentPicker: {
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#0066ff',
    borderStyle: 'dashed',
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  imagenSeleccionada: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  textoSubir: {
    color: '#0066ff',
    fontSize: 16,
    fontWeight: '600',
  },
  textoSubirSecundario: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  
  // Lista de documentos
  documentosLista: {
    marginTop: 10,
    marginBottom: 10,
  },
  documentoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginVertical: 3,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  documentoNombre: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  eliminarBoton: {
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  eliminarTexto: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Políticas
  politicas: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
    marginTop: 30,
    paddingHorizontal: 10,
    lineHeight: 18,
  },
});