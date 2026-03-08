const express = require('express');
const router = express.Router();
const ollamaService = require('../services/ollamaService');
const groqService = require('../services/groqService');
const claudeService = require('../services/claudeService');
const storage = require('../services/storageService');

// GET /api/ai/ollama/status
router.get('/ollama/status', async (req, res) => {
  try {
    const result = await ollamaService.ping();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/ollama/models
router.get('/ollama/models', async (req, res) => {
  try {
    const models = await ollamaService.listModels();
    res.json({ models });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/groq/test
router.post('/groq/test', async (req, res) => {
  try {
    const { apiKey } = req.body;
    const ok = await groqService.testKey(apiKey);
    res.json({ ok });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/claude/test
router.post('/claude/test', async (req, res) => {
  try {
    const { apiKey } = req.body;
    const ok = await claudeService.testKey(apiKey);
    res.json({ ok });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
