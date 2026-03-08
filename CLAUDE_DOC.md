# CLAUDE_DOC — Documentation technique NoteFlow

## Lancement

```bash
# Installation
npm install && cd frontend && npm install && cd ..

# Backend (port 3001)
node backend/server.js

# Frontend (port 5173)
cd frontend && npm run dev

# Les deux simultanément (requiert concurrently)
npm run dev
```

---

## Architecture des fichiers

```
noteflow/
├── package.json                    ← scripts lancement + dépendances backend
├── .gitignore                      ← exclut node_modules/, data/
├── backend/
│   ├── server.js                   ← Express + CORS + montage des routes
│   ├── routes/
│   │   ├── notebooks.js            ← CRUD blocs-notes + suggestion contexte IA
│   │   ├── notes.js                ← Ajout notes + structuration IA + mise à jour README
│   │   ├── ai.js                   ← Status Ollama, test clés Groq/Claude
│   │   ├── documents.js            ← Génération et lecture documents .md
│   │   └── config.js               ← Lecture/écriture config.json
│   └── services/
│       ├── storageService.js       ← Toutes les opérations disque (JSON + .md)
│       ├── ollamaService.js        ← API Ollama native (/api/chat, /api/tags)
│       ├── groqService.js          ← OpenAI SDK pointé sur Groq (baseURL)
│       ├── claudeService.js        ← SDK @anthropic-ai/sdk
│       ├── aiRouter.js             ← Point d'entrée unique — lit config → dispatch
│       └── markdownService.js      ← parseAIResponse() + slugify()
├── frontend/
│   ├── package.json                ← dépendances React/Vite
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                 ← BrowserRouter + LangProvider + Routes
│       ├── index.css               ← Tailwind + classes utilitaires (.btn, .card, .input…)
│       ├── context/
│       │   └── LangContext.jsx     ← Fournisseur langue global (fr/en)
│       ├── hooks/
│       │   └── useTranslation.js   ← Hook t(key), lang, setLang
│       ├── i18n/
│       │   ├── fr.json             ← Traductions françaises
│       │   └── en.json             ← Traductions anglaises
│       ├── pages/
│       │   ├── HomePage.jsx        ← Liste des blocs-notes
│       │   ├── NotebookPage.jsx    ← Vue bloc-note (tabs : Timeline / Documents / README)
│       │   └── SettingsPage.jsx    ← Configuration IA et langue
│       └── components/
│           ├── Navbar.jsx          ← Logo, nav, badge provider, bascule FR/EN
│           ├── NoteForm.jsx        ← Formulaire saisie note (contexte + contenu brut + override provider)
│           ├── Timeline.jsx        ← Trait vertical + cartes
│           ├── NoteCard.jsx        ← Carte note (Markdown rendu, toggle brut/structuré, copy, generate doc)
│           ├── DocumentsTab.jsx    ← Liste documents + prévisualisation Markdown
│           ├── ReadmeTab.jsx       ← Affichage README.md du bloc-note
│           ├── NewNotebookModal.jsx   ← Création bloc-note + suggestion contexte IA
│           ├── EditContextModal.jsx   ← Édition contexte global
│           └── GenerateDocModal.jsx   ← Titre + instructions → génération document
└── data/                           ← Créé automatiquement (non versionné)
    ├── config.json
    └── notebooks/
        └── {uuid}/
            ├── meta.json
            ├── notes.json
            ├── README.md
            └── documents/
                └── {slug}.md
```

---

## Endpoints API

### Config

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/config` | Config complète (app 100% locale, localhost uniquement) |
| PUT | `/api/config` | Mise à jour config (merge profond) |

**Body PUT :**
```json
{
  "language": "fr",
  "ai": {
    "provider": "ollama",
    "ollama": { "model": "qwen2.5:72b" },
    "groq": { "apiKey": "gsk_...", "model": "llama-3.3-70b-versatile" },
    "claude": { "apiKey": "sk-ant-...", "model": "claude-haiku-4-5-20251001" }
  }
}
```

### Blocs-notes

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/notebooks` | Liste tous les blocs-notes (triés par date décroissante) |
| GET | `/api/notebooks/:id` | Détail d'un bloc-note |
| POST | `/api/notebooks` | Créer un bloc-note |
| PUT | `/api/notebooks/:id` | Modifier titre/contexte |
| GET | `/api/notebooks/:id/readme` | Contenu README.md |
| POST | `/api/notebooks/suggest-context` | Génération contexte via IA |

**Body POST /api/notebooks :**
```json
{ "title": "Projet Nexus", "context": "...", "language": "fr" }
```

**Body POST suggest-context :**
```json
{ "title": "Projet Nexus", "language": "fr", "provider": "ollama" }
```

