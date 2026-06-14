const { detect } = require('../ai');

const {
  normalizeText,
  unique
} = require('../utils/text.util');

function generate({
  ocrText = '',
  filename = '',
  description = ''
}) {

  const combined =
    normalizeText(
      `${ocrText} ${filename} ${description}`
    );

  const result =
    detect(combined);

  const template =
    result.templates[0]?.id || null;

  const emotion =
    result.emotions[0]?.id || null;

  const topic =
    result.topics[0]?.id || null;

  const tags = unique([
    template,
    emotion,
    topic,
    ...result.slang,
    ...result.profanity
  ].filter(Boolean));

  return {
    category: topic || 'random',

    template,

    emotion,

    topic,

    slang: result.slang,

    profanity: result.profanity,

    tags,

    description:
      description ||
      `${template || 'meme'} ${topic || ''} ${emotion || ''}`
  };
}

module.exports = {
  generate
};