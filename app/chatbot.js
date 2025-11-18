import React, { useRef, useState, useCallback, useMemo } from "react";
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
  ActivityIndicator,
  Animated,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const API_URL = "https://patitas-conectadas-nine.vercel.app";

function ChatApp() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      from: "bot",
      text: "¡Hola! 👋 Soy Patitas, tu asistente virtual. Estoy aquí para ayudarte con todo lo que necesites. ¿En qué puedo ayudarte hoy?",
    },
  ]);
  const [input, setInput] = useState("");
  const [trainingOpen, setTrainingOpen] = useState(false);
  const [trainQ, setTrainQ] = useState("");
  const [trainA, setTrainA] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animación de entrada para mensajes
  const animateMessageIn = useCallback(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Función optimizada para desplazar el scroll al final
  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // Función para enviar un mensaje al chatbot
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    Keyboard.dismiss();
    const userMsg = { id: Date.now().toString(), from: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    animateMessageIn();

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        throw new Error(`Error del servidor: ${res.status}`);
      }

      const data = await res.json();
      const botMsg = {
        id: (Date.now() + 1).toString(),
        from: "bot",
        text: data.reply || "Ups, hubo un problema con la respuesta del bot.",
      };
      setMessages((prev) => [...prev, botMsg]);
      animateMessageIn();
    } catch (e) {
      console.error("Error al enviar mensaje:", e);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          from: "bot",
          text: `Lo siento, no pude conectar con el servidor. Por favor, intenta de nuevo. 😿`,
        },
      ]);
    } finally {
      setIsLoading(false);
      scrollToEnd();
    }
  }, [input, isLoading, scrollToEnd, animateMessageIn]);

  // Función para entrenar al bot
  const trainBot = useCallback(async () => {
    const q = trainQ.trim();
    const a = trainA.trim();
    
    if (!q || !a) {
      Alert.alert(
        "Campos Vacíos",
        "Por favor, ingresa una pregunta y una respuesta para entrenar al bot.",
        [{ text: "Entendido", style: "default" }]
      );
      return;
    }

    try {
      const res = await fetch(`${API_URL}/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, answer: a }),
      });

      if (!res.ok) {
        throw new Error(`Error del servidor al entrenar: ${res.status}`);
      }

      setTrainingOpen(false);
      setTrainQ("");
      setTrainA("");
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 3).toString(),
          from: "bot",
          text: "¡Genial! He aprendido algo nuevo. Gracias por enseñarme 🎓✨",
        },
      ]);
      scrollToEnd();
      Alert.alert(
        "¡Éxito! 🎉",
        "El bot ha sido entrenado correctamente",
        [{ text: "Perfecto", style: "default" }]
      );
    } catch (e) {
      console.error("Error al entrenar el bot:", e);
      Alert.alert(
        "Error ⚠️",
        `No pude guardar el entrenamiento. Por favor, intenta de nuevo.`,
        [{ text: "Entendido", style: "cancel" }]
      );
    }
  }, [trainQ, trainA, scrollToEnd]);

  // Componente memoizado para renderizar burbujas
  const MessageBubble = useMemo(
    () =>
      React.memo(({ item, index }) => (
        <Animated.View
          style={[
            styles.bubble,
            item.from === "bot" ? styles.bot : styles.user,
            { opacity: index === messages.length - 1 ? fadeAnim : 1 },
          ]}
        >
          {item.from === "bot" && (
            <View style={styles.botIcon}>
              <Text style={styles.botIconText}>🐾</Text>
            </View>
          )}
          <View style={styles.messageContent}>
            <Text style={[styles.text, item.from === "user" && styles.userText]}>
              {item.text}
            </Text>
            <Text style={styles.timestamp}>
              {new Date().toLocaleTimeString('es-MX', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </Animated.View>
      )),
    [fadeAnim, messages.length]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 80}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <StatusBar style="light" />
          
          {/* Header con gradiente */}
          <LinearGradient
            colors={['#B8756D', '#A4645E', '#8B4F48']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 12 }]}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerIcon}>
                <Text style={styles.headerIconText}>🐾</Text>
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Patitas</Text>
                <Text style={styles.headerSubtitle}>Tu asistente virtual</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Lista de mensajes */}
          <View style={styles.messagesContainer}>
            <KeyboardAwareScrollView
              ref={scrollRef}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={scrollToEnd}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((m, index) => (
                <MessageBubble key={m.id} item={m} index={index} />
              ))}
              {isLoading && (
                <View style={[styles.bubble, styles.bot, styles.loadingBubble]}>
                  <View style={styles.botIcon}>
                    <Text style={styles.botIconText}>🐾</Text>
                  </View>
                  <View style={styles.loadingContent}>
                    <View style={styles.typingIndicator}>
                      <View style={[styles.typingDot, styles.dot1]} />
                      <View style={[styles.typingDot, styles.dot2]} />
                      <View style={[styles.typingDot, styles.dot3]} />
                    </View>
                    <Text style={styles.loadingText}>Patitas está escribiendo...</Text>
                  </View>
                </View>
              )}
            </KeyboardAwareScrollView>
          </View>

          {/* Barra de input mejorada */}
          <View style={[styles.inputBar, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Escribe tu mensaje..."
                placeholderTextColor="#999"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                editable={!isLoading}
                multiline
                maxLength={500}
                accessibilityLabel="Campo de texto para escribir un mensaje"
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || isLoading) && styles.btnDisabled]}
                onPress={sendMessage}
                disabled={!input.trim() || isLoading}
                accessibilityLabel="Botón para enviar mensaje"
              >
                <Text style={styles.sendIcon}>📤</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.trainBtn}
              onPress={() => setTrainingOpen(true)}
              accessibilityLabel="Botón para abrir el formulario de entrenamiento del bot"
            >
              <LinearGradient
                colors={['#B8756D', '#A4645E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.trainBtnGradient}
              >
                <Text style={styles.trainBtnText}>Entrenar Bot</Text>
                <Text style={styles.trainBtnIcon}>🎓</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Modal de entrenamiento mejorado */}
          <Modal
            visible={trainingOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setTrainingOpen(false)}
          >
            <TouchableWithoutFeedback onPress={() => setTrainingOpen(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.modalCard}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalIcon}>🎓</Text>
                      <Text style={styles.modalTitle}>Entrenar a Patitas</Text>
                      <Text style={styles.modalSubtitle}>
                        Ayuda a mejorar las respuestas del bot
                      </Text>
                    </View>
                    
                    <View style={styles.modalBody}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Pregunta del usuario</Text>
                        <TextInput
                          style={styles.modalInput}
                          placeholder="Ej: ¿Cuál es tu horario de atención?"
                          placeholderTextColor="#999"
                          value={trainQ}
                          onChangeText={setTrainQ}
                          accessibilityLabel="Campo para la pregunta del usuario"
                        />
                      </View>
                      
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Respuesta del bot</Text>
                        <TextInput
                          style={[styles.modalInput, styles.modalInputMultiline]}
                          placeholder="Ej: Nuestro horario es de lunes a viernes de 9am a 6pm"
                          placeholderTextColor="#999"
                          value={trainA}
                          onChangeText={setTrainA}
                          multiline
                          textAlignVertical="top"
                          accessibilityLabel="Campo para la respuesta del bot"
                        />
                      </View>
                    </View>
                    
                    <View style={styles.modalFooter}>
                      <TouchableOpacity
                        style={[styles.modalBtn, styles.cancelBtn]}
                        onPress={() => setTrainingOpen(false)}
                        accessibilityLabel="Botón para cancelar el entrenamiento"
                      >
                        <Text style={styles.cancelBtnText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalBtn, styles.saveBtn]}
                        onPress={trainBot}
                        accessibilityLabel="Botón para guardar el entrenamiento"
                      >
                        <LinearGradient
                          colors={['#B8756D', '#A4645E']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.saveBtnGradient}
                        >
                          <Text style={styles.saveBtnText}>Guardar</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

export default ChatApp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerIconText: {
    fontSize: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  bubble: {
    maxWidth: "85%",
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  bot: {
    alignSelf: "flex-start",
  },
  user: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  botIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#A4645E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginBottom: 4,
  },
  botIconText: {
    fontSize: 16,
  },
  messageContent: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  text: {
    color: "#2C3E50",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
  },
  userText: {
    color: "#fff",
  },
  timestamp: {
    color: "#95A5A6",
    fontSize: 11,
    marginTop: 6,
    alignSelf: "flex-end",
  },
  loadingBubble: {
    marginBottom: 16,
  },
  loadingContent: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#A4645E",
  },
  loadingText: {
    color: "#7F8C8D",
    fontSize: 13,
    fontStyle: "italic",
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#2C3E50",
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#A4645E",
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    fontSize: 18,
  },
  trainBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  trainBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  trainBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  trainBtnIcon: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalHeader: {
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2C3E50",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
  },
  modalBody: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#F9F9F9",
    fontSize: 15,
    color: "#2C3E50",
  },
  modalInputMultiline: {
    height: 120,
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 24,
    paddingTop: 0,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  cancelBtn: {
    backgroundColor: "#F0F0F0",
  },
  cancelBtnText: {
    textAlign: "center",
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "700",
    color: "#7F8C8D",
  },
  saveBtn: {
    overflow: "hidden",
  },
  saveBtnGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});