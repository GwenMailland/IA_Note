const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const NOTEBOOKS_DIR = path.join(DATA_DIR, 'notebooks');

const DEFAULT_CONFIG = {
  language: 'fr',
  ai: {
    provider: 'ollama',
    ollama: { model: 'qwen2.5:72b' },
    groq: { apiKey: '', model: 'llama-3.3-70b-versatile' },
    claude: { apiKey: '', model: 'claude-haiku-4-5-20251001' }
  }
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(NOTEBOOKS_DIR)) fs.mkdirSync(NOTEBOOKS_DIR, { recursive: true });
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
  }
}

function getConfig() {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(config) {
  ensureDataDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getNotebooks() {
  ensureDataDir();
  if (!fs.existsSync(NOTEBOOKS_DIR)) return [];
  return fs.readdirSync(NOTEBOOKS_DIR)
    .filter(d => fs.statSync(path.join(NOTEBOOKS_DIR, d)).isDirectory())
    .map(id => {
      const metaPath = path.join(NOTEBOOKS_DIR, id, 'meta.json');
      if (!fs.existsSync(metaPath)) return null;
      return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getNotebook(id) {
  const metaPath = path.join(NOTEBOOKS_DIR, id, 'meta.json');
  if (!fs.existsSync(metaPath)) return null;
  return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
}

function createNotebook(id, title, context, language = 'fr') {
  const dir = path.join(NOTEBOOKS_DIR, id);
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(dir, 'documents'), { recursive: true });

  const meta = {
    id,
    title,
    context,
    language,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    noteCount: 0
  };
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
  fs.writeFileSync(path.join(dir, 'notes.json'), JSON.stringify([], null, 2));

  const fr = language === 'fr';
  const readme = [
    `# ${title}`,
    '',
    `## ${fr ? 'Contexte' : 'Context'}`,
    context,
    '',
    `## ${fr ? 'Synthèse évolutive' : 'Evolving summary'}`,
    '',
    `## ${fr ? 'Chronologie' : 'Timeline'}`,
    '',
    `## ${fr ? 'Actions en cours' : 'Pending actions'}`,
    '',
    `## ${fr ? 'Questions ouvertes' : 'Open questions'}`,
    '',
    `## ${fr ? 'Dernière mise à jour' : 'Last update'}`,
    new Date().toISOString(),
    ''
  ].join('\n');
  fs.writeFileSync(path.join(dir, 'README.md'), readme);

  return meta;
}

function updateNotebook(id, updates) {
  const metaPath = path.join(NOTEBOOKS_DIR, id, 'meta.json');
  if (!fs.existsSync(metaPath)) return null;
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const updated = { ...meta, ...updates, updatedAt: new Date().toISOString() };
  fs.writeFileSync(metaPath, JSON.stringify(updated, null, 2));
  return updated;
}

function getNotes(notebookId) {
  const notesPath = path.join(NOTEBOOKS_DIR, notebookId, 'notes.json');
  if (!fs.existsSync(notesPath)) return [];
  return JSON.parse(fs.readFileSync(notesPath, 'utf8'));
}

function addNote(notebookId, note) {
  const notesPath = path.join(NOTEBOOKS_DIR, notebookId, 'notes.json');
  const notes = getNotes(notebookId);
  notes.unshift(note);
  fs.writeFileSync(notesPath, JSON.stringify(notes, null, 2));

  // Update note count in meta
  const meta = getNotebook(notebookId);
  if (meta) {
    updateNotebook(notebookId, { noteCount: notes.length });
  }
  return note;
}

function getReadme(notebookId) {
  const readmePath = path.join(NOTEBOOKS_DIR, notebookId, 'README.md');
  if (!fs.existsSync(readmePath)) return '';
  return fs.readFileSync(readmePath, 'utf8');
}

function saveReadme(notebookId, content) {
  const readmePath = path.join(NOTEBOOKS_DIR, notebookId, 'README.md');
  fs.writeFileSync(readmePath, content);
}

function getDocuments(notebookId) {
  const docsDir = path.join(NOTEBOOKS_DIR, notebookId, 'documents');
  if (!fs.existsSync(docsDir)) return [];
  return fs.readdirSync(docsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const slug = f.replace('.md', '');
      const content = fs.readFileSync(path.join(docsDir, f), 'utf8');
      const stat = fs.statSync(path.join(docsDir, f));
      return { slug, content, updatedAt: stat.mtime.toISOString() };
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function saveDocument(notebookId, slug, content) {
  const docsDir = path.join(NOTEBOOKS_DIR, notebookId, 'documents');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, `${slug}.md`), content);
  return { slug, content };
}

function getDocument(notebookId, slug) {
  const docPath = path.join(NOTEBOOKS_DIR, notebookId, 'documents', `${slug}.md`);
  if (!fs.existsSync(docPath)) return null;
  return fs.readFileSync(docPath, 'utf8');
}

module.exports = {
  ensureDataDir,
  getConfig,
  saveConfig,
  getNotebooks,
  getNotebook,
  createNotebook,
  updateNotebook,
  getNotes,
  addNote,
  getReadme,
  saveReadme,
  getDocuments,
  saveDocument,
  getDocument
};
