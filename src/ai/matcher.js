const scoreRule = require('./scorer');

function matchRules(text, rules) {
  return rules
    .map(rule => ({
      id: rule.id,
      score: scoreRule(text, rule)
    }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);
}

module.exports = matchRules;