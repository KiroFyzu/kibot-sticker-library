const express = require('express');
const upload = require('../middlewares/upload.middleware');
const imageController = require('../controllers/image.controller');

const router = express.Router();

router.get('/upload', imageController.showUpload);
router.post('/upload', upload.single('image'), imageController.uploadImage);

router.get('/images', imageController.listImages);
router.get('/images/:id/original', imageController.previewOriginal);
router.get('/images/:id/sticker', imageController.previewSticker);
router.get('/images/:id', imageController.showImage);
router.post('/images/:id/convert', imageController.convertImage);
router.get('/images/:id/download-sticker', imageController.downloadSticker);
router.post('/images/:id/delete', imageController.deleteImage);

router.get('/categories/:category', imageController.listByCategory);

module.exports = router;
