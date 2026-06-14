const prisma = require('../config/database');
const { getCategoryStats } = require('../services/imageQuery.service');

async function index(req, res, next) {
  try {
    const [totalImages, totalStickers, totalProcessing, categoryStats, latestImages] = await Promise.all([
      prisma.image.count(),
      prisma.image.count({
        where: {
          stickerObjectKey: {
            not: null
          }
        }
      }),
      prisma.image.count({
        where: {
          status: 'processing'
        }
      }),
      getCategoryStats(),
      prisma.image.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: 8
      })
    ]);

    res.render('pages/dashboard', {
      title: 'Dashboard',
      active: 'dashboard',
      stats: {
        totalImages,
        totalStickers,
        totalProcessing,
        totalCategories: categoryStats.length
      },
      latestImages,
      categories: categoryStats
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  index
};
