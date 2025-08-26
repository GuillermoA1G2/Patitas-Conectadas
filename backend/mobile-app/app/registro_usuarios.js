import React, { useState } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

// Configura la URL base del servidor
const API_BASE_URL = 'http://192.168.1.119:3000';

export default function App({ navigation }) {
  const [tipo, setTipo] = useState(null); 

  const regresar = () => setTipo(null);

  if (!tipo) {
    return (
      <View style={styles.container}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
        <Text style={styles.titulo}>¿Quién eres?</Text>
        <TouchableOpacity style={styles.boton} onPress={() => setTipo('usuario')}>
          <Text style={styles.botonTexto}>Usuario</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.boton} onPress={() => setTipo('asociacion')}>
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

  if (tipo === 'usuario') return <FormularioUsuario onBack={regresar} navigation={navigation} />;
  if (tipo === 'asociacion') return <FormularioAsociacion onBack={regresar} navigation={navigation} />;
}

// ===  Usuario ===
function FormularioUsuario({ onBack, navigation }) {
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [direccion, setDireccion] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [numero, setNumero] = useState('');
  const [curp, setCurp] = useState('');
  const [imagen, setImagen] = useState(null);
  const [cargando, setCargando] = useState(false);

  const seleccionarImagen = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso requerido', 'Se requiere permiso para acceder a la galería');
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!resultado.canceled) {
        setImagen(resultado.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
      console.error('Error al seleccionar imagen:', error);
    }
  };

  const validarFormulario = () => {
    if (!nombre || !apellidos || !direccion || !correo || !contrasena || !confirmarContrasena || !numero || !curp || !imagen) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return false;
    }

    if (contrasena !== confirmarContrasena) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }

    if (contrasena.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return false;
    }

    // Validar CURP (18 caracteres)
    if (curp.length !== 18) {
      Alert.alert('Error', 'El CURP debe tener exactamente 18 caracteres');
      return false;
    }

    return true;
  };

  const registrar = async () => {
    if (!validarFormulario()) {
      return;
    }

    setCargando(true);

    try {
      const datosUsuario = {
        nombre,
        apellidos,
        direccion,
        correo,
        contrasena,
        numero,
        curp,
        imagen: `data:${imagen.type};base64,${imagen.base64}`,
      };

      console.log('Enviando datos al servidor...');
      
      const response = await fetch(`${API_BASE_URL}/api/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosUsuario),
      });

      const resultado = await response.json();

      if (response.ok) {
        Alert.alert('Éxito', 'Usuario registrado correctamente', [
          {
            text: 'OK',
            onPress: () => {
              // Limpiar campos
              setNombre('');
              setApellidos('');
              setDireccion('');
              setCorreo('');
              setContrasena('');
              setConfirmarContrasena('');
              setNumero('');
              setCurp('');
              setImagen(null);
              
              // Navegar a inicio de sesión
              if (navigation) {
                navigation.navigate('InicioSesion');
              }
            }
          }
        ]);
      } else {
        Alert.alert('Error', resultado.mensaje || 'Error al registrar usuario');
      }
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor. Verifica que esté corriendo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.formContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logoSmall} />
        <Text style={styles.titulo}>Registro de Usuario</Text>

        <TouchableOpacity style={styles.imagePicker} onPress={seleccionarImagen}>
          {imagen ? (
            <Image source={{ uri: imagen.uri }} style={styles.imagenSeleccionada} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.textoSubir}>📄 Subir Identificación Oficial</Text>
              <Text style={styles.textoSubirSecundario}>Toca para seleccionar</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Nombre *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ingresa tu nombre"
          value={nombre} 
          onChangeText={setNombre}
          editable={!cargando}
        />

        <Text style={styles.label}>Apellidos *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ingresa tus apellidos"
          value={apellidos} 
          onChangeText={setApellidos}
          editable={!cargando}
        />

        <Text style={styles.label}>Dirección *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ingresa tu dirección"
          value={direccion} 
          onChangeText={setDireccion}
          editable={!cargando}
        />

        <Text style={styles.label}>Correo electrónico *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="email@mail.com"
          value={correo} 
          onChangeText={setCorreo} 
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!cargando}
        />

        <Text style={styles.label}>Contraseña *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Mínimo 6 caracteres"
          value={contrasena} 
          onChangeText={setContrasena} 
          secureTextEntry
          editable={!cargando}
        />

        <Text style={styles.label}>Confirmar Contraseña *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Repite la contraseña"
          value={confirmarContrasena} 
          onChangeText={setConfirmarContrasena} 
          secureTextEntry
          editable={!cargando}
        />

        <Text style={styles.label}>Número de teléfono *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ingresa tu número"
          value={numero} 
          onChangeText={setNumero} 
          keyboardType="phone-pad"
          editable={!cargando}
        />

        <Text style={styles.label}>CURP *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ingresa tu CURP (18 caracteres)"
          value={curp} 
          onChangeText={setCurp}
          autoCapitalize="characters"
          maxLength={18}
          editable={!cargando}
        />

        <TouchableOpacity 
          style={[styles.boton, cargando && styles.botonDeshabilitado]} 
          onPress={registrar}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.botonTexto}>Registrar</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.boton, styles.botonSecundario]} 
          onPress={onBack}
          disabled={cargando}
        >
          <Text style={styles.botonTextoSecundario}>Regresar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ===  Asociación ===
function FormularioAsociacion({ onBack, navigation }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [responsable, setResponsable] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rfc, setRfc] = useState('');
  const [archivosDocumentos, setArchivosDocumentos] = useState([]);
  const [logo, setLogo] = useState(null);
  const [cargando, setCargando] = useState(false);

  const seleccionarLogo = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso requerido', 'Se requiere permiso para acceder a la galería');
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!resultado.canceled) {
        setLogo(resultado.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
      console.error('Error al seleccionar logo:', error);
    }
  };

  const seleccionarDocumentos = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!resultado.canceled && resultado.assets) {
        setArchivosDocumentos(prevArchivos => [...prevArchivos, ...resultado.assets]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron seleccionar los documentos');
      console.error('Error al seleccionar documentos:', error);
    }
  };

  const eliminarDocumento = (index) => {
    setArchivosDocumentos(prevArchivos => 
      prevArchivos.filter((_, i) => i !== index)
    );
  };

  const validarFormulario = () => {
    if (!nombre || !descripcion || !responsable || !direccion || !ciudad || 
        !correo || !contrasena || !confirmarContrasena || !telefono || 
        !rfc || !logo) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return false;
    }

    if (contrasena !== confirmarContrasena) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }

    if (contrasena.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return false;
    }

    // Validar RFC (12 o 13 caracteres)
    if (rfc.length < 12 || rfc.length > 13) {
      Alert.alert('Error', 'El RFC debe tener entre 12 y 13 caracteres');
      return false;
    }

    return true;
  };

  const convertirPDFABase64 = async (archivo) => {
    try {
      // Para archivos PDF, necesitarías implementar la conversión a base64
      return {
        nombre: archivo.name,
        uri: archivo.uri,
        size: archivo.size,
        type: archivo.mimeType || 'application/pdf'
      };
    } catch (error) {
      console.error('Error al convertir PDF:', error);
      return null;
    }
  };

  const registrar = async () => {
    if (!validarFormulario()) {
      return;
    }

    setCargando(true);

    try {
      // Convertir archivos PDF si los hay
      const documentosProcesados = [];
      for (const archivo of archivosDocumentos) {
        const documentoProcesado = await convertirPDFABase64(archivo);
        if (documentoProcesado) {
          documentosProcesados.push(documentoProcesado);
        }
      }

      const datosAsociacion = {
        nombre,
        descripcion,
        responsable,
        direccion,
        ciudad,
        correo,
        contrasena,
        telefono,
        rfc,
        archivosPDF: documentosProcesados,
        logo: `data:${logo.type};base64,${logo.base64}`,
      };

      console.log('Enviando datos de asociación al servidor...');
      
      const response = await fetch(`${API_BASE_URL}/api/asociaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosAsociacion),
      });

      const resultado = await response.json();

      if (response.ok) {
        Alert.alert('Éxito', 'Asociación registrada correctamente', [
          {
            text: 'OK',
            onPress: () => {
              // Limpiar campos
              setNombre('');
              setDescripcion('');
              setResponsable('');
              setDireccion('');
              setCiudad('');
              setCorreo('');
              setContrasena('');
              setConfirmarContrasena('');
              setTelefono('');
              setRfc('');
              setArchivosDocumentos([]);
              setLogo(null);
              
              // Navegar a inicio de sesión
              if (navigation) {
                navigation.navigate('InicioSesion');
              }
            }
          }
        ]);
      } else {
        Alert.alert('Error', resultado.mensaje || 'Error al registrar asociación');
      }
    } catch (error) {
      console.error('Error al registrar asociación:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor. Verifica que esté corriendo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.formContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logoSmall} />
        <Text style={styles.titulo}>Registro de Asociación</Text>

        <TouchableOpacity style={styles.imagePicker} onPress={seleccionarLogo}>
          {logo ? (
            <Image source={{ uri: logo.uri }} style={styles.imagenSeleccionada} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.textoSubir}>📄 Subir Logo</Text>
              <Text style={styles.textoSubirSecundario}>Toca para seleccionar</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Nombre de la Asociación *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Nombre de la asociación"
          value={nombre} 
          onChangeText={setNombre}
          editable={!cargando}
        />

        <Text style={styles.label}>Descripción *</Text>
        <TextInput 
          style={[styles.input, styles.inputMultilinea]} 
          placeholder="Descripción de la asociación"
          value={descripcion} 
          onChangeText={setDescripcion}
          multiline
          numberOfLines={3}
          editable={!cargando}
        />

        <Text style={styles.label}>Nombre del Responsable *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Nombre del responsable"
          value={responsable} 
          onChangeText={setResponsable}
          editable={!cargando}
        />

        <Text style={styles.label}>Dirección *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Dirección completa"
          value={direccion} 
          onChangeText={setDireccion}
          editable={!cargando}
        />

        <Text style={styles.label}>Ciudad *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ciudad"
          value={ciudad} 
          onChangeText={setCiudad}
          editable={!cargando}
        />

        <Text style={styles.label}>Correo electrónico *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="email@mail.com"
          value={correo} 
          onChangeText={setCorreo} 
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!cargando}
        />

        <Text style={styles.label}>Contraseña *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Mínimo 6 caracteres"
          value={contrasena} 
          onChangeText={setContrasena} 
          secureTextEntry
          editable={!cargando}
        />

        <Text style={styles.label}>Confirmar Contraseña *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Repite la contraseña"
          value={confirmarContrasena} 
          onChangeText={setConfirmarContrasena} 
          secureTextEntry
          editable={!cargando}
        />

        <Text style={styles.label}>Teléfono *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Número de teléfono"
          value={telefono} 
          onChangeText={setTelefono} 
          keyboardType="phone-pad"
          editable={!cargando}
        />

        <Text style={styles.label}>RFC *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="RFC de la asociación (12-13 caracteres)"
          value={rfc} 
          onChangeText={setRfc}
          autoCapitalize="characters"
          maxLength={13}
          editable={!cargando}
        />

        <Text style={styles.label}>Documentos Legales * </Text>
        <Text style={styles.label}>(Ej: Acta constitutiva, RFC, etc.)</Text>
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

        {archivosDocumentos.length > 0 && (
          <View style={styles.documentosLista}>
            <Text style={styles.label}>Documentos seleccionados:</Text>
            {archivosDocumentos.map((documento, index) => (
              <View key={index} style={styles.documentoItem}>
                <Text style={styles.documentoNombre} numberOfLines={1}>
                  📄 {documento.name}
                </Text>
                <TouchableOpacity 
                  onPress={() => eliminarDocumento(index)}
                  style={styles.eliminarBoton}
                >
                  <Text style={styles.eliminarTexto}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity 
          style={[styles.boton, cargando && styles.botonDeshabilitado]} 
          onPress={registrar}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.botonTexto}>Registrar</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.boton, styles.botonSecundario]} 
          onPress={onBack}
          disabled={cargando}
        >
          <Text style={styles.botonTextoSecundario}>Regresar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Pantalla principal de selección
  container: {
    flex: 1,
    backgroundColor: '#a2d2ff',
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
    color: '#333',
  },
  
  // ScrollView y formularios
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#a2d2ff',
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
    color: '#333',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  inputMultilinea: {
    height: 80,
    textAlignVertical: 'top',
  },
  
  // Botones
  boton: {
    backgroundColor: '#0066ff',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginTop: 10,
    marginBottom: 15,
  },
  botonDeshabilitado: {
    backgroundColor: '#cccccc',
  },
  botonTexto: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  botonSecundario: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0066ff',
    marginTop: 0,
  },
  botonTextoSecundario: {
    color: '#0066ff',
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
    padding: 10,
    borderRadius: 5,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: '#ddd',
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
  },
});