# FONCTIONNEL — Description de NoteFlow pour non-techniciens

## Qu'est-ce que NoteFlow ?

NoteFlow est une application web qui tourne **entièrement sur votre ordinateur**. Elle vous aide à prendre des notes rapidement, puis les **réorganise et structure automatiquement grâce à l'IA**. Rien n'est envoyé vers un serveur externe sauf si vous choisissez d'utiliser Groq ou Claude (optionnel).

L'interface est disponible en **français et en anglais**, avec bascule instantanée.

---

## Écran 1 — Page d'accueil (liste des blocs-notes)

Quand vous ouvrez l'application, vous voyez tous vos **blocs-notes** sous forme de cartes.

Chaque carte affiche :
- Le titre du bloc-note
- Un extrait de son contexte
- Le nombre de notes qu'il contient
- La date de création et la dernière activité

**Créer un bloc-note :**
1. Cliquez sur "Nouveau bloc-note"
2. Saisissez un titre (ex : "Projet Nexus", "Suivi fournisseur Dupont")
3. Optionnellement, cliquez sur "Suggérer via IA" : l'IA génère automatiquement un contexte global adapté (objectifs, parties prenantes, type de contenu attendu) en se basant sur le titre
4. Vous pouvez modifier ou ignorer la suggestion
5. Cliquez sur "Créer"

L'application crée automatiquement un dossier sur votre disque pour stocker les données de ce bloc-note.

---

## Écran 2 — Vue d'un bloc-note

Quand vous ouvrez un bloc-note, vous avez accès à trois onglets :

### Onglet "Timeline"

C'est l'onglet principal. Il contient :
- En haut : **le formulaire de saisie de note**
- En bas : **la timeline** — toutes vos notes dans l'ordre (la plus récente en haut)

#### Formulaire de saisie

Deux champs à remplir :
1. **Contexte de la note** (obligatoire) — une ligne qui décrit de quoi parle cette note : "Réunion de lancement", "Appel téléphonique client", "Brainstorming"
2. **Contenu brut** — vos notes telles quelles, en vrac, sans mise en forme

Un sélecteur discret permet de choisir ponctuellement un autre moteur IA (Ollama, Groq ou Claude) que celui par défaut, juste pour cette note.

Quand vous cliquez sur **"Envoyer & Structurer"** :
1. Vos notes brutes sont envoyées à l'IA
2. L'IA les reformule, les structure en Markdown propre, corrige l'orthographe, et identifie les décisions prises, les actions à faire (TODO) et les questions ouvertes
3. La note structurée apparaît dans la timeline en quelques secondes
4. En arrière-plan, le fichier README.md du bloc-note est mis à jour automatiquement

Si l'IA détecte qu'il serait utile de créer un document (un compte rendu, un plan d'action…), une bannière s'affiche sur la note avec un bouton "Créer".

#### Cartes de note dans la timeline

Chaque note est affichée dans une carte avec :
- La date et l'heure
- Un badge coloré avec le contexte (ex : "Réunion de lancement")
- Un badge discret indiquant quel moteur IA a été utilisé et quel modèle
- Le contenu structuré rendu en Markdown

Boutons disponibles sur chaque note :
- **"Brut" / "Structuré"** : basculer entre le texte original saisi et la version structurée par l'IA
- **"Générer un document"** : créer un document `.md` à partir de cette note
- **"Copier"** : copier le contenu dans le presse-papiers
- Les cartes sont **collapsables** (cliquer sur la flèche)

La timeline est triable (plus récent ou plus ancien en haut).

### Onglet "Documents"

Affiche la liste de tous les documents `.md` générés pour ce bloc-note.

- À gauche : la liste des documents (nom + date de mise à jour)
- À droite : la prévisualisation du document sélectionné, rendu en Markdown

Vous pouvez générer un nouveau document depuis cet onglet avec le bouton "Nouveau document".

### Onglet "README"

Affiche le fichier README.md du bloc-note, mis à jour automatiquement à chaque nouvelle note.

Ce fichier contient :
- Le titre et le contexte global du bloc-note
- Une **synthèse évolutive** (max 5 lignes, mise à jour à chaque note)
- Une **chronologie** (une ligne par note)
- Les **actions en cours** (TODO non résolus)
- Les **questions ouvertes**
- La date de dernière mise à jour

---

## Génération d'un document

Quand vous demandez la création d'un document (depuis une note ou depuis l'onglet Documents) :