### Notes

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/notebooks/:id/notes` | Liste les notes (plus récentes en premier) |
| POST | `/api/notebooks/:id/notes` | Ajouter + structurer via IA |

**Body POST :**
```json
{
  "noteContext": "Réunion de lancement",
  "rawContent": "On a décidé de...",
  "language": "fr",
  "provider": "groq"
}
```

**Réponse :**
```json
{
  "id": "uuid",
  "notebookId": "uuid",
  "noteContext": "Réunion de lancement",
  "rawContent": "...",
  "structuredContent": "# Réunion de lancement\n...",
  "meta": { "suggest_document": true, "document_title": "CR Réunion", "document_reason": "..." },
  "provider": "ollama",
  "model": "qwen2.5:72b",
  "language": "fr",
  "createdAt": "2025-03-08T..."
}
```

### IA

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/ai/ollama/status` | `{ available: bool, models: [] }` |
| GET | `/api/ai/ollama/models` | `{ models: ["qwen2.5:72b", ...] }` |
| POST | `/api/ai/groq/test` | `{ apiKey }` → `{ ok: bool }` |
| POST | `/api/ai/claude/test` | `{ apiKey }` → `{ ok: bool }` |

### Documents

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/notebooks/:id/documents` | Liste les documents |
| GET | `/api/notebooks/:id/documents/:slug` | Contenu d'un document |
| POST | `/api/notebooks/:id/documents/generate` | Génère un document via IA |
| PUT | `/api/notebooks/:id/documents/:slug` | Mettre à jour un document |

**Body POST generate :**
```json
{
  "title": "Compte rendu réunion",
  "instructions": "Format bullet points",
  "noteId": "uuid-optionnel",
  "language": "fr"
}
```

---

## Format des fichiers de stockage

### data/config.json
```json
{
  "language": "fr",
  "ai": {
    "provider": "ollama",
    "ollama": { "model": "qwen2.5:72b" },
    "groq": { "apiKey": "", "model": "llama-3.3-70b-versatile" },
    "claude": { "apiKey": "", "model": "claude-haiku-4-5-20251001" }
  }
}
```

### data/notebooks/{id}/meta.json
```json
{
  "id": "uuid",
  "title": "Projet Nexus",
  "context": "## Contexte\n...",
  "createdAt": "ISO",
  "updatedAt": "ISO",
  "language": "fr",
  "noteCount": 3
}
```

### data/notebooks/{id}/notes.json
```json
[
  {
    "id": "uuid",
    "notebookId": "uuid",
    "noteContext": "Réunion de lancement",
    "rawContent": "...",
    "structuredContent": "# Réunion\n...",
    "meta": { "suggest_document": true, "document_title": "CR", "document_reason": "..." },
    "provider": "ollama",
    "model": "qwen2.5:72b",
    "language": "fr",
    "createdAt": "ISO"
  }
]
```

---

## Prompts IA

### Suggestion contexte global

**FR :** `Tu es un assistant de prise de notes. L'utilisateur crée un bloc-note intitulé "{titre}". Propose un contexte global court (5-8 lignes) en Markdown structuré : Objet, Parties prenantes, Objectifs, Type de contenu. Réponds uniquement avec le Markdown.`

**EN :** `You are a note-taking assistant. The user is creating a notebook titled "{titre}". Propose a short global context (5-8 lines) in structured Markdown: Purpose, Stakeholders, Objectives, Expected content type. Reply only with the Markdown content.`

### Structuration de note

**FR :** Variables : `{contexte_global}`, `{contexte_note}`, `{contenu_brut}`. Reformulation Markdown + identification décisions/TODO/questions. Réponse UNIQUEMENT Markdown + séparateur `---AI_META---` + JSON meta.

**EN :** Même structure, labels en anglais.

### Mise à jour README

**FR :** Variables : `{readme_actuel}`, `{contexte_note}`, `{date}`, `{note_structuree}`. Met à jour Chronologie, Synthèse, Actions, Questions, timestamp.

### Génération document

**FR/EN :** Variables : `{notebook.title}`, `{notebook.context}`, `{title}`, `{instructions}`, `{notesSummary}`. Génère un document Markdown complet et professionnel.

---

## Parsing `---AI_META---`

Le backend parse la réponse IA dans `markdownService.parseAIResponse()` :
1. Cherche le séparateur `---AI_META---`
2. Partie avant = note structurée
3. Partie après = JSON extrait par regex `\{[^}]*\}` (non-greedy)
4. En cas d'erreur de parsing JSON → `meta = {}`

---

## Décisions techniques

| Décision | Justification |
|----------|---------------|
| Stockage JSON/fichiers | 100% local, pas de DB, simplicité absolue |
| `aiRouter.js` comme seul point d'entrée IA | Découplage, changement provider transparent |
| Notes en tête de `notes.json` | `unshift()` → ordre chronologique inversé natif |
| Clé API dans `data/config.json` | Hors git via `.gitignore data/` |
| Slugs max 50 chars, sans accents | Compatibilité OS/URL, fallback `document-{timestamp}` si vide |
| README mis à jour async | Ne bloque pas la réponse HTTP à l'utilisateur |
| Port 3001 backend / 5173 frontend | Vite par défaut, CORS configuré |

---

## Dépendances

### Backend
- `express` : serveur HTTP
- `cors` : Cross-Origin pour frontend local
- `openai` : SDK compatible Groq (baseURL override)
- `@anthropic-ai/sdk` : Claude API
- `uuid` : génération d'IDs
- `slugify` : non utilisé directement (slugify custom dans markdownService)

### Frontend
- `react` + `react-dom` : UI
- `react-router-dom` : navigation SPA
- `react-markdown` + `remark-gfm` : rendu Markdown avec support GFM
- `vite` + `@vitejs/plugin-react` : bundler
- `tailwindcss` + `@tailwindcss/typography` : CSS utilitaire + classes prose
