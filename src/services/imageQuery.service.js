const prisma = require('../config/database');

async function getCategoryStats() {
  const grouped = await prisma.image.groupBy({
    by: ['category'],
    where: {
      category: {
        not: null
      }
    },
    _count: {
      category: true
    },
    orderBy: {
      _count: {
        category: 'desc'
      }
    }
  });

  return grouped.map((item) => ({
    name: item.category,
    count: item._count.category
  }));
}

module.exports = {
  getCategoryStats
};
