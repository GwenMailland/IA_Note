const express = require('express');
const router = express.Router({ mergeParams: true });
const storage = require('../services/storageService');
const aiRouter = require('../services/aiRouter');
const { slugify } = require('../services/markdownService');

const MAX_CONTEXT_CHARS = 40000;

function buildNotesContext(notes) {
  let ctx = '';
  for (const n of notes) {
    const entry = `### ${n.noteContext} (${new Date(n.createdAt).toLocaleDateString()})\n${n.structuredContent}\n\n---\n\n`;
    if (ctx.length + entry.length > MAX_CONTEXT_CHARS) break;
    ctx += entry;
  }
  return ctx.trimEnd();
}

// GET week number helper
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return { week: Math.ceil((((d - yearStart) / 86400000) + 1) / 7), year: d.getUTCFullYear() };
}

// POST /api/notebooks/:notebookId/chat/stream — SSE
router.post('/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  function send(data) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  try {
    const { notebookId } = req.params;
    const { question, language = 'fr', provider } = req.body;

    if (!question || !question.trim()) {
      send({ error: language === 'fr' ? 'Question vide' : 'Empty question' });
      return res.end();
    }

    send({ step: 'loading', progress: 15, label: language === 'fr' ? 'Chargement des notes…' : 'Loading notes…' });

    const notebook = storage.getNotebook(notebookId);
    if (!notebook) {
      send({ error: 'Notebook not found' });
      return res.end();
    }

    const notes = storage.getNotes(notebookId);
    const context = buildNotesContext(notes);

    send({ step: 'thinking', progress: 35, label: language === 'fr' ? 'Analyse du contexte…' : 'Analysing context…' });

    let prompt;
    if (language === 'fr') {
      prompt = `Tu es l'assistant IA d'un bloc-note professionnel appelé "${notebook.title}".
Contexte du bloc-note : ${notebook.context || 'Aucun contexte défini.'}

Voici toutes les notes disponibles :
${context || 'Aucune note pour l\'instant.'}

Question de l'utilisateur : ${question}

Réponds de façon précise, concise et utile. Appuie-toi uniquement sur le contenu des notes. Si la réponse n'est pas dans les notes, indique-le clairement.`;
    } else {
      prompt = `You are the AI assistant for a professional notebook called "${notebook.title}".
Notebook context: ${notebook.context || 'No context defined.'}

Here are all the available notes:
${context || 'No notes yet.'}

User question: ${question}

Answer precisely, concisely and helpfully. Base your answer only on the note content. If the answer is not in the notes, say so clearly.`;
    }

    send({ step: 'ai_call', progress: 50, label: language === 'fr' ? 'Réflexion en cours…' : 'Thinking…' });

    const result = await aiRouter.callAI(prompt, '', { provider });

    send({ step: 'done', progress: 100, result: { answer: result.content, provider: result.provider, model: result.model } });
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// POST /api/notebooks/:notebookId/summary/weekly — generate weekly summary
router.post('/summary/weekly', async (req, res) => {
  try {
    const { notebookId } = req.params;
    const { language = 'fr', provider } = req.body;

    const notebook = storage.getNotebook(notebookId);
    if (!notebook) return res.status(404).json({ error: 'Notebook not found' });

    const allNotes = storage.getNotes(notebookId);

    // Filter notes from last 7 days
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekNotes = allNotes.filter(n => new Date(n.createdAt) >= cutoff);

    if (weekNotes.length === 0) {
      return res.status(200).json({ empty: true, message: language === 'fr' ? 'Aucune note cette semaine.' : 'No notes this week.' });
    }

    const notesSummary = weekNotes
      .map(n => `### ${n.noteContext} (${new Date(n.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')})\n${n.structuredContent}`)
      .join('\n\n---\n\n');

    let prompt;
    if (language === 'fr') {
      prompt = `Tu génères un résumé hebdomadaire professionnel d'un bloc-note.

Bloc-note : ${notebook.title}
Contexte : ${notebook.context || ''}
Semaine du : ${cutoff.toLocaleDateString('fr-FR')} au ${new Date().toLocaleDateString('fr-FR')}
Nombre de notes : ${weekNotes.length}

Notes de la semaine :
${notesSummary}

Génère un résumé Markdown hebdomadaire structuré avec :
- Un résumé exécutif (3-4 phrases)
- Faits marquants de la semaine (liste)
- Décisions prises
- Actions en cours / à faire
- Questions ouvertes
- Tendances observées

Réponds UNIQUEMENT avec le Markdown complet.`;
    } else {
      prompt = `You are generating a professional weekly notebook summary.

Notebook: ${notebook.title}
Context: ${notebook.context || ''}
Week from: ${cutoff.toLocaleDateString('en-US')} to ${new Date().toLocaleDateString('en-US')}
Note count: ${weekNotes.length}

Notes from this week:
${notesSummary}

Generate a structured weekly Markdown summary with:
- Executive summary (3-4 sentences)
- Key highlights of the week (list)
- Decisions made
- Actions in progress / to do
- Open questions
- Observed trends

Reply ONLY with the complete Markdown.`;
    }

    const result = await aiRouter.callAI(prompt, '', { provider });

    // Save as document
    const { week, year } = getISOWeek(new Date());
    const slug = `weekly-summary-${year}-w${String(week).padStart(2, '0')}`;
    storage.saveDocument(notebookId, slug, result.content);

    // Store last summary date in notebook meta
    storage.updateNotebook(notebookId, { lastWeeklySummary: new Date().toISOString() });

    res.json({ slug, content: result.content, notesCount: weekNotes.length, provider: result.provider, model: result.model });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
