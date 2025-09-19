import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  Animated,
  Dimensions,
  ImageBackground,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';

// ========================================================================================
// BACKEND LOGIC SECTION
// ========================================================================================

// Constants and Configuration
const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.65; // 65% del ancho de la pantalla

// Data Models and Business Logic
class MenuService {
  static getMenuItems() {
    return [
      {
        title: 'Perfil Usuario',
        icon: 'person-outline',
        route: 'PerfilUsuario',
        color: '#4ECDC4',
        gradient: ['#4ECDC4', '#44A08D']
      },
      {
        title: 'Asociaciones',
        icon: 'people-outline',
        route: 'Asociaciones',
        color: '#A55EEA',
        gradient: ['#A55EEA', '#FD79A8']
      },
      {
        title: 'Catalogo Mascotas',
        icon: 'star-outline',
        route: 'CatalogoMascotas',
        color: '#26DE81',
        gradient: ['#26DE81', '#20BF55']
      },
      {
        title: 'Donaciones',
        icon: 'gift-outline',
        route: 'Donaciones',
        color: '#FD79A8',
        gradient: ['#FD79A8', '#FDBB2D']
      }
    ];
  }

  static getAppInfo() {
    return {
      name: 'Patitas Conectadas',
      version: '1.0.0',
      copyright: 'Patitas Conectadas © 2024',
      welcomeMessage: '¡Bienvenido!'
    };
  }

  static getAboutContent() {
    return {
      title: 'Nosotros',
      sections: [
        {
          title: 'Quienes Somos',
          content: 'Patitas conectadas es un grupo de personas que busca ayudar a las asociaciones y animalitos que más lo necesitan.',
          image: require('../assets/logo.png'),
          imageType: 'logo'
        },
        {
          title: 'Que buscamos',
          content: 'Buscamos ayudar a los refugios a encontrar el hogar más adecuado a los animales que lo necesitan.',
          image: require('../assets/us.png'),
          imageType: 'us'
        }
      ]
    };
  }

  static getBackgroundImage() {
    return require('../assets/Fondo.png');
  }
}

// Animation Service
class AnimationService {
  static createMenuAnimation(initialValue = -MENU_WIDTH) {
    return new Animated.Value(initialValue);
  }

  static animateMenuOpen(animation) {
    return new Promise((resolve) => {
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(resolve);
    });
  }

