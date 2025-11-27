import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Root folder for all employee-related assets in Cloudinary
const CLOUDINARY_EMPLOYEE_ROOT_FOLDER = process.env.CLOUDINARY_EMPLOYEE_ROOT_FOLDER || 'labour-management/employees';

const PHOTO_FOLDER = `${CLOUDINARY_EMPLOYEE_ROOT_FOLDER}/photos`;
const ID_PROOF_FOLDER = `${CLOUDINARY_EMPLOYEE_ROOT_FOLDER}/id-proofs`;

function uploadToCloudinary(fileBuffer, folder, resourceType = 'auto') {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(error);
          }
          resolve(result);
        }
      )
      .end(fileBuffer);
  });
}

export async function uploadEmployeePhoto(file) {
  if (!file) return null;

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    const error = new Error('Invalid photo file type. Allowed: JPG, PNG, WEBP');
    error.status = 400;
    throw error;
  }

  const result = await uploadToCloudinary(file.buffer, PHOTO_FOLDER, 'image');
  return result.secure_url;
}

export async function uploadEmployeeIdProof(file) {
  if (!file) return null;

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    const error = new Error('Invalid identity proof file type. Allowed: JPG, PNG, WEBP, PDF');
    error.status = 400;
    throw error;
  }

  const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';

  const result = await uploadToCloudinary(file.buffer, ID_PROOF_FOLDER, resourceType);
  return result.secure_url;
}

export default {
  uploadEmployeePhoto,
  uploadEmployeeIdProof,
};
