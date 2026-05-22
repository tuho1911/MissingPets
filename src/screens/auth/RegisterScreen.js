import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, SafeAreaView } from 'react-native';
import { auth, db } from '../../config/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

// Import component dùng chung
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false); 

  const handleRegister = async () => {
    if (!fullName || !email || !phone || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    if (!agree) {
      Alert.alert("Thông báo", "Bạn cần đồng ý với Điều khoản và Chính sách để tiếp tục.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: fullName,
        email: email,
        phone: phone,
        createdAt: new Date()
      });

      console.log("Đăng ký thành công!");
    } catch (error) {
      Alert.alert("Đăng ký thất bại", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop' }} 
          style={styles.bannerImage} 
        />

        <View style={styles.content}>
          <View style={styles.brandBadgeRow}>
            <Ionicons name="paw" size={18} color="#000000" />
            <Text style={styles.brandBadgeText}>Find Frodo</Text>
          </View>

          <Text style={styles.title}>Tạo tài khoản</Text>
          <Text style={styles.subtitle}>Tham gia cộng đồng giải cứu thú cưng</Text>

          {/* Dàn Component CustomInput tái sử dụng cực gọn */}
          <CustomInput
            label="Họ và tên"
            iconName="person-outline"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
          />

          <CustomInput
            label="Email"
            iconName="mail-outline"
            placeholder="email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <CustomInput
            label="Số điện thoại"
            iconName="call-outline"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <CustomInput
            label="Mật khẩu"
            iconName="lock-closed-outline"
            placeholder="Min. 6 characters"
            value={password}
            onChangeText={setPassword}
            isPassword={true}
          />

          {/* Checkbox điều khoản */}
          <TouchableOpacity style={styles.checkboxRow} onPress={() => setAgree(!agree)}>
            <Ionicons 
              name={agree ? "checkbox" : "square-outline"} 
              size={22} 
              color={agree ? "#000000" : "#8E8E93"} 
            />
            <Text style={styles.checkboxText}>
              Tôi đồng ý với <Text style={styles.underlineText}>Điều khoản và Điều kiện</Text> và <Text style={styles.underlineText}>Chính sách Bảo mật</Text>.
            </Text>
          </TouchableOpacity>

          {/* Nút bấm Vàng chói lọi được tái sử dụng */}
          <CustomButton title="Đăng ký ➔" onPress={handleRegister} style={{ marginTop: 15, marginBottom: 20 }} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.linkText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  bannerImage: { width: '100%', height: 220, resizeMode: 'cover' },
  content: { flex: 1, backgroundColor: '#F8F9FA', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, paddingHorizontal: 24, paddingTop: 24 },
  brandBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  brandBadgeText: { color: '#000000', fontSize: 14, fontWeight: '900', marginLeft: 6 },
  title: { fontSize: 26, fontWeight: '900', color: '#000000', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#636366', marginBottom: 24 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, paddingRight: 20 },
  checkboxText: { color: '#636366', fontSize: 12, marginLeft: 8, lineHeight: 18 },
  underlineText: { color: '#000000', fontWeight: 'bold', textDecorationLine: 'underline' },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingBottom: 40 },
  footerText: { color: '#636366', fontSize: 14 },
  linkText: { color: '#000000', fontWeight: '900', textDecorationLine: 'underline' }
});