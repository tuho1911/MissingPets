import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Import chính xác 100% theo cây thư mục VS Code thực tế của bạn
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import PostScreen from './src/screens/PostScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Cấu hình màu nền hệ thống thành màu sáng để TRỊ DỨT ĐIỂM lỗi chớp trắng màn hình
const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F8F9FA', 
  },
};

// Định nghĩa Thanh Menu Đáy (Bottom Tabs) hoàn toàn bằng Tiếng Việt
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          // Thiết lập icon tương ứng cho từng Tab
          if (route.name === 'HomeTab') {
            iconName = focused ? 'paw' : 'paw-outline';
          } else if (route.name === 'PostTab') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'ChatTab') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#000000', // Màu đen đậm cá tính khi nhấn vào
        tabBarInactiveTintColor: '#8E8E93', // Màu xám cho các tab còn lại
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Trang chủ' }} />
      <Tab.Screen name="PostTab" component={PostScreen} options={{ tabBarLabel: 'Đăng tin' }} />
      <Tab.Screen name="ChatTab" component={ChatScreen} options={{ tabBarLabel: 'Tin nhắn' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Cá nhân' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer theme={MyTheme}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right', // Hiệu ứng lướt từ phải qua trái sang xịn mịn
          freezeOnBlur: true,           // Đóng băng màn hình cũ để tối ưu bộ nhớ khi quay về
        }}
      >
        {/* Luồng xác thực tài khoản ban đầu */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        
        {/* Luồng chính dẫn thẳng vào Menu đáy sau khi Đăng nhập/Đăng ký thành công */}
        <Stack.Screen name="Home" component={MainTabNavigator} />
      </Stack.Navigator>
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}