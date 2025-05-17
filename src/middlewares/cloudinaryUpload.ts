import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import cloudinary from '../config/cloudinary';
import { v4 as uuidv4 } from 'uuid';

// Use memory storage for all environments
const storage = multer.memoryStorage();

// Create multer upload instance
const upload = multer({
    storage,
    fileFilter: (req: Request, file: Express.Multer.File, cb: any) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * Middleware to handle file upload to Cloudinary
 * @param fieldName The form field name for the file
 */
export const uploadToCloudinary = (fieldName: string) => {
    return [
        // First use multer to handle the multipart form data
        upload.single(fieldName),

        // Then upload to Cloudinary if there's a file
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                // If no file was uploaded, continue to the next middleware
                if (!req.file) {
                    console.log('No file was uploaded');
                    return next();
                }

                console.log(`File received: ${req.file.originalname}, size: ${req.file.size} bytes`);

                // Generate a unique ID for the file to avoid name collisions
                const uniqueId = uuidv4().substring(0, 8);

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
                const result = await cloudinary.uploader.upload(dataURI, {
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
            } catch (error: any) {
                console.error('Cloudinary upload error:', error.message);

                // Instead of failing the request, add an error flag and continue
                req.body.cloudinaryError = error.message;
                next();
            }
        }
    ];
};

export default { uploadToCloudinary }; 