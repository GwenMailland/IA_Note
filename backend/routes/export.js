const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const os = require('os');
const storage = require('../services/storageService');

function resolveDir(raw) {
  if (!raw) return path.join(os.homedir(), 'Downloads');
  return raw.replace(/^~/, os.homedir());
}

// POST /api/export  — write file(s) to disk
// Body: { files: [{name: 'doc.md', content: '...'}, ...] }
// If one file  → saves to exportDir/name
// If multiple  → saves to exportDir/noteflow-YYYY-MM-DD/name
router.post('/', (req, res) => {
  try {
    const config = storage.getConfig();
    const baseDir = resolveDir(config.exportDir);

    const { files } = req.body;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'files array is required' });
    }

    let destDir = baseDir;
    if (files.length > 1) {
      const stamp = new Date().toISOString().slice(0, 10);
      destDir = path.join(baseDir, `noteflow-${stamp}`);
    }

    fs.mkdirSync(destDir, { recursive: true });

    const saved = files.map(({ name, content }) => {
      const filePath = path.join(destDir, name);
      fs.writeFileSync(filePath, content, 'utf8');
      return { name, path: filePath };
    });

    res.json({ saved, dir: destDir });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/dir — return resolved export directory
router.get('/dir', (req, res) => {
  try {
    const config = storage.getConfig();
    const raw = config.exportDir || '~/Downloads';
    res.json({ raw, resolved: resolveDir(raw) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
