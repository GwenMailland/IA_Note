# NoteFlow — Spec pour Claude Code

## Contexte du projet

Application web locale de prise de notes augmentée par IA. Organisée en **blocs-notes thématiques** avec timeline visuelle, génération de documents `.md` automatique et à la demande.

L'application est **100% locale** : les données restent sur le disque de l'utilisateur. Les appels IA se font soit en local via Ollama, soit vers des APIs cloud (Groq gratuit ou Anthropic payant).

**Cible matérielle** : Mac Apple Silicon 32 Go — Ollama tourne parfaitement, modèles 70B Q4 supportés.

---

## Architecture technique

### Stack
- **Frontend** : React (Vite), TailwindCSS
- **Backend** : Node.js + Express
- **Stockage** : Fichiers JSON + `.md` sur disque local (pas de base de données)
- **IA locale** : Ollama via API REST (`http://localhost:11434`)
- **IA cloud gratuite** : Groq API (`https://api.groq.com/openai/v1`) — compatible OpenAI SDK
- **IA cloud premium** : Anthropic API (`https://api.anthropic.com`)

### Structure de fichiers du projet
```
noteflow/
├── backend/
│   ├── server.js
│   ├── routes/
│   │   ├── notebooks.js
│   │   ├── notes.js
│   │   ├── ai.js
│   │   └── documents.js
│   └── services/
│       ├── ollamaService.js
│       ├── groqService.js
│       ├── claudeService.js
│       ├── aiRouter.js          ← sélectionne le bon service selon config
│       ├── storageService.js
│       └── markdownService.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── i18n/
│   │   │   ├── fr.json
│   │   │   └── en.json
│   │   └── App.jsx
│   └── index.html
└── data/                        ← créé automatiquement au premier lancement
    ├── config.json
    ├── notebooks/
    │   └── {notebook-id}/
    │       ├── meta.json
    │       ├── notes.json
    │       ├── README.md
    │       └── documents/
    │           └── {slug}.md
    └── ...
```

### Format de config.json
```json
{
  "language": "fr",
  "ai": {
    "provider": "ollama",
    "ollama": {
      "model": "qwen2.5:72b"
    },
    "groq": {
      "apiKey": "",
      "model": "llama-3.3-70b-versatile"
    },
    "claude": {
      "apiKey": "",
      "model": "claude-haiku-4-5-20251001"
    }
  }
}
```

---

## Internationalisation (i18n)

L'application est **entièrement bilingue français / anglais**.

### Portée du bilingue
- **UI** : tous les labels, boutons, messages, placeholders, notifications
- **Prompts IA** : les prompts envoyés à l'IA sont dans la langue sélectionnée → notes structurées et documents générés dans la bonne langue
- **Templates** : les templates proposés par l'IA sont dans la langue active

### Implémentation
- Fichiers `fr.json` et `en.json` dans `frontend/src/i18n/`
- Hook React `useTranslation()` consommé dans tous les composants
- Bascule langue dans Settings → sauvegardée dans `data/config.json`
- Rechargement instantané sans redémarrage
- Les prompts backend reçoivent `language: "fr" | "en"` en paramètre

### Langue par défaut : français

---

## Providers IA

### Priorité recommandée
1. **Ollama** (local, gratuit, confidentiel) — provider par défaut
2. **Groq** (cloud gratuit, rapide, backup idéal)
3. **Claude API** (premium, meilleure qualité)

### 1. Ollama (local)
- API : `http://localhost:11434`
- Liste des modèles : `GET /api/tags` → récupérée dynamiquement
- Modèle recommandé affiché : `qwen2.5:72b` (excellent pour le français, 32 Go)
- Si Ollama absent : warning dans Settings, app continue de fonctionner
- Format d'appel : API Ollama native (`/api/chat`)

