import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  FlatList, 
  SafeAreaView, 
  Dimensions, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import cấu hình database từ file firebaseConfig của bạn
import { db } from '../config/firebaseConfig';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [pets, setPets] = useState([]); // Nơi chứa dữ liệu lấy từ Firestore
  const [loading, setLoading] = useState(true); // Trạng thái đợi tải dữ liệu

  // Hàm xử lý hiển thị ngày tháng từ Firestore một cách an toàn
  const formatPetDate = (createdAt) => {
    if (!createdAt) return 'Không rõ thời gian';
    // Nếu ngày tháng được lưu dạng Timestamp của Firebase
    if (createdAt.seconds) {
      const date = createdAt.toDate();
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}/${month} lúc ${hours}:${minutes}`;
    }
    // Nếu ngày tháng lưu sẵn dạng chuỗi (String)
    return createdAt.toString();
  };

  // Lắng nghe dữ liệu thời gian thực từ Firestore khi màn hình được bật lên
  useEffect(() => {
    // Trỏ vào bộ sưu tập có tên là "pets" trên Firestore của bạn
    const petsCollectionRef = collection(db, 'pets');
    
    // Tạo truy vấn xếp các bài đăng mới nhất lên đầu tiên dựa vào trường "createdAt"
    const q = query(petsCollectionRef, orderBy('createdAt', 'desc'));

    // Bắt đầu lắng nghe sự thay đổi của Firestore
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const petsList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        petsList.push({
          id: doc.id, // Lấy ID tự sinh của document làm khóa chính
          name: data.name || 'Thú cưng ẩn danh',
          status: data.status || 'Bị lạc', // 'Bị lạc' | 'Đã thấy' | 'Nhận nuôi'
          location: data.location || 'Không rõ vị trí',
          date: formatPetDate(data.createdAt),
          image: data.image || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400', // Ảnh mặc định nếu bài đăng thiếu ảnh
        });
      });
      
      setPets(petsList);
      setLoading(false);
    }, (error) => {
      console.error("Lỗi khi lấy dữ liệu Firestore: ", error);
      setLoading(false);
    });

    // Hủy lắng nghe khi người dùng thoát khỏi màn hình để tránh hao pin và tốn dung lượng mạng
    return () => unsubscribe();
  }, []);

  // Bộ lọc dữ liệu (Lọc theo thanh Tìm Kiếm và các Nút Phân Loại Danh Mục)
  const filteredPets = pets.filter(pet => {
    const matchesSearch = pet.name.toLowerCase().includes(search.toLowerCase()) || 
                          pet.location.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Tất cả' || pet.status === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const renderPetCard = ({ item }) => {
    let badgeBg = '#FFF200'; // Đã thấy (Vàng)
    if (item.status === 'Bị lạc') badgeBg = '#FF3B30'; // Bị lạc (Đỏ)
    if (item.status === 'Nhận nuôi') badgeBg = '#34C759'; // Nhận nuôi (Xanh lá)

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.9}>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, item.status === 'Bị lạc' && { color: '#FFF' }]}>
            {item.status}
          </Text>
        </View>

        <Image source={{ uri: item.image }} style={styles.petImage} />

        <View style={styles.cardInfo}>
          <Text style={styles.petName} numberOfLines={1}>{item.name}</Text>
          
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color="#636366" />
            <Text style={styles.petLoc} numberOfLines={1}>{item.location}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color="#8E8E93" />
            <Text style={styles.petDate}>{item.date}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View>
      <View style={styles.yellowHeader}>
        <SafeAreaView>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.welcomeText}>Xin chào bạn 👋</Text>
              <Text style={styles.headerTitle}>Tìm kiếm hoặc đăng{'\n'}tin thú cưng lạc nội bộ</Text>
            </View>
            <TouchableOpacity style={styles.avatarButton}>
              <Ionicons name="person-outline" size={22} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrapper}>
            <Ionicons name="search-outline" size={20} color="#1C1C1E" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Nhập tên, giống loài cần tìm..."
              placeholderTextColor="#A9A9A9"
              value={search}
              onChangeText={setSearch}
            />
            <TouchableOpacity style={styles.filterIconButton}>
              <Ionicons name="options-outline" size={20} color="#000000" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.categoryContainer}>
        {['Tất cả', 'Bị lạc', 'Đã thấy', 'Nhận nuôi'].map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => setActiveCategory(category)}
            style={[
              styles.categoryChip,
              activeCategory === category && styles.activeCategoryChip
            ]}
          >
            <Text style={[
              styles.categoryText,
              activeCategory === category && styles.activeCategoryText
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Tin đăng mới nhất</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        // Hiển thị vòng xoay chờ đợi khi dữ liệu đang được tải từ server về
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Đang tải dữ liệu thú cưng...</Text>
        </View>
      ) : (
        // Đưa mảng filteredPets đã lọc vào danh sách hiển thị
        <FlatList
          data={filteredPets}
          renderItem={renderPetCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.rowStyle}
          ListHeaderComponent={ListHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          ListEmptyComponent={
            // Hiển thị thông báo thân thiện khi không tìm thấy kết quả phù hợp
            <View style={styles.emptyContainer}>
              <Ionicons name="search-sharp" size={48} color="#C7C7CC" />
              <Text style={styles.emptyText}>Không tìm thấy tin đăng nào phù hợp!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#636366', fontWeight: '600', fontSize: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 40, paddingHorizontal: 40 },
  emptyText: { marginTop: 12, color: '#8E8E93', textAlign: 'center', fontWeight: '600', fontSize: 14 },
  yellowHeader: {
    backgroundColor: '#FFF200',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderWidth: 2,
    borderColor: '#000000',
    borderTopWidth: 0,
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 20 },
  welcomeText: { fontSize: 14, fontWeight: '700', color: '#000000', opacity: 0.6 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#000000', lineHeight: 26, marginTop: 2 },
  avatarButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000000' },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', height: 52, borderRadius: 12, paddingHorizontal: 14, borderWidth: 2, borderColor: '#000000' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#000000', fontSize: 15, fontWeight: '600' },
  filterIconButton: { paddingLeft: 10 },
  categoryContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 20, marginBottom: 10, justifyContent: 'space-between' },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E5E5EA' },
  activeCategoryChip: { backgroundColor: '#FFF200', borderColor: '#000000', borderWidth: 1.5 },
  categoryText: { fontSize: 13, fontWeight: '700', color: '#636366' },
  activeCategoryText: { color: '#000000' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#000000' },
  seeAllText: { fontSize: 13, fontWeight: '700', color: '#636366', textDecorationLine: 'underline' },
  rowStyle: { justifyContent: 'space-between', paddingHorizontal: 16 },
  card: { width: CARD_WIDTH, backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: '#000000', position: 'relative' },
  badge: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#000000', zIndex: 10 },
  badgeText: { fontSize: 10, fontWeight: '900', color: '#000000' },
  petImage: { width: '100%', height: 140, resizeMode: 'cover' },
  cardInfo: { padding: 12 },
  petName: { fontSize: 15, fontWeight: '900', color: '#000000', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  petLoc: { fontSize: 12, color: '#636366', fontWeight: '600', marginLeft: 4, flex: 1 },
  petDate: { fontSize: 11, color: '#8E8E93', fontWeight: '500', marginLeft: 4 },
});