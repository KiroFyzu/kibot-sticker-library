const path = require('path');
const fs = require('fs/promises');

const DEFAULT_JOB_URL = 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs';
const DEFAULT_MODEL = 'PaddleOCR-VL-1.6';
const DEFAULT_OPTIONAL_PAYLOAD = {
  useDocOrientationClassify: false,
  useDocUnwarping: false,
  useChartRecognition: false
};

function getConfig() {
  return {
    token: process.env.PADDLEOCR_API_TOKEN,
    jobUrl: process.env.PADDLEOCR_JOB_URL || DEFAULT_JOB_URL,
    model: process.env.PADDLEOCR_MODEL || DEFAULT_MODEL,
    pollIntervalMs: Number(process.env.PADDLEOCR_POLL_INTERVAL_MS || 5000),
    timeoutMs: Number(process.env.PADDLEOCR_TIMEOUT_MS || 120000)
  };
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`PaddleOCR request failed with ${response.status}: ${text.slice(0, 300)}`);
  }

  return text ? JSON.parse(text) : {};
}

async function submitLocalFileJob(filePath, config) {
  const fileBuffer = await fs.readFile(filePath);
  const form = new FormData();
  const filename = path.basename(filePath);
  const fileBlob = new Blob([fileBuffer], { type: 'application/octet-stream' });

  form.append('model', config.model);
  form.append('optionalPayload', JSON.stringify(DEFAULT_OPTIONAL_PAYLOAD));
  form.append('file', fileBlob, filename);

  const payload = await requestJson(config.jobUrl, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${config.token}`
    },
    body: form
  });

  const jobId = payload && payload.data && payload.data.jobId;
  if (!jobId) {
    throw new Error('PaddleOCR did not return a jobId.');
  }

  return jobId;
}

async function submitUrlJob(fileUrl, config) {
  const payload = await requestJson(config.jobUrl, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${config.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fileUrl,
      model: config.model,
      optionalPayload: DEFAULT_OPTIONAL_PAYLOAD
    })
  });

  const jobId = payload && payload.data && payload.data.jobId;
  if (!jobId) {
    throw new Error('PaddleOCR did not return a jobId.');
  }

  return jobId;
}

async function pollJob(jobId, config) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < config.timeoutMs) {
    const payload = await requestJson(`${config.jobUrl}/${jobId}`, {
      headers: {
        Authorization: `bearer ${config.token}`
      }
    });

    const data = payload.data || {};

    if (data.state === 'done') {
      const jsonUrl = data.resultUrl && data.resultUrl.jsonUrl;
      if (!jsonUrl) {
        throw new Error('PaddleOCR job completed without a JSON result URL.');
      }
      return jsonUrl;
    }

    if (data.state === 'failed') {
      throw new Error(data.errorMsg || 'PaddleOCR job failed.');
    }

    await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
  }

  throw new Error('PaddleOCR job timed out.');
}

function collectText(value, output = []) {
  if (!value || typeof value !== 'object') return output;

  if (typeof value.text === 'string') output.push(value.text);
  if (typeof value.recText === 'string') output.push(value.recText);
  if (typeof value.content === 'string') output.push(value.content);

  for (const item of Object.values(value)) {
    if (Array.isArray(item)) {
      item.forEach((child) => collectText(child, output));
    } else if (item && typeof item === 'object') {
      collectText(item, output);
    }
  }

  return output;
}

function extractTextFromJsonl(jsonl) {
  const chunks = [];
  const lines = jsonl.split('\n').map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    const parsed = JSON.parse(line);
    const result = parsed.result || parsed;
    const layoutResults = result.layoutParsingResults || [];

    for (const layoutResult of layoutResults) {
      if (layoutResult.markdown && typeof layoutResult.markdown.text === 'string') {
        chunks.push(layoutResult.markdown.text);
      }
    }

    collectText(result, chunks);
  }

  return [...new Set(chunks)]
    .join('\n')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchResultText(jsonUrl) {
  const response = await fetch(jsonUrl);
  const jsonl = await response.text();

  if (!response.ok) {
    throw new Error(`Could not fetch PaddleOCR result: ${response.status} ${jsonl.slice(0, 300)}`);
  }

  return extractTextFromJsonl(jsonl);
}

async function readTextFromImage(filePathOrUrl) {
  if (typeof fetch !== 'function') {
    throw new Error('Global fetch is not available. Use Node.js 18 or newer.');
  }

  const config = getConfig();
  if (!config.token) {
    throw new Error('PADDLEOCR_API_TOKEN is not configured.');
  }

  const jobId = String(filePathOrUrl).startsWith('http')
    ? await submitUrlJob(filePathOrUrl, config)
    : await submitLocalFileJob(filePathOrUrl, config);

  const jsonUrl = await pollJob(jobId, config);
  return fetchResultText(jsonUrl);
}

module.exports = {
  readTextFromImage
};
