import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image, StatusBar, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db, auth } from '../config/firebaseConfig';
import {
  collection, addDoc, query, where, orderBy, onSnapshot,
  serverTimestamp, doc, setDoc, updateDoc
} from 'firebase/firestore';

// Import 2 Component con dùng chung vừa bóc tách xịn sò
import ChatGroupItem from '../components/ChatGroupItem';
import MessageBubble from '../components/MessageBubble';

export default function ChatScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef();
  const [viewMode, setViewMode] = useState('list');
  const [chatGroups, setChatGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [activePartnerName, setActivePartnerName] = useState('Hội thoại cứu hộ');
  const [activePostImg, setActivePostImg] = useState('');

  const targetPost = route?.params?.post || null;

  const handleHideChat = (roomItem) => {
    Alert.alert("Xóa hội thoại", "Bạn muốn ẩn cuộc trò chuyện này khỏi danh sách?", [
      { text: "Hủy" },
      {
        text: "Xác nhận", style: "destructive", onPress: async () => {
          const isSender = auth.currentUser.uid === roomItem.users[0];
          const updateData = {};
          if (isSender) updateData.hideFromSender = true;
          else updateData.hideFromReceiver = true;

          await updateDoc(doc(db, 'chats', roomItem.id), updateData);
        }
      }
    ]);
  };

  const handleOpenRoom = async (item) => {
    setCurrentRoomId(item.id);
    setActivePartnerName(item.postTitle || 'Hội thoại cứu hộ');
    setActivePostImg(item.postImageUrl || '');
    setViewMode('room');

    if (item.lastSenderId !== auth.currentUser.uid && item.unread) {
      try {
        await updateDoc(doc(db, 'chats', item.id), { unread: false });
      } catch (e) {
        console.log("Lỗi cập nhật trạng thái đã đọc:", e);
      }
    }
  };

  useEffect(() => {
    if (targetPost && auth.currentUser) {
      const senderId = auth.currentUser.uid;
      const authorId = targetPost.userId;
      if (senderId !== authorId) {
        const roomId = `${targetPost.id}_${senderId}_${authorId}`;
        setCurrentRoomId(roomId);
        setActivePartnerName(targetPost.title);
        setActivePostImg(targetPost.imageUrl);
        const roomRef = doc(db, 'chats', roomId);

        setDoc(roomRef, {
          roomId,
          postTitle: targetPost.title,
          postImageUrl: targetPost.imageUrl,
          users: [senderId, authorId],
          hideFromSender: false,
          hideFromReceiver: false,
          unread: false
        }, { merge: true });
        setViewMode('room');
      }
    }
  }, [targetPost]);

  useEffect(() => {
    if (!auth.currentUser || viewMode !== 'list') return;
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('users', 'array-contains', auth.currentUser.uid), orderBy('lastUpdated', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(item => {
          const isSender = auth.currentUser.uid === item.users[0];
          return isSender ? !item.hideFromSender : !item.hideFromReceiver;
        });
      setChatGroups(list);
      setLoadingGroups(false);
    });
  }, [viewMode]);

  useEffect(() => {
    if (!currentRoomId || viewMode !== 'room') return;
    return onSnapshot(query(collection(db, 'chats', currentRoomId, 'messages'), orderBy('createdAt', 'asc')), (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [currentRoomId, viewMode]);

  const handleSendMessage = async () => {
    if (typedMessage.trim() === '' || !currentRoomId) return;
    const messageText = typedMessage.trim();
    setTypedMessage('');

    await addDoc(collection(db, 'chats', currentRoomId, 'messages'), { senderId: auth.currentUser.uid, text: messageText, createdAt: serverTimestamp() });

    await updateDoc(doc(db, 'chats', currentRoomId), {
      lastMessage: messageText,
      lastUpdated: serverTimestamp(),
      lastSenderId: auth.currentUser.uid,
      unread: true,
      hideFromSender: false,
      hideFromReceiver: false
    });
  };

  return (
    <View style={styles.container}>
      {/* ==================== GIAO DIỆN 1: HỘP THƯ TỔNG ==================== */}
      {viewMode === 'list' ? (
        <View style={{ flex: 1 }}>
          <View style={[styles.mainHeaderStyle, { paddingTop: Platform.OS === 'android' ? 40 : 55 }]}>
            <Text style={styles.mainHeaderTitle}>Hộp thư cứu hộ</Text>
          </View>

          {loadingGroups ? (
            <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#000" /></View>
          ) : (
            <FlatList
              data={chatGroups}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 30 }}
              renderItem={({ item }) => (
                <ChatGroupItem
                  item={item}
                  currentUserId={auth.currentUser?.uid}
                  onPress={() => handleOpenRoom(item)}
                  onHide={() => handleHideChat(item)}
                />
              )}
            />
          )}
        </View>
      ) : (
        /* ==================== GIAO DIỆN 2: PHÒNG CHAT ĐÃ FIX LỖI ==================== */
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: insets.top }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            {/* Header phòng chat */}
            <View style={styles.roomHeaderRow}>
              <TouchableOpacity style={styles.roomBackBtn} onPress={() => { setViewMode('list'); if (navigation.setParams) navigation.setParams({ post: null }); }}>
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>

              <View style={styles.roomHeaderCenterInfo}>
                {activePostImg ? (
                  <Image source={{ uri: activePostImg }} style={styles.roomHeaderAvatar} />
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={styles.roomTitleText} numberOfLines={1}>{activePartnerName}</Text>
                  <Text style={styles.roomSubtitleText}>Kết nối cứu hộ</Text>
                </View>
              </View>
              <View style={{ width: 20 }} />
            </View>

            {/* Vùng hiển thị tin nhắn */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
              renderItem={({ item }) => (
                <MessageBubble item={item} currentUserId={auth.currentUser?.uid} />
              )}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Thanh nhập liệu */}
            <View style={styles.inputContainerBar}>
              <TextInput style={styles.chatBarTextInput} value={typedMessage} onChangeText={setTypedMessage} placeholder="Nhập tin nhắn..." multiline />
              <TouchableOpacity style={styles.sendIconBtn} onPress={handleSendMessage}>
                <Ionicons name="send" size={16} color="#000" />
              </TouchableOpacity>
            </View>

          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  mainHeaderStyle: { paddingHorizontal: 20, paddingBottom: 12 },
  mainHeaderTitle: { fontSize: 26, fontWeight: '900' },
  roomHeaderRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', height: 60, paddingHorizontal: 6, borderBottomWidth: 1.5, borderColor: '#000' },
  roomBackBtn: { width: 40, height: '100%', justifyContent: 'center', alignItems: 'center' },
  roomHeaderCenterInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  roomHeaderAvatar: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: '#000', marginRight: 10 },
  roomTitleText: { fontSize: 15, fontWeight: '900', color: '#000' },
  roomSubtitleText: { fontSize: 11, fontWeight: '600', color: '#8E8E93', marginTop: 1 },
  inputContainerBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1.5, borderColor: '#000', backgroundColor: '#FFF', alignItems: 'center' },
  chatBarTextInput: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: '#000', fontSize: 14, fontWeight: '600', color: '#000', maxHeight: 80 },
  sendIconBtn: { width: 38, height: 38, backgroundColor: '#FFF200', borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginLeft: 8, borderWidth: 1.5, borderColor: '#000' }
});