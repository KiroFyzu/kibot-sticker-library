const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const paddleOcr = require('./paddleOcr.service');
const { unlinkSafe } = require('../utils/file.util');

const tmpOcrDir = path.join(__dirname, '..', '..', 'tmp', 'ocr');
const tesseractCacheDir = path.join(__dirname, '..', '..', 'tmp', 'tesseract');

async function preprocessForOcr(filePath) {
  await fs.mkdir(tmpOcrDir, { recursive: true });

  const outputPath = path.join(tmpOcrDir, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.png`);
  const image = sharp(filePath, { failOn: 'none' });
  const metadata = await image.metadata();
  const targetWidth = Number(process.env.OCR_PREPROCESS_WIDTH || 1400);
  const shouldResize = metadata.width && metadata.width < targetWidth;

  let pipeline = sharp(filePath, { failOn: 'none' });

  if (shouldResize) {
    pipeline = pipeline.resize({
      width: targetWidth,
      withoutEnlargement: false
    });
  }

  await pipeline
    .grayscale()
    .normalize()
    .linear(1.15, -10)
    .median(3)
    .sharpen({
      sigma: 1,
      m1: 0.8,
      m2: 1.4
    })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  return outputPath;
}

async function readTextFromImage(filePath) {
  const primaryProvider = String(process.env.OCR_PRIMARY_PROVIDER || 'paddleocr').toLowerCase();

  if (primaryProvider === 'paddleocr') {
    try {
      const paddleText = await paddleOcr.readTextFromImage(filePath);
      if (paddleText) return paddleText;
      console.warn('PaddleOCR returned empty text. Falling back to Tesseract.');
    } catch (error) {
      console.warn(`PaddleOCR failed. Falling back to Tesseract: ${error.message}`);
    }
  }

  return readTextWithTesseract(filePath);
}

async function readTextWithTesseract(filePath) {
  const lang = process.env.OCR_LANG || 'ind';
  const preparedPath = await preprocessForOcr(filePath);

  try {
    const result = await Tesseract.recognize(preparedPath, lang, {
      cachePath: tesseractCacheDir,
      logger: () => {}
    });

    return result.data.text.replace(/\s+/g, ' ').trim();
  } finally {
    await unlinkSafe(preparedPath);
  }
}

module.exports = {
  preprocessForOcr,
  readTextWithTesseract,
  readTextFromImage
};
