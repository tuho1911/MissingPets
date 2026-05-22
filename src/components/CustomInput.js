import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CustomInput({
  label,
  iconName,
  placeholder,
  value,
  onChangeText,
  isPassword = false,
  rightHeaderElement,
  multiline, // 🌟 Bắt thuộc tính multiline để xử lý giao diện
  style,     // 🌟 Bắt thuộc tính style bồ truyền từ ngoài vào
  ...props
}) {
  const [secureText, setSecureText] = useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        {label && <Text style={styles.label}>{label}</Text>}
        {rightHeaderElement && rightHeaderElement}
      </View>

      {/* 🌟 NÂNG CẤP: Nếu là multiline thì bỏ chiều cao cố định, cho tự giãn 'auto' và căn chữ lên đỉnh */}
      <View style={[
        styles.inputWrapper, 
        multiline && { height: 'auto', alignItems: 'flex-start', paddingTop: 10, paddingBottom: 10 }
      ]}>
        {iconName && (
          <Ionicons name={iconName} size={20} color="#1C1C1E" style={[styles.inputIcon, multiline && { marginTop: 2 }]} />
        )}
        
        <TextInput
          style={[
            styles.input, 
            multiline && { textAlignVertical: 'top' }, // Ép chữ trên Android bắt đầu từ đỉnh ô
            style // Hòa trộn style chiều cao (height: 100) bồ truyền từ ngoài vào đây
          ]}
          placeholder={placeholder}
          placeholderTextColor="#A9A9A9"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword ? secureText : false}
          multiline={multiline}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity onPress={() => setSecureText(!secureText)}>
            <Ionicons name={secureText ? "eye-outline" : "eye-off-outline"} size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '700', color: '#000000', marginTop: 4 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7', 
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52, // Chiều cao mặc định cho các ô 1 dòng
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#000000', fontSize: 15 },
});