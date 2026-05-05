import { v2 as cloudinary } from 'cloudinary';
import config from '../../config/index.js';

if (!config.cloudinary_name || !config.cloudinary_api_key || !config.cloudinary_api_secret) {
  console.error('Cloudinary configuration is missing in .env');
}

cloudinary.config({
  cloud_name: config.cloudinary_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

export const uploadToCloudinary = async (base64String: string, folder: string) => {
  try {
    const response = await cloudinary.uploader.upload(base64String, {
      folder: `zawajbd/${folder}`,
      resource_type: 'auto',
    });
    return response.secure_url;
  } catch (error: any) {
    console.error('Cloudinary upload error details:', error);
    throw new Error(`Cloudinary Upload Failed: ${error.message || 'Unknown Error'}`);
  }
};
