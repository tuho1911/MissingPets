import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PostSuccess({ onContinue }) {
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
        <TouchableOpacity style={styles.successContinueBtn} onPress={onContinue} activeOpacity={0.9}>
          <Text style={styles.successContinueBtnText}>Tiếp tục ➔</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  successContinueBtn: { backgroundColor: '#000000', width: '100%', height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  successContinueBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});