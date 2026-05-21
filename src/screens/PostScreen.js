import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  SafeAreaView, 
  Alert, 
  ActivityIndicator,
  Platform,
  StatusBar,
  KeyboardAvoidingView // 1. Thêm gói này để tự động đẩy giao diện khi hiện bàn phím
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

// Import cấu hình từ dự án của bồ
import { db, auth } from '../config/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadToCloudinary } from '../config/cloudinaryConfig';

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

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Quyền truy cập', 'Bạn cần cấp quyền truy cập bộ sưu tập để chọn ảnh thú cưng!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

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

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.successContainer}>
        <View style={styles.successContentCard}>
          <View style={styles.successIllustrationBox}>
            <View style={styles.successPaperMock}>
              <Text style={styles.successPaperText}>Tuyệt vời!</Text>
              <View style={styles.successCheckCircle}>
                <Ionicons name="checkmark" size={30} color="#9BA300" />
              </View>
            </View>
          </View>
          <Text style={styles.successMessageTitle}>Tin đăng của bạn đã được xuất bản thành công!</Text>
          <TouchableOpacity style={styles.successContinueBtn} onPress={handleResetAndGoHome}>
            <Text style={styles.successContinueBtnText}>Tiếp tục ➔</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 2. Bọc toàn bộ Form bằng KeyboardAvoidingView để đẩy thông minh */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} // Khoảng cách đệm an toàn tùy hệ điều hành
      >
        <View style={styles.mainHeader}>
          <Text style={styles.mainHeaderTitle}>Đăng tin mới</Text>
        </View>

        <ScrollView style={styles.scrollFormBody} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          
          <TouchableOpacity style={styles.photoUploadBox} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.uploadPlaceholderInner}>
                <Ionicons name="image-outline" size={36} color="#8E8E93" />
                <Text style={styles.uploadPlaceholderText}>Bấm vào đây để thêm ảnh thú cưng</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.formLabel}>Tiêu đề bài viết</Text>
          <TextInput
            style={styles.textInputStyle}
            placeholder="Ví dụ: Tìm mèo Anh lông ngắn đi lạc..."
            placeholderTextColor="#A9A9A9"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.formLabel}>Trạng thái</Text>
          <View style={styles.gridChipRow}>
            {[
              { label: 'Bị lạc', value: 'missing' },
              { label: 'Tìm thấy', value: 'found' }
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                onPress={() => setCategory(item.value)}
                style={[styles.gridChip, category === item.value && styles.activeGridChip]}
              >
                <Text style={[styles.gridChipText, category === item.value && styles.activeGridChipText]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formLabel}>Loài vật nuôi</Text>
          <View style={styles.gridChipRow}>
            {[
              { label: 'Mèo', value: 'Cat' },
              { label: 'Chó', value: 'Dog' }
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                onPress={() => setPetType(item.value)}
                style={[styles.gridChip, petType === item.value && styles.activeGridChip]}
              >
                <Text style={[styles.gridChipText, petType === item.value && styles.activeGridChipText]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formLabel}>Giống loài cụ thể</Text>
          <TextInput
            style={styles.textInputStyle}
            placeholder="Ví dụ: Mèo Anh lông ngắn, Poodle, Chó cỏ..."
            placeholderTextColor="#A9A9A9"
            value={breed}
            onChangeText={setBreed}
          />

          <Text style={styles.formLabel}>Giới tính</Text>
          <View style={styles.gridChipRow}>
            {[
              { label: 'Đực', value: 'male' },
              { label: 'Cái', value: 'female' }
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                onPress={() => setSex(item.value)}
                style={[styles.gridChip, sex === item.value && styles.activeGridChip]}
              >
                <Text style={[styles.gridChipText, sex === item.value && styles.activeGridChipText]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formLabel}>Khu vực / Địa điểm</Text>
          <TextInput
            style={styles.textInputStyle}
            placeholder="Ví dụ: Quận 1, TP. HCM hoặc Long Khánh, Đồng Nai"
            placeholderTextColor="#A9A9A9"
            value={locationStr}
            onChangeText={locationStrText => setLocationStr(locationStrText)}
          />

          <Text style={styles.formLabel}>Số điện thoại liên hệ</Text>
          <TextInput
            style={styles.textInputStyle}
            placeholder="Nhập số điện thoại để mọi người liên lạc..."
            placeholderTextColor="#A9A9A9"
            value={phone}
            onChangeText={text => setPhone(text.replace(/[^0-9]/g, ''))} 
            keyboardType="phone-pad"
          />

          <Text style={styles.formLabel}>Mô tả thêm đặc điểm nhận dạng (Tùy chọn)</Text>
          <TextInput
            style={[styles.textInputStyle, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
            placeholder="Mô tả màu lông, vòng đeo cổ để mọi người dễ nhận diện..."
            placeholderTextColor="#A9A9A9"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity 
            style={[styles.submitActionBtn, isSubmitting && { backgroundColor: '#A9A9A9' }]} 
            onPress={handleCreatePost}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitActionBtnText}>Lưu và Đăng bài tin này ➔</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  photoUploadBox: {
    width: '100%',
    height: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000000',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 20,
  },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  uploadPlaceholderInner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  uploadPlaceholderText: { marginTop: 8, fontSize: 13, fontWeight: '700', color: '#8E8E93' },
  formLabel: { fontSize: 13, fontWeight: '800', color: '#000000', marginTop: 16, marginBottom: 8, textTransform: 'uppercase' },
  textInputStyle: {
    backgroundColor: '#FFFFFF',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#000000',
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  gridChipRow: { flexDirection: 'row', justifyContent: 'space-between' },
  gridChip: {
    flex: 0.48,
    backgroundColor: '#FFFFFF',
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
  },
  activeGridChip: { backgroundColor: '#FFF200', borderColor: '#000000', borderWidth: 1.5 },
  gridChipText: { fontSize: 13, fontWeight: '700', color: '#636366' },
  activeGridChipText: { color: '#000000' },
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
  successContainer: { flex: 1, backgroundColor: '#FFF200', justifyContent: 'center', alignItems: 'center' },
  successContentCard: { width: '85%', alignItems: 'center', padding: 24 },
  successIllustrationBox: { width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successPaperMock: {
    width: 115,
    height: 145,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000000',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  successPaperText: { fontSize: 16, fontWeight: '900', color: '#000000', transform: [{ rotate: '-6deg' }] },
  successCheckCircle: {
    position: 'absolute',
    bottom: -15,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successMessageTitle: { fontSize: 17, fontWeight: '900', color: '#000000', textAlign: 'center', lineHeight: 24, marginVertical: 14 },
  successContinueBtn: {
    backgroundColor: '#000000',
    width: '100%',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  successContinueBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});