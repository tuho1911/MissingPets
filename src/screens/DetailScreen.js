import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Platform,
    StatusBar,
    Linking,
    Share,
    Alert,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/firebaseConfig'; // Import auth để check quyền

const { width } = Dimensions.get('window');

export default function DetailScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const { post } = route.params;

    // Định dạng ngày tháng
    const formatPostDate = (timestamp) => {
        if (!timestamp) return 'Gần đây';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return `Ngày ${date.getDate()} thg ${date.getMonth() + 1}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    // Chia sẻ bài viết
    const handleSharePost = async () => {
        try {
            const phoneNumber = post?.phone || 'Chưa cập nhật';
            await Share.share({
                message: `FIND FRODO 🐾\n${post.title}\nGiống loài: ${post.breed}\nKhu vực: ${post.location}\nLiên hệ: ${phoneNumber}`,
            });
        } catch (error) {
            console.log('Lỗi chia sẻ:', error.message);
        }
    };

    // Gọi điện
    const handleMakeCall = () => {
        if (!post?.phone) {
            Alert.alert('Thông báo', 'Bài viết này không kèm số điện thoại!');
            return;
        }
        Linking.openURL(`tel:${post.phone}`).catch(() => 
            Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi.')
        );
    };

    const isMissing = post.type === 'missing';
    const statusLabel = isMissing ? 'Bị lạc' : 'Tìm thấy';

    return (
        <View style={styles.container}>
            {/* Header Nổi */}
            <View style={[styles.floatingHeader, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : insets.top + 10 }]}>
                <TouchableOpacity style={styles.iconCircleBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="#000000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconCircleBtn} onPress={handleSharePost}>
                    <Ionicons name="share-social-outline" size={22} color="#000000" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
                <Image source={{ uri: post.imageUrl }} style={styles.mainPetImage} />

                <View style={styles.detailsCardPanel}>
                    <View style={styles.badgeRow}>
                        <View style={[styles.statusBadge, { backgroundColor: isMissing ? '#FF3B30' : '#FFF200' }]}>
                            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
                        </View>
                        <Text style={styles.postTimeText}>{formatPostDate(post.createdAt)}</Text>
                    </View>

                    <Text style={styles.mainTitleText}>{post.title}</Text>
                    <Text style={styles.descriptionParagraph}>{post.description}</Text>

                    <View style={styles.metadataBlock}>
                        <View style={styles.metadataRow}>
                            <Text style={styles.metadataLabel}>Khu vực:</Text>
                            <Text style={styles.metadataValue}>{post.location}</Text>
                        </View>
                        <View style={styles.metadataRow}>
                            <Text style={styles.metadataLabel}>Giống loài:</Text>
                            <Text style={styles.metadataValue}>{post.breed}</Text>
                        </View>
                        <View style={[styles.metadataRow, { borderBottomWidth: 0 }]}>
                            <Text style={styles.metadataLabel}>Giới tính:</Text>
                            <Text style={styles.metadataValue}>{post.sex === 'female' ? 'Cái' : 'Đực'}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Thanh hành động đáy */}
            <View style={[styles.stickyBottomBar, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 14 }]}>
                <TouchableOpacity style={styles.callActionButton} onPress={handleMakeCall}>
                    <Ionicons name="call-outline" size={20} color="#000000" style={{ marginRight: 6 }} />
                    <Text style={styles.callButtonText}>Gọi điện</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.messageActionButton} 
                    onPress={() => navigation.navigate('Home', { screen: 'ChatTab', params: { post: post } })}
                >
                    <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.messageButtonText}>Nhắn tin cứu hộ</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    floatingHeader: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, zIndex: 10 },
    iconCircleBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
    mainPetImage: { width: width, height: 380, resizeMode: 'cover' },
    detailsCardPanel: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -30, paddingHorizontal: 24, paddingTop: 28 },
    badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    statusBadge: { paddingHorizontal: 16, paddingVertical: 5, borderRadius: 14 },
    statusBadgeText: { fontSize: 13, fontWeight: '800' },
    postTimeText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
    mainTitleText: { fontSize: 22, fontWeight: '900', color: '#000000', marginBottom: 14 },
    descriptionParagraph: { fontSize: 14, fontWeight: '600', color: '#3A3A3C', lineHeight: 22, marginBottom: 25 },
    metadataBlock: { borderTopWidth: 1.5, borderTopColor: '#E5E5EA', paddingTop: 8 },
    metadataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
    metadataLabel: { fontSize: 14, fontWeight: '700', color: '#8E8E93' },
    metadataValue: { fontSize: 14, fontWeight: '800', color: '#000000', textAlign: 'right', maxWidth: '65%' },
    stickyBottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E5EA' },
    callActionButton: { width: '32%', height: 52, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E5E5EA', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    callButtonText: { fontSize: 14, fontWeight: '800' },
    messageActionButton: { width: '64%', height: 52, borderRadius: 14, backgroundColor: '#1C1C1E', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    messageButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' }
});