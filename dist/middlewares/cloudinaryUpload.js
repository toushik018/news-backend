"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = void 0;
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const uuid_1 = require("uuid");
// Use memory storage for all environments
const storage = multer_1.default.memoryStorage();
// Create multer upload instance
const upload = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed!'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
/**
 * Middleware to handle file upload to Cloudinary
 * @param fieldName The form field name for the file
 */
const uploadToCloudinary = (fieldName) => {
    return [
        // First use multer to handle the multipart form data
        upload.single(fieldName),
        // Then upload to Cloudinary if there's a file
        async (req, res, next) => {
            try {
                // If no file was uploaded, continue to the next middleware
                if (!req.file) {
                    console.log('No file was uploaded');
                    return next();
                }
                console.log(`File received: ${req.file.originalname}, size: ${req.file.size} bytes`);
                // Generate a unique ID for the file to avoid name collisions
                const uniqueId = (0, uuid_1.v4)().substring(0, 8);
                // Create a unique folder path with date to organize uploads
                const date = new Date();
                const folder = `uploads/${date.getFullYear()}/${date.getMonth() + 1}`;
                // Create a unique public_id
                const fileExtension = req.file.originalname.split('.').pop() || 'jpg';
                const publicId = `${folder}/${uniqueId}`;
                // Convert buffer to base64 data URI
                const b64 = Buffer.from(req.file.buffer).toString('base64');
                const dataURI = `data:${req.file.mimetype};base64,${b64}`;
                console.log(`Uploading to Cloudinary with public_id: ${publicId}`);
                // Upload to Cloudinary with improved options
                const result = await cloudinary_1.default.uploader.upload(dataURI, {
                    resource_type: 'auto', // Auto-detect resource type
                    public_id: publicId,
                    overwrite: true,
                    format: fileExtension,
                    transformation: [
                        { quality: 'auto:good' } // Optimize quality
                    ]
                });
                console.log('Cloudinary upload successful:', result.secure_url);
                // Add Cloudinary URL to request body
                req.body.coverImage = result.secure_url;
                next();
            }
            catch (error) {
                console.error('Cloudinary upload error:', error.message);
                // Instead of failing the request, add an error flag and continue
                req.body.cloudinaryError = error.message;
                next();
            }
        }
    ];
};
exports.uploadToCloudinary = uploadToCloudinary;
exports.default = { uploadToCloudinary: exports.uploadToCloudinary };
