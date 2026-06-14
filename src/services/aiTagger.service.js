const { normalizeText, unique } = require('../utils/text.util');

const rules = [
  {
    category: 'meme kuliah',
    tags: ['meme', 'kuliah'],
    keywords: ['tugas', 'deadline', 'dosen', 'skripsi', 'uas', 'uts', 'kelas', 'kampus', 'mahasiswa', 'belajar']
  },
  {
    category: 'meme kerja',
    tags: ['meme', 'kerja'],
    keywords: ['kerja', 'kantor', 'meeting', 'boss', 'atasan', 'lembur', 'gaji', 'client', 'deadline']
  },
  {
    category: 'anime reaction',
    tags: ['anime', 'reaction'],
    keywords: ['anime', 'waifu', 'manga', 'senpai', 'reaction', 'kawaii']
  },
  {
    category: 'kucing',
    tags: ['kucing', 'lucu'],
    keywords: ['kucing', 'cat', 'meong', 'kitten']
  },
  {
    category: 'sedih',
    tags: ['sedih', 'reaction'],
    keywords: ['sedih', 'nangis', 'cry', 'kecewa', 'galau']
  },
  {
    category: 'marah',
    tags: ['marah', 'reaction'],
    keywords: ['marah', 'angry', 'kesal', 'emosi', 'rage']
  },
  {
    category: 'sindiran',
    tags: ['sindiran', 'meme'],
    keywords: ['sindir', 'nyindir', 'satir', 'ironi', 'halus']
  },
  {
    category: 'lucu',
    tags: ['lucu', 'meme'],
    keywords: ['lucu', 'haha', 'wkwk', 'lol', 'ngakak', 'receh']
  }
];

const keywordTags = {
  deadline: ['deadline', 'panik'],
  tugas: ['tugas', 'kuliah'],
  besok: ['deadline', 'panik'],
  'belum mulai': ['panik', 'tugas'],
  panik: ['panik'],
  dosen: ['dosen', 'kuliah'],
  kerja: ['kerja'],
  meeting: ['meeting', 'kerja'],
  lembur: ['lembur', 'kerja'],
  sedih: ['sedih'],
  marah: ['marah'],
  anime: ['anime'],
  kucing: ['kucing'],
  lucu: ['lucu']
};

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function createDescription(category, tags, sourceText) {
  const base = sourceText || tags.join(', ') || category;
  const trimmed = base.length > 140 ? `${base.slice(0, 137)}...` : base;
  return `Gambar ${category || 'random'} dengan konteks ${trimmed}.`;
}

function generate({ ocrText = '', filename = '', description = '' }) {
  const combined = normalizeText(`${ocrText} ${filename} ${description}`);
  const collectedTags = [];
  let selectedCategory = 'random';

  for (const rule of rules) {
    if (includesAny(combined, rule.keywords)) {
      selectedCategory = rule.category;
      collectedTags.push(...rule.tags);
      break;
    }
  }

  for (const [keyword, tags] of Object.entries(keywordTags)) {
    if (combined.includes(keyword)) {
      collectedTags.push(...tags);
    }
  }

  if (combined.includes('meme')) collectedTags.push('meme');
  if (combined.includes('reaction')) collectedTags.push('reaction');

  const words = combined
    .split(' ')
    .filter((word) => word.length > 3 && word.length < 18)
    .slice(0, 8);

  const tags = unique([...collectedTags, ...words]).slice(0, 12);

  return {
    category: selectedCategory,
    tags,
    description: description || createDescription(selectedCategory, tags, ocrText || filename)
  };
}

module.exports = {
  generate
};
