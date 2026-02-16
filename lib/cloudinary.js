import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

/**
 * Upload an image buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {string} folder - Destination folder (e.g., 'jarvis/users')
 * @returns {Promise<Object>} - Cloudinary upload response
 */
export const uploadImage = async (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                format: 'webp',
                transformation: [
                    { width: 512, height: 512, crop: 'limit' },
                    { quality: 'auto' },
                    { fetch_format: 'webp' }
                ]
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
};

/**
 * Delete an image from Cloudinary by its public ID
 * @param {string} publicId - Public ID of the image
 */
export const deleteImage = async (publicId) => {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary deletion error:', error);
    }
};

export default cloudinary;
