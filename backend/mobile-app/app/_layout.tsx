import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/AuthContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) return null;

  return (
    <AuthProvider> {/* Envuelve toda la aplicación con AuthProvider */}
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="inicio_sesion" options={{ title: 'Iniciar Sesión', headerShown: false }} />
          <Stack.Screen name="home" options={{ title: 'Inicio' }} />
          <Stack.Screen name="registro_usuarios" options={{ title: 'Registro de Usuarios' }} />
          <Stack.Screen name="registrar-animal" options={{ title: 'Registrar Animal' }} />
          <Stack.Screen name="verificacion" options={{ title: 'Verificación' }} />
          <Stack.Screen name="adopciones" options={{ title: 'Formulario de Adopción' }} />
          {/* Asegúrate de que todas tus rutas estén aquí */}
          <Stack.Screen name="PerfilUsuario" options={{ title: 'Mi Perfil' }} />
          <Stack.Screen name="refugio" options={{ title: 'Panel Refugio' }} />
          <Stack.Screen name="admin" options={{ title: 'Panel Administrador' }} />
          <Stack.Screen name="RecuperarContraseña" options={{ title: 'Recuperar Contraseña' }} />
          <Stack.Screen name="Asociaciones" options={{ title: 'Asociaciones' }} />
          <Stack.Screen name="CatalogoMascotas" options={{ title: 'Catálogo de Mascotas' }} />
          <Stack.Screen name="Donaciones" options={{ title: 'Donaciones' }} />
          {/* La pantalla_inicio.js ahora se llamará 'NosotrosScreen' */}
          <Stack.Screen name="pantalla_inicio" options={{ title: 'Nosotros', headerShown: false }} /> 
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}