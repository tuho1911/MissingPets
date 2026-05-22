import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function CustomButton({ title, onPress, style, textStyle }) {
  return (
    <TouchableOpacity style={[styles.primaryButton, style]} onPress={onPress}>
      <Text style={[styles.primaryButtonText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#FFF200', 
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#000000',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
  },
});