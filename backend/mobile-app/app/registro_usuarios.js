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
        quality: 1,
      });

      if (!resultado.canceled) {
        setImagen(resultado.assets[0].uri);
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

    try {
      // Crear el objeto del usuario
      const nuevoUsuario = {
        nombre,
        apellidos,
        direccion,
        correo,
        contrasena,
        numero,
        curp,
        imagen,
        fechaRegistro: new Date().toISOString(),
        tipo: 'usuario'
      };

      // Simular envío al backend (descomenta cuando tengas el endpoint)
      // await axios.post('http://TU_BACKEND_URL/api/usuarios', nuevoUsuario);
      
      // Por ahora solo mostramos en consola
      console.log('Usuario registrado:', nuevoUsuario);
      
      Alert.alert('Éxito', 'Usuario registrado correctamente');
      
      // Reset de los campos
      setNombre('');
      setApellidos('');
      setDireccion('');
      setCorreo('');
      setContrasena('');
      setNumero('');
      setCurp('');
      setImagen(null);
      
      // Opcional: regresar al menú principal
      onBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el usuario');
      console.error('Error al registrar usuario:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.formContainer}>
      <Text style={styles.titulo}>Registro de Usuario</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={seleccionarImagen}>
        {imagen ? (
          <Image source={{ uri: imagen }} style={styles.imagen} />
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

      <TouchableOpacity style={styles.boton} onPress={registrar}>
        <Text style={styles.textoBoton}>Registrar</Text>
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
  const [responsable, setResponsable] = useState('');
  const [direccion, setDireccion] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rfc, setRfc] = useState('');
  const [logo, setLogo] = useState(null);

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
        quality: 1,
      });

      if (!resultado.canceled) {
        setLogo(resultado.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
      console.error('Error al seleccionar logo:', error);
    }
  };

  const registrar = async () => {
    if (!nombre || !responsable || !direccion || !correo || !telefono || !rfc || !logo) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      // Crear el objeto de la asociación
      const nuevaAsociacion = {
        nombre,
        responsable,
        direccion,
        correo,
        telefono,
        rfc,
        logo,
        fechaRegistro: new Date().toISOString(),
        tipo: 'asociacion'
      };

      // Simular envío al backend (descomenta cuando tengas el endpoint)
      // await axios.post('http://TU_BACKEND_URL/api/asociaciones', nuevaAsociacion);
      
      // Por ahora solo mostramos en consola
      console.log('Asociación registrada:', nuevaAsociacion);
      
      Alert.alert('Éxito', 'Asociación registrada correctamente');
      
      // Reset de los campos
      setNombre('');
      setResponsable('');
      setDireccion('');
      setCorreo('');
      setTelefono('');
      setRfc('');
      setLogo(null);
      
      // Opcional: regresar al menú principal
      onBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar la asociación');
      console.error('Error al registrar asociación:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.formContainer}>
      <Text style={styles.titulo}>Registro de Asociación</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={seleccionarLogo}>
        {logo ? (
          <Image source={{ uri: logo }} style={styles.imagen} />
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
        style={styles.input} 
        placeholder="Responsable" 
        value={responsable} 
        onChangeText={setResponsable} 
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

      <TouchableOpacity style={styles.boton} onPress={registrar}>
        <Text style={styles.textoBoton}>Registrar</Text>
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
});