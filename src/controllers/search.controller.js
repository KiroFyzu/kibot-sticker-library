const prisma = require('../config/database');
const { getCategoryStats } = require('../services/imageQuery.service');

function containsQuery(q) {
  return {
    contains: q
  };
}

async function search(req, res, next) {
  try {
    const q = String(req.query.q || '').trim();
    const categories = await getCategoryStats();
    let images = [];

    if (q) {
      images = await prisma.image.findMany({
        where: {
          OR: [
            { filename: containsQuery(q) },
            { originalName: containsQuery(q) },
            { ocrText: containsQuery(q) },
            { description: containsQuery(q) },
            { category: containsQuery(q) },
            { tags: containsQuery(q) }
          ]
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    res.render('pages/search', {
      title: 'Search',
      active: 'search',
      q,
      images,
      categories
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  search
};
