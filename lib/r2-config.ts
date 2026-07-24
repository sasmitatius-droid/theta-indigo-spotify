// Cloudflare R2 Configuration for Image Storage
// This file contains the CORS configuration and R2 setup

export const R2_CONFIG = {
  // CORS Configuration for R2 Bucket
  cors: {
    allowedOrigins: [
      'http://localhost:3000',
      'https://your-domain.com', // Replace with your actual domain
    ],
    allowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
    ],
    maxAgeSeconds: 3600,
  },

  // R2 Bucket Configuration
  bucket: {
    name: process.env.R2_BUCKET_NAME || 'theta-indigo-images',
    region: 'auto', // R2 doesn't require region specification
  },

  // Image Upload Configuration
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    path: 'user-uploads',
  },
};

// CORS Headers Helper
export function getCorsHeaders(origin: string) {
  const allowedOrigins = R2_CONFIG.cors.allowedOrigins;
  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');

  if (isAllowed) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': R2_CONFIG.cors.allowedMethods.join(', '),
      'Access-Control-Allow-Headers': R2_CONFIG.cors.allowedHeaders.join(', '),
      'Access-Control-Max-Age': R2_CONFIG.cors.maxAgeSeconds.toString(),
    };
  }

  return {};
}

// R2 CORS Configuration for Cloudflare Dashboard
// Copy this to your R2 bucket settings in Cloudflare Dashboard:
/*
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-domain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3600
  }
]
*/
