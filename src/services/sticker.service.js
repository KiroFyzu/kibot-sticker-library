const path = require('path');
const sharp = require('sharp');
const storageService = require('./storage.service');

async function createStickerFromStream(readableStream, imageId) {
  const chunks = [];

  for await (const chunk of readableStream) {
    chunks.push(chunk);
  }

  const input = Buffer.concat(chunks);
  const stickerBuffer = await sharp(input)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .webp({ quality: 90 })
    .toBuffer();

  const objectKey = `stickers/${new Date().toISOString().slice(0, 10)}/${imageId}-${Date.now()}${path.extname('sticker.webp')}`;
  const stickerUrl = await storageService.uploadBuffer(
    storageService.buckets.sticker,
    objectKey,
    stickerBuffer,
    'image/webp'
  );

  return {
    stickerBucket: storageService.buckets.sticker,
    stickerObjectKey: objectKey,
    stickerUrl
  };
}

module.exports = {
  createStickerFromStream
};
