const fs = require('fs');
const { minioClient, buckets, publicBaseUrl } = require('../config/minio');

async function ensureBucket(bucketName) {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName);
  }
}

async function ensureBuckets() {
  await Promise.all([
    ensureBucket(buckets.original),
    ensureBucket(buckets.sticker),
    ensureBucket(buckets.thumbnail)
  ]);
}

async function uploadFile(bucketName, objectKey, filePath, contentType) {
  const metaData = contentType ? { 'Content-Type': contentType } : undefined;
  await minioClient.fPutObject(bucketName, objectKey, filePath, metaData);
  return getObjectUrl(bucketName, objectKey);
}

async function uploadBuffer(bucketName, objectKey, buffer, contentType) {
  const metaData = contentType ? { 'Content-Type': contentType } : undefined;
  await minioClient.putObject(bucketName, objectKey, buffer, buffer.length, metaData);
  return getObjectUrl(bucketName, objectKey);
}

async function deleteObject(bucketName, objectKey) {
  if (!bucketName || !objectKey) return;

  try {
    await minioClient.removeObject(bucketName, objectKey);
  } catch (error) {
    if (error.code !== 'NoSuchKey' && error.code !== 'NotFound') {
      throw error;
    }
  }
}

function getObjectUrl(bucketName, objectKey) {
  if (!publicBaseUrl) return '';
  const safeBucket = encodeURIComponent(bucketName);
  const safeKey = String(objectKey)
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `${publicBaseUrl.replace(/\/$/, '')}/${safeBucket}/${safeKey}`;
}

async function getPresignedUrl(bucketName, objectKey, expirySeconds = 60 * 60) {
  return minioClient.presignedGetObject(bucketName, objectKey, expirySeconds);
}

function getObjectStream(bucketName, objectKey) {
  return minioClient.getObject(bucketName, objectKey);
}

function createReadStream(filePath) {
  return fs.createReadStream(filePath);
}

module.exports = {
  buckets,
  ensureBuckets,
  uploadFile,
  uploadBuffer,
  deleteObject,
  getObjectUrl,
  getPresignedUrl,
  getObjectStream,
  createReadStream
};
