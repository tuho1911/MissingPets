import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View, ActivityIndicator, Text } from 'react-native';
import * as Location from 'expo-location'; 

// Import các cấu hình kết nối Firebase
import { collection, query, orderBy, onSnapshot, doc, where } from 'firebase/firestore';
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
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999; 
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

// ==================== THANH ĐIỀU HƯỚNG GẦM ĐÁY (BOTTOM TAB) ====================
function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  // 🌟 KHỞI TẠO VÀ LẮNG NGHE CHẤM ĐỎ NGAY TẠI ĐÂY ĐỂ ĐÚNG PHẠM VI BIẾN
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('users', 'array-contains', uid));

    const unsubscribeUnread = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        const isSender = uid === data.users[0];
        const isHidden = isSender ? data.hideFromSender : data.hideFromReceiver;

        // Chỉ đếm khi tin nhắn đó chưa đọc, mình không phải người gửi cuối và cuộc chat không bị xóa ẩn
        if (data.unread && data.lastSenderId !== uid && !isHidden) {
          count++;
        }
      });
      setUnreadCount(count);
    });

    return () => unsubscribeUnread();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
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
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{
          tabBarLabel: 'Tin nhắn',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined, 
          tabBarBadgeStyle: { backgroundColor: '#FF3B30', color: '#FFF', fontSize: 10, fontWeight: 'bold' } 
        }}
      />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}

// ==================== THỰC THỂ KHỞI CHẠY CHÍNH ĐẦU APP ====================
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

          if (
            postData.userId !== user.uid &&
            postData.createdAt?.toDate &&
            postData.createdAt.toDate() > appOpenTime
          ) {
            if (userSettings.alertRadius === 'Tắt') return;

            let maxRadiusKm = 1.0;
            if (userSettings.alertRadius === '500m') maxRadiusKm = 0.5;
            if (userSettings.alertRadius === '1km') maxRadiusKm = 1.0;
            if (userSettings.alertRadius === '2km') maxRadiusKm = 2.0;

            try {
              const currentLoc = await Location.getCurrentPositionAsync({});
              const myLat = currentLoc.coords.latitude;
              const myLon = currentLoc.coords.longitude;

              const distance = calculateDistance(myLat, myLon, postData.latitude, postData.longitude);

              console.log(`LOG: Phát hiện bài đăng mới cách bồ ${distance.toFixed(2)} km. Hạn mức bồ chọn là ${maxRadiusKm} km.`);

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
  }, [user, userSettings]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={{ marginTop: 10, fontSize: 14 }}>Đang kiểm tra đăng nhập...</Text>
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