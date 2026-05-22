import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MessageBubble({ item, currentUserId }) {
  const isMyMsg = item.senderId === currentUserId;

  const formatChatTime = (timestamp) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
      const now = new Date();
      return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
    const date = timestamp.toDate();
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.messageBubbleRow, isMyMsg ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
      <View style={[styles.baseBubble, isMyMsg ? styles.myMessageBubble : styles.partnerMessageBubble]}>
        <Text style={styles.bubbleText}>{item.text}</Text>
        <Text style={[styles.bubbleTimeText, isMyMsg ? { color: '#636366' } : { color: '#8E8E93' }]}>
          {formatChatTime(item.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageBubbleRow: { flexDirection: 'row', marginBottom: 10, paddingHorizontal: 16, width: '100%' },
  baseBubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16, borderWidth: 1.5, borderColor: '#000', minWidth: 72 },
  myMessageBubble: { backgroundColor: '#FFF200', borderTopRightRadius: 4 },
  partnerMessageBubble: { backgroundColor: '#FFF', borderTopLeftRadius: 4 },
  bubbleText: { fontSize: 14, fontWeight: '600', color: '#000', lineHeight: 19 },
  bubbleTimeText: { fontSize: 9, fontWeight: '700', textAlign: 'right', marginTop: 3, marginBottom: -2 },
});