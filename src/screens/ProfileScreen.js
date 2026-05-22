import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  Platform,
  StatusBar,
  FlatList,
  Switch,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Import cấu hình hệ thống
import { db, auth } from '../config/firebaseConfig';
import { doc, onSnapshot, updateDoc, collection, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '../config/cloudinaryConfig';
import { signOut } from 'firebase/auth';

export default function ProfileScreen({ route, navigation }) {
  // Quản lý luồng màn hình: 'menu' | 'details' | 'my_reports' | 'notifications'
  const [step, setStep] = useState('menu'); 

  // Trạng thái dữ liệu người dùng
  const [userDocId, setUserDocId] = useState(null); 
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Trạng thái danh sách bài đăng của riêng bồ (My Reports)
  const [myPosts, setMyPosts] = useState([]);

  // --- TRẠNG THÁI CẤU HÌNH THÔNG BÁO (NOTIFICATIONS) ---
  const [chatNotify, setChatNotify] = useState(true); // Bật/tắt báo tin nhắn
  const [matchNotify, setMatchNotify] = useState(true); // Bật/tắt báo khớp giống loài
  const [alertRadius, setAlertRadius] = useState('1km'); // Tắt | 500m | 1km | 2km (Giải quyết bài toán làm phiền)

  // Trạng thái hệ thống
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // 1. Quét lấy thông tin tài khoản của đúng người đang đăng nhập
  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserDocId(docSnap.id);
        setFullName(data.fullName || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setAvatarUrl(data.avatarUrl || null); 
        
        // Load luôn các cài đặt thông báo của user từ DB nếu có (mặc định bật)
        if (data.settings) {
          setChatNotify(data.settings.chatNotify !== undefined ? data.settings.chatNotify : true);
          setMatchNotify(data.settings.matchNotify !== undefined ? data.settings.matchNotify : true);
          setAlertRadius(data.settings.alertRadius || '1km');
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Lỗi quét dữ liệu người dùng: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Lắng nghe danh sách bài đăng của riêng bồ khi mở mục "My reports"
  useEffect(() => {
    if (!auth.currentUser || step !== 'my_reports') return;

    setLoadingPosts(true);
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, where('userId', '==', auth.currentUser.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const list = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setMyPosts(list);
      setLoadingPosts(false);
    }, (error) => {
      console.error("Lỗi quét bài đăng cá nhân: ", error);
      setLoadingPosts(false);
    });

    return () => unsubscribe();
  }, [step]);

  useEffect(() => {
    if (route?.params?.initialStep) {
      setStep(route.params.initialStep); 
      navigation.setParams({ initialStep: null });
    }
  }, [route?.params?.initialStep]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setStep('menu'); 
    });

    return unsubscribe;
  }, [navigation]);

  // Hàm chọn ảnh đại diện từ thiết bị
  const pickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Quyền truy cập', 'Bạn cần cấp quyền truy cập để đổi ảnh đại diện!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  // Hàm cập nhật thông tin cá nhân lên Firestore
  const handleUpdateProfile = async () => {
    if (!fullName || !phone || !email) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin cá nhân!');
      return;
    }
    if (!userDocId) return;

    setIsUpdating(true);
    try {
      let finalAvatarUrl = avatarUrl;
      if (avatarUrl && avatarUrl.startsWith('file://')) {
        finalAvatarUrl = await uploadToCloudinary(avatarUrl);
      }

      const userDocRef = doc(db, 'users', userDocId);
      await updateDoc(userDocRef, {
        fullName,
        phone,
        email,
        avatarUrl: finalAvatarUrl
      });

      Alert.alert('Thành công 🎉', 'Thông tin đã được lưu chỉnh sửa thành công!');
      setStep('menu');
    } catch (error) {
      Alert.alert('Lỗi cập nhật', error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Hàm lưu nhanh cài đặt thông báo lên Firestore khi người dùng tương tác bật/tắt
  const saveNotificationSettings = async (newChat, newMatch, newRadius) => {
    if (!userDocId) return;
    try {
      const userDocRef = doc(db, 'users', userDocId);
      await updateDoc(userDocRef, {
        settings: {
          chatNotify: newChat,
          matchNotify: newMatch,
          alertRadius: newRadius
        }
      });
    } catch (e) {
      console.log("Lỗi lưu cấu hình thông báo: ", e);
    }
  };

  // Hàm xóa nhanh bài đăng khi không cần thiết hoặc đã tìm thấy bé
  const handleDeletePost = (postId) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn gỡ tin đăng này không?',
      [
        { text: 'Hủy bài', style: 'cancel' },
        { 
          text: 'Xóa tin', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'posts', postId));
              Alert.alert('Thông báo', 'Đã gỡ bài đăng thành công!');
            } catch (e) {
              Alert.alert('Lỗi', 'Không thể gỡ bài viết lúc này!');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Đang tải hồ sơ cá nhân...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* ========================================================
          LUỒNG 1: GIAO DIỆN MENU CÀI ĐẶT CHÍNH (Settings Menu)
          ======================================================== */}
      {step === 'menu' && (
        <View style={styles.menuContentWrapper}>
          <Text style={styles.menuHeaderTitle}>Settings</Text>

          <View style={styles.menuListContainer}>
            <TouchableOpacity style={styles.menuItemRow} onPress={() => setStep('details')}>
              <Text style={styles.menuItemText}>Personal Details</Text>
              <Ionicons name="chevron-forward" size={18} color="#000000" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItemRow} onPress={() => setStep('notifications')}>
              <Text style={styles.menuItemText}>Notifications</Text>
              <Ionicons name="chevron-forward" size={18} color="#000000" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItemRow} onPress={() => setStep('my_reports')}>
              <Text style={styles.menuItemText}>My reports</Text>
              <Ionicons name="chevron-forward" size={18} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: 20 }}>
            <TouchableOpacity style={styles.logoutBtn} onPress={async () => { try { await signOut(auth); } catch (e) { Alert.alert('Lỗi', 'Không đăng xuất được!'); } }}>
              <Ionicons name="log-out-outline" size={20} color="#000000" style={{ marginRight: 8 }} />
              <Text style={styles.logoutBtnText}>Log out</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ========================================================
          LUỒNG 2: GIAO DIỆN CHỈNH SỬA THÔNG TIN (Personal Details)
          ======================================================== */}
      {step === 'details' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.subHeaderStyle}>
            <TouchableOpacity onPress={() => setStep('menu')} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#000" /></TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Personal Details</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
            <View style={styles.avatarSection}>
              <TouchableOpacity style={styles.avatarCircle} onPress={pickAvatar} activeOpacity={0.9}>
                {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} /> : (
                  <Text style={styles.avatarLetter}>{fullName ? fullName.charAt(0).toUpperCase() : 'A'}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={pickAvatar}><Text style={styles.addPhotoText}>Add a photo</Text></TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.textInput} value={fullName} onChangeText={setFullName} placeholder="Nhập họ tên..." />
              {fullName !== '' && <TouchableOpacity onPress={() => setFullName('')}><Ionicons name="close" size={18} color="#000" /></TouchableOpacity>}
            </View>

            <Text style={styles.inputLabel}>Your Phone</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.textInput} value={phone} onChangeText={t => setPhone(t.replace(/[^0-9]/g, ''))} keyboardType="phone-pad" placeholder="Nhập số điện thoại..." />
              {phone !== '' && <TouchableOpacity onPress={() => setPhone('')}><Ionicons name="close" size={18} color="#000" /></TouchableOpacity>}
            </View>

            <Text style={styles.inputLabel}>Your email</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.textInput} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Nhập email..." />
              {email !== '' && <TouchableOpacity onPress={() => setEmail('')}><Ionicons name="close" size={18} color="#000" /></TouchableOpacity>}
            </View>

            <TouchableOpacity style={[styles.saveProfileBtn, isUpdating && { backgroundColor: '#A9A9A9' }]} onPress={handleUpdateProfile} disabled={isUpdating}>
              {isUpdating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveProfileBtnText}>Save</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ========================================================
          LUỒNG 3: GIAO DIỆN QUẢN LÝ THÔNG BÁO THÔNG MINH (Notifications)
          ======================================================== */}
      {step === 'notifications' && (
        <View style={{ flex: 1 }}>
          <View style={styles.subHeaderStyle}>
            <TouchableOpacity onPress={() => setStep('menu')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Notifications</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 10 }}>
            
            {/* Mục 1: Tin nhắn mới */}
            <View style={styles.toggleRowItem}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.toggleRowTitle}>Tin nhắn hội thoại mới</Text>
                <Text style={styles.toggleRowSub}>Báo chuông ngay lập tức khi có người nhắn tin hỏi thăm về thú cưng.</Text>
              </View>
              <Switch 
                value={chatNotify} 
                onValueChange={(val) => { setChatNotify(val); saveNotificationSettings(val, matchNotify, alertRadius); }}
                trackColor={{ false: "#E5E5EA", true: "#FFF200" }}
                thumbColor="#1C1C1E"
              />
            </View>

            {/* Mục 2: Khớp giống loài */}
            <View style={styles.toggleRowItem}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.toggleRowTitle}>Phát hiện tin đăng trùng khớp</Text>
                <Text style={styles.toggleRowSub}>Hệ thống tự quét và thông báo nếu có bài đăng "Tìm thấy" trùng giống với bé bồ bị lạc.</Text>
              </View>
              <Switch 
                value={matchNotify} 
                onValueChange={(val) => { setMatchNotify(val); saveNotificationSettings(chatNotify, val, alertRadius); }}
                trackColor={{ false: "#E5E5EA", true: "#FFF200" }}
                thumbColor="#1C1C1E"
              />
            </View>

            {/* Mục 3: Cấu hình bán kính cảnh báo thông minh (Giải quyết chống làm phiền) */}
            <Text style={styles.sectionLabelStyle}>Bán kính cảnh báo thú lạc quanh đây</Text>
            <Text style={styles.toggleRowSub} style={{ marginBottom: 14, color: '#8E8E93', fontSize: 13, lineHeight: 18 }}>
              Giới hạn khoảng cách nhận thông báo khi có người báo lạc pet quanh vị trí hiện tại của bồ để tránh bị thông báo làm phiền liên tục.
            </Text>
            
            <View style={styles.radiusTabsWrapper}>
              {['Tắt', '500m', '1km', '2km'].map((radius) => (
                <TouchableOpacity
                  key={radius}
                  onPress={() => { setAlertRadius(radius); saveNotificationSettings(chatNotify, matchNotify, radius); }}
                  style={[styles.radiusTabChip, alertRadius === radius && styles.activeRadiusTabChip]}
                >
                  <Text style={[styles.radiusTabChipText, alertRadius === radius && styles.activeRadiusTabChipText]}>
                    {radius}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

          </ScrollView>
        </View>
      )}

      {/* ========================================================
          LUỒNG 4: GIAO DIỆN QUAN TRỌNG "MY REPORTS" (Tin đăng của tôi)
          ======================================================== */}
      {step === 'my_reports' && (
        <View style={{ flex: 1 }}>
          <View style={styles.subHeaderStyle}>
            <TouchableOpacity onPress={() => setStep('menu')} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#000" /></TouchableOpacity>
            <Text style={styles.subHeaderTitle}>My reports</Text>
            <View style={{ width: 24 }} />
          </View>

          {loadingPosts ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="small" color="#000" /></View>
          ) : (
            <FlatList
              data={myPosts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 30 }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text-outline" size={44} color="#C7C7CC" />
                  <Text style={styles.emptyText}>Bạn chưa xuất bản tin đăng cứu hộ nào đâu nhé!</Text>
                </View>
              }
              renderItem={({ item }) => {
                let badgeBg = '#FFF200';
                let statusText = 'TÌM THẤY';
                if (item.type === 'missing') { badgeBg = '#FF3B30'; statusText = 'BỊ LẠC'; }

                return (
                  <View style={styles.reportCard}>
                    <Image source={{ uri: item.imageUrl }} style={styles.reportCardImage} />
                    <View style={styles.reportCardInfo}>
                      <View style={[styles.reportBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.reportBadgeText, item.type === 'missing' && { color: '#FFF' }]}>{statusText}</Text>
                      </View>
                      <Text style={styles.reportTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.reportSubtitle} numberOfLines={1}>{item.breed} ({item.sex === 'female' ? 'Cái' : 'Đực'})</Text>
                      <Text style={styles.reportLoc} numberOfLines={1}>📍 {item.location}</Text>
                    </View>
                    <TouchableOpacity style={styles.deletePostRowBtn} onPress={() => handleDeletePost(item.id)}>
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#636366', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
  emptyText: { marginTop: 12, color: '#8E8E93', textAlign: 'center', fontWeight: '600', fontSize: 13, lineHeight: 20 },
  
  // --- MENU CHÍNH ---
  menuContentWrapper: { flex: 1, paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 55 },
  menuHeaderTitle: { fontSize: 26, fontWeight: '900', color: '#000000', marginBottom: 20 },
  menuListContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5, borderColor: '#000000', overflow: 'hidden' },
  menuItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1.5, borderBottomColor: '#F0F0F0' },
  menuItemText: { fontSize: 15, fontWeight: '700', color: '#000000' },
  logoutBtn: { flexDirection: 'row', width: '100%', height: 50, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  logoutBtnText: { fontSize: 14, fontWeight: '800', color: '#000000' },

  // --- SUB HEADERS PHỤ CHỐNG TRÀN ---
  subHeaderStyle: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomWidth: 1.5, borderBottomColor: '#E5E5EA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
    height: Platform.OS === 'android' ? 56 + StatusBar.currentHeight : 56 + 44,
  },
  backBtn: { paddingHorizontal: 16, height: '100%', justifyContent: 'center' },
  subHeaderTitle: { fontSize: 16, fontWeight: '900', color: '#000000' },

  // --- FORM CÁ NHÂN ---
  avatarSection: { alignItems: 'center', marginTop: 24, marginBottom: 16 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF200', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000000', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarLetter: { fontSize: 36, fontWeight: '900', color: '#000000' },
  addPhotoText: { fontSize: 13, fontWeight: '800', color: '#000000', marginTop: 10, textDecorationLine: 'underline' },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#8E8E93', marginTop: 16, marginBottom: 6, textTransform: 'uppercase', marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', height: 50, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#E5E5EA' },
  textInput: { flex: 1, fontSize: 14, fontWeight: '600', color: '#000000', height: '100%' },
  saveProfileBtn: { backgroundColor: '#1C1C1E', height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginTop: 35, marginBottom: 20, borderWidth: 1.5, borderColor: '#000000' },
  saveProfileBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },

  // --- STYLE MỤC NOTIFICATIONS ---
  toggleRowItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#000000', marginBottom: 14 },
  toggleRowTitle: { fontSize: 15, fontWeight: '850', color: '#000000', marginBottom: 4 },
  toggleRowSub: { fontSize: 12, fontWeight: '600', color: '#636366', lineHeight: 16 },
  sectionLabelStyle: { fontSize: 12, fontWeight: '800', color: '#000000', textTransform: 'uppercase', marginTop: 14, marginBottom: 4 },
  radiusTabsWrapper: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 6, borderRadius: 14, borderWidth: 1.5, borderColor: '#000000' },
  radiusTabChip: { flex: 1, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: 'transparent' },
  activeRadiusTabChip: { backgroundColor: '#FFF200', borderWidth: 1, borderColor: '#000000' },
  radiusTabChipText: { fontSize: 13, fontWeight: '700', color: '#636366' },
  activeRadiusTabChipText: { color: '#000000', fontWeight: '900' },

  // --- CARD STYLE TRONG MỤC MY REPORTS ---
  reportCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 14, marginBottom: 12, borderWidth: 1.5, borderColor: '#000000', overflow: 'hidden', padding: 10, alignItems: 'center', position: 'relative' },
  reportCardImage: { width: 75, height: 75, borderRadius: 10, borderWidth: 1, borderColor: '#000', resizeMode: 'cover' },
  reportCardInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  reportBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#000', marginBottom: 4 },
  reportBadgeText: { fontSize: 8, fontWeight: '900', color: '#000' },
  reportTitle: { fontSize: 14, fontWeight: '900', color: '#000', marginBottom: 2, marginRight: 20 },
  reportSubtitle: { fontSize: 11, fontWeight: '600', color: '#636366', marginBottom: 2 },
  reportLoc: { fontSize: 11, fontWeight: '600', color: '#8E8E93' },
  deletePostRowBtn: { position: 'absolute', right: 12, bottom: 12, width: 34, height: 34, borderRadius: 8, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFE0E0' }
});