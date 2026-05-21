import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  FlatList, 
  Dimensions, 
  ActivityIndicator,
  Platform,  
  StatusBar,
  Modal, 
  ScrollView,
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location'; 

import { db } from '../config/firebaseConfig';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'; 

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const POPULAR_BREEDS = [
  'Mèo Anh lông ngắn', 'Mèo Anh lông dài', 'Mèo Ba Tư', 'Mèo Xiêm', 'Mèo Mướp', 'Mèo Tam Thể',
  'Golden Retriever', 'Poodle', 'Corgi', 'Husky', 'Phốc Sóc', 'Chó cỏ Việt Nam'
];

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

export default function HomeScreen({ navigation }) {
  const [search, setSearch] = useState(''); 
  const [activeCategory, setActiveCategory] = useState('Tất cả'); 
  const [selectedRadius, setSelectedRadius] = useState('Tất cả'); 
  const [pets, setPets] = useState([]); 
  const [loading, setLoading] = useState(true); 

  // --- TRẠNG THÁI CHO BỘ LỌC NÂNG CAO ---
  const [isModalVisible, setIsModalVisible] = useState(false); 
  const [modalStep, setModalStep] = useState('main'); 
  const [subSearchText, setSubSearchText] = useState(''); 

  const [advCategory, setAdvCategory] = useState('Tất cả'); 
  const [advPetType, setAdvPetType] = useState('Tất cả'); // Tất cả | Cat | Dog
  const [advBreed, setAdvBreed] = useState('Tất cả'); 
  const [advSex, setAdvSex] = useState('Tất cả'); // Tất cả | male | female
  const [advLocation, setAdvLocation] = useState(''); 

  const [userLocation, setUserLocation] = useState({
    latitude: 10.9322,
    longitude: 107.2394,
    addressName: 'Đang xác định vị trí...'
  });

  useEffect(() => {
    const getLiveLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setUserLocation(prev => ({ ...prev, addressName: 'Bị từ chối GPS (Long Khánh)' }));
          return;
        }
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = location.coords;
        let reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        let currentCity = 'Vị trí hiện tại';
        if (reverseGeocode && reverseGeocode.length > 0) {
          const locData = reverseGeocode[0];
          currentCity = locData.district || locData.city || locData.subregion || 'Vị trí hiện tại';
        }
        setUserLocation({ latitude, longitude, addressName: `${currentCity} 📍` });
      } catch (error) {
        console.log("Lỗi định vị GPS: ", error);
        setUserLocation(prev => ({ ...prev, addressName: 'Lỗi GPS (Long Khánh)' }));
      }
    };
    getLiveLocation();
  }, []);

  useEffect(() => {
    const postsCollectionRef = collection(db, 'posts'); 
    const q = query(postsCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsList = []; 
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        postsList.push({
          id: doc.id,
          title: data.title || 'Thú cưng ẩn danh',
          type: data.type || 'missing', // missing | found
          location: data.location || 'Không rõ vị trí',
          imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400', 
          breed: data.breed || 'Không rõ giống',
          petType: data.petType || 'Cat', // Cat | Dog
          sex: data.sex || 'female', // male | female
          latitude: data.latitude,
          longitude: data.longitude,
          phone: data.phone || '', 
          description: data.description || 'Không có mô tả chi tiết.',
          createdAt: data.createdAt,
          userId: data.userId || '',
        });
      });
      setPets(postsList); 
      setLoading(false);
    }, (error) => {
      console.error("Lỗi khi lấy dữ liệu Firestore: ", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // HỆ THỐNG ĐIỀU PHỐI BỘ LỌC
  const filteredPets = pets.filter(pet => {
    const isNotClosed = pet.type !== 'closed';
    const currentDistance = calculateDistance(userLocation.latitude, userLocation.longitude, pet.latitude, pet.longitude);
    pet.computedDistance = currentDistance; 

    const matchesSearch = search === '' || 
                          pet.title.toLowerCase().includes(search.toLowerCase()) || 
                          pet.breed.toLowerCase().includes(search.toLowerCase()) ||
                          pet.location.toLowerCase().includes(search.toLowerCase());
    
    // Đã đồng bộ mapping trường 'type' của DB sang Tiếng Việt
    let categoryMap = 'Tất cả';
    if (pet.type === 'missing') categoryMap = 'Bị lạc';
    if (pet.type === 'found') categoryMap = 'Tìm thấy';
    const matchesCategory = activeCategory === 'Tất cả' || categoryMap === activeCategory;

    let matchesRadius = true;
    if (selectedRadius !== 'Tất cả') {
      const radiusLimit = parseInt(selectedRadius); 
      matchesRadius = currentDistance <= radiusLimit;
    }

    // Lọc nâng cao theo đúng cấu hình tiếng Anh của Firestore
    const matchesAdvCategory = advCategory === 'Tất cả' || categoryMap === advCategory;
    const matchesAdvPetType = advPetType === 'Tất cả' || pet.petType === advPetType;
    const matchesAdvBreed = advBreed === 'Tất cả' || pet.breed.toLowerCase() === advBreed.toLowerCase();
    const matchesAdvSex = advSex === 'Tất cả' || pet.sex === advSex;
    const matchesAdvLocation = advLocation === '' || pet.location.toLowerCase().includes(advLocation.toLowerCase());

    return isNotClosed && matchesSearch && matchesCategory && matchesRadius && matchesAdvCategory && matchesAdvPetType && matchesAdvBreed && matchesAdvSex && matchesAdvLocation;
  });

  const handleApplyAdvancedSearch = () => {
    if (advCategory !== 'Tất cả') setActiveCategory(advCategory);
    setIsModalVisible(false);
  };

  const handleClearAdvancedFilters = () => {
    setAdvCategory('Tất cả');
    setAdvPetType('Tất cả');
    setAdvBreed('Tất cả');
    setAdvSex('Tất cả');
    setAdvLocation('');
    setSearch('');
    setActiveCategory('Tất cả');
  };

  const renderPetCard = ({ item }) => {
    let badgeBg = '#FFF200'; 
    let statusText = 'TÌM THẤY';
    if (item.type === 'missing') { badgeBg = '#FF3B30'; statusText = 'BỊ LẠC'; }

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.9} 
      onPress={() => navigation.navigate('Detail', { post: item })}>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, item.type === 'missing' && { color: '#FFF' }]}>
            {statusText}
          </Text>
        </View>

        <Image source={{ uri: item.imageUrl }} style={styles.petImage} />

        <View style={styles.cardInfo}>
          <Text style={styles.petName} numberOfLines={1}>{item.title}</Text>
          {/* Đã đồng bộ dịch giới tính sang Tiếng Việt khi hiển thị */}
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
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Đang kết nối dữ liệu...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPets}
          renderItem={renderPetCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.rowStyle}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          
          ListHeaderComponent={
            <View>
              <View style={styles.yellowHeader}>
                <View style={styles.headerTopRow}>
                  <View>
                    <Text style={styles.welcomeText}>Vị trí: {userLocation.addressName}</Text>
                    <Text style={styles.headerTitle}>FIND FRODO</Text>
                  </View>
                  <TouchableOpacity style={styles.avatarButton}>
                    <Ionicons name="person-outline" size={22} color="#000000" />
                  </TouchableOpacity>
                </View>

                <View style={styles.searchWrapper}>
                  <Ionicons name="search-outline" size={20} color="#1C1C1E" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm khu vực hoặc đặc điểm..."
                    placeholderTextColor="#A9A9A9"
                    value={search}
                    onChangeText={setSearch}
                  />
                  <TouchableOpacity 
                    style={styles.filterIconButton}
                    onPress={() => {
                      setModalStep('main');
                      setIsModalVisible(true);
                    }}
                  >
                    <Ionicons name="options-outline" size={20} color="#000000" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.subSectionTitle}>Phạm vi tìm kiếm gần bạn</Text>
              <View style={styles.radiusContainer}>
                {['Tất cả', '2km', '5km', '10km', '20km'].map((radius) => (
                  <TouchableOpacity
                    key={radius}
                    onPress={() => setSelectedRadius(radius)}
                    style={[styles.radiusChip, selectedRadius === radius && styles.activeRadiusChip]}
                  >
                    <Text style={[styles.radiusText, selectedRadius === radius && styles.activeRadiusText]}>{radius}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.categoryContainer}>
                {['Tất cả', 'Bị lạc', 'Tìm thấy'].map((category) => (
                  <TouchableOpacity
                    key={category}
                    onPress={() => setActiveCategory(category)}
                    style={[styles.categoryChip, activeCategory === category && styles.activeCategoryChip]}
                  >
                    <Text style={[styles.categoryText, activeCategory === category && styles.activeCategoryText]}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Tin đăng mới nhận</Text>
                <Text style={styles.resultsCount}>Tìm thấy {filteredPets.length} tin</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-sharp" size={48} color="#C7C7CC" />
              <Text style={styles.emptyText}>Không tìm thấy thú cưng nào phù hợp bộ lọc!</Text>
            </View>
          }
        />
      )}

      {/* MODAL TÌM KIẾM NÂNG CAO */}
      <Modal visible={isModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          
          {modalStep === 'main' && (
            <View style={{ flex: 1 }}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeModalBtn}>
                  <Ionicons name="close" size={26} color="#000" />
                </TouchableOpacity>
                <Text style={styles.modalHeaderTitle}>Advanced search</Text>
                <View style={{ width: 26 }} />
              </View>

              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                {/* Trạng thái tin (Category) */}
                <Text style={styles.modalLabel}>Category</Text>
                <View style={styles.advFilterRow}>
                  {['Tất cả', 'Bị lạc', 'Tìm thấy'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setAdvCategory(cat)}
                      style={[styles.advGridChip, advCategory === cat && styles.advActiveGridChip]}
                    >
                      <Text style={[styles.advGridChipText, advCategory === cat && styles.advActiveGridChipText]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Khối chọn Loài (Type) - ĐÃ ĐỒNG BỘ TIẾNG ANH CHO DB, TIẾNG VIỆT CHO UI */}
                <Text style={styles.modalLabel}>Loài</Text>
                <View style={styles.advFilterRow}>
                  {[
                    { label: 'Tất cả', value: 'Tất cả' },
                    { label: 'Chó', value: 'Dog' },
                    { label: 'Mèo', value: 'Cat' }
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      onPress={() => setAdvPetType(item.value)}
                      style={[styles.advGridChip, advPetType === item.value && styles.advActiveGridChip]}
                    >
                      <Text style={[styles.advGridChipText, advPetType === item.value && styles.advActiveGridChipText]}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Chọn Giống loài */}
                <Text style={styles.modalLabel}>Giống loài</Text>
                <TouchableOpacity style={styles.selectorRowInput} onPress={() => { setSubSearchText(''); setModalStep('selectBreed'); }}>
                  <Text style={[styles.selectorRowText, advBreed !== 'Tất cả' && { color: '#000' }]}>
                    {advBreed === 'Tất cả' ? 'Chọn giống loài thú cưng...' : advBreed}
                  </Text>
                  {advBreed !== 'Tất cả' ? (
                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); setAdvBreed('Tất cả'); }}>
                      <Ionicons name="close-circle" size={18} color="#8E8E93" />
                    </TouchableOpacity>
                  ) : <Ionicons name="chevron-forward" size={18} color="#8E8E93" />}
                </TouchableOpacity>

                {/* Khối chọn Giới tính (Sex) - ĐÃ ĐỒNG BỘ TIẾNG ANH CHO DB, TIẾNG VIỆT CHO UI */}
                <Text style={styles.modalLabel}>Giới tính</Text>
                <View style={styles.advFilterRow}>
                  {[
                    { label: 'Tất cả', value: 'Tất cả' },
                    { label: 'Đực', value: 'male' },
                    { label: 'Cái', value: 'female' }
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      onPress={() => setAdvSex(item.value)}
                      style={[styles.advGridChip, advSex === item.value && styles.advActiveGridChip]}
                    >
                      <Text style={[styles.advGridChipText, advSex === item.value && styles.advActiveGridChipText]}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Khối nhập Vị trí tự do */}
                <Text style={styles.modalLabel}>Vị trí khu vực</Text>
                <View style={styles.locationInputWrapper}>
                  <Ionicons name="location-sharp" size={18} color="#000" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.locationTextInput}
                    placeholder="Nhập bất kỳ tỉnh thành, quận huyện nào..."
                    placeholderTextColor="#A9A9A9"
                    value={advLocation}
                    onChangeText={setAdvLocation} 
                  />
                  {advLocation !== '' && (
                    <TouchableOpacity onPress={() => setAdvLocation('')}>
                      <Ionicons name="close-circle" size={18} color="#8E8E93" />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity 
                  style={styles.gpsShortcutBtn}
                  onPress={() => setAdvLocation(userLocation.addressName.replace(' 📍', ''))}
                >
                  <Ionicons name="navigate" size={14} color="#9BA300" style={{ marginRight: 4 }} />
                  <Text style={styles.gpsShortcutText}>Sử dụng vị trí định vị hiện tại</Text>
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.modalFooterActions}>
                <TouchableOpacity style={styles.clearFiltersBtn} onPress={handleClearAdvancedFilters}>
                  <Text style={styles.clearFiltersBtnText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyFiltersBtn} onPress={handleApplyAdvancedSearch}>
                  <Text style={styles.applyFiltersBtnText}>Show the results</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* CHỌN GIỐNG VIEW */}
          {modalStep === 'selectBreed' && (
            <View style={{ flex: 1 }}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setModalStep('main')}><Ionicons name="arrow-back" size={24} color="#000" /></TouchableOpacity>
                <Text style={styles.modalHeaderTitle}>Giống loài</Text>
                <View style={{ width: 24 }} />
              </View>
              <View style={styles.subViewSearchWrapper}>
                <Ionicons name="search" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.subViewSearchInput}
                  placeholder="Tìm giống loài (Ví dụ: Anh lông ngắn...)"
                  value={subSearchText}
                  onChangeText={setSubSearchText}
                />
              </View>
              <Text style={styles.offersSectionTitle}>Gợi ý giống phổ biến</Text>
              <FlatList
                data={POPULAR_BREEDS.filter(b => b.toLowerCase().includes(subSearchText.toLowerCase()))}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.subViewListItem} onPress={() => { setAdvBreed(item); setModalStep('main'); }}>
                    <Text style={styles.subViewListItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

        </SafeAreaView>
      </Modal>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  welcomeText: { fontSize: 12, fontWeight: '700', color: '#000000', opacity: 0.6 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#000000', lineHeight: 24, marginTop: 2 },
  avatarButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000000' },
  searchWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    height: 52, 
    borderRadius: 12, 
    paddingHorizontal: 14, 
    borderWidth: 2, 
    borderColor: '#000000' 
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#000000', fontSize: 14, fontWeight: '600', height: '100%' },
  filterIconButton: { paddingLeft: 10, borderLeftWidth: 1.5, borderLeftColor: '#E5E5EA', height: 24, justifyContent: 'center' },
  subSectionTitle: { fontSize: 13, fontWeight: '800', color: '#000000', marginLeft: 16, marginTop: 18, marginBottom: 8 },
  radiusContainer: { flexDirection: 'row', paddingHorizontal: 16, justifyContent: 'space-between', marginBottom: 6 },
  radiusChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E5E5EA', minWidth: 64, alignItems: 'center' },
  activeRadiusChip: { backgroundColor: '#9BA300', borderColor: '#000000' }, 
  radiusText: { fontSize: 12, fontWeight: '700', color: '#636366' },
  activeRadiusText: { color: '#FFFFFF' },
  categoryContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 14, marginBottom: 10 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E5E5EA', marginRight: 10 },
  activeCategoryChip: { backgroundColor: '#FFF200', borderColor: '#000000' },
  categoryText: { fontSize: 13, fontWeight: '700', color: '#636366' },
  activeCategoryText: { color: '#000000' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#000000' },
  resultsCount: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  rowStyle: { justifyContent: 'space-between', paddingHorizontal: 16 },
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

  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFF',
  },
  closeModalBtn: { padding: 4 },
  modalHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#000000' },
  modalScrollBody: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  modalLabel: { fontSize: 13, fontWeight: '700', color: '#8E8E93', marginTop: 22, marginBottom: 10, textTransform: 'uppercase' },
  selectorRowInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
  },
  selectorRowText: { fontSize: 15, color: '#A9A9A9', fontWeight: '600' },
  advFilterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  advGridChip: {
    flex: 0.31,
    backgroundColor: '#F2F2F7',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  advActiveGridChip: { backgroundColor: '#FFF200', borderColor: '#000000' },
  advGridChipText: { fontSize: 14, fontWeight: '700', color: '#636366' },
  advActiveGridChipText: { color: '#000000' },
  locationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  locationTextInput: { flex: 1, color: '#000000', fontSize: 15, fontWeight: '600', height: '100%' },
  gpsShortcutBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: 4 },
  gpsShortcutText: { fontSize: 12, color: '#636366', fontWeight: '700', textDecorationLine: 'underline' },
  modalFooterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  clearFiltersBtn: {
    flex: 0.3,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearFiltersBtnText: { color: '#000000', fontSize: 14, fontWeight: '700' },
  applyFiltersBtn: {
    flex: 0.66,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1C1C1E', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyFiltersBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  subViewSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    height: 44,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  subViewSearchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#000' },
  offersSectionTitle: { fontSize: 12, fontWeight: '700', color: '#8E8E93', marginHorizontal: 16, marginTop: 16, marginBottom: 6 },
  subViewListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFF',
  },
  subViewListItemText: { fontSize: 15, fontWeight: '600', color: '#000' }
});