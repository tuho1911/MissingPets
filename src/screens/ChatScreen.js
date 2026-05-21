import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image, StatusBar, SafeAreaView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db, auth } from '../config/firebaseConfig';
import { 
  collection, addDoc, query, where, orderBy, onSnapshot, 
  serverTimestamp, doc, setDoc, updateDoc 
} from 'firebase/firestore';

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

  const targetPost = route?.params?.post || null;

  // XỬ LÝ ẨN CUỘC TRÒ CHUYỆN (Xóa ẩn - Archive)
  const handleHideChat = (roomItem) => {
    Alert.alert("Xóa hội thoại", "Bạn muốn ẩn cuộc trò chuyện này khỏi danh sách?", [
      { text: "Hủy" },
      { text: "Xác nhận", style: "destructive", onPress: async () => {
          const isSender = auth.currentUser.uid === roomItem.users[0];
          const updateData = {};
          // Cập nhật cờ ẩn dựa trên vai trò
          if (isSender) updateData.hideFromSender = true;
          else updateData.hideFromReceiver = true;
          
          await updateDoc(doc(db, 'chats', roomItem.id), updateData);
      }}
    ]);
  };

  useEffect(() => {
    if (targetPost && auth.currentUser) {
      const senderId = auth.currentUser.uid;
      const authorId = targetPost.userId;
      if (senderId !== authorId) {
        const roomId = `${targetPost.id}_${senderId}_${authorId}`;
        setCurrentRoomId(roomId);
        setActivePartnerName(targetPost.title);
        const roomRef = doc(db, 'chats', roomId);
        setDoc(roomRef, { roomId, postTitle: targetPost.title, postImageUrl: targetPost.imageUrl, users: [senderId, authorId], hideFromSender: false, hideFromReceiver: false }, { merge: true });
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
        // CHỈ HIỆN NHỮNG CÁI CHƯA BỊ ẨN
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
    
    // Khi nhắn tin, tự động hiện lại chat nếu trước đó đã ẩn
    await addDoc(collection(db, 'chats', currentRoomId, 'messages'), { senderId: auth.currentUser.uid, text: messageText, createdAt: serverTimestamp() });
    await updateDoc(doc(db, 'chats', currentRoomId), { lastMessage: messageText, lastUpdated: serverTimestamp(), hideFromSender: false, hideFromReceiver: false });
  };

  return (
    <View style={styles.container}>
      {viewMode === 'list' ? (
        <View style={{ flex: 1 }}>
          <View style={[styles.mainHeaderStyle, { paddingTop: Platform.OS === 'android' ? 40 : 55 }]}>
            <Text style={styles.mainHeaderTitle}>Hộp thư cứu hộ</Text>
          </View>
          <FlatList
            data={chatGroups}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.chatGroupRow}>
                <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => { setCurrentRoomId(item.id); setActivePartnerName(item.postTitle); setViewMode('room'); }}>
                  <Image source={{ uri: item.postImageUrl }} style={styles.groupAvatar} />
                  <View style={styles.groupInfoBlock}>
                    <Text style={styles.groupTitleText}>{item.postTitle}</Text>
                    <Text style={styles.groupSubText}>{item.lastMessage}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleHideChat(item)}>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      ) : (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
          <View style={styles.roomHeaderRow}>
            <TouchableOpacity onPress={() => { setViewMode('list'); if(navigation.setParams) navigation.setParams({ post: null }); }}>
              <Ionicons name="arrow-back" size={24} />
            </TouchableOpacity>
            <Text style={styles.roomTitleText}>{activePartnerName}</Text>
            <View style={{ width: 40 }} />
          </View>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.messageBubbleRow, item.senderId === auth?.currentUser?.uid ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
                <View style={[styles.baseBubble, item.senderId === auth?.currentUser?.uid ? styles.myMessageBubble : styles.partnerMessageBubble]}>
                  <Text style={styles.bubbleText}>{item.text}</Text>
                </View>
              </View>
            )}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />
          <View style={styles.inputContainerBar}>
            <TextInput style={styles.chatBarTextInput} value={typedMessage} onChangeText={setTypedMessage} placeholder="Nhập tin nhắn..." multiline />
            <TouchableOpacity style={styles.sendIconBtn} onPress={handleSendMessage}>
              <Ionicons name="send" size={18} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  mainHeaderStyle: { paddingHorizontal: 20, paddingBottom: 12 },
  mainHeaderTitle: { fontSize: 26, fontWeight: '900' },
  chatGroupRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#000' },
  groupAvatar: { width: 50, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#000' },
  groupInfoBlock: { flex: 1, marginLeft: 14 },
  groupTitleText: { fontSize: 15, fontWeight: '850', marginBottom: 4 },
  groupSubText: { fontSize: 12, fontWeight: '600', color: '#636366' },
  roomHeaderRow: { flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: 16, borderBottomWidth: 1.5 },
  roomTitleText: { fontSize: 15, fontWeight: '900', flex: 1, textAlign: 'center' },
  messageBubbleRow: { flexDirection: 'row', marginBottom: 12, paddingHorizontal: 16 },
  baseBubble: { maxWidth: '75%', padding: 12, borderRadius: 16, borderWidth: 1.5, borderColor: '#000' },
  myMessageBubble: { backgroundColor: '#FFF200', borderTopRightRadius: 4 },
  partnerMessageBubble: { backgroundColor: '#FFF', borderTopLeftRadius: 4 },
  bubbleText: { fontSize: 14, fontWeight: '600' },
  inputContainerBar: { flexDirection: 'row', padding: 16, borderTopWidth: 1.5, alignItems: 'center' },
  chatBarTextInput: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 20, padding: 10, borderWidth: 1.5, borderColor: '#000' },
  sendIconBtn: { width: 40, height: 40, backgroundColor: '#FFF200', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 8, borderWidth: 1, borderColor: '#000' }
});