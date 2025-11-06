import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

//const API_URL = "http://192.168.1.119:3000";
const API_URL = "https://patitas-conectadas-nine.vercel.app";

function ChatApp() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      from: "bot",
      text: "¡Hola! Soy Patitas, tu asistente. ¿En qué puedo ayudarte?",
    },
  ]);
  const [input, setInput] = useState("");
  const [trainingOpen, setTrainingOpen] = useState(false);
  const [trainQ, setTrainQ] = useState("");
  const [trainA, setTrainA] = useState("");
  const scrollRef = useRef(null);
  const insets = useSafeAreaInsets();

  // Función para desplazar el scroll al final de los mensajes
  const scrollToEnd = () => {
    // Un pequeño retraso para asegurar que el contenido se ha renderizado
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  // Función para enviar un mensaje al chatbot
  async function sendMessage() {
    const text = input.trim();
    if (!text) return; // No enviar mensajes vacíos

    Keyboard.dismiss(); // Ocultar el teclado
    const userMsg = { id: Date.now().toString(), from: "user", text };
    setMessages((prev) => [...prev, userMsg]); // Añadir mensaje del usuario
    setInput(""); // Limpiar el input
    scrollToEnd(); // Desplazar al final

    try {
      // **CORRECCIÓN**: Usar template literals con backticks
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        // Manejar respuestas HTTP no exitosas
        throw new Error(`Error del servidor: ${res.status}`);
      }

      const data = await res.json();
      const botMsg = {
        id: (Date.now() + 1).toString(),
        from: "bot",
        text: data.reply || "Ups, hubo un problema con la respuesta del bot.",
      };
      setMessages((prev) => [...prev, botMsg]); // Añadir respuesta del bot
      scrollToEnd(); // Desplazar al final
    } catch (e) {
      console.error("Error al enviar mensaje:", e);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          from: "bot",
          text: `No pude conectar con el servidor o hubo un error: ${e.message || 'Desconocido'} 😿`,
        },
      ]);
      scrollToEnd(); // Desplazar al final
    }
  }

  // Función para entrenar al bot con una nueva pregunta y respuesta
  async function trainBot() {
    const q = trainQ.trim();
    const a = trainA.trim();
    if (!q || !a) {
      Alert.alert("Campos Vacíos", "Por favor, ingresa una pregunta y una respuesta para entrenar al bot.");
      return;
    }

    try {
      // **CORRECCIÓN**: Usar template literals con backticks
      const res = await fetch(`${API_URL}/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, answer: a }),
      });

      if (!res.ok) {
        throw new Error(`Error del servidor al entrenar: ${res.status}`);
      }

      // Asumiendo que el servidor devuelve un JSON de confirmación, aunque no se usa aquí
      // const data = await res.json();

      setTrainingOpen(false); // Cerrar el modal
      setTrainQ(""); // Limpiar input de pregunta
      setTrainA(""); // Limpiar input de respuesta
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 3).toString(),
          from: "bot",
          text: "¡He aprendido una nueva respuesta! 🎓",
        },
      ]);
      scrollToEnd(); // Desplazar al final
    } catch (e) { // **CORRECCIÓN**: Capturar el objeto de error
      console.error("Error al entrenar el bot:", e);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 4).toString(),
          from: "bot",
          text: `No pude guardar el entrenamiento: ${e.message || 'Desconocido'} 😿`,
        },
      ]);
      scrollToEnd(); // Desplazar al final
    }
  }

  // Componente para renderizar cada burbuja de mensaje
  const renderItem = (item) => (
    <View
      key={item.id}
      style={[styles.bubble, item.from === "bot" ? styles.bot : styles.user]}
    >
      <Text style={[styles.text, item.from === "user" && styles.userText]}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      // Ajusta este offset si el teclado aún cubre el input en Android
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 80}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <StatusBar style="light" />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chatbot</Text>
          </View>
          <KeyboardAwareScrollView
            ref={scrollRef}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={scrollToEnd}
          >
            {messages.map((m) => renderItem(m))}
          </KeyboardAwareScrollView>
          <View style={[styles.inputBar, { paddingBottom: insets.bottom }]}>
            <TextInput
              style={styles.input}
              placeholder="Escribe aquí..."
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage} // Envía el mensaje al presionar "Enter" o "Send"
              returnKeyType="send"
              accessibilityLabel="Campo de texto para escribir un mensaje"
            />
            <TouchableOpacity
              style={styles.askBtn}
              onPress={sendMessage}
              accessibilityLabel="Botón para enviar mensaje"
            >
              <Text style={styles.askBtnText}>Haz una pregunta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.plusBtn}
              onPress={() => setTrainingOpen(true)}
              accessibilityLabel="Botón para abrir el formulario de entrenamiento del bot"
            >
              <Text style={styles.plusBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Modal de entrenamiento */}
          <Modal visible={trainingOpen} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Entrenar respuesta</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Frase del usuario (pregunta)"
                  value={trainQ}
                  onChangeText={setTrainQ}
                  accessibilityLabel="Campo para la pregunta del usuario"
                />
                <TextInput
                  style={[styles.modalInput, { height: 90 }]}
                  placeholder="Respuesta del bot"
                  value={trainA}
                  onChangeText={setTrainA}
                  multiline
                  accessibilityLabel="Campo para la respuesta del bot"
                />
                <View style={styles.modalRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.cancel]}
                    onPress={() => setTrainingOpen(false)}
                    accessibilityLabel="Botón para cancelar el entrenamiento"
                  >
                    <Text style={[styles.modalBtnText, { color: "#333" }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.save]}
                    onPress={trainBot}
                    accessibilityLabel="Botón para guardar el entrenamiento"
                  >
                    <Text style={[styles.modalBtnText, { color: "#fff" }]}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

export default ChatApp;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#A4645E",
    padding: 16,
    alignItems: "center",
    // Añadir padding superior para iOS si no se usa useSafeAreaInsets en el header
    paddingTop: Platform.OS === "ios" ? 40 : 16,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  listContent: { padding: 12 },
  bubble: {
    maxWidth: "78%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
    // Sombra para un mejor efecto visual
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  bot: { backgroundColor: "#eeeeee", alignSelf: "flex-start" },
  user: { backgroundColor: "#FFD6EC", alignSelf: "flex-end" },
  text: { color: "#333" },
  userText: { color: "#900B09" },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    marginRight: 8,
    minHeight: 40, // Asegurar una altura mínima
  },
  askBtn: {
    backgroundColor: "#000",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    justifyContent: "center", // Centrar texto verticalmente
  },
  askBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  plusBtn: {
    marginLeft: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  plusBtnText: { fontSize: 18, fontWeight: "900", color: "#000" }, // Asegurar color del texto
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    // Sombra para el modal
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18, // Un poco más grande
    fontWeight: "700",
    marginBottom: 15, // Más espacio
    textAlign: "center",
    color: "#333",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12, // Más padding
    marginBottom: 12, // Más espacio
    backgroundColor: "#fff",
    fontSize: 16, // Tamaño de fuente consistente
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10, // Espacio superior
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16, // Más padding horizontal
    borderRadius: 10,
    minWidth: 90, // Ancho mínimo para los botones
    alignItems: "center",
  },
  cancel: { backgroundColor: "#e0e0e0" }, // Color más suave
  save: { backgroundColor: "#a26b6c" },
  modalBtnText: { fontWeight: "600", fontSize: 15 }, // Tamaño de fuente consistente
});

