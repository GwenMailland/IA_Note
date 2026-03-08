const express = require('express');
const router = express.Router();
const storage = require('../services/storageService');

// GET /api/config — app is 100% local (localhost only), returns full config
router.get('/', (req, res) => {
  try {
    res.json(storage.getConfig());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/config
router.put('/', (req, res) => {
  try {
    const current = storage.getConfig();
    const updates = req.body;

    // Merge deeply
    const newConfig = {
      ...current,
      ...updates,
      ai: {
        ...current.ai,
        ...(updates.ai || {}),
        ollama: { ...current.ai.ollama, ...(updates.ai?.ollama || {}) },
        groq: { ...current.ai.groq, ...(updates.ai?.groq || {}) },
        claude: { ...current.ai.claude, ...(updates.ai?.claude || {}) }
      }
    };

    // Don't overwrite keys if masked value sent
    if (updates.ai?.groq?.apiKey === '***') newConfig.ai.groq.apiKey = current.ai.groq.apiKey;
    if (updates.ai?.claude?.apiKey === '***') newConfig.ai.claude.apiKey = current.ai.claude.apiKey;

    storage.saveConfig(newConfig);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
