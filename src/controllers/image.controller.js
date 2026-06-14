const prisma = require('../config/database');
const storageService = require('../services/storage.service');
const ocrService = require('../services/ocr.service');
const aiTagger = require('../services/aiTagger.service');
const stickerService = require('../services/sticker.service');
const { getCategoryStats } = require('../services/imageQuery.service');
const { makeObjectKey, unlinkSafe } = require('../utils/file.util');

async function listImages(req, res, next) {
  try {
    const [images, categories] = await Promise.all([
      prisma.image.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      }),
      getCategoryStats()
    ]);

    res.render('pages/images', {
      title: 'Gallery',
      active: 'images',
      images,
      categories,
      pageHeading: 'Semua Gambar',
      emptyMessage: 'Belum ada gambar di library.'
    });
  } catch (error) {
    next(error);
  }
}

async function showUpload(req, res, next) {
  try {
    res.render('pages/upload', {
      title: 'Upload',
      active: 'upload',
      categories: await getCategoryStats(),
      errorMessage: null
    });
  } catch (error) {
    next(error);
  }
}

async function processImage(image, filePath) {
  try {
    const ocrText = await ocrService.readTextFromImage(filePath);
    const generated = aiTagger.generate({
      ocrText,
      filename: image.originalName,
      description: image.description
    });

    await prisma.image.update({
      where: {
        id: image.id
      },
      data: {
        ocrText,
        description: generated.description,
        category: generated.category,
        tags: JSON.stringify(generated.tags),
        status: 'ready',
        errorMessage: null
      }
    });
  } catch (error) {
    await prisma.image.update({
      where: {
        id: image.id
      },
      data: {
        status: 'failed',
        errorMessage: error.message
      }
    });
  } finally {
    await unlinkSafe(filePath);
  }
}

async function uploadImage(req, res, next) {
  const file = req.file;

  if (!file) {
    res.status(400).render('pages/upload', {
      title: 'Upload',
      active: 'upload',
      categories: await getCategoryStats(),
      errorMessage: 'Pilih file gambar terlebih dahulu.'
    });
    return;
  }

  try {
    const objectKey = makeObjectKey(file.originalname, 'original');
    const originalUrl = await storageService.uploadFile(
      storageService.buckets.original,
      objectKey,
      file.path,
      file.mimetype
    );

    const image = await prisma.image.create({
      data: {
        filename: objectKey.split('/').pop(),
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        originalBucket: storageService.buckets.original,
        originalObjectKey: objectKey,
        originalUrl,
        status: 'processing'
      }
    });

    await processImage(image, file.path);
    res.redirect(`/images/${image.id}`);
  } catch (error) {
    await unlinkSafe(file.path);
    next(error);
  }
}

async function showImage(req, res, next) {
  try {
    const image = await prisma.image.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    if (!image) {
      const error = new Error('Gambar tidak ditemukan.');
      error.status = 404;
      throw error;
    }

    res.render('pages/image-detail', {
      title: image.originalName,
      active: 'images',
      image,
      categories: await getCategoryStats()
    });
  } catch (error) {
    next(error);
  }
}

async function convertImage(req, res, next) {
  try {
    const image = await prisma.image.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    if (!image) {
      const error = new Error('Gambar tidak ditemukan.');
      error.status = 404;
      throw error;
    }

    const originalStream = await storageService.getObjectStream(image.originalBucket, image.originalObjectKey);
    const sticker = await stickerService.createStickerFromStream(originalStream, image.id);

    await prisma.image.update({
      where: {
        id: image.id
      },
      data: {
        ...sticker,
        status: 'ready',
        errorMessage: null
      }
    });

    res.redirect(`/images/${image.id}`);
  } catch (error) {
    if (req.params.id) {
      await prisma.image.update({
        where: {
          id: Number(req.params.id)
        },
        data: {
          status: 'failed',
          errorMessage: error.message
        }
      }).catch(() => {});
    }
    next(error);
  }
}

async function downloadSticker(req, res, next) {
  try {
    const image = await prisma.image.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    if (!image || !image.stickerObjectKey) {
      const error = new Error('Sticker belum tersedia.');
      error.status = 404;
      throw error;
    }

    const url = await storageService.getPresignedUrl(image.stickerBucket, image.stickerObjectKey);
    res.redirect(url);
  } catch (error) {
    next(error);
  }
}

async function previewOriginal(req, res, next) {
  try {
    const image = await prisma.image.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    if (!image || !image.originalObjectKey) {
      const error = new Error('Preview original tidak tersedia.');
      error.status = 404;
      throw error;
    }

    const url = await storageService.getPresignedUrl(image.originalBucket, image.originalObjectKey, 60 * 10);
    res.redirect(url);
  } catch (error) {
    next(error);
  }
}

async function previewSticker(req, res, next) {
  try {
    const image = await prisma.image.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    if (!image || !image.stickerObjectKey) {
      const error = new Error('Preview sticker tidak tersedia.');
      error.status = 404;
      throw error;
    }

    const url = await storageService.getPresignedUrl(image.stickerBucket, image.stickerObjectKey, 60 * 10);
    res.redirect(url);
  } catch (error) {
    next(error);
  }
}

async function deleteImage(req, res, next) {
  try {
    const image = await prisma.image.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    if (!image) {
      res.redirect('/images');
      return;
    }

    await storageService.deleteObject(image.originalBucket, image.originalObjectKey);
    await storageService.deleteObject(image.stickerBucket, image.stickerObjectKey);
    await prisma.image.delete({
      where: {
        id: image.id
      }
    });

    res.redirect('/images');
  } catch (error) {
    next(error);
  }
}

async function listByCategory(req, res, next) {
  try {
    const category = decodeURIComponent(req.params.category);
    const [images, categories] = await Promise.all([
      prisma.image.findMany({
        where: {
          category
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      getCategoryStats()
    ]);

    res.render('pages/images', {
      title: category,
      active: 'categories',
      images,
      categories,
      pageHeading: `Kategori: ${category}`,
      emptyMessage: 'Tidak ada gambar di kategori ini.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listImages,
  showUpload,
  uploadImage,
  showImage,
  convertImage,
  downloadSticker,
  previewOriginal,
  previewSticker,
  deleteImage,
  listByCategory
};
