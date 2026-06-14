const Minio = require('minio');

const required = ['MINIO_ENDPOINT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key} must be set in .env`);
  }
}

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: Number(process.env.MINIO_PORT || 9000),
  useSSL: String(process.env.MINIO_USE_SSL).toLowerCase() === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
});

module.exports = {
  minioClient,
  buckets: {
    original: process.env.MINIO_BUCKET_ORIGINAL || 'stickers-original',
    sticker: process.env.MINIO_BUCKET_STICKER || 'stickers-webp',
    thumbnail: process.env.MINIO_BUCKET_THUMBNAIL || 'stickers-thumbnail'
  },
  publicBaseUrl: process.env.MINIO_PUBLIC_BASE_URL || ''
};
