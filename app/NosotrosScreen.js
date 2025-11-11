import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';

// ========================================================================================
// BACKEND LOGIC SECTION
// ========================================================================================

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.65;

// Data Models and Business Logic
class MenuService {
  static getMenuItems() {
    return [
      {
        title: 'Perfil Usuario',
        icon: 'person-outline',
        route: 'PerfilUsuario',
        color: '#4ECDC4',
      },
      {
        title: 'Asociaciones',
        icon: 'people-outline',
        route: 'Asociaciones',
        color: '#A55EEA',
      },
      {
        title: 'Catalogo Mascotas',
        icon: 'star-outline',
        route: 'CatalogoMascotas',
        color: '#26DE81',
      },
      {
        title: 'Donaciones',
        icon: 'gift-outline',
        route: 'Donaciones',
        color: '#FD79A8',
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
      headerTitle: 'Uniendo corazones, una adopción a la vez',
      headerDescription: 'Apoyamos a refugios locales y acompañamos a cada mascota en su camino hacia un hogar lleno de amor.',
      sections: [
        {
          title: 'Quiénes Somos',
          content: 'Patitas conectadas es un grupo de personas que busca ayudar a las asociaciones y animalitos que más lo necesitan.',
          image: require('../assets/logo.png'),
          imageType: 'logo'
        },
        {
          title: 'Qué Buscamos',
          content: 'Buscamos ayudar a los refugios a encontrar el hogar más adecuado a los animales que lo necesitan.',
          image: require('../assets/us.png'),
          imageType: 'standard'
        }
      ],
      mission: {
        title: 'Misión',
        content: 'Desarrollar una plataforma digital confiable e intuitiva que conecte a refugios, asociaciones y adoptantes para promover la adopción responsable de animales. Buscamos digitalizar los procesos de registro, verificación y seguimiento, brindando herramientas tecnológicas que faciliten la comunicación y mejoren la organización de los refugios, asegurando un hogar digno para cada mascota.',
        icon: 'compass-outline',
        image: require('../assets/mision.png'),
      },
      vision: {
        title: 'Visión',
        content: 'Construir una comunidad en Zapopan comprometida con el bienestar animal, apoyando a refugios y asociaciones locales para que cada perro encuentre un hogar seguro y amoroso a través de adopciones responsables.',
        icon: 'eye-outline',
        image: require('../assets/vision.png'),
      },
      values: {
        title: 'Nuestros Valores',
        items: [
          {
            name: 'Empatía',
            description: 'Comprendemos la importancia emocional de cada adopción, tanto para la mascota como para la familia adoptante.',
            icon: 'heart-outline',
            color: '#FF6B9D'
          },
          {
            name: 'Innovación',
            description: 'Usamos la tecnología como herramienta para mejorar la vida de los animales y las personas.',
            icon: 'bulb-outline',
            color: '#FFC93C'
          },
          {
            name: 'Transparencia',
            description: 'Promovemos la confianza mediante la verificación real de usuarios y refugios.',
            icon: 'shield-checkmark-outline',
            color: '#4ECDC4'
          },
          {
            name: 'Solidaridad',
            description: 'Impulsamos la colaboración entre asociaciones, voluntarios y adoptantes por una misma causa.',
            icon: 'people-outline',
            color: '#A55EEA'
          },
          {
            name: 'Responsabilidad',
            description: 'Fomentamos la adopción consciente, basada en el respeto y el bienestar animal.',
            icon: 'paw-outline',
            color: '#26DE81'
          }
        ]
      }
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

// Custom Hooks
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
        <Ionicons name="paw" size={32} color="#fff" />
      </View>
      <View style={styles.profileInfo}>
        <Text style={styles.welcomeText}>{appInfo.welcomeMessage}</Text>
        <Text style={styles.appName}>{appInfo.name}</Text>
      </View>
    </View>
    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
      <Ionicons name="close" size={24} color="#fff" />
    </TouchableOpacity>
  </View>
);

// Component: Menu Item
const MenuItem = ({ item, onPress, userId }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    onPress();
    if (item.route) {
      navigation.navigate(item.route, { userId: userId });
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
    onMenuClose();
    navigation.reset({
      index: 0,
      routes: [{ name: 'inicio_sesion' }],
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
            userId={userId}
          />
        ))}
      </View>

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
            userId={userId}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

// Component: Header Banner
const HeaderBanner = ({ title, description }) => (
  <View style={styles.headerBanner}>
    <Ionicons name="heart" size={40} color="#a26b6c" style={styles.bannerIcon} />
    <Text style={styles.bannerTitle}>{title}</Text>
    <Text style={styles.bannerDescription}>{description}</Text>
  </View>
);

// Component: Content Section - UNIFICADO
const ContentSection = ({ section }) => {
  const getImageStyle = (imageType) => {
    // Logo es circular, el resto rectangular
    if (imageType === 'logo') {
      return styles.logoImage;
    }
    return styles.standardImage;
  };

  return (
    <View style={styles.card}>
      {section.image && (
        <Image
          source={section.image}
          style={getImageStyle(section.imageType)}
        />
      )}
      <Text style={styles.cardTitle}>{section.title}</Text>
      <Text style={styles.cardText}>{section.content}</Text>
    </View>
  );
};

// Component: Mission/Vision Card - ESTANDARIZADO
const MissionVisionCard = ({ data }) => (
  <View style={styles.card}>
    {data.image && (
      <Image
        source={data.image}
        style={styles.standardImage}
      />
    )}
    <View style={styles.missionVisionHeader}>
      <Ionicons name={data.icon} size={28} color="#a26b6c" />
      <Text style={styles.cardTitle}>{data.title}</Text>
    </View>
    <Text style={styles.cardText}>{data.content}</Text>
  </View>
);

// Component: Value Item
const ValueItem = ({ value }) => (
  <View style={styles.valueCard}>
    <View style={[styles.valueIconContainer, { backgroundColor: value.color }]}>
      <Ionicons name={value.icon} size={28} color="#fff" />
    </View>
    <View style={styles.valueContent}>
      <Text style={styles.valueName}>{value.name}</Text>
      <Text style={styles.valueDescription}>{value.description}</Text>
    </View>
  </View>
);

// Component: Values Section
const ValuesSection = ({ valuesData }) => (
  <View style={styles.valuesContainer}>
    <View style={styles.valuesSectionHeader}>
      <Ionicons name="star" size={32} color="#a26b6c" />
      <Text style={styles.valuesSectionTitle}>{valuesData.title}</Text>
    </View>
    {valuesData.items.map((value, index) => (
      <ValueItem key={index} value={value} />
    ))}
  </View>
);

// Component: Main Content
const MainContent = ({ aboutContent, backgroundImage }) => (
  <ImageBackground source={backgroundImage} style={styles.backgroundImage} resizeMode="cover">
    <View style={styles.contentOverlay}>
      <ScrollView 
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <HeaderBanner 
          title={aboutContent.headerTitle} 
          description={aboutContent.headerDescription} 
        />
        
        {aboutContent.sections.map((section, index) => (
          <ContentSection key={index} section={section} />
        ))}
        
        <View style={styles.missionVisionContainer}>
          <MissionVisionCard data={aboutContent.mission} />
          <MissionVisionCard data={aboutContent.vision} />
        </View>
        
        <ValuesSection valuesData={aboutContent.values} />
        
        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  </ImageBackground>
);

// ========================================================================================
// MAIN COMPONENT
// ========================================================================================

export default function NosotrosScreen() {
  const { menuVisible, slideAnimation, toggleMenu, closeMenu } = useMenuController();
  const { menuItems, appInfo, aboutContent, backgroundImage } = useAppData();

  const route = useRoute();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (route.params?.userId) {
      setUserId(route.params.userId);
      console.log('NosotrosScreen: userId recibido:', route.params.userId);
    } else {
      console.warn('NosotrosScreen: No se recibió userId en los parámetros de la ruta.');
    }
  }, [route.params?.userId]);

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
        userId={userId}
      />

      <MainContent aboutContent={aboutContent} backgroundImage={backgroundImage} />
    </SafeAreaView>
  );
}

// ========================================================================================
// STYLES SECTION - OPTIMIZADOS Y ESTANDARIZADOS
// ========================================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  contentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },

