import axios from 'axios';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';

import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ==========================================
// BACKEND SECTION - Lógica de Autenticación
// ==========================================

class AuthService {
  //static BASE_URL = 'http://192.168.1.119:3000/api';
  static BASE_URL = 'https://patitas-conectadas-nine.vercel.app/api';
  

  static validarEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validarCampos(correo, contrasena) {
    if (!correo || !contrasena) {
      throw new Error('Por favor completa todos los campos.');
    }

    if (!this.validarEmail(correo)) {
      throw new Error('Por favor ingresa un correo electrónico válido.');
    }
  }

  static obtenerEndpoint(tipoUsuario) {
    const endpoints = {
      usuario: `${this.BASE_URL}/login`,
      refugio: `${this.BASE_URL}/login/refugio`,
      admin: `${this.BASE_URL}/login/admin`
    };
    return endpoints[tipoUsuario] || endpoints.usuario;
  }

  static determinarRutaPorRol(userData, tipoUsuario) {
    if (tipoUsuario === 'refugio') {
      return {
        pathname: '/refugio',
        params: {
          refugioId: userData.id || userData._id,
          refugioNombre: userData.nombre,
          refugioEmail: userData.email,
          refugioTelefono: userData.telefono || '',
          usuarioTipo: 'refugio'
        }
      };
    }

    const rol = userData.rol || userData.id_rol;

    if (rol === 5) {
      return {
        pathname: '/admin',
        params: {
          adminId: userData.id || userData._id,
          adminNombre: userData.nombre,
          adminEmail: userData.email,
          usuarioTipo: 'admin',
          id_rol: rol
        }
      };
    } else {
      return {
        pathname: '/PerfilUsuario',
        params: {
          usuarioId: userData.id || userData._id,
          usuarioNombre: userData.nombre,
          usuarioEmail: userData.email,
          usuarioTelefono: userData.telefono || '',
          usuarioTipo: 'usuario',
          id_rol: rol || 4
        }
      };
    }
  }

  static procesarRespuestaLogin(response, tipoUsuario) {
    if (!response.data) {
      throw new Error('Respuesta del servidor incompleta.');
    }

    let userData;
    if (tipoUsuario === 'refugio') {
      userData = response.data.refugio;
    } else {
      userData = response.data.usuario;
    }

    if (!userData) {
      throw new Error('Datos de usuario no encontrados en la respuesta.');
    }

    const parametrosRedireccion = this.determinarRutaPorRol(userData, tipoUsuario);

    let mensajeBienvenida;
    const rol = userData.rol || userData.id_rol;

    if (tipoUsuario === 'refugio') {
      mensajeBienvenida = `¡Bienvenido ${userData.nombre}!`;
    } else if (rol === 5) {
      mensajeBienvenida = `¡Bienvenido Administrador ${userData.nombre}!`;
    } else {
      mensajeBienvenida = `¡Bienvenid@ ${userData.nombre}!`;
    }

    return {
      mensajeBienvenida,
      parametrosRedireccion,
      userData
    };
  }

  static manejarErrorLogin(error) {
    console.log('Error details:', error.response?.data || error.message);

    if (error.response) {
      const mensajes = {
        400: 'Datos inválidos. Verifica que hayas completado todos los campos.',
        401: 'Correo o contraseña incorrectos.',
        404: 'Usuario no encontrado. Verifica el tipo de cuenta seleccionado.',
        409: 'Conflicto con los datos proporcionados.',
        500: 'Error interno del servidor. Intenta más tarde.'
      };

      return mensajes[error.response.status] ||
        error.response.data?.message ||
        'Error desconocido del servidor.';
    } else if (error.request) {
      return `No se pudo conectar con el servidor. Verifica:\n• Tu conexión a internet\n• Que el servidor esté ejecutándose en el puerto 3000\n• La dirección IP del servidor`;
    } else {
      return error.message || 'Ocurrió un error inesperado.';
    }
  }

