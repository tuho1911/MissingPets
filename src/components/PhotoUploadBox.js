import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function PhotoUploadBox({ imageUri, onImagePicked }) {
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
      onImagePicked(result.assets[0].uri);
    }
  };

  return (
    <TouchableOpacity style={styles.photoUploadBox} onPress={pickImage} activeOpacity={0.8}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.previewImage} />
      ) : (
        <View style={styles.uploadPlaceholderInner}>
          <Ionicons name="image-outline" size={36} color="#8E8E93" />
          <Text style={styles.uploadPlaceholderText}>Bấm vào đây để thêm ảnh thú cưng</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});