1. Une fenêtre s'ouvre avec deux champs :
   - **Titre du document** (ex : "Compte rendu réunion du 5 mars")
   - **Instructions spécifiques** (optionnel : "Format synthétique, bullet points, pour envoi externe")
2. Vous cliquez sur "Générer"
3. L'IA génère un document Markdown complet et professionnel à partir des notes du bloc-note (ou d'une note spécifique si vous avez cliqué depuis une note)
4. Le document est sauvegardé sur votre disque dans `data/notebooks/{id}/documents/`
5. Vous êtes redirigé vers l'onglet Documents où il s'affiche immédiatement

---

## Écran 3 — Paramètres

Accessible depuis la barre de navigation.

### Langue
Choisissez Français ou Anglais. Le changement est instantané, **sans redémarrage**. Les prompts envoyés à l'IA seront aussi dans la langue choisie, donc les notes structurées et les documents seront générés dans la bonne langue.

### Provider IA actif
Choisissez lequel des trois moteurs IA utiliser par défaut pour toutes vos notes :
- **Ollama** (recommandé) : tourne sur votre Mac, gratuit, confidentiel
- **Groq** : service cloud gratuit, très rapide, nécessite une clé API gratuite
- **Claude** : service cloud premium Anthropic, meilleure qualité, payant

### Configuration Ollama
- L'application vérifie automatiquement si Ollama est lancé sur votre machine
- Un indicateur vert/orange indique son état
- Si disponible : sélectionnez le modèle à utiliser parmi ceux installés (le modèle `qwen2.5:72b` est recommandé pour le français sur Mac 32 Go)
- Si indisponible : un message vous indique comment le lancer (`ollama serve`)

### Configuration Groq
- Collez votre clé API Groq (obtenue gratuitement sur console.groq.com)
- Cliquez sur "Tester" pour vérifier qu'elle fonctionne
- Choisissez le modèle (llama-3.3-70b-versatile est le plus performant)

### Configuration Claude API
- Collez votre clé API Anthropic (sur console.anthropic.com)
- Cliquez sur "Tester" pour vérifier
- Choisissez le modèle (haiku = rapide/économique, opus = meilleure qualité)

Cliquez sur **"Sauvegarder"** pour enregistrer tous les changements.

---

## Barre de navigation

Toujours visible en haut de l'écran :
- Logo et nom "NoteFlow"
- Lien vers les blocs-notes et les paramètres
- Un badge discret indiquant quel moteur IA est actif et quel modèle (ex : "ollama — qwen2.5:72b")
- Les boutons **FR / EN** pour changer de langue depuis n'importe quelle page

---

## Ce que l'IA fait à chaque étape

| Action | Ce que fait l'IA | Langue |
|--------|-----------------|--------|
| Création d'un bloc-note | Génère un contexte global suggéré | Langue active |
| Envoi d'une note | Structure, reformule, identifie décisions/TODO/questions | Langue active |
| Mise à jour README | Intègre la nouvelle note dans le résumé existant | Langue active |
| Génération de document | Crée un document complet à partir des notes | Langue active |

---

## Fichiers créés sur votre disque

Tout est stocké dans le dossier `data/` à côté de l'application :

```
data/
├── config.json          ← vos préférences et clés API (ne pas versionner)
└── notebooks/
    └── {identifiant}/
        ├── meta.json       ← titre, contexte, date de création
        ├── notes.json      ← toutes vos notes et leurs métadonnées
        ├── README.md       ← synthèse évolutive (mise à jour automatique)
        └── documents/
            └── mon-document.md   ← documents générés par l'IA
```

Ces fichiers sont lisibles directement dans n'importe quel éditeur de texte. Vous pouvez les copier, les ouvrir dans Obsidian ou les versionner avec Git (sauf `data/config.json` qui contient vos clés API).
