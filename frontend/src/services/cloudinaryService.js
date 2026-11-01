import { CLOUDINARY_CONFIG } from '../utils/constants';

export const cloudinaryService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', 'stayfinder/properties');

    const res = await fetch(CLOUDINARY_CONFIG.uploadUrl, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Upload failed');
    }
    return data.secure_url;
  },

  uploadMultiple: async (files) => {
    return Promise.all(Array.from(files).map((f) => cloudinaryService.uploadImage(f)));
  },
};

export default cloudinaryService;
