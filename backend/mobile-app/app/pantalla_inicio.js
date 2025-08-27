import React, { useState } from 'react';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  Animated,
  Dimensions,
} from 'react-native';

// ========================================================================================
// BACKEND LOGIC SECTION
// ========================================================================================

// Constants and Configuration
const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.80; // 80% del ancho de la pantalla

// Data Models and Business Logic
class MenuService {
  static getMenuItems() {
    return [
      {
        title: 'Perfil Usuario',
        icon: 'person-outline',
        route: '/PerfilUsuario',
        color: '#4ECDC4',
        gradient: ['#4ECDC4', '#44A08D']
      },
      {
        title: 'Formulario de Adopción',
        icon: 'heart-outline',
        route: '/formulario_adopcion',
        color: '#96CEB4',
        gradient: ['#96CEB4', '#FFECD2']
      },
      {
        title: 'Verificación de Cuenta',
        icon: 'shield-checkmark-outline',
        route: '/verificacion',
        color: '#FECA57',
        gradient: ['#FECA57', '#FF9FF3']
      },
      {
        title: 'Asociaciones',
        icon: 'people-outline',
        route: '/Asociaciones',
        color: '#A55EEA',
        gradient: ['#A55EEA', '#FD79A8']
      },
      {
        title: 'Casos de Éxito',
        icon: 'star-outline',
        route: '/CasosExito',
        color: '#26DE81',
        gradient: ['#26DE81', '#20BF55']
      },
      {
        title: 'Donación',
        icon: 'gift-outline',
        route: '/Donacion',
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
          image: require('../assets/logo.png')
        },
        {
          title: 'Que buscamos',
          content: 'Buscamos ayudar a los refugios a encontrar el hogar más adecuado a los animales que lo necesitan.',
          image: require('../assets/us.png')
        }
      ]
    };
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

  return {
    menuItems,
    appInfo,
    aboutContent
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
const Header = ({ title, menuVisible, onMenuToggle }) => (
  <View style={styles.header}>
    <HamburgerButton isActive={menuVisible} onPress={onMenuToggle} />
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

// Component: Menu Header
const MenuHeader = ({ appInfo, onClose }) => (
  <View style={styles.menuHeader}>
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        <Ionicons name="paw" size={32} color="#000000" />
      </View>
      <View style={styles.profileInfo}>
        <Text style={styles.welcomeText}>{appInfo.welcomeMessage}</Text>
        <Text style={styles.appName}>{appInfo.name}</Text>
      </View>
    </View>
    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
      <Ionicons name="close" size={24} color="#000000" />
    </TouchableOpacity>
  </View>
);

// Component: Menu Item
const MenuItem = ({ item, onPress }) => (
  <Link href={item.route} asChild>
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={22} color="#fff" />
      </View>
      <Text style={styles.menuItemText}>{item.title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#B0BEC5" />
    </TouchableOpacity>
  </Link>
);

// Component: Menu Content
const MenuContent = ({ menuItems, appInfo, onMenuClose }) => (
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
        />
      ))}
    </View>

    {/* Sección de logout */}
    <View style={styles.logoutSection}>
      <View style={styles.divider} />
      <Link href="/inicio_sesion" asChild>
        <TouchableOpacity 
          style={styles.logoutItem} 
          onPress={onMenuClose}
          activeOpacity={0.7}
        >
          <View style={styles.logoutIconContainer}>
            <Ionicons name="log-out-outline" size={22} color="#FF5252" />
          </View>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </Link>
    </View>

    {/* Footer del menú */}
    <View style={styles.menuFooter}>
      <Text style={styles.footerText}>Versión {appInfo.version}</Text>
      <Text style={styles.footerSubtext}>{appInfo.copyright}</Text>
    </View>
  </ScrollView>
);

// Component: Side Menu
const SideMenu = ({ visible, slideAnimation, menuItems, appInfo, onClose }) => {
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
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

// Component: Content Section
const ContentSection = ({ section }) => (
  <View style={styles.contentSection}>
    {section.image && (
      <Image source={section.image} style={styles.logo} />
    )}
    <Text style={styles.subtitulo}>{section.title}</Text>
    <Text style={styles.texto}>{section.content}</Text>
  </View>
);

// Component: Main Content
const MainContent = ({ aboutContent }) => (
  <ScrollView contentContainerStyle={styles.scroll}>
    {aboutContent.sections.map((section, index) => (
      <ContentSection key={index} section={section} />
    ))}
  </ScrollView>
);

// ========================================================================================
// MAIN COMPONENT (Componente Principal)
// ========================================================================================

export default function NosotrosScreen() {
  // Business Logic Hooks
  const { menuVisible, slideAnimation, toggleMenu, closeMenu } = useMenuController();
  const { menuItems, appInfo, aboutContent } = useAppData();

  // Render UI
  return (
    <View style={styles.container}>
      <Header 
        title={aboutContent.title}
        menuVisible={menuVisible}
        onMenuToggle={toggleMenu}
      />

      <SideMenu 
        visible={menuVisible}
        slideAnimation={slideAnimation}
        menuItems={menuItems}
        appInfo={appInfo}
        onClose={closeMenu}
      />

      <MainContent aboutContent={aboutContent} />
    </View>
  );
}

// ========================================================================================
// STYLES SECTION
// ========================================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a2d2ff',
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  menuButton: {
    padding: 8,
    marginRight: 15,
  },
  
  hamburgerContainer: {
    width: 24,
    height: 20,
    justifyContent: 'space-between',
  },
  
  hamburgerLine: {
    width: 24,
    height: 3,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  
  hamburgerLineMiddle: {
    width: 20,
  },
  
  hamburgerLineActive: {
    backgroundColor: '#666',
  },
  
  hamburgerLineMiddleActive: {
    opacity: 0.5,
  },
  
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
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
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    paddingTop: 40,
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
    color: 'rgba(0, 0, 0, 0.8)',
    marginBottom: 2,
  },

  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
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
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    marginLeft: 20,
    marginBottom: 10,
    letterSpacing: 1,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#37474F',
  },

  logoutSection: {
    marginTop: 20,
  },

  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
    marginBottom: 10,
  },

  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 12,
  },

  logoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  logoutText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#FF5252',
  },

  menuFooter: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 20,
  },

  footerText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 4,
  },

  footerSubtext: {
    fontSize: 11,
    color: '#BDBDBD',
  },

  contentSection: {
    alignItems: 'center',
    marginBottom: 20,
  },

  logo: {
    width: 350,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  
  scroll: {
    padding: 20,
    paddingBottom: 100,
    alignItems: 'center',
  },
  
  subtitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginTop: 20,
    textAlign: 'center',
  },
  
  texto: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
});