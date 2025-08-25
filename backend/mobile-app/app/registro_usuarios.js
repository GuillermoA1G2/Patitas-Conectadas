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

// Configura la URL base del servidor
const API_BASE_URL = 'http://192.168.1.119:3000';

export default function App() {
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

  if (tipo === 'usuario') return <FormularioUsuario onBack={regresar} />;
  if (tipo === 'asociacion') return <FormularioAsociacion onBack={regresar} />;
}

// ===  Usuario ===
function FormularioUsuario({ onBack }) {
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [direccion, setDireccion] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
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
        quality: 0.8, // Reducir calidad para menor tamaño
        base64: true, // Obtener base64
      });

      if (!resultado.canceled) {
        setImagen(resultado.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
      console.error('Error al seleccionar imagen:', error);
    }
  };

  const registrar = async () => {
    if (
      !nombre ||
      !apellidos ||
      !direccion ||
      !correo ||
      !contrasena ||
      !numero ||
      !curp ||
      !imagen
    ) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setCargando(true);

    try {
      // Preparar los datos para enviar
      const datosUsuario = {
        nombre,
        apellidos,
        direccion,
        correo,
        contrasena,
        numero,
        curp,
        imagen: `data:${imagen.type};base64,${imagen.base64}`, // Formato base64
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
              setNumero('');
              setCurp('');
              setImagen(null);
              onBack();
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

        <Text style={styles.label}>Nombre</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ingresa tu nombre"
          value={nombre} 
          onChangeText={setNombre}
          editable={!cargando}
        />

        <Text style={styles.label}>Apellidos</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ingresa tus apellidos"
          value={apellidos} 
          onChangeText={setApellidos}
          editable={!cargando}
        />

        <Text style={styles.label}>Dirección</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ingresa tu dirección"
          value={direccion} 
          onChangeText={setDireccion}
          editable={!cargando}
        />

        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput 
          style={styles.input} 
          placeholder="email@mail.com"
          value={correo} 
          onChangeText={setCorreo} 
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!cargando}
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput 
          style={styles.input} 
          placeholder="********"
          value={contrasena} 
          onChangeText={setContrasena} 
          secureTextEntry
          editable={!cargando}
        />

        <Text style={styles.label}>Número de teléfono</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ingresa tu número"
          value={numero} 
          onChangeText={setNumero} 
          keyboardType="phone-pad"
          editable={!cargando}
        />

        <Text style={styles.label}>CURP</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ingresa tu CURP"
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
function FormularioAsociacion({ onBack }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [responsable, setResponsable] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rfc, setRfc] = useState('');
  const [documentosLegales, setDocumentosLegales] = useState('');
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

  const registrar = async () => {
    if (!nombre || !descripcion || !responsable || !direccion || !ciudad || !correo || !contrasena || !telefono || !rfc || !documentosLegales || !logo) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setCargando(true);

    try {
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
        documentosLegales,
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
              setTelefono('');
              setRfc('');
              setDocumentosLegales('');
              setLogo(null);
              onBack();
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
              <Text style={styles.textoSubir}>📄 Subir Documento o Logo</Text>
              <Text style={styles.textoSubirSecundario}>Toca para seleccionar</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Nombre de la Asociación</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Nombre de la asociación"
          value={nombre} 
          onChangeText={setNombre}
          editable={!cargando}
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput 
          style={[styles.input, styles.inputMultilinea]} 
          placeholder="Descripción de la asociación"
          value={descripcion} 
          onChangeText={setDescripcion}
          multiline
          numberOfLines={3}
          editable={!cargando}
        />

        <Text style={styles.label}>Nombre del Responsable</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Nombre del responsable"
          value={responsable} 
          onChangeText={setResponsable}
          editable={!cargando}
        />

        <Text style={styles.label}>Dirección</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Dirección completa"
          value={direccion} 
          onChangeText={setDireccion}
          editable={!cargando}
        />

        <Text style={styles.label}>Ciudad</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ciudad"
          value={ciudad} 
          onChangeText={setCiudad}
          editable={!cargando}
        />

        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput 
          style={styles.input} 
          placeholder="email@mail.com"
          value={correo} 
          onChangeText={setCorreo} 
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!cargando}
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput 
          style={styles.input} 
          placeholder="********"
          value={contrasena} 
          onChangeText={setContrasena} 
          secureTextEntry
          editable={!cargando}
        />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Número de teléfono"
          value={telefono} 
          onChangeText={setTelefono} 
          keyboardType="phone-pad"
          editable={!cargando}
        />

        <Text style={styles.label}>RFC</Text>
        <TextInput 
          style={styles.input} 
          placeholder="RFC de la asociación"
          value={rfc} 
          onChangeText={setRfc}
          autoCapitalize="characters"
          maxLength={13}
          editable={!cargando}
        />

        <Text style={styles.label}>Documentos Legales</Text>
        <TextInput 
          style={[styles.input, styles.inputMultilinea]} 
          placeholder="Información sobre documentos legales (Ej: Acta constitutiva, RFC, etc.)"
          value={documentosLegales} 
          onChangeText={setDocumentosLegales}
          multiline
          numberOfLines={3}
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