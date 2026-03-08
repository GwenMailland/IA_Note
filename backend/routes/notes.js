const express = require('express');
const router = express.Router({ mergeParams: true });
const { v4: uuidv4 } = require('uuid');
const storage = require('../services/storageService');
const aiRouter = require('../services/aiRouter');
const { parseAIResponse } = require('../services/markdownService');

// GET /api/notebooks/:notebookId/notes
router.get('/', (req, res) => {
  try {
    const notes = storage.getNotes(req.params.notebookId);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notebooks/:notebookId/notes
router.post('/', async (req, res) => {
  try {
    const { notebookId } = req.params;
    const { noteContext, rawContent, language = 'fr', provider } = req.body;

    if (!noteContext || !rawContent) {
      return res.status(400).json({ error: 'noteContext and rawContent are required' });
    }

    const notebook = storage.getNotebook(notebookId);
    if (!notebook) return res.status(404).json({ error: 'Notebook not found' });

    const globalContext = notebook.context || '';

    let prompt;
    if (language === 'fr') {
      prompt = `Tu es un assistant de prise de notes professionnelles.\n\nContexte global du bloc-note : ${globalContext}\nType de note : ${noteContext}\nContenu brut :\n${rawContent}\n\n1. Reformule et structure en Markdown propre\n2. Conserve TOUTES les informations\n3. Ajoute titres, listes si pertinent\n4. Corrige orthographe et grammaire\n5. Identifie : décisions prises, TODO, questions ouvertes\nRéponds UNIQUEMENT avec le Markdown structuré.\n\n---AI_META---\n{"suggest_document": true/false, "document_title": "titre ou null", "document_reason": "raison ou null"}`;
    } else {
      prompt = `You are a professional note-taking assistant.\n\nNotebook context: ${globalContext}\nNote type: ${noteContext}\nRaw content:\n${rawContent}\n\n1. Reformat and structure in clean Markdown\n2. Keep ALL information\n3. Add titles, lists where relevant\n4. Fix spelling and grammar\n5. Identify: decisions, TODOs, open questions\nReply ONLY with the structured Markdown.\n\n---AI_META---\n{"suggest_document": true/false, "document_title": "title or null", "document_reason": "reason or null"}`;
    }

    const aiResult = await aiRouter.callAI(prompt, '', { provider });
    const { structured, meta } = parseAIResponse(aiResult.content);

    const note = {
      id: uuidv4(),
      notebookId,
      noteContext,
      rawContent,
      structuredContent: structured,
      meta,
      provider: aiResult.provider,
      model: aiResult.model,
      language,
      createdAt: new Date().toISOString()
    };

    storage.addNote(notebookId, note);

    // Update README incrementally (async, don't block response)
    updateReadmeAsync(notebookId, note, language).catch(console.error);

    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function updateReadmeAsync(notebookId, note, language) {
  try {
    const currentReadme = storage.getReadme(notebookId);
    const date = new Date(note.createdAt).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US');

    let prompt;
    if (language === 'fr') {
      prompt = `Tu mets à jour le README.md d'un bloc-note.\n\nREADME actuel :\n${currentReadme}\n\nNouvelle note :\n- Type : ${note.noteContext}\n- Date : ${date}\n- Contenu : ${note.structuredContent}\n\nMets à jour : Chronologie (1 ligne), Synthèse évolutive (max 5 lignes), Actions, Questions, timestamp.\nRéponds UNIQUEMENT avec le README complet mis à jour.`;
    } else {
      prompt = `You are updating a notebook's README.md.\n\nCurrent README:\n${currentReadme}\n\nNew note:\n- Type: ${note.noteContext}\n- Date: ${date}\n- Content: ${note.structuredContent}\n\nUpdate: Timeline (1 line), Evolving summary (max 5 lines), Actions, Questions, timestamp.\nReply ONLY with the complete updated README.`;
    }

    const result = await aiRouter.callAI(prompt, '');
    storage.saveReadme(notebookId, result.content);
  } catch (err) {
    console.error('README update failed:', err.message);
  }
}

module.exports = router;
