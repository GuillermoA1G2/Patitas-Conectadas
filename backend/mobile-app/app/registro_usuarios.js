import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
        <Button title="Usuario" onPress={() => setTipo('usuario')} />
        <View style={{ marginVertical: 10 }} />
        <Button title="Asociación" onPress={() => setTipo('asociacion')} />
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
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      alert('Se requiere permiso para acceder a la galería');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!resultado.cancelled) setImagen(resultado.uri);
  };

  const registrar = () => {
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
      alert('Por favor llena todos los campos');
      return;
    }

    Alert.alert('Éxito', 'Usuario registrado correctamente');
    // Aquí para que guardes los datos en la bd
  };

  return (
    <ScrollView contentContainerStyle={styles.formContainer}>
      <Text style={styles.titulo}>Registro de Usuario</Text>

      <TextInput style={styles.input} placeholder="Nombre" value={nombre} onChangeText={setNombre} />
      <TextInput style={styles.input} placeholder="Apellidos" value={apellidos} onChangeText={setApellidos} />
      <TextInput style={styles.input} placeholder="Dirección" value={direccion} onChangeText={setDireccion} />
      <TextInput style={styles.input} placeholder="Correo" value={correo} onChangeText={setCorreo} keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Contraseña" value={contrasena} onChangeText={setContrasena} secureTextEntry />
      <TextInput style={styles.input} placeholder="Número" value={numero} onChangeText={setNumero} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="CURP" value={curp} onChangeText={setCurp} />

      <TouchableOpacity onPress={seleccionarImagen} style={styles.botonImagen}>
        <Text style={styles.textoBoton}>Seleccionar Identificación Oficial</Text>
      </TouchableOpacity>
      {imagen && <Image source={{ uri: imagen }} style={styles.imagen} />}

      <Button title="Registrar" onPress={registrar} />
      <View style={{ marginVertical: 10 }} />
      <Button title="Salir" color="red" onPress={onBack} />
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
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      alert('Se requiere permiso para acceder a la galería');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!resultado.cancelled) setLogo(resultado.uri);
  };

  const registrar = () => {
    if (!nombre || !responsable || !direccion || !correo || !telefono || !rfc || !logo) {
      alert('Por favor llena todos los campos');
      return;
    }

    Alert.alert('Éxito', 'Asociación registrada correctamente');
    // Aquí para que guardes los datos en la bd
  };

  return (
    <ScrollView contentContainerStyle={styles.formContainer}>
      <Text style={styles.titulo}>Registro de Asociación</Text>

      <TextInput style={styles.input} placeholder="Nombre de la Asociación" value={nombre} onChangeText={setNombre} />
      <TextInput style={styles.input} placeholder="Responsable" value={responsable} onChangeText={setResponsable} />
      <TextInput style={styles.input} placeholder="Dirección" value={direccion} onChangeText={setDireccion} />
      <TextInput style={styles.input} placeholder="Correo" value={correo} onChangeText={setCorreo} keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="RFC" value={rfc} onChangeText={setRfc} />

      <TouchableOpacity onPress={seleccionarLogo} style={styles.botonImagen}>
        <Text style={styles.textoBoton}>Subir Documento o Logo</Text>
      </TouchableOpacity>
      {logo && <Image source={{ uri: logo }} style={styles.imagen} />}

      <Button title="Registrar" onPress={registrar} />
      <View style={{ marginVertical: 10 }} />
      <Button title="Salir" color="red" onPress={onBack} />
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
  },
  titulo: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  botonImagen: {
    backgroundColor: '#007bff',
    padding: 12,
    marginBottom: 15,
    borderRadius: 5,
  },
  textoBoton: {
    color: '#fff',
    textAlign: 'center',
  },
  imagen: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: 20,
  },
});