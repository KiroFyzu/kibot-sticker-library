function scoreRule(text, rule) {
  let score = 0;

  for (const keyword of rule.keywords) {
    if (text.includes(keyword)) {
      score++;
    }
  }

  return score;
}

module.exports = scoreRule;