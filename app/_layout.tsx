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
          <Stack.Screen name="chatbot" options={{ title: 'ChatBot' }} />
          <Stack.Screen name="registro_usuarios" options={{ title: 'Registro de Usuarios', headerShown: false }} />
          <Stack.Screen name="registrar-animal" options={{ title: 'Registrar Animal', headerShown: false }} />
          <Stack.Screen name="verificacion" options={{ title: 'Verificación', headerShown: false }} />
          <Stack.Screen name="formulario_adopcion" options={{ title: 'Formulario de Adopción', headerShown: false }} />
          {/* Asegúrate de que todas tus rutas estén aquí */}
          <Stack.Screen name="PerfilUsuario" options={{ title: 'Mi Perfil', headerShown: false }} />
          <Stack.Screen name="refugio" options={{ title: 'Refugio', headerShown: false }} />
          <Stack.Screen name="perfil_mascota" options={{ title: 'Perfil Mascota', headerShown: false }} />
          <Stack.Screen name="admin" options={{ title: 'Panel Administrador', headerShown: false }} />
          <Stack.Screen name="RecuperarContrasena" options={{ title: 'Recuperar Contraseña', headerShown: false }} />
          <Stack.Screen name="Asociaciones" options={{ title: 'Asociaciones', headerShown: false }} />
          <Stack.Screen name="CatalogoMascotas" options={{ title: 'Catálogo de Mascotas', headerShown: false }} />
          <Stack.Screen name="Donaciones" options={{ title: 'Donaciones', headerShown: false }} />
          <Stack.Screen name="DonacionesAso" options={{ title: 'Solicitud de Donaciones', headerShown: false }} />
          <Stack.Screen name="HistorialDonaciones" options={{ title: 'Historial de Donaciones', headerShown: false }} />
          <Stack.Screen name="NosotrosScreen" options={{ title: 'Nosotros', headerShown: false }} />
          <Stack.Screen name="Solicitudes" options={{ title: 'Solicitudes', headerShown: false }} />
          <Stack.Screen name="SolicitudesRefugio" options={{ title: 'Solicitudes Refugio' }} />
          <Stack.Screen name="SolicitudesUsuario" options={{ title: 'Solicitudes de Adopción' }} />
          <Stack.Screen name="PostAdopcion" options={{ title: 'PostAdopcion' }} />
          <Stack.Screen name="Seguimiento" options={{ title: 'Seguimiento Adopción' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}