  static animateMenuClose(animation) {
    return new Promise((resolve) => {
      Animated.timing(animation, {
        toValue: -MENU_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start(resolve);
    });
  }
}

// Custom Hooks (Business Logic Layer)
const useMenuController = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [slideAnimation] = useState(AnimationService.createMenuAnimation());

  const openMenu = async () => {
    setMenuVisible(true);
    await AnimationService.animateMenuOpen(slideAnimation);
  };

  const closeMenu = async () => {
    await AnimationService.animateMenuClose(slideAnimation);
    setMenuVisible(false);
  };

  const toggleMenu = () => {
    if (menuVisible) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  return {
    menuVisible,
    slideAnimation,
    toggleMenu,
    closeMenu
  };
};

const useAppData = () => {
  const menuItems = MenuService.getMenuItems();
  const appInfo = MenuService.getAppInfo();
  const aboutContent = MenuService.getAboutContent();
  const backgroundImage = MenuService.getBackgroundImage();

  return {
    menuItems,
    appInfo,
    aboutContent,
    backgroundImage
  };
};

// ========================================================================================
// FRONTEND COMPONENTS SECTION
// ========================================================================================

// Component: Hamburger Menu Button
const HamburgerButton = ({ isActive, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.menuButton}>
    <View style={styles.hamburgerContainer}>
      <View style={[styles.hamburgerLine, isActive && styles.hamburgerLineActive]} />
      <View style={[
        styles.hamburgerLine,
        styles.hamburgerLineMiddle,
        isActive && styles.hamburgerLineMiddleActive
      ]} />
      <View style={[styles.hamburgerLine, isActive && styles.hamburgerLineActive]} />
    </View>
  </TouchableOpacity>
);

// Component: Header
const Header = ({ appName, screenTitle, menuVisible, onMenuToggle }) => (
  <View style={styles.header}>
    <HamburgerButton isActive={menuVisible} onPress={onMenuToggle} />
    <View>
      <Text style={styles.headerAppName}>{appName}</Text>
      <Text style={styles.headerScreenTitle}>{screenTitle}</Text>
    </View>
  </View>
);

// Component: Menu Header
const MenuHeader = ({ appInfo, onClose }) => (
  <View style={styles.menuHeader}>
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        <Ionicons name="paw" size={32} color="#fff" /> {/* Cambiado a blanco para consistencia */}
      </View>
      <View style={styles.profileInfo}>
        <Text style={styles.welcomeText}>{appInfo.welcomeMessage}</Text>
        <Text style={styles.appName}>{appInfo.name}</Text>
      </View>
    </View>
    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
      <Ionicons name="close" size={24} color="#fff" /> {/* Cambiado a blanco para consistencia */}
    </TouchableOpacity>
  </View>
);

// Component: Menu Item
const MenuItem = ({ item, onPress, userId }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    onPress(); // Cierra el menú
    if (item.route) {
      // Pasa el userId a la siguiente ruta
      navigation.navigate(item.route, { userId: userId });
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={22} color="#fff" />
      </View>
      <Text style={styles.menuItemText}>{item.title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#B0BEC5" />
    </TouchableOpacity>
  );
};

// Component: Menu Content
const MenuContent = ({ menuItems, appInfo, onMenuClose, userId }) => {
  const navigation = useNavigation();

  const handleLogout = () => {
    onMenuClose(); // Cierra el menú
    navigation.reset({
      index: 0,
      routes: [{ name: 'inicio_sesion' }], // Asegúrate de que 'inicio_sesion' sea el nombre correcto de tu ruta de login
    });
  };

  return (
    <ScrollView
      style={styles.menuScrollView}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>NAVEGACIÓN</Text>

        {menuItems.map((item, index) => (
          <MenuItem
            key={index}
            item={item}
            onPress={onMenuClose}
            userId={userId} // Pasa el userId a cada MenuItem
          />
        ))}
      </View>

      {/* Sección de logout */}
      <View style={styles.logoutSection}>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.logoutItem}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View style={styles.logoutIconContainer}>
            <Ionicons name="log-out-outline" size={22} color="#FF5252" />
          </View>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Footer del menú */}
      <View style={styles.menuFooter}>
        <Text style={styles.footerText}>Versión {appInfo.version}</Text>
        <Text style={styles.footerSubtext}>{appInfo.copyright}</Text>
      </View>
    </ScrollView>
  );
};

// Component: Side Menu
const SideMenu = ({ visible, slideAnimation, menuItems, appInfo, onClose, userId }) => {
  if (!visible) return null;

  return (
    <Modal transparent={true} visible={visible} animationType="none">
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.sideMenu,
            {
              transform: [{ translateX: slideAnimation }],
              width: MENU_WIDTH,
            }
          ]}
        >
          <MenuHeader appInfo={appInfo} onClose={onClose} />
          <MenuContent
            menuItems={menuItems}
            appInfo={appInfo}
            onMenuClose={onClose}
            userId={userId} // Pasa el userId al MenuContent
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

// Component: Content Section
const ContentSection = ({ section }) => {
  // Determinar el estilo de imagen según el tipo
  const getImageStyle = (imageType) => {
    switch (imageType) {
      case 'logo':
        return styles.logoImage;
      case 'us':
        return styles.usImage;
      default:
        return styles.logoImage;
    }
  };

  return (
    <View style={styles.card}>
      {section.image && (
        <Image
          source={section.image}
          style={getImageStyle(section.imageType)}
        />
      )}
      <Text style={styles.subtitulo}>{section.title}</Text>
      <Text style={styles.texto}>{section.content}</Text>
    </View>
  );
};

// Component: Main Content
const MainContent = ({ aboutContent, backgroundImage }) => (
  <ImageBackground source={backgroundImage} style={styles.backgroundImage} resizeMode="cover">
    <View style={styles.contentOverlay}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {aboutContent.sections.map((section, index) => (
          <ContentSection key={index} section={section} />
        ))}
      </ScrollView>
    </View>
  </ImageBackground>
);

// ========================================================================================
// MAIN COMPONENT (Componente Principal)
// ========================================================================================

export default function NosotrosScreen() {
  // Business Logic Hooks
  const { menuVisible, slideAnimation, toggleMenu, closeMenu } = useMenuController();
  const { menuItems, appInfo, aboutContent, backgroundImage } = useAppData();

  const route = useRoute();
  const [userId, setUserId] = useState(null);

  // Extraer userId de los parámetros de la ruta al montar o cuando la ruta cambia
  useEffect(() => {
    if (route.params?.userId) {
      setUserId(route.params.userId);
      console.log('NosotrosScreen: userId recibido:', route.params.userId);
    } else {
      console.warn('NosotrosScreen: No se recibió userId en los parámetros de la ruta.');
    }
  }, [route.params?.userId]);

  // Render UI
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#a26b6c" />
      <Header
        appName={appInfo.name}
        screenTitle={aboutContent.title}
        menuVisible={menuVisible}
        onMenuToggle={toggleMenu}
      />

      <SideMenu
        visible={menuVisible}
        slideAnimation={slideAnimation}
        menuItems={menuItems}
        appInfo={appInfo}
        onClose={closeMenu}
        userId={userId} // Pasa el userId al SideMenu
      />

      <MainContent aboutContent={aboutContent} backgroundImage={backgroundImage} />
    </SafeAreaView>
  );
}

