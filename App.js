import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location'; // Thêm gói này để lấy vị trí hiện tại của bồ

// Import các cấu hình kết nối Firebase
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db, auth } from './src/config/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

// Import hàm kích hoạt nổ thông báo tại chỗ
import { triggerLocalNotification } from './src/utils/notificationHelper';

// Import các màn hình của bồ
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import PostScreen from './src/screens/PostScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import DetailScreen from './src/screens/DetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F8F9FA',
  },
};

// --- CÔNG THỨC TOÁN HỌC HAVERSINE: ĐO KHOẢNG CÁCH GIỮA 2 TỌA ĐỘ GPS ---
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999; // Thiếu tọa độ thì cho ra xa để loại bỏ
  const R = 6371; // Bán kính Trái Đất tính bằng km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Trả về khoảng cách chính xác theo đơn vị km
}

function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') iconName = focused ? 'paw' : 'paw-outline';
          else if (route.name === 'PostTab') iconName = focused ? 'add-circle' : 'add-circle-outline';
          else if (route.name === 'ChatTab') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'ProfileTab') iconName = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          height: Platform.OS === 'android' ? 60 + (insets.bottom > 0 ? insets.bottom : 10) : 60 + insets.bottom,
          paddingBottom: Platform.OS === 'android' ? (insets.bottom > 0 ? insets.bottom + 2 : 12) : insets.bottom + 4,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Trang chủ' }} />
      <Tab.Screen name="PostTab" component={PostScreen} options={{ tabBarLabel: 'Đăng tin' }} />
      <Tab.Screen name="ChatTab" component={ChatScreen} options={{ tabBarLabel: 'Tin nhắn' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Lưu trạng thái cấu hình thông báo động của người dùng
  const [userSettings, setUserSettings] = useState({ chatNotify: true, matchNotify: true, alertRadius: '1km' });

  // Mốc thời gian mở ứng dụng để lọc tin cũ
  const [appOpenTime] = useState(new Date());

  // 1. Lắng nghe trạng thái đăng nhập hệ thống
  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return subscriber;
  }, []);

  // 2. Lắng nghe động cấu hình thông báo (alertRadius) từ Firestore
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().settings) {
        setUserSettings(docSnap.data().settings);
      }
    });

    return () => unsubscribeUser();
  }, [user]);

  // 3. LUỒNG REAL-TIME: Bắt bài đăng mới + Đo khoảng cách hình học để nổ thông báo
  useEffect(() => {
    if (!user) return;

    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));

    const unsubscribePosts = onSnapshot(q, (querySnapshot) => {
      querySnapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const postData = change.doc.data();

          // Kiểm tra xem bài có hợp lệ và được tạo sau khi bồ mở app hay không
          if (
            postData.userId !== user.uid &&
            postData.createdAt?.toDate &&
            postData.createdAt.toDate() > appOpenTime
          ) {

            // LỌC CHỐNG LÀM PHIỀN: Nếu bồ chọn "Tắt" nhận cảnh báo khu vực thì bỏ qua luôn
            if (userSettings.alertRadius === 'Tắt') return;

            // Quy đổi chữ cấu hình bán kính thành con số km cụ thể để so sánh
            let maxRadiusKm = 1.0;
            if (userSettings.alertRadius === '500m') maxRadiusKm = 0.5;
            if (userSettings.alertRadius === '1km') maxRadiusKm = 1.0;
            if (userSettings.alertRadius === '2km') maxRadiusKm = 2.0;

            try {
              // Lấy tọa độ GPS hiện tại của chiếc điện thoại bồ đang cầm test
              const currentLoc = await Location.getCurrentPositionAsync({});
              const myLat = currentLoc.coords.latitude;
              const myLon = currentLoc.coords.longitude;

              // Tính toán khoảng cách thực tế từ bồ tới vị trí pet lạc/tìm thấy
              const distance = calculateDistance(myLat, myLon, postData.latitude, postData.longitude);

              console.log(`LOG: Phát hiện bài đăng mới cách bồ ${distance.toFixed(2)} km. Hạn mức bồ chọn là ${maxRadiusKm} km.`);

              // CHỈ THÔNG BÁO khi khoảng cách đo được nhỏ hơn hoặc bằng bán kính bồ đã cấu hình!
              if (distance <= maxRadiusKm) {
                const vnType = postData.type === 'missing' ? 'bị lạc 🚨' : 'được tìm thấy ✨';
                const vnPet = postData.petType === 'Cat' ? 'Mèo' : 'Chó';

                const title = `CẢNH BÁO CỨU HỘ: ${vnPet} ${vnType}`;
                const body = `Bé giống ${postData.breed} cách bồ ${distance.toFixed(1)}km tại ${postData.location}. Xem ngay!`;

                triggerLocalNotification(title, body);
              }
            } catch (err) {
              console.log("Không lấy được vị trí máy nhận để so khoảng cách: ", err);
            }

          }
        }
      });
    });

    return () => unsubscribePosts();
  }, [user, userSettings]); // Lắng nghe lại mỗi khi cấu hình bán kính thay đổi

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={MyTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', freezeOnBlur: true }}>
        {user ? (
          <>
            <Stack.Screen name="Home" component={MainTabNavigator} />
            <Stack.Screen name="Detail" component={DetailScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}