  header: {
    backgroundColor: '#a26b6c',
    paddingTop: 40,
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
    height: 18,
    justifyContent: 'space-between',
  },

  hamburgerLine: {
    width: '100%',
    height: 2,
    backgroundColor: 'white',
    borderRadius: 1,
  },

  hamburgerLineMiddle: {
    width: '80%',
  },

  hamburgerLineActive: {
    backgroundColor: 'white',
  },

  hamburgerLineMiddleActive: {
    width: '60%',
  },

  headerAppName: {
    color: 'rgba(255, 255, 255, 0.8)',
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
    backgroundColor: '#a26b6c',
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
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },

  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    paddingHorizontal: 15,
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

  scroll: {
    paddingVertical: 20,
    paddingHorizontal: 0,
  },

  // ==========================================
  // HEADER BANNER STYLES
  // ==========================================
  headerBanner: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },

  bannerIcon: {
    marginBottom: 10,
  },

  bannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#a26b6c',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 28,
  },

  bannerDescription: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 5,
  },

  // ==========================================
  // CARD STYLES - UNIFICADOS
  // ==========================================
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Logo permanece circular
  logoImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    resizeMode: 'cover',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  // ESTANDARIZADO: Todas las demás imágenes (Qué Buscamos, Misión, Visión)
  standardImage: {
    width: 160,
    height: 200,
    borderRadius: 20,
    resizeMode: 'cover',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  // ESTANDARIZADO: Todos los títulos de tarjetas
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginTop: 5,
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },

  // ESTANDARIZADO: Todos los textos de contenido
  cardText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
    color: '#555',
  },

  // ==========================================
  // MISSION/VISION STYLES
  // ==========================================
  missionVisionContainer: {
    marginTop: 10,
    marginBottom: 10,
  },

  missionVisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  // ==========================================
  // VALUES STYLES
  // ==========================================
  valuesContainer: {
    marginTop: 10,
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  valuesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  valuesSectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#a26b6c',
    marginLeft: 10,
  },

  valueCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  valueIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  valueContent: {
    flex: 1,
  },

  valueName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },

  valueDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  footerSpace: {
    height: 20,
  },
});