const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const { validateImageMagicBytes } = require('../middleware/uploadSecurity');

dotenv.config();

// Configure Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImage = async (imageInput, mimeType = 'image/jpeg') => {
  if (Buffer.isBuffer(imageInput)) {
    if (!validateImageMagicBytes(imageInput)) {
      throw new Error('Security Error: Uploaded buffer failed binary magic byte content inspection. Not a valid image.');
    }
  }

  const isConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                       process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name' &&
                       process.env.CLOUDINARY_CLOUD_NAME.trim() !== '';

  if (!isConfigured) {
    console.warn("WARNING: Cloudinary is not configured in .env. Storing image as Base64 directly in MongoDB.");
    let uploadStr = imageInput;
    if (Buffer.isBuffer(imageInput)) {
      uploadStr = `data:${mimeType};base64,${imageInput.toString('base64')}`;
    }
    return {
      url: uploadStr,
      public_id: 'local_base64_fallback'
    };
  }

  return new Promise((resolve, reject) => {
    let uploadStr = imageInput;

    // Convert file buffer to base64 DataURI if buffer is provided
    if (Buffer.isBuffer(imageInput)) {
      uploadStr = `data:${mimeType};base64,${imageInput.toString('base64')}`;
    }

    cloudinary.uploader.upload(
      uploadStr,
      {
        folder: 'techzone_mobile_accessories',
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' }, // scale down large uploads
          { quality: 'auto:good' }, // compress automatically
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          public_id: result.public_id
        });
      }
    );
  });
};

/**
 * Deletes an image from Cloudinary using its public ID
 * @param {String} publicId - Cloudinary public ID of the image
 * @returns {Promise<Object>} - Cloudinary destroy result
 */
const deleteImage = async (publicId) => {
  const isConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                       process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name' &&
                       process.env.CLOUDINARY_CLOUD_NAME.trim() !== '';

  if (!isConfigured) {
    console.warn("WARNING: Cloudinary is not configured. Bypassing image delete.");
    return { result: 'bypassed_no_config' };
  }

  return new Promise((resolve, reject) => {
    if (!publicId) return resolve({ result: 'not_found' });
    
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });
  });
};

/**
 * Helper to construct optimized Cloudinary URLs with dynamic quality and width parameters
 */
const getOptimizedImageUrl = (url, options = {}) => {
  if (!url || typeof url !== 'string') return url;

  const width = options.width || 800;
  const quality = options.quality || 'auto';
  const crop = options.crop || 'limit';

  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    if (url.includes('/upload/f_auto,q_auto') || url.includes('/upload/q_auto')) {
      return url;
    }
    return url.replace('upload/', `upload/f_auto,q_${quality},w_${width},c_${crop}/`);
  }

  if (url.includes('images.unsplash.com')) {
    const cleanUrl = url.split('?')[0];
    return `${cleanUrl}?w=${width}&auto=format&fit=crop&q=80`;
  }

  return url;
};

module.exports = {
  uploadImage,
  deleteImage,
  getOptimizedImageUrl
};
