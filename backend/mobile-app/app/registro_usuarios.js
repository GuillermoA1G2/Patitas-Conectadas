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
        <Text style={styles.titulo}>¿Quién eres?</Text>
        <TouchableOpacity style={styles.botonTipo} onPress={() => setTipo('usuario')}>
          <Text style={styles.textoBotonTipo}>Usuario</Text>
        </TouchableOpacity>
        <View style={{ marginVertical: 10 }} />
        <TouchableOpacity style={styles.botonTipo} onPress={() => setTipo('asociacion')}>
          <Text style={styles.textoBotonTipo}>Asociación</Text>
        </TouchableOpacity>
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
    <ScrollView contentContainerStyle={styles.formContainer}>
      <Text style={styles.titulo}>Registro de Usuario</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={seleccionarImagen}>
        {imagen ? (
          <Image source={{ uri: imagen.uri }} style={styles.imagen} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.textoSubir}>📄 Subir Identificación Oficial</Text>
            <Text style={styles.textoSubirSecundario}>Toca para seleccionar</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput 
        style={styles.input} 
        placeholder="Nombre" 
        value={nombre} 
        onChangeText={setNombre} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Apellidos" 
        value={apellidos} 
        onChangeText={setApellidos} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Dirección" 
        value={direccion} 
        onChangeText={setDireccion} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Correo" 
        value={correo} 
        onChangeText={setCorreo} 
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput 
        style={styles.input} 
        placeholder="Contraseña" 
        value={contrasena} 
        onChangeText={setContrasena} 
        secureTextEntry 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Número" 
        value={numero} 
        onChangeText={setNumero} 
        keyboardType="phone-pad" 
      />
      <TextInput 
        style={styles.input} 
        placeholder="CURP" 
        value={curp} 
        onChangeText={setCurp}
        autoCapitalize="characters"
        maxLength={18}
      />

      <TouchableOpacity 
        style={[styles.boton, cargando && styles.botonDeshabilitado]} 
        onPress={registrar}
        disabled={cargando}
      >
        <Text style={styles.textoBoton}>
          {cargando ? 'Registrando...' : 'Registrar'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={onBack}>
        <Text style={styles.textoBotonSecundario}>Salir</Text>
      </TouchableOpacity>
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
    <ScrollView contentContainerStyle={styles.formContainer}>
      <Text style={styles.titulo}>Registro de Asociación</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={seleccionarLogo}>
        {logo ? (
          <Image source={{ uri: logo.uri }} style={styles.imagen} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.textoSubir}>📄 Subir Documento o Logo</Text>
            <Text style={styles.textoSubirSecundario}>Toca para seleccionar</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput 
        style={styles.input} 
        placeholder="Nombre de la Asociación" 
        value={nombre} 
        onChangeText={setNombre} 
      />
      <TextInput 
        style={[styles.input, styles.inputMultilinea]} 
        placeholder="Descripción de la asociación" 
        value={descripcion} 
        onChangeText={setDescripcion}
        multiline
        numberOfLines={3}
      />
      <TextInput 
        style={styles.input} 
        placeholder="Nombre del Responsable" 
        value={responsable} 
        onChangeText={setResponsable} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Dirección completa" 
        value={direccion} 
        onChangeText={setDireccion} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Ciudad" 
        value={ciudad} 
        onChangeText={setCiudad} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Correo electrónico" 
        value={correo} 
        onChangeText={setCorreo} 
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput 
        style={styles.input} 
        placeholder="Contraseña" 
        value={contrasena} 
        onChangeText={setContrasena} 
        secureTextEntry 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Teléfono" 
        value={telefono} 
        onChangeText={setTelefono} 
        keyboardType="phone-pad" 
      />
      <TextInput 
        style={styles.input} 
        placeholder="RFC" 
        value={rfc} 
        onChangeText={setRfc}
        autoCapitalize="characters"
        maxLength={13}
      />
      <TextInput 
        style={[styles.input, styles.inputMultilinea]} 
        placeholder="Información sobre documentos legales (Ej: Acta constitutiva, RFC, etc.)" 
        value={documentosLegales} 
        onChangeText={setDocumentosLegales}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity 
        style={[styles.boton, cargando && styles.botonDeshabilitado]} 
        onPress={registrar}
        disabled={cargando}
      >
        <Text style={styles.textoBoton}>
          {cargando ? 'Registrando...' : 'Registrar'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={onBack}>
        <Text style={styles.textoBotonSecundario}>Salir</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f0f0f0',
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  titulo: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#3a0ca3',
  },
  botonTipo: {
    backgroundColor: '#7209b7',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  textoBotonTipo: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 12,
    marginBottom: 15,
    borderRadius: 6,
    fontSize: 16,
  },
  imagePicker: {
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  imagen: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  textoSubir: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  textoSubirSecundario: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
  boton: {
    backgroundColor: '#7209b7',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  textoBoton: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  botonSecundario: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#7209b7',
  },
  textoBotonSecundario: {
    color: '#7209b7',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  botonDeshabilitado: {
    backgroundColor: '#ccc',
  },
  inputMultilinea: {
    height: 80,
    textAlignVertical: 'top',
  },
});