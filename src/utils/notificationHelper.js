import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Cấu hình hiển thị thông báo khi đang mở app
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Hàm kích hoạt nổ thông báo tại chỗ (Local Notification)
 */
export async function triggerLocalNotification(title, body) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  // Xin quyền hiển thị thông báo nhanh
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  // Bắn thông báo lên thanh trạng thái điện thoại ngay lập tức
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
      sound: 'default',
    },
    trigger: null, // null nghĩa là nổ thông báo ngay lập tức
  });
}