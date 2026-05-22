import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function CustomChip({ label, isActive, onPress, variant = 'yellow', style }) {
  // Xác định bộ Style màu nền dựa theo phân loại nút bồ truyền vào
  const getVariantStyles = () => {
    if (!isActive) {
      return {
        chip: variant === 'gray' ? styles.grayInactiveChip : styles.standardInactiveChip,
        text: styles.inactiveText,
      };
    }
    
    // Khi trạng thái được chọn kích hoạt (Active)
    switch (variant) {
      case 'olive':
        return { chip: styles.oliveActiveChip, text: styles.whiteText };
      case 'gray':
        return { chip: styles.yellowActiveChip, text: styles.blackText };
      case 'yellow':
      default:
        return { chip: styles.yellowActiveChip, text: styles.blackText };
    }
  };

  const currentStyle = getVariantStyles();

  return (
    <TouchableOpacity 
      style={[styles.baseChip, currentStyle.chip, variant === 'gray' && styles.grayBaseSize, style]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.baseText, currentStyle.text]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grayBaseSize: {
    flex: 0.31,
    height: 48,
  },
  standardInactiveChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E5EA',
  },
  grayInactiveChip: {
    backgroundColor: '#F2F2F7',
    borderColor: 'transparent',
  },
  yellowActiveChip: {
    backgroundColor: '#FFF200',
    borderColor: '#000000',
  },
  oliveActiveChip: {
    backgroundColor: '#9BA300',
    borderColor: '#000000',
  },
  baseText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inactiveText: {
    color: '#636366',
  },
  blackText: {
    color: '#000000',
  },
  whiteText: {
    color: '#FFFFFF',
  },
});