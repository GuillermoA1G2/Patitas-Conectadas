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

export default function VerificacionScreen({ navigation }) {
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
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!resultado.canceled) {
      setComprobanteDomicilio(resultado.assets[0].uri);
    }
  };

  const seleccionarIdentificacion = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!resultado.canceled) {
      setIdentificacion(resultado.assets[0].uri);
    }
  };

  const enviarSolicitud = async () => {
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
      Alert.alert('Error', 'Por favor completa todos los campos y sube los documentos requeridos');
      return;
    }

    try {
      // Crear el objeto de la solicitud
      const solicitudVerificacion = {
        nombre,
        domicilio,
        telefono,
        correo,
        motivo,
        referencias,
        experiencia,
        comprobanteDomicilio,
        identificacion,
        fecha: new Date().toISOString(),
      };

      // Simular envío al backend (descomenta cuando tengas el endpoint)
      // await axios.post('http://TU_BACKEND_URL/api/verificacion', solicitudVerificacion);
      
      // Por ahora solo mostramos en consola
      console.log('Solicitud de verificación enviada:', solicitudVerificacion);
      
      Alert.alert('Éxito', 'Solicitud de verificación enviada correctamente');
      
      // Reset de los campos
      setNombre('');
      setDomicilio('');
      setMotivo('');
      setReferencias('');
      setTelefono('');
      setCorreo('');
      setExperiencia('');
      setComprobanteDomicilio(null);
      setIdentificacion(null);
      
      // Opcional: navegar hacia atrás
      if (navigation) {
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la solicitud');
      console.error('Error al enviar solicitud:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
        autoCapitalize="none"
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="¿Por qué deseas adoptar? (Explica tus motivaciones)"
        value={motivo}
        onChangeText={setMotivo}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Referencias personales (Nombre, teléfono y relación)"
        value={referencias}
        onChangeText={setReferencias}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="¿Has tenido mascotas antes? Describe tu experiencia"
        value={experiencia}
        onChangeText={setExperiencia}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Selector de identificación */}
      <TouchableOpacity style={styles.imagePicker} onPress={seleccionarIdentificacion}>
        {identificacion ? (
          <Image source={{ uri: identificacion }} style={styles.imagen} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.textoSubir}>📄 Subir Identificación Oficial</Text>
            <Text style={styles.textoSubirSecundario}>Toca para seleccionar</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Selector de comprobante de domicilio */}
      <TouchableOpacity style={styles.imagePicker} onPress={seleccionarComprobante}>
        {comprobanteDomicilio ? (
          <Image source={{ uri: comprobanteDomicilio }} style={styles.imagen} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.textoSubir}>🏠 Subir Comprobante de Domicilio</Text>
            <Text style={styles.textoSubirSecundario}>Toca para seleccionar</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.boton} onPress={enviarSolicitud}>
        <Text style={styles.textoBoton}>Enviar Solicitud</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#3a0ca3',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 12,
    marginBottom: 15,
    borderRadius: 6,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  imagePicker: {
    alignItems: 'center',
    marginVertical: 10,
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
    marginTop: 20,
  },
  textoBoton: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});