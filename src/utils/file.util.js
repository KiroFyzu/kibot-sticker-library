const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

function safeExtension(filename, fallback = '.jpg') {
  const ext = path.extname(filename || '').toLowerCase();
  return ext || fallback;
}

function makeObjectKey(originalName, folder = 'images') {
  const ext = safeExtension(originalName);
  const stamp = new Date().toISOString().slice(0, 10);
  const token = crypto.randomBytes(10).toString('hex');
  return `${folder}/${stamp}/${Date.now()}-${token}${ext}`;
}

async function unlinkSafe(filePath) {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Could not remove temporary file ${filePath}:`, error.message);
    }
  }
}

function formatFileSize(bytes = 0) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

module.exports = {
  makeObjectKey,
  safeExtension,
  unlinkSafe,
  formatFileSize
};
