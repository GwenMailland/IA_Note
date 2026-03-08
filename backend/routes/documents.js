const express = require('express');
const router = express.Router({ mergeParams: true });
const storage = require('../services/storageService');
const aiRouter = require('../services/aiRouter');
const { slugify } = require('../services/markdownService');

// GET /api/notebooks/:notebookId/documents
router.get('/', (req, res) => {
  try {
    const docs = storage.getDocuments(req.params.notebookId);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notebooks/:notebookId/documents/:slug
router.get('/:slug', (req, res) => {
  try {
    const content = storage.getDocument(req.params.notebookId, req.params.slug);
    if (!content) return res.status(404).json({ error: 'Document not found' });
    res.json({ slug: req.params.slug, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const MAX_NOTES_CHARS = 40000;

function buildNotesSummary(notes) {
  let summary = '';
  for (const n of notes) {
    const entry = `### ${n.noteContext} (${new Date(n.createdAt).toLocaleDateString()})\n${n.structuredContent}\n\n---\n\n`;
    if (summary.length + entry.length > MAX_NOTES_CHARS) break;
    summary += entry;
  }
  return summary.trimEnd();
}

function buildDocPrompt(notebook, title, instructions, specificNote, notesSummary, language) {
  if (language === 'fr') {
    return `Tu génères un document Markdown professionnel.\n\nBloc-note : ${notebook.title}\nContexte : ${notebook.context}\nTitre du document : ${title}\n${instructions ? `Instructions spécifiques : ${instructions}\n` : ''}\n${specificNote ? `Note source :\n${specificNote}\n` : `Notes disponibles :\n${notesSummary}`}\n\nGénère un document Markdown complet, structuré et professionnel. Réponds UNIQUEMENT avec le Markdown.`;
  }
  return `You are generating a professional Markdown document.\n\nNotebook: ${notebook.title}\nContext: ${notebook.context}\nDocument title: ${title}\n${instructions ? `Specific instructions: ${instructions}\n` : ''}\n${specificNote ? `Source note:\n${specificNote}\n` : `Available notes:\n${notesSummary}`}\n\nGenerate a complete, structured and professional Markdown document. Reply ONLY with the Markdown.`;
}

// POST /api/notebooks/:notebookId/documents/generate/stream  (SSE — real progress)
router.post('/generate/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  function send(data) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  try {
    const { notebookId } = req.params;
    const { title, instructions = '', noteId, language = 'fr', provider } = req.body;

    if (!title) {
      send({ error: 'Title is required' });
      return res.end();
    }

    send({ step: 'preparing', progress: 10, label: language === 'fr' ? 'Préparation…' : 'Preparing…' });

    const notebook = storage.getNotebook(notebookId);
    if (!notebook) {
      send({ error: 'Notebook not found' });
      return res.end();
    }

    send({ step: 'loading', progress: 25, label: language === 'fr' ? 'Chargement des notes…' : 'Loading notes…' });

    const notes = storage.getNotes(notebookId);
    const notesSummary = buildNotesSummary(notes);

    let specificNote = '';
    if (noteId) {
      const note = notes.find(n => n.id === noteId);
      if (note) specificNote = note.structuredContent;
    }

    const prompt = buildDocPrompt(notebook, title, instructions, specificNote, notesSummary, language);

    send({ step: 'ai_call', progress: 40, label: language === 'fr' ? 'Génération IA en cours…' : 'AI generating…' });

    const result = await aiRouter.callAI(prompt, '', { provider });

    send({ step: 'saving', progress: 88, label: language === 'fr' ? 'Sauvegarde du document…' : 'Saving document…' });

    const slug = slugify(title);
    storage.saveDocument(notebookId, slug, result.content);

    send({ step: 'done', progress: 100, result: { slug, title, content: result.content, provider: result.provider, model: result.model } });
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// POST /api/notebooks/:notebookId/documents/generate
router.post('/generate', async (req, res) => {
  try {
    const { notebookId } = req.params;
    const { title, instructions = '', noteId, language = 'fr', provider } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });

    const notebook = storage.getNotebook(notebookId);
    if (!notebook) return res.status(404).json({ error: 'Notebook not found' });

    const notes = storage.getNotes(notebookId);
    const notesSummary = buildNotesSummary(notes);

    let specificNote = '';
    if (noteId) {
      const note = notes.find(n => n.id === noteId);
      if (note) specificNote = note.structuredContent;
    }

    const prompt = buildDocPrompt(notebook, title, instructions, specificNote, notesSummary, language);
    const result = await aiRouter.callAI(prompt, '', { provider });

    const slug = slugify(title);
    storage.saveDocument(notebookId, slug, result.content);

    res.status(201).json({ slug, title, content: result.content, provider: result.provider, model: result.model });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notebooks/:notebookId/documents/:slug
router.put('/:slug', (req, res) => {
  try {
    const { content } = req.body;
    storage.saveDocument(req.params.notebookId, req.params.slug, content);
    res.json({ slug: req.params.slug, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
