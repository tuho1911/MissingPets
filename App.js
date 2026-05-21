import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// Import các màn hình của bạn
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Khởi tạo bộ định tuyến Stack
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login" // Màn hình xuất hiện đầu tiên khi mở app
        screenOptions={{
          headerShown: false, // Ẩn cái thanh Header mặc định của hệ thống để dùng giao diện Vàng-Đen custom của bạn
          animation: 'slide_from_right', // Hiệu ứng chuyển cảnh mượt mà từ phải qua trái
        }}
      >
        {/* Định nghĩa các tuyến đường (Routes) */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}