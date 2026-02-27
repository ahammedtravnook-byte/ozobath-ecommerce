// ============================================
// OZOBATH - Upload Controller (Cloudinary Direct)
// ============================================
const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/apiError');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Upload single image (buffer from multer memoryStorage)
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image file provided.');

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'ozobath',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) reject(new ApiError(500, 'Image upload failed.'));
        else resolve(result);
      }
    );
    stream.end(req.file.buffer);
  });

  sendResponse(res, 200, {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  }, 'Image uploaded successfully');
});

// Upload multiple images
const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'No image files provided.');
  }

  const uploadPromises = req.files.map((file) =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'ozobath',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) reject(new ApiError(500, 'Image upload failed.'));
          else resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      stream.end(file.buffer);
    })
  );

  const images = await Promise.all(uploadPromises);
  sendResponse(res, 200, images, `${images.length} images uploaded successfully`);
});

// Delete image
const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  if (!publicId) throw new ApiError(400, 'Public ID is required.');

  await cloudinary.uploader.destroy(publicId);
  sendResponse(res, 200, null, 'Image deleted successfully');
});

module.exports = { uploadImage, uploadImages, deleteImage };
