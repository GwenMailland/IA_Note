# NoteFlow — AI-Augmented Note Taking

> Prise de notes professionnelle augmentée par IA. Structurez vos idées, générez des documents, gardez une mémoire vivante de vos projets.

![NoteFlow Demo](https://img.shields.io/badge/status-active-brightgreen) ![License](https://img.shields.io/badge/license-Apache%202.0-blue) ![Node](https://img.shields.io/badge/node-%3E%3D18-green) ![React](https://img.shields.io/badge/react-18-61dafb)

---

## ✨ Fonctionnalités

- **Structuration IA** — Collez vos notes brutes, l'IA les reformate en Markdown propre avec titres, listes, TODO et décisions identifiées
- **Génération de documents** — Créez des comptes-rendus, plans d'action et rapports professionnels en un clic
- **Mémoire vivante** — Chaque bloc-note dispose d'un README auto-mis à jour par l'IA après chaque note
- **Tags intelligents** — L'IA génère automatiquement des tags filtrables pour chaque note
- **Multi-providers IA** — Ollama (local, gratuit), Groq (cloud gratuit), Claude API (premium)
- **3 thèmes** — Dark indigo, Light, Blood/Neon
- **Timeline filtrée** — Recherche plein-texte avec surbrillance, filtre par tag
- **Progress bar réelle** — Suivi des opérations IA via Server-Sent Events (SSE)
- **Export** — Téléchargement individuel (.md) ou bulk (.zip)
- **Bilingue** — Français / English

---

## 📸 Interface

| Timeline | Documents | Mémoire |
|----------|-----------|---------|
| Notes structurées en Markdown avec tags, recherche et highlighting | Documents générés par IA, visualisation rich, export ZIP | README vivant auto-mis à jour par l'IA |

---

## 🚀 Installation

### Prérequis
- Node.js ≥ 18
- [Ollama](https://ollama.ai) (recommandé pour usage local gratuit)

### Démarrage rapide

```bash
# Cloner le dépôt
git clone https://github.com/GwenMailland/IA_Note.git
cd IA_Note

# Installer les dépendances
npm install
cd frontend && npm install && cd ..

# Lancer le backend (port 3001)
node backend/server.js

# Dans un second terminal : lancer le frontend (port 5173)
cd frontend && npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Configuration IA

Rendez-vous dans **Paramètres** pour configurer votre provider IA.

### Ollama (local, gratuit — recommandé)
```bash
# Installer Ollama : https://ollama.ai
ollama serve
ollama pull qwen2.5:72b   # ou mistral-small:22b, llama3.2...
```

### Groq (cloud gratuit)
Créez une clé API sur [console.groq.com](https://console.groq.com) et renseignez-la dans les paramètres.

### Claude API (premium)
Clé API sur [console.anthropic.com](https://console.anthropic.com).

---

## 🏗️ Architecture

```
IA_Note/
├── backend/
│   ├── server.js                 # Express + CORS + routes
│   ├── routes/
│   │   ├── notebooks.js          # CRUD notebooks
│   │   ├── notes.js              # Notes + SSE stream + README queue
│   │   └── documents.js          # Documents + SSE stream
│   └── services/
│       ├── aiRouter.js           # Point d'entrée unique IA (Ollama/Groq/Claude)
│       ├── storageService.js     # Lecture/écriture fichiers JSON + .md
│       └── markdownService.js    # parseAIResponse() + slugify()
├── frontend/
│   └── src/
│       ├── components/           # NoteCard, Timeline, NoteForm, ProgressBar...
│       ├── context/              # LangContext, ThemeContext
│       ├── hooks/                # useTranslation, useSSEPost
│       ├── pages/                # HomePage, NotebookPage, SettingsPage
│       └── i18n/                 # fr.json, en.json
└── data/                         # Stockage local (JSON + .md)
    └── notebooks/<id>/
        ├── meta.json
        ├── notes.json
        ├── README.md             # Mémoire du bloc-note
        └── documents/
```

**Stack** : Node.js + Express · React 18 + Vite · TailwindCSS · Stockage fichier local

---

## 🔒 Sécurité

- `data/config.json` (clés API) est exclu du dépôt via `.gitignore`
- L'application est conçue pour un usage **local uniquement** — aucune authentification n'est implémentée
- Ne pas exposer le port 3001 sur un réseau public

---

## 📄 Licence

[Apache 2.0](LICENSE) — © 2026 GwenMailland
