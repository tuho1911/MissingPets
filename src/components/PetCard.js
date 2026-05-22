import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function PetCard({ item, onPress }) {
  let badgeBg = '#FFF200';
  let statusText = 'TÌM THẤY';
  if (item.type === 'missing') { 
    badgeBg = '#FF3B30'; 
    statusText = 'BỊ LẠC'; 
  }

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      {/* Badge Trạng thái */}
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.badgeText, item.type === 'missing' && { color: '#FFF' }]}>
          {statusText}
        </Text>
      </View>

      {/* Ảnh Thú Cưng */}
      <Image source={{ uri: item.imageUrl }} style={styles.petImage} />

      {/* Thông tin thẻ */}
      <View style={styles.cardInfo}>
        <Text style={styles.petName} numberOfLines={1}>{item.title}</Text>
        
        <Text style={styles.petBreed} numberOfLines={1}>
          Giống: {item.breed} ({item.sex === 'female' ? 'Cái' : 'Đực'})
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color="#636366" />
          <Text style={styles.petLoc} numberOfLines={1}>{item.location}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="navigate-outline" size={13} color="#9BA300" />
          <Text style={styles.distanceText}>Cách bạn: {item.computedDistance.toFixed(1)} km</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: CARD_WIDTH, backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: '#000000', position: 'relative' },
  badge: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#000000', zIndex: 10 },
  badgeText: { fontSize: 9, fontWeight: '900', color: '#000000', letterSpacing: 0.5 },
  petImage: { width: '100%', height: 130, resizeMode: 'cover' },
  cardInfo: { padding: 10 },
  petName: { fontSize: 14, fontWeight: '900', color: '#000000', marginBottom: 2 },
  petBreed: { fontSize: 11, fontWeight: '600', color: '#636366', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  petLoc: { fontSize: 11, color: '#636366', fontWeight: '600', marginLeft: 4, flex: 1 },
  distanceText: { fontSize: 11, color: '#000000', fontWeight: '700', marginLeft: 4 },
});