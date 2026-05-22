import React, { useState, useEffect } from 'react'; 
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { auth, db } from '../../config/firebaseConfig'; // 🌟 ĐÃ THÊM: Gọi thêm biến db từ cấu hình của bồ
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth'; 
import { doc, setDoc, getDoc } from 'firebase/firestore'; // 🌟 ĐÃ THÊM: Các hàm thao tác với Firestore
import { Ionicons } from '@expo/vector-icons'; 
import { GoogleSignin } from '@react-native-google-signin/google-signin'; 

// Import các component dùng chung mới tinh
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Cấu hình Google Sign-In giữ nguyên mã Web Client ID của bồ
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '147097427293-42pdptmq72ireiafhh1l1j08igm89slu.apps.googleusercontent.com', 
    });
  }, []);

  // 🌟 HÀM XỬ LÝ ĐĂNG NHẬP GOOGLE CẬP NHẬT: TỰ ĐỘNG ĐẺ DATA TRÊN FIRESTORE
  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      
      if (!idToken) throw new Error("Không lấy được mã ID Token từ phía Google.");

      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      
      // Khối xử lý bốc thông tin ghi danh vào Firestore
      const user = userCredential.user;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      // Nếu tài khoản Google này chưa từng xuất hiện trong collection 'users'
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          fullName: user.displayName || 'Người dùng Google', // Lấy tên hiển thị của Gmail
          email: user.email,
          phone: user.phoneNumber || '', // Google mặc định không trả về số điện thoại nên để trống
          createdAt: new Date()
        });
        console.log("Đăng nhập bằng Google thành công và đã tạo user mới trên Firestore!");
      } else {
        console.log("Tài khoản đã tồn tại trên Firestore, cho vào thẳng luôn không ghi đè.");
      }
      
    } catch (error) {
      console.log("Lỗi Google Auth:", error);
      Alert.alert("Đăng nhập thất bại", "Không thể liên kết tài khoản Google: " + error.message);
    }
  };

  // Logic đăng nhập Email / Mật khẩu cũ giữ nguyên vẹn
  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ Email và Mật khẩu!");
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("Đăng nhập thành công:", userCredential.user.email);
      })
      .catch((error) => {
        Alert.alert("Đăng nhập thất bại", error.message);
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.logoContainer}>
          <Ionicons name="paw" size={40} color="#000000" />
        </View>

        <Text style={styles.title}>FIND FRODO.</Text>
        <Text style={styles.subtitle}>Chào mừng bạn quay lại!</Text>

        <View style={styles.card}>
          <Text style={styles.cardHeader}>Chào mừng bạn quay lại!</Text>

          {/* Ô nhập Email sử dụng Component rút gọn */}
          <CustomInput
            label="Email"
            iconName="mail-outline"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Ô nhập Mật khẩu tích hợp nút Quên mật khẩu gọn gàng */}
          <CustomInput
            label="Mật khẩu"
            iconName="lock-closed-outline"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            isPassword={true}
            rightHeaderElement={
              <TouchableOpacity>
                <Text style={styles.forgotText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            }
          />

          {/* Nút bấm Vàng viền Đen rút gọn */}
          <CustomButton title="Đăng nhập ➔" onPress={handleLogin} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoContainer: { width: 70, height: 70, borderRadius: 22, backgroundColor: '#FFF200', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16, borderWidth: 2, borderColor: '#000000' },
  title: { fontSize: 28, fontWeight: '900', color: '#000000', textAlign: 'center', letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: '#636366', textAlign: 'center', marginBottom: 30 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, borderWidth: 2, borderColor: '#000000', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { fontSize: 20, fontWeight: 'bold', color: '#000000', marginBottom: 20 },
  forgotText: { color: '#636366', fontSize: 12, textDecorationLine: 'underline' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1.5, backgroundColor: '#E5E5EA' },
  dividerText: { color: '#8E8E93', fontSize: 11, fontWeight: 'bold', marginHorizontal: 10 },
  socialRow: { flexDirection: 'row', justifyContent: 'space-between' },
  socialButton: { flex: 0.47, flexDirection: 'row', height: 48, backgroundColor: '#FFFFFF', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#000000' },
  socialButtonText: { color: '#000000', fontSize: 14, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: '#636366', fontSize: 14 },
  linkText: { color: '#000000', fontWeight: '900', textDecorationLine: 'underline' }
});