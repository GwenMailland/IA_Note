const express = require('express');
const cors = require('cors');
const { ensureDataDir } = require('./services/storageService');

// Ensure data directory exists
ensureDataDir();

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/config', require('./routes/config'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notebooks', require('./routes/notebooks'));
app.use('/api/notebooks/:notebookId/notes', require('./routes/notes'));
app.use('/api/notebooks/:notebookId/documents', require('./routes/documents'));
app.use('/api/notebooks/:notebookId/chat', require('./routes/chat'));
app.use('/api/export', require('./routes/export'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`NoteFlow backend running on http://localhost:${PORT}`);
});
