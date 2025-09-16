// AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';

// Crear el contexto de autenticación
const AuthContext = createContext(null);

// Proveedor de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Almacena los datos del usuario autenticado
  const [token, setToken] = useState(null); // Almacena el token de autenticación
  const [loading, setLoading] = useState(true); // Para saber si estamos cargando la sesión inicial
  const router = useRouter();

  useEffect(() => {
    const loadUserSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userSession');
        const storedToken = await AsyncStorage.getItem('userToken'); // Cargar el token
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setToken(storedToken); // Establecer el token
          console.log('✅ Sesión de usuario y token cargados desde AsyncStorage:', userData.nombre || userData.email);

          // Configurar el token en las cabeceras de Axios globalmente
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Redirigir al usuario a la pantalla correcta si ya está logueado
          if (userData.tipo === 'refugio') {
            router.replace({
              pathname: '/refugio',
              params: {
                refugioId: userData.id,
                refugioNombre: userData.nombre,
                refugioEmail: userData.email,
                refugioTelefono: userData.telefono || '',
                usuarioTipo: 'refugio'
              }
            });
          } else if (userData.rol === 5) { // Admin
            router.replace({
              pathname: '/admin',
              params: {
                adminId: userData.id,
                adminNombre: userData.nombre,
                adminEmail: userData.email,
                usuarioTipo: 'admin',
                id_rol: userData.rol
              }
            });
          } else { // Usuario normal
            router.replace({
              pathname: '/PerfilUsuario',
              params: {
                usuarioId: userData.id,
                usuarioNombre: userData.nombre,
                usuarioEmail: userData.email,
                usuarioTelefono: userData.telefono || '',
                usuarioTipo: 'usuario',
                id_rol: userData.rol || 4
              }
            });
          }
        } else {
          console.log('❌ No hay sesión de usuario o token en AsyncStorage.');
          // Si no hay sesión, asegurar que estamos en la pantalla de login
          router.replace('/inicio_sesion');
        }
      } catch (error) {
        console.error('Error al cargar la sesión de usuario:', error);
        Alert.alert('Error de Sesión', 'No se pudo cargar la sesión anterior.');
        router.replace('/inicio_sesion'); // En caso de error, ir al login
      } finally {
        setLoading(false);
      }
    };

    loadUserSession();
  }, []); // Se ejecuta solo una vez al montar el componente

  const login = async (userData, tipoUsuario, authToken) => { // Recibe el token
    try {
      const sessionData = {
        id: userData.id || userData._id,
        nombre: userData.nombre,
        email: userData.email,
        telefono: userData.telefono,
        rol: userData.rol || userData.id_rol || 4,
        tipo: tipoUsuario
      };
      await AsyncStorage.setItem('userSession', JSON.stringify(sessionData));
      await AsyncStorage.setItem('userToken', authToken); // Guardar el token
      setUser(sessionData);
      setToken(authToken); // Establecer el token en el estado

      // Configurar el token en las cabeceras de Axios globalmente
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

      console.log('✅ Sesión de usuario y token guardados y establecidos en el contexto:', sessionData.nombre);
    } catch (error) {
      console.error('Error al guardar la sesión de usuario o token:', error);
      Alert.alert('Error de Sesión', 'No se pudo guardar la sesión.');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userSession');
      await AsyncStorage.removeItem('userToken'); // Eliminar el token
      setUser(null);
      setToken(null); // Limpiar el token del estado

      // Eliminar el token de las cabeceras de Axios
      delete axios.defaults.headers.common['Authorization'];

      console.log('🗑️ Sesión de usuario y token cerrados y eliminados de AsyncStorage.');
      router.replace('/inicio_sesion'); // Redirigir al login después de cerrar sesión
    } catch (error) {
      console.error('Error al cerrar la sesión de usuario:', error);
      Alert.alert('Error de Sesión', 'No se pudo cerrar la sesión.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};