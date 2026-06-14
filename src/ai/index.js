const matchRules = require('./matcher');

const templateRules = require('./rules/template.rules');
const emotionRules = require('./rules/emotion.rules');
const topicRules = require('./rules/topic.rules');

const slangRules = require('./rules/slang.rules');
const profanityRules = require('./rules/profanity.rules');

function detect(text) {

  const templates =
    matchRules(text, templateRules);

  const emotions =
    matchRules(text, emotionRules);

  const topics =
    matchRules(text, topicRules);

  const slang =
    slangRules.filter(x =>
      text.includes(x)
    );

  const profanity =
    profanityRules.filter(x =>
      text.includes(x)
    );

  return {
    templates,
    emotions,
    topics,
    slang,
    profanity
  };
}

module.exports = {
  detect
};