### 2. Groq (cloud gratuit)
- API : `https://api.groq.com/openai/v1` (compatible OpenAI)
- Clé API gratuite sur [console.groq.com](https://console.groq.com)
- Modèles disponibles (liste fixe) :
  - `llama-3.3-70b-versatile` ← recommandé par défaut
  - `llama-3.1-8b-instant`
  - `mixtral-8x7b-32768`
  - `gemma2-9b-it`
- Utiliser le SDK OpenAI Node.js avec `baseURL` pointant vers Groq

### 3. Claude API (optionnel)
- API : `https://api.anthropic.com`
- Clé API sur [console.anthropic.com](https://console.anthropic.com) — pay-per-use
- Modèles :
  - `claude-haiku-4-5-20251001` ← défaut (rapide, économique)
  - `claude-sonnet-4-6`
  - `claude-opus-4-6`
- SDK : `@anthropic-ai/sdk`

### aiRouter.js
Point d'entrée unique pour tous les appels IA :
```javascript
async function callAI(prompt, systemPrompt, options = {}) {
  // lit config.json → appelle ollamaService | groqService | claudeService
  // retourne { content: string, provider: string, model: string }
}
```
Jamais d'appel direct aux services depuis les routes — tout passe par aiRouter.

---

## Fonctionnalités détaillées

### 1. Gestion des blocs-notes

Chaque bloc-note = un projet ou contexte global (ex : "Projet Nexus", "Suivi fournisseur", "ARS dossiers 2025").

#### Création
- Titre saisi par l'utilisateur
- Contexte global : texte libre, avec suggestion IA basée sur le titre (accepter / modifier / ignorer)

**Prompt suggestion contexte global — FR :**
```
Tu es un assistant de prise de notes. L'utilisateur crée un bloc-note intitulé "{titre}".
Propose un contexte global court (5-8 lignes) en Markdown structuré :
- Objet du bloc-note
- Parties prenantes potentielles
- Objectifs
- Type de contenu attendu
Adapte-toi au domaine détecté. Réponds uniquement avec le Markdown, sans commentaire.
```

**Prompt suggestion contexte global — EN :**
```
You are a note-taking assistant. The user is creating a notebook titled "{titre}".
Propose a short global context (5-8 lines) in structured Markdown:
- Purpose of the notebook
- Potential stakeholders
- Objectives
- Expected content type
Adapt to the detected domain. Reply only with the Markdown content, no commentary.
```

#### Modification du contexte global
Bouton accessible à tout moment → déclenche mise à jour du README.md.

#### Page d'accueil
Cards : titre, date création, nombre de notes, dernière activité.

---

### 2. Prise de note

#### Formulaire de saisie (haut de la vue bloc-note)

**Champ 1 — Contexte de la note** (ligne simple, obligatoire)
Exemples : "Réunion de lancement", "Appel fournisseur X", "Brainstorming API", "Call with partner"

**Champ 2 — Contenu brut** (textarea)
Notes en vrac, sans mise en forme.

**Dropdown provider** (discret, optionnel)
Override ponctuel pour cette note uniquement.

**Bouton "Envoyer & Structurer" / "Send & Structure"**

Déclenche :
1. Appel IA via aiRouter (prompt selon langue active)
2. Parsing de la réponse : séparation note structurée / meta JSON sur `---AI_META---`
3. Note ajoutée à `notes.json` avec timestamp, provider, modèle
4. Timeline mise à jour
5. README.md mis à jour incrémentalement
6. Si `suggest_document: true` → notification sur la note

**Prompt structuration — FR :**
```
Tu es un assistant de prise de notes professionnelles.

Contexte global du bloc-note : {contexte_global}
Type de note : {contexte_note}
Contenu brut :
{contenu_brut}

1. Reformule et structure en Markdown propre
2. Conserve TOUTES les informations
3. Ajoute titres, listes si pertinent
4. Corrige orthographe et grammaire
5. Identifie : décisions prises, TODO, questions ouvertes
Réponds UNIQUEMENT avec le Markdown structuré.

---AI_META---
{"suggest_document": true/false, "document_title": "titre ou null", "document_reason": "raison ou null"}
```

**Prompt structuration — EN :**
```
You are a professional note-taking assistant.

Notebook context: {contexte_global}
Note type: {contexte_note}
Raw content:
{contenu_brut}

1. Reformat and structure in clean Markdown
2. Keep ALL information
3. Add titles, lists where relevant
4. Fix spelling and grammar
5. Identify: decisions, TODOs, open questions
Reply ONLY with the structured Markdown.

---AI_META---
{"suggest_document": true/false, "document_title": "title or null", "document_reason": "reason or null"}
```

---

### 3. Timeline visuelle

Vue principale d'un bloc-note.

- Trait vertical continu à gauche
- Chaque note = card reliée au trait par connecteur horizontal
- En-tête : date + heure + contexte (badge) + provider/modèle utilisé (badge discret)
- Corps : Markdown rendu HTML
- Boutons : toggle Brut/Structuré, Générer document, Copier
- Blocs collapsables
- Ordre : plus récent en haut (inversable)

---

### 4. Documents `.md`

#### 4.1 README.md — général par bloc-note

Mis à jour **incrémentalement** (jamais régénéré depuis zéro).

```markdown
# {Titre du bloc-note}

## Contexte
{contexte global}

## Synthèse évolutive
{max 5 lignes, mise à jour IA}

## Chronologie
- **{date}** — {contexte_note} : {résumé 1 ligne}

## Actions en cours
{TODO non résolus}

## Questions ouvertes
{questions identifiées}

## Dernière mise à jour
{timestamp}
```

**Prompt mise à jour README — FR :**
```
Tu mets à jour le README.md d'un bloc-note.

README actuel :
{readme_actuel}

Nouvelle note :
- Type : {contexte_note}
- Date : {date}
- Contenu : {note_structuree}

Mets à jour : Chronologie (1 ligne), Synthèse évolutive (max 5 lignes), Actions, Questions, timestamp.
Réponds UNIQUEMENT avec le README complet mis à jour.
```

#### 4.2 Documents spécifiques

**Déclenchement :**
- Automatique : notification + bouton "Créer" si `suggest_document: true`
- Manuel : bouton "Générer un document" sur note ou global

**Interface :** titre (prérempli si suggestion), champ instructions, bouton Générer.

**Stockage :** `data/notebooks/{id}/documents/{slug}.md`

**Affichage :** onglet "Documents", liste cliquable, prévisualisation Markdown rendu.

---

### 5. Page Settings

#### Langue / Language
Radio FR / EN — rechargement instantané.

#### Ollama
- Ping `localhost:11434` au chargement → indicateur statut
- Si accessible : dropdown modèles (fetch dynamique), modèle recommandé `qwen2.5:72b` mis en avant
- Si inaccessible : message d'aide pour lancer Ollama

#### Groq (cloud gratuit)
- Lien vers console.groq.com
- Champ clé API (masqué) + bouton "Tester"
- Dropdown : `llama-3.3-70b-versatile` (défaut), `llama-3.1-8b-instant`, `mixtral-8x7b-32768`, `gemma2-9b-it`

#### Claude API (optionnel)
- Lien vers console.anthropic.com
- Champ clé API (masqué) + bouton "Tester"
- Dropdown : `claude-haiku-4-5-20251001` (défaut), `claude-sonnet-4-6`, `claude-opus-4-6`

#### Provider actif
Radio Ollama / Groq / Claude → sauvegardé dans config.json.

---

### 6. Interface générale

#### Navbar
- Logo + "NoteFlow"
- Liens : Blocs-notes, Settings
- Badge provider actif (ex. "Ollama — qwen2.5:72b")
- Bouton bascule FR/EN accessible depuis partout

#### Thème : dark mode par défaut, sobre et fonctionnel.

---

## Fichiers à maintenir par Claude Code

Mis à jour après chaque modification significative du code.

### `CLAUDE_DOC.md` — Documentation technique
- Architecture fichiers et rôles
- Tous les endpoints (route, méthode, params, réponse)
- Format JSON de stockage
- Tous les prompts avec variables
- Instructions de lancement
- Dépendances et rôles
- Décisions techniques et justifications

### `FONCTIONNEL.md` — Description langage naturel (français)
- Ce que voit et fait l'utilisateur écran par écran
- Fonctionnement de chaque feature sans jargon
- Ce que fait l'IA à chaque étape et dans quelle langue
- Fichiers créés sur disque et pourquoi
- Compréhensible par un non-technique

---

## Contraintes et points d'attention

1. Ollama absent → app démarre sans erreur, warning dans Settings uniquement
2. README mis à jour incrémentalement, jamais régénéré depuis zéro
3. Parsing `---AI_META---` côté backend uniquement
4. Slugs fichiers : lowercase, tirets, sans accents, max 50 chars
5. Pas de suppression de notes en v1
6. Ports : backend `3001`, frontend `5173`
7. CORS : `localhost:5173` → `localhost:3001`
8. Clés API dans `data/config.json` → `.gitignore` excluant `data/`
9. Tout appel IA passe par `aiRouter.js`, jamais direct depuis les routes
10. Backend reçoit toujours `language: "fr" | "en"` pour sélectionner le bon prompt
11. Chaque note enregistre provider + modèle utilisé dans `notes.json`

---

## Ordre de développement recommandé

1. Structure projet + scripts lancement + `.gitignore`
2. Backend : `storageService.js`, CRUD blocs-notes et notes
3. Backend : `ollamaService.js`, `groqService.js`, `claudeService.js`, `aiRouter.js`
4. Backend : routes `/api/notebooks`, `/api/notes`, `/api/ai`, `/api/documents`
5. Frontend : i18n (`fr.json`, `en.json`, hook `useTranslation`)
6. Frontend : page d'accueil
7. Frontend : vue bloc-note + formulaire saisie + override provider
8. Intégration IA : structuration + parsing `---AI_META---`
9. Frontend : timeline visuelle
10. Backend + Frontend : mise à jour incrémentale README.md
11. Backend + Frontend : documents spécifiques
12. Frontend : page Settings complète
13. Rédaction finale `CLAUDE_DOC.md` et `FONCTIONNEL.md`
