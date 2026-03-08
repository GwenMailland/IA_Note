const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const storage = require('../services/storageService');
const aiRouter = require('../services/aiRouter');

// GET /api/notebooks
router.get('/', (req, res) => {
  try {
    const notebooks = storage.getNotebooks();
    res.json(notebooks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notebooks/:id
router.get('/:id', (req, res) => {
  try {
    const nb = storage.getNotebook(req.params.id);
    if (!nb) return res.status(404).json({ error: 'Notebook not found' });
    res.json(nb);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notebooks
router.post('/', async (req, res) => {
  try {
    const { title, context, language } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const config = storage.getConfig();
    const lang = language || config.language || 'fr';
    const id = uuidv4();
    const nb = storage.createNotebook(id, title, context || '', lang);
    res.status(201).json(nb);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notebooks/:id
router.put('/:id', async (req, res) => {
  try {
    const { title, context } = req.body;
    const updated = storage.updateNotebook(req.params.id, { title, context });
    if (!updated) return res.status(404).json({ error: 'Notebook not found' });

    // Update README when context changes
    if (context !== undefined) {
      const readme = storage.getReadme(req.params.id);
      const newReadme = readme.replace(
        /## (?:Contexte|Context)\n[\s\S]*?\n\n## /,
        `## ${updated.language === 'en' ? 'Context' : 'Contexte'}\n${context}\n\n## `
      );
      storage.saveReadme(req.params.id, newReadme);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notebooks/suggest-context — AI suggestion for notebook context
router.post('/suggest-context', async (req, res) => {
  try {
    const { title, language = 'fr', provider } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    let prompt;
    if (language === 'fr') {
      prompt = `Tu es un assistant de prise de notes. L'utilisateur crée un bloc-note intitulé "${title}".\nPropose un contexte global court (5-8 lignes) en Markdown structuré :\n- Objet du bloc-note\n- Parties prenantes potentielles\n- Objectifs\n- Type de contenu attendu\nAdapte-toi au domaine détecté. Réponds uniquement avec le Markdown, sans commentaire.`;
    } else {
      prompt = `You are a note-taking assistant. The user is creating a notebook titled "${title}".\nPropose a short global context (5-8 lines) in structured Markdown:\n- Purpose of the notebook\n- Potential stakeholders\n- Objectives\n- Expected content type\nAdapt to the detected domain. Reply only with the Markdown content, no commentary.`;
    }

    const result = await aiRouter.callAI(prompt, '', { provider });
    res.json({ context: result.content, provider: result.provider, model: result.model });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notebooks/:id/readme
router.get('/:id/readme', (req, res) => {
  try {
    const content = storage.getReadme(req.params.id);
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
