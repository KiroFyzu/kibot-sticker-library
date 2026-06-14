require('dotenv').config();

const app = require('./src/app');
const storageService = require('./src/services/storage.service');

const port = process.env.PORT || 3000;

async function start() {
  await storageService.ensureBuckets();

  app.listen(port, () => {
    console.log(`AI Sticker Library is running at http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start AI Sticker Library:', error);
  process.exit(1);
});
