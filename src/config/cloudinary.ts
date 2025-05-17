import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Validate Cloudinary credentials
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
    console.error('⚠️ Cloudinary credentials missing! Image uploads will fail.');
    console.error('Please check your .env file for CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET');
} else {
    console.log('✅ Cloudinary credentials found');
}

// Configure Cloudinary
cloudinary.config({
    cloud_name: cloudName || '',
    api_key: apiKey || '',
    api_secret: apiSecret || '',
});

// Test the configuration
try {
    cloudinary.api.ping((error, result) => {
        if (error) {
            console.error('❌ Cloudinary connection test failed:', error.message);
        } else {
            console.log('✅ Cloudinary connection successful');
        }
    });
} catch (error) {
    console.error('❌ Cloudinary test error:', error);
}

export default cloudinary; 