// ========================================================================================
// STYLES SECTION
// ========================================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Fondo general para SafeAreaView
  },

  // Background styles
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  contentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // Un overlay más claro para mejor contraste
  },

  // Header styles (ajustado para parecerse a PerfilUsuario)
  header: {
    backgroundColor: '#a26b6c',
    paddingTop: 40, // Ajustado para StatusBar
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  menuButton: {
    marginRight: 15,
  },

  hamburgerContainer: {
    width: 24,
    height: 18, // Ajustado para que coincida con PerfilUsuario
    justifyContent: 'space-between',
  },

  hamburgerLine: {
    width: '100%',
    height: 2, // Ajustado para que coincida con PerfilUsuario
    backgroundColor: 'white',
    borderRadius: 1, // Ajustado para que coincida con PerfilUsuario
  },

  hamburgerLineMiddle: {
    width: '80%', // Ajustado para que coincida con PerfilUsuario
  },

  hamburgerLineActive: {
    backgroundColor: 'white',
  },

  hamburgerLineMiddleActive: {
    width: '60%', // Ajustado para que coincida con PerfilUsuario
  },

  headerAppName: {
    color: 'rgba(255, 255, 255, 0.8)', // Color de texto más suave para el nombre de la app
    fontSize: 14,
    marginBottom: 2,
  },

  headerScreenTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  sideMenu: {
    height: '100%',
    backgroundColor: '#fff',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },

  menuHeader: {
    backgroundColor: '#a26b6c', // Color de fondo del header del menú
    paddingTop: 40, // Ajustado para StatusBar
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  profileInfo: {
    flex: 1,
  },

  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)', // Color de texto blanco
    marginBottom: 2,
  },

  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF', // Color de texto blanco
  },

  closeButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  menuScrollView: {
    flex: 1,
  },

  menuSection: {
    paddingTop: 20,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#78909C',
    marginLeft: 20,
    marginBottom: 10,
    letterSpacing: 1,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderLeftWidth: 4,
    borderLeftColor: '#a26b6c',
  },

  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    elevation: 0,
    shadowColor: 'transparent',
  },

  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },

  logoutSection: {
    paddingHorizontal: 10,
    paddingVertical: 15,
  },

  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },

  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },

  logoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  logoutText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#FF5252',
  },

  menuFooter: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 10,
    alignItems: 'center',
  },

  footerText: {
    color: '#78909C',
    fontSize: 12,
    textAlign: 'center',
  },

  footerSubtext: {
    color: '#546E7A',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 5,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 20,
    marginHorizontal: 25,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },

  logoImage: {
    width: 200,
    height: 200,
    borderRadius: 80,
    resizeMode: 'cover',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  usImage: {
    width: 175,
    height: 225,
    borderRadius: 25,
    resizeMode: 'cover',
    marginBottom: 15,
  },

  scroll: {
    paddingVertical: 20,
    paddingHorizontal: 0,
    alignItems: 'center',
  },

  subtitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },

  texto: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
    color: '#555',
  },
});