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

export default function VerificacionScreen() {
  const [nombre, setNombre] = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [motivo, setMotivo] = useState('');
  const [referencias, setReferencias] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [experiencia, setExperiencia] = useState('');
  const [comprobanteDomicilio, setComprobanteDomicilio] = useState(null);
  const [identificacion, setIdentificacion] = useState(null);

  const seleccionarComprobante = async () => {
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

    if (!resultado.cancelled) setComprobanteDomicilio(resultado.uri);
  };

  const seleccionarIdentificacion = async () => {
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

    if (!resultado.cancelled) setIdentificacion(resultado.uri);
  };

  const enviarSolicitud = () => {
    if (
      !nombre ||
      !domicilio ||
      !motivo ||
      !referencias ||
      !telefono ||
      !correo ||
      !experiencia ||
      !comprobanteDomicilio ||
      !identificacion
    ) {
      alert('Por favor llena todos los campos y sube los documentos requeridos');
      return;
    }

    Alert.alert('Éxito', 'Solicitud de verificación enviada correctamente');
    console.log('Datos enviados:', {
      nombre,
      domicilio,
      motivo,
      referencias,
      telefono,
      correo,
      experiencia,
      comprobanteDomicilio,
      identificacion
    });
    // Aquí para que guardes los datos en la bd
  };

  return (
    <ScrollView contentContainerStyle={styles.formContainer}>
      <Text style={styles.titulo}>Proceso de Verificación</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        style={styles.input}
        placeholder="Domicilio completo"
        value={domicilio}
        onChangeText={setDomicilio}
      />

      <TextInput
        style={styles.input}
        placeholder="Número de teléfono"
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={correo}
        onChangeText={setCorreo}
        keyboardType="email-address"
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="¿Por qué deseas adoptar? (Explica tus motivaciones)"
        value={motivo}
        onChangeText={setMotivo}
        multiline
        numberOfLines={4}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Referencias personales (Nombre, teléfono y relación)"
        value={referencias}
        onChangeText={setReferencias}
        multiline
        numberOfLines={3}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="¿Has tenido mascotas antes? Describe tu experiencia"
        value={experiencia}
        onChangeText={setExperiencia}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity onPress={seleccionarIdentificacion} style={styles.botonImagen}>
        <Text style={styles.textoBoton}>Subir Identificación Oficial</Text>
      </TouchableOpacity>
      {identificacion && <Image source={{ uri: identificacion }} style={styles.imagen} />}

      <TouchableOpacity onPress={seleccionarComprobante} style={styles.botonImagen}>
        <Text style={styles.textoBoton}>Subir Comprobante de Domicilio</Text>
      </TouchableOpacity>
      {comprobanteDomicilio && <Image source={{ uri: comprobanteDomicilio }} style={styles.imagen} />}

      <View style={styles.buttonContainer}>
        <Button title="Enviar Solicitud" onPress={enviarSolicitud} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  buttonContainer: {
    marginTop: 10,
  },
});