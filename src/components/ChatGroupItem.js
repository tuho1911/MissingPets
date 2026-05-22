import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChatGroupItem({ item, currentUserId, onPress, onHide }) {
  const hasUnread = item.unread && item.lastSenderId !== currentUserId;

  const formatListTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  return (
    <View style={styles.chatGroupRow}>
      <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={onPress}>
        <Image source={{ uri: item.postImageUrl || 'https://via.placeholder.com/150' }} style={styles.groupAvatar} />
        <View style={styles.groupInfoBlock}>
          <View style={styles.groupMetaTitleRow}>
            <Text style={[styles.groupTitleText, hasUnread && { fontWeight: '900' }]} numberOfLines={1}>
              {item.postTitle}
            </Text>
            <Text style={[styles.listTimeText, hasUnread && { color: '#FF3B30', fontWeight: '900' }]}>
              {formatListTime(item.lastUpdated)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.groupSubText, hasUnread && { color: '#000', fontWeight: '800' }]} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {hasUnread && <View style={styles.unreadDotBadge} />}
          </View>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.deleteListBtn} onPress={onHide}>
        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  chatGroupRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#000' },
  groupAvatar: { width: 52, height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: '#000' },
  groupInfoBlock: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  groupMetaTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  groupTitleText: { fontSize: 15, fontWeight: '850', color: '#000', flex: 1, paddingRight: 8 },
  listTimeText: { fontSize: 11, fontWeight: '700', color: '#8E8E93' },
  groupSubText: { fontSize: 13, fontWeight: '600', color: '#636366', flex: 1, paddingRight: 5 },
  deleteListBtn: { paddingLeft: 10, paddingVertical: 10 },
  unreadDotBadge: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF3B30', marginRight: 4 },
});