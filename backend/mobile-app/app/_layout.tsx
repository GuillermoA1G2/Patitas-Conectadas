import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="inicio_sesion" options={{ title: 'Iniciar Sesión', headerShown: false }} />
        <Stack.Screen name="home" options={{ title: 'Inicio' }} />
        <Stack.Screen name="registro_usuarios" options={{ title: 'Registro de Usuarios' }} />
        <Stack.Screen name="registrar-animal" options={{ title: 'Registrar Animal' }} />
        <Stack.Screen name="verificacion" options={{ title: 'Verificación' }} />
        <Stack.Screen name="adopciones" options={{ title: 'Formulario de Adopción' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
