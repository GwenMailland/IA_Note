# Compte rendu — Réunion Kick-off Partenariat TechVentures

**Date** : 28 février 2026
**Participants** : Sophie Marchand (VP Partnerships), Marco Reyes (CTO) — TechVentures / Alexis Bernard, Julie Faure — Notre équipe
**Objet** : Lancement officiel des discussions de partenariat

---

## 1. Présentation des parties

### TechVentures
- Éditeur de logiciels de gestion pour PME, présent en Espagne et Portugal
- **800 clients actifs** dans la cible PME (50–200 salariés)
- Chiffre d'affaires 2025 : 12M€
- Cherche à enrichir son offre avec une brique IA de prise de notes et génération documentaire

### Notre solution
- Plateforme SaaS de prise de notes augmentée par IA
- Support multi-providers (Ollama local, Groq cloud, Claude API)
- Génération automatique de documents Markdown structurés
- SLA support : réponse en 4h ouvrées

---

## 2. Périmètre du partenariat envisagé

| Critère | Détail |
|---------|--------|
| Territoire | Espagne + Portugal |
| Cible clients | PME 50–200 salariés |
| Volume estimé | 800 comptes TechVentures |
| Modèle | Revente avec commission |
| ARR cible | 400 000 – 600 000 € |

---

## 3. Points techniques abordés

- **Stack TechVentures** : Node.js + PostgreSQL → **compatible** avec notre API REST
- Besoin d'un **endpoint webhook** pour synchroniser les notes en temps réel dans leur tableau de bord
- **OAuth2** : non encore implémenté côté TechVentures. Marco s'engage à livrer sous 3 semaines.
- Estimation effort intégration : **3 à 4 semaines** côté notre équipe

---

## 4. Modèle commercial — première discussion

- TechVentures propose : 18% de commission sur le CA généré
- Notre contre-proposition : structure à paliers (12% → 15% selon volumes)
- **Accord de principe** : négociation à poursuivre, zone d'accord estimée à ~15%

---

## 5. Prochaines étapes

| Action | Responsable | Échéance |
|--------|-------------|----------|
| Envoyer spécifications API/webhook | Julie Faure | 5 mars |
| Livraison OAuth2 | Marco Reyes (CTO) | 21 mars |
| Point juridique contrat | Maître Dupont + Alexis | 5 mars |
| Démo commerciale clients | Alexis Bernard | 10 mars |
| Signature contrat | Les deux parties | Fin mars 2026 |

---

## 6. Décisions prises

- ✅ Lancement officiel des discussions de partenariat
- ✅ Modèle revente avec commission retenu (vs OEM)
- ✅ Périmètre géographique limité à ES + PT dans un premier temps

---

*Document généré par NoteFlow — 2026-03-08*
