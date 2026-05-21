// ==========================================
// CẤU HÌNH CLOUDINARY CHÍNH CHỦ CỦA BẠN
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dcxebnx0i/image/upload';
const CLOUDINARY_PRESET = 'MissingPets';
// ==========================================

/**
 * Hàm xử lý tải ảnh lên Cloudinary dùng chung cho toàn App
 * @param {string} uri - Đường dẫn ảnh tạm thời từ ImagePicker trên máy
 * @returns {Promise<string>} - Đường dẫn URL dạng https tuyệt đối của ảnh sau khi upload thành công
 */
export const uploadToCloudinary = async (uri) => {
  if (!uri) return null;

  const filename = uri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename || '');
  const fileType = match ? `image/${match[1]}` : `image`;

  const formData = new FormData();
  formData.append('file', { uri, name: filename, type: fileType });
  formData.append('upload_preset', CLOUDINARY_PRESET);

  const response = await fetch(CLOUDINARY_URL, {
    method: 'POST',
    body: formData,
    headers: { 'content-type': 'multipart/form-data' },
  });

  if (!response.ok) {
    throw new Error('Không thể kết nối hoặc đẩy hình ảnh lên máy chủ Cloudinary!');
  }

  const data = await response.json();
  return data.secure_url; // Trả về link ảnh thành công
};