  static configurarAxios() {
    axios.interceptors.request.handlers = [];
    axios.interceptors.response.handlers = [];

    axios.interceptors.request.use(
      (config) => {
        console.log('Enviando request a:', config.url);
        console.log('Datos:', config.data);
        return config;
      },
      (error) => {
        console.log('Error en request:', error);
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      (response) => {
        console.log('Respuesta recibida de:', response.config.url);
        console.log('Status:', response.status);
        console.log('Data:', response.data);
        return response;
      },
      (error) => {
        console.log('Error en response:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  static async iniciarSesion(correo, contrasena, tipoUsuario) {
    try {
      this.configurarAxios();
      this.validarCampos(correo, contrasena);

      const endpoint = this.obtenerEndpoint(tipoUsuario);
      console.log('Intentando login en:', endpoint);
      console.log('Tipo de usuario seleccionado:', tipoUsuario);

      const response = await axios.post(endpoint, {
        email: correo,
        password: contrasena
      }, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Login exitoso:', response.data);

      const resultado = this.procesarRespuestaLogin(response, tipoUsuario);

      console.log('Redirigiendo a:', resultado.parametrosRedireccion.pathname);
      console.log('Rol del usuario:', resultado.userData?.rol || resultado.userData?.id_rol);

      return resultado;

    } catch (error) {
      console.error('Error en iniciarSesion:', error);
      throw new Error(this.manejarErrorLogin(error));
    }
  }
}

// ==========================================
// MODAL CONTENT SERVICE
// ==========================================

class ModalContentService {
  static getPrivacyContent() {
    return `Política de Privacidad Patitas Conectadas

Última actualización: 10 de octubre de 2025

1. Responsable del tratamiento
Patitas Conectadas con domicilio en Guadalajara, Jalisco, México, es responsable del uso y protección de los datos personales de sus usuarios.

2. Datos que recopilamos
• Nombre completo, correo, teléfono y dirección
• CURP o RFC (para verificación de refugios y usuarios)
• Datos sobre adopciones o mascotas registradas
• Datos técnicos del dispositivo (IP, sistema, uso)

3. Finalidades del tratamiento
• Facilitar procesos de adopción y registro
• Enviar recordatorios o seguimientos post-adopción
• Mejorar la experiencia del usuario
• Cumplir obligaciones legales y de seguridad
• No usamos tu información con fines comerciales sin consentimiento

4. Protección de la información
• Implementamos medidas técnicas, administrativas y físicas para proteger los datos
• Solo personal autorizado puede acceder a la información

5. Compartición de datos
• Con refugios o adoptantes directamente involucrados
• Por requerimiento de una autoridad
• Con proveedores de servicios tecnológicos necesarios

6. Derechos ARCO
Puedes ejercer tus derechos de Acceso, Rectificación, Cancelación u Oposición enviando un correo a:
📩 privacidad@patitasconectadas.mx

7. Conservación de datos
Los datos se conservarán solo por el tiempo necesario para cumplir las finalidades descritas y conforme a la ley.

8. Aceptación
Al usar la aplicación o el sitio web, confirmas que has leído y aceptado esta Política de Privacidad.`;
  }

  static getTermsContent() {
    return `Términos y Condiciones

1. Introducción
Bienvenido a Patitas Conectadas, una aplicación creada para facilitar la adopción responsable de perros y fortalecer la colaboración entre refugios, adoptantes y la comunidad de Zapopan. Al usar la app o el sitio web, aceptas estos Términos y Condiciones. Si no estás de acuerdo con alguno de ellos, te recomendamos no utilizar nuestros servicios.

2. Objeto
• Conectar refugios y adoptantes de forma segura
• Registrar y consultar perros disponibles para adopción
• Dar seguimiento al bienestar animal después de la adopción
• La aplicación actúa como un facilitador tecnológico, no como intermediario legal

3. Registro y uso de la cuenta
Los usuarios deben:
• Proporcionar información veraz y actualizada
• Mantener la confidencialidad de sus credenciales
• Ser mayor de edad o contar con supervisión de un tutor
• Patitas Conectadas puede suspender cuentas en caso de uso indebido o fraude

4. Responsabilidad de los usuarios
• Los refugios deben garantizar la veracidad de la información de los animales publicados
• Los adoptantes se comprometen con la tenencia responsable
• La aplicación no se hace responsable por acuerdos fuera de la plataforma

5. Propiedad intelectual
Todo el contenido, logotipos, textos, diseños y software pertenecen a Patitas Conectadas o a sus titulares. Queda prohibida su reproducción total o parcial sin autorización.

6. Limitación de responsabilidad
Patitas Conectadas no se responsabiliza por:
• Daños ocasionados por uso o imposibilidad de uso
• Información falsa proporcionada por usuarios o refugios
• Pérdida de datos o errores técnicos fuera de nuestro control

7. Modificaciones
Podremos actualizar estos Términos en cualquier momento. Las modificaciones se publicarán en esta misma sección.

8. Legislación aplicable
Estos términos se rigen por las leyes de los Estados Unidos Mexicanos y la LFPDPPP.`;
  }

  static getHelpContent() {
    return `Ayuda y Soporte

¿Tienes alguna pregunta o quieres colaborar con nosotros?

📞 Teléfono: (52) 33 14498999
📧 Correo: patitasconnected@gmail.com

Horario de atención:
Lunes a Viernes: 9:00 AM - 6:00 PM
Sábados: 10:00 AM - 2:00 PM

Síguenos en redes sociales:
🐾 Facebook: @PatitasConectadas
🐾 Instagram: @patitas_conectadas
🐾 Twitter: @PatitasConecta`;
  }
}

// ==========================================
// FRONTEND SECTION - Componentes de UI
// ==========================================

const TipoUsuarioButton = ({
  tipo,
  titulo,
  descripcion,
  icono,
  tipoSeleccionado,
  onSeleccionar,
  deshabilitado
}) => (
  <TouchableOpacity
    style={[
      styles.tipoUsuarioButton,
      tipoSeleccionado === tipo && styles.tipoUsuarioSeleccionado
    ]}
    onPress={() => onSeleccionar(tipo)}
    disabled={deshabilitado}
  >
    <Ionicons
      name={icono}
      size={24}
      color={tipoSeleccionado === tipo ? '#900B09' : '#666'}
      style={styles.iconoTipoUsuario}
    />
    <Text
      style={[
        styles.tituloTipoUsuario,
        tipoSeleccionado === tipo && styles.textoSeleccionado
      ]}
    >
      {titulo}
    </Text>
    <Text
      style={[
        styles.descripcionTipoUsuario,
        tipoSeleccionado === tipo && styles.textoSeleccionado
      ]}
    >
      {descripcion}
    </Text>
  </TouchableOpacity>
);

const SelectorTipoUsuario = ({ tipoSeleccionado, onSeleccionar, deshabilitado }) => (
  <View style={styles.tipoUsuarioContainer}>
    <Text style={styles.labelTipoUsuario}>Tipo de cuenta:</Text>

    <View style={styles.tipoUsuarioRow}>
      <TipoUsuarioButton
        tipo="usuario"
        titulo="Usuario"
        descripcion="Usuario/Admin"
        icono="person"
        tipoSeleccionado={tipoSeleccionado}
        onSeleccionar={onSeleccionar}
        deshabilitado={deshabilitado}
      />
      <TipoUsuarioButton
        tipo="refugio"
        titulo="Refugio"
        descripcion="Asociación/ONG"
        icono="home"
        tipoSeleccionado={tipoSeleccionado}
        onSeleccionar={onSeleccionar}
        deshabilitado={deshabilitado}
      />
    </View>
  </View>
);

const CampoCorreo = ({ correo, onCorreoChange, deshabilitado }) => (
  <>
    <Text style={styles.label}>Correo electrónico</Text>
    <TextInput
      style={styles.input}
      placeholder="email@mail.com"
      keyboardType="email-address"
      value={correo}
      onChangeText={onCorreoChange}
      autoCapitalize="none"
      autoCorrect={false}
      editable={!deshabilitado}
      placeholderTextColor="#999"
    />
  </>
);

function CampoContrasena({ label, value, onChangeText, editable, placeholder }) {
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          editable={editable}
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={styles.passwordVisibilityToggle}
          onPress={() => setSecureTextEntry(!secureTextEntry)}
          disabled={!editable}
        >
          <Ionicons
            name={secureTextEntry ? 'eye-off' : 'eye'}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
      </View>
    </>
  );
}

const BotonLogin = ({ onPress, cargando }) => (
  <TouchableOpacity
    style={[styles.boton, cargando && styles.botonDeshabilitado]}
    onPress={onPress}
    disabled={cargando}
  >
    {cargando ? (
      <ActivityIndicator color="white" />
    ) : (
      <Text style={styles.botonTexto}>Iniciar sesión</Text>
    )}
  </TouchableOpacity>
);

const EnlacesAdicionales = ({ deshabilitado, onShowPrivacy, onShowTerms }) => (
  <>
    <View style={styles.registroContainer}>
      <Link href="/RecuperarContrasena" asChild>
        <TouchableOpacity disabled={deshabilitado}>
          <Text style={styles.textoRegistro}>
            ¿Olvidaste tu contraseña?{' '}
            <Text style={styles.linkRegistroTexto}>Recuperar</Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </View>

    <View style={styles.registroContainer}>
      <Link href="/registro_usuarios" asChild>
        <TouchableOpacity disabled={deshabilitado}>
          <Text style={styles.textoRegistro}>
            ¿No tienes cuenta?{' '}
            <Text style={styles.linkRegistroTexto}>Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </View>

    <Text style={styles.politicas}>
      Al continuar, aceptas nuestros{' '}
      <Text style={styles.politicasLink} onPress={onShowTerms}>
        Términos de Servicio
      </Text>
      {' '}y{' '}
      <Text style={styles.politicasLink} onPress={onShowPrivacy}>
        Política de Privacidad
      </Text>
    </Text>
  </>
);

// ==========================================
// MODAL COMPONENT
// ==========================================

const InfoModal = ({ visible, title, content, onClose }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalFondo}>
      <View style={styles.modalContenido}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitulo}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close-circle" size={28} color="#900B09" />
          </TouchableOpacity>
        </View>
        <ScrollView 
          style={styles.modalScroll} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.modalScrollContent}
        >
          <Text style={styles.modalTexto}>{content}</Text>
        </ScrollView>
        <TouchableOpacity onPress={onClose} style={styles.modalBoton}>
          <Text style={styles.modalBotonTexto}>Entendido</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// ==========================================
// MAIN COMPONENT (FRONTEND CONTROLLER)
// ==========================================

export default function LoginScreen() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [tipoUsuarioSeleccionado, setTipoUsuarioSeleccionado] = useState('usuario');
  
  // Estados para modales
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  
  const router = useRouter();

  const manejarInicioSesion = async () => {
    setCargando(true);

    try {
      console.log('Iniciando proceso de login...');
      console.log('Tipo de usuario seleccionado:', tipoUsuarioSeleccionado);
      console.log('Email:', correo);

      const resultado = await AuthService.iniciarSesion(
        correo,
        contrasena,
        tipoUsuarioSeleccionado
      );

      console.log('Login exitoso, redirigiendo a:', resultado.parametrosRedireccion.pathname);

      Alert.alert('Éxito', resultado.mensajeBienvenida, [
        {
          text: 'Continuar',
          onPress: () => {
            router.replace(resultado.parametrosRedireccion);
          }
        }
      ]);

    } catch (error) {
      console.error('Error en login:', error.message);
      Alert.alert('Error de Inicio de Sesión', error.message);
    } finally {
      setCargando(false);
    }
  };

  const showPrivacyModal = () => {
    setModalTitle('Política de Privacidad');
    setModalContent(ModalContentService.getPrivacyContent());
    setModalVisible(true);
  };

  const showTermsModal = () => {
    setModalTitle('Términos y Condiciones');
    setModalContent(ModalContentService.getTermsContent());
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalTitle('');
    setModalContent('');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />

      <Text style={styles.titulo}>¡Bienvenido!</Text>
      <Text style={styles.subtitulo}>Patitas Conectadas</Text>

      <SelectorTipoUsuario
        tipoSeleccionado={tipoUsuarioSeleccionado}
        onSeleccionar={setTipoUsuarioSeleccionado}
        deshabilitado={cargando}
      />

      <CampoCorreo
        correo={correo}
        onCorreoChange={setCorreo}
        deshabilitado={cargando}
      />

      <CampoContrasena
        label="Contraseña"
        placeholder="••••••••"
        value={contrasena}
        onChangeText={setContrasena}
        editable={!cargando}
      />

      <BotonLogin
        onPress={manejarInicioSesion}
        cargando={cargando}
      />

      <EnlacesAdicionales 
        deshabilitado={cargando}
        onShowPrivacy={showPrivacyModal}
        onShowTerms={showTermsModal}
      />

      {/* Modal de Información */}
      <InfoModal
        visible={modalVisible}
        title={modalTitle}
        content={modalContent}
        onClose={closeModal}
      />
    </ScrollView>
  );
}

// ==========================================
// STYLES - Estilos de la Interfaz de Usuario
// ==========================================

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#A4645E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#ffffff',
  },
  subtitulo: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 15,
    fontWeight: '500',
  },
  tipoUsuarioContainer: {
    width: '100%',
    marginBottom: 20,
  },
  labelTipoUsuario: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  tipoUsuarioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  tipoUsuarioButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 2,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#FFD6EC',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  tipoUsuarioSeleccionado: {
    borderColor: '#ffe5f0',
    backgroundColor: '#ffe5f0',
  },
  iconoTipoUsuario: {
    marginBottom: 4,
  },
  tituloTipoUsuario: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  descripcionTipoUsuario: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  textoSeleccionado: {
    color: '#000000',
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    marginTop: 10,
    color: '#f7f3f3',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  passwordVisibilityToggle: {
    padding: 10,
  },
  boton: {
    backgroundColor: '#FEE9E7',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
  botonDeshabilitado: {
    backgroundColor: '#cccccc',
  },
  botonTexto: {
    color: '#900B09',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registroContainer: {
    alignItems: 'center',
    marginVertical: 5,
  },
  textoRegistro: {
    color: '#f1f1f1',
    marginBottom: 3,
    fontSize: 14,
  },
  linkRegistroTexto: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 14,
  },
  politicas: {
    fontSize: 13,
    textAlign: 'center',
    color: '#f1f1f1',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  politicasLink: {
    textDecorationLine: 'underline',
    color: '#000000',
    fontWeight: '800',
  },
  // Estilos del Modal
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
    padding: 20,
    width: '95%',
    maxWidth: 500,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#900B09',
    flex: 1,
  },
  modalCloseButton: {
    padding: 5,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalScrollContent: {
    paddingBottom: 10,
  },
  modalTexto: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    textAlign: 'left',
  },
  modalBoton: {
    backgroundColor: '#900B09',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  modalBotonTexto: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});