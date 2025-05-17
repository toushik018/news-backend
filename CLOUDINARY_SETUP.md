# Cloudinary Setup for Image Uploads

This project now uses Cloudinary for storing and serving images when deployed to Vercel. This solves the "read-only filesystem" error you were experiencing.

## Why This Change Was Needed

The error `EROFS: read-only file system, open '/var/task/uploads/1747418045909-switzright.png'` occurred because:

1. Vercel's serverless environment uses a read-only filesystem
2. Your app was trying to write uploaded files to the local filesystem
3. This works fine in development but fails in production

## How It Works Now

1. In development (local): Files are stored in your local `/uploads` directory
2. In production (Vercel): Files are uploaded to Cloudinary and stored in the cloud

## Setup Instructions

1. **Sign up for a free Cloudinary account:**

   - Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
   - Complete the registration

2. **Get your Cloudinary credentials:**

   - Log in to your Cloudinary dashboard
   - Copy your Cloud Name, API Key, and API Secret

3. **Set Vercel environment variables:**

   - Go to your Vercel project dashboard
   - Click on "Settings" → "Environment Variables"
   - Add the following variables:
     ```
     CLOUDINARY_CLOUD_NAME=your_cloud_name
     CLOUDINARY_API_KEY=your_api_key
     CLOUDINARY_API_SECRET=your_api_secret
     NODE_ENV=production
     ```

4. **Redeploy your application:**
   - After setting the environment variables, redeploy your app

## Testing Your Setup

1. Upload a new image via the dashboard
2. Check that the image URL now starts with `https://res.cloudinary.com/`
3. The image should display correctly in both the list view and detail view

## Troubleshooting

If you still have issues:

1. Check the Vercel deployment logs for any errors
2. Verify that your Cloudinary credentials are correctly set
3. Ensure your Cloudinary account is active (not suspended due to quota limits)

## Local Development

For local development:

- Set `NODE_ENV=development` in your `.env` file
- Images will be stored locally in the `/uploads` directory as before
