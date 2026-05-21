import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, SafeAreaView } from 'react-native';
import { auth, db } from '../../config/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
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
      // navigation.navigate('Home'); // Chuyển vào HomeScreen
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

          {/* Họ tên */}
          <Text style={styles.label}>Họ và tên</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#1C1C1E" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#A9A9A9"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#1C1C1E" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              placeholderTextColor="#A9A9A9"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Số điện thoại */}
          <Text style={styles.label}>Số điện thoại</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={20} color="#1C1C1E" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor="#A9A9A9"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Mật khẩu */}
          <Text style={styles.label}>Mật khẩu</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#1C1C1E" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Min. 6 characters"
              placeholderTextColor="#A9A9A9"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureText}
            />
            <TouchableOpacity onPress={() => setSecureText(!secureText)}>
              <Ionicons name={secureText ? "eye-outline" : "eye-off-outline"} size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>

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

          {/* Nút Đăng ký vàng chói lọi */}
          <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
            <Text style={styles.primaryButtonText}>Đăng ký ➔</Text>
          </TouchableOpacity>

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
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  bannerImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  brandBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandBadgeText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#636366',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Form đăng ký dùng nền trắng tinh
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#000000',
    fontSize: 15,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    paddingRight: 20,
  },
  checkboxText: {
    color: '#636366',
    fontSize: 12,
    marginLeft: 8,
    lineHeight: 18,
  },
  underlineText: {
    color: '#000000',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  primaryButton: {
    backgroundColor: '#FFF200',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#000000',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  footerText: {
    color: '#636366',
    fontSize: 14,
  },
  linkText: {
    color: '#000000',
    fontWeight: '900',
    textDecorationLine: 'underline',
  }
});