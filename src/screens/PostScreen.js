import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, Alert,
  ActivityIndicator, Platform, StatusBar, KeyboardAvoidingView, TouchableOpacity
} from 'react-native';
import * as Location from 'expo-location';

// Import cấu hình kết nối dự án của bồ
import { db, auth } from '../config/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadToCloudinary } from '../config/cloudinaryConfig';

// Import các Component dùng chung và Component vừa bóc tách
import CustomInput from '../components/CustomInput';
import CustomChip from '../components/CustomChip';
import PhotoUploadBox from '../components/PhotoUploadBox';
import PostSuccess from '../components/PostSuccess';

export default function PostScreen({ navigation }) {
  const [imageUri, setImageUri] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('missing');
  const [petType, setPetType] = useState('Cat');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState('female');
  const [locationStr, setLocationStr] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCreatePost = async () => {
    if (!title || !breed || !locationStr || !phone) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ các thông tin cốt lõi nhé!');
      return;
    }
    if (!imageUri) {
      Alert.alert('Thông báo', 'Bạn chưa chọn hình ảnh cho thú cưng kìa!');
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedImageUrl = await uploadToCloudinary(imageUri);

      let latitude = 10.9322;
      let longitude = 107.2394;
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
        }
      } catch (e) {
        console.log('Bỏ qua lấy GPS, dùng tọa độ mặc định');
      }

      await addDoc(collection(db, 'posts'), {
        userId: auth.currentUser.uid,
        title: title,
        type: category,
        petType: petType,
        breed: breed,
        sex: sex,
        location: locationStr,
        phone: phone,
        description: description || 'Không có mô tả chi tiết.',
        imageUrl: uploadedImageUrl,
        latitude: latitude,
        longitude: longitude,
        createdAt: serverTimestamp()
      });

      setIsSuccess(true);
    } catch (error) {
      Alert.alert('Đăng bài thất bại', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndGoHome = () => {
    setTitle('');
    setImageUri(null);
    setBreed('');
    setLocationStr('');
    setPhone('');
    setDescription('');
    setCategory('missing');
    setPetType('Cat');
    setSex('female');
    setIsSuccess(false);
    navigation.navigate('HomeTab');
  };

  // Nếu đăng bài thành công, bung ngay component SuccessView
  if (isSuccess) {
    return <PostSuccess onContinue={handleResetAndGoHome} />;
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        enabled={Platform.OS === 'ios'} 
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} 
      >
        <View style={styles.mainHeader}>
          <Text style={styles.mainHeaderTitle}>Đăng tin mới</Text>
        </View>

        <ScrollView style={styles.scrollFormBody} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Hộp tải ảnh con vừa tách gọn gàng */}
          <PhotoUploadBox imageUri={imageUri} onImagePicked={setImageUri} />

          <CustomInput
            label="Tiêu đề bài viết"
            placeholder="Ví dụ: Tìm mèo Anh lông ngắn đi lạc..."
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.formLabel}>Trạng thái</Text>
          <View style={styles.gridChipRow}>
            <CustomChip
              label="Bị lạc"
              isActive={category === 'missing'}
              style={styles.formHalfChip}
              onPress={() => setCategory('missing')}
            />
            <CustomChip
              label="Tìm thấy"
              isActive={category === 'found'}
              style={styles.formHalfChip}
              onPress={() => setCategory('found')}
            />
          </View>

          <Text style={styles.formLabel}>Loài vật nuôi</Text>
          <View style={styles.gridChipRow}>
            <CustomChip
              label="Mèo"
              isActive={petType === 'Cat'}
              style={styles.formHalfChip}
              onPress={() => setPetType('Cat')}
            />
            <CustomChip
              label="Chó"
              isActive={petType === 'Dog'}
              style={styles.formHalfChip}
              onPress={() => setPetType('Dog')}
            />
          </View>

          <CustomInput
            label="Giống loài cụ thể"
            placeholder="Ví dụ: Mèo Anh lông ngắn, Poodle, Chó cỏ..."
            value={breed}
            onChangeText={setBreed}
          />

          <Text style={styles.formLabel}>Giới tính</Text>
          <View style={styles.gridChipRow}>
            <CustomChip
              label="Đực"
              isActive={sex === 'male'}
              style={styles.formHalfChip}
              onPress={() => setSex('male')}
            />
            <CustomChip
              label="Cái"
              isActive={sex === 'female'}
              style={styles.formHalfChip}
              onPress={() => setSex('female')}
            />
          </View>

          <CustomInput
            label="Khu vực / Địa điểm"
            placeholder="Ví dụ: Quận 1, TP. HCM hoặc Long Khánh, Đồng Nai"
            value={locationStr}
            onChangeText={setLocationStr}
          />

          <CustomInput
            label="Số điện thoại liên hệ"
            placeholder="Nhập số điện thoại để mọi người liên lạc..."
            value={phone}
            onChangeText={text => setPhone(text.replace(/[^0-9]/g, ''))}
            keyboardType="phone-pad"
          />

          <CustomInput
            label="Mô tả thêm đặc điểm nhận dạng (Tùy chọn)"
            placeholder="Mô tả màu lông, vòng đeo cổ để mọi người dễ nhận diện..."
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: 'top', paddingTop: 12 }}
          />

          {/* Nút gửi bài viết hành động */}
          <TouchableOpacity
            style={[styles.submitActionBtn, isSubmitting && { backgroundColor: '#A9A9A9' }]}
            onPress={handleCreatePost}
            disabled={isSubmitting}
            activeOpacity={0.9}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitActionBtnText}>Lưu và Đăng bài tin này ➔</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  mainHeader: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000',
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  mainHeaderTitle: { fontSize: 16, fontWeight: '900', color: '#000000', textTransform: 'uppercase', letterSpacing: 0.5 },
  scrollFormBody: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  formLabel: { fontSize: 13, fontWeight: '800', color: '#000000', marginTop: 4, marginBottom: 8, textTransform: 'uppercase' },
  gridChipRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  formHalfChip: { flex: 0.48, height: 46, paddingVertical: 0, borderRadius: 12 },
  submitActionBtn: {
    backgroundColor: '#1C1C1E',
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 35,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  submitActionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});