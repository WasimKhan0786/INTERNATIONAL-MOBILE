const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

// Configure Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImage = async (imageInput, mimeType = 'image/jpeg') => {
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

module.exports = {
  uploadImage,
  deleteImage
};
