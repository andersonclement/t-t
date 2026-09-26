# Cours signés OnBuch+ — Chimie Terminale C, D, E

Cours premium (LaTeX + PDF), une leçon par fichier, conformes au **programme
officiel MINESEC de Chimie de Terminale C, D, E** (3 modules, 50 h).

Les trois séries ont le même programme : le contenu est identique, seuls le
niveau affiché (page de garde, en-tête) change.

## Leçons

| # | Leçon | Module |
|---|---|---|
| L01 | Propriétés chimiques des alcools | 1 · Chimie organique |
| L02 | Les acides carboxyliques et leurs dérivés | 1 · Chimie organique |
| L03 | Les amines | 1 · Chimie organique |
| L04 | Les acides α-aminés et la synthèse des peptides | 1 · Chimie organique |
| L05 | Stéréochimie : isomérie et représentation des molécules | 1 · Chimie organique |
| L06 | Acides et bases en solution aqueuse : eau, autoprotolyse et pH | 2 · Acides et bases |
| L07 | Acides forts et bases fortes | 2 · Acides et bases |
| L08 | Acides faibles, bases faibles et couples acide/base | 2 · Acides et bases |
| L09 | Réactions acide/base et dosages | 2 · Acides et bases |
| L10 | Les solutions tampons | 2 · Acides et bases |
| L11 | Cinétique chimique | 3 · Cinétique chimique |

Sortie : `cours/Tle-C/`, `cours/Tle-D/`, `cours/Tle-E/`, un dossier par leçon
contenant le `.tex` autonome et le `.pdf`.

Chaque cours contient : page de garde, sommaire, objectifs, prérequis, le
cours complet (définitions, propriétés, méthodes, expériences, schémas TikZ,
formules chemfig, courbes pgfplots, exemples chiffrés, pièges, « le
savais-tu ? »), travaux pratiques, méthodes et exercices résolus, exercices
en trois niveaux, corrigés détaillés, fiche bilan avec carte mentale, et la
signature OnBuch+ en bas de la page de garde et de la dernière page.

## Structure

- `preamble.tex` — préambule « Pop » OnBuch+ enrichi (boîtes pédagogiques,
  chimie, graphes, page de garde, signature).
- `fonts/` — Archivo Black, Plus Jakarta Sans, Space Grotesk (OFL, Google Fonts).
- `pipeline/lessons.json` — découpage du programme officiel en leçons
  (savoirs et savoir-faire repris du programme).
- `pipeline/generate.py` — génération par LLM (NVIDIA API) : plan → rédaction
  section par section → relecture scientifique par un second modèle →
  compilation de chaque bloc avec correction automatique des erreurs.
  Intermédiaires mis en cache dans `build/` (non versionné).
- `pipeline/build.py` — assemblage par série et compilation des PDF.

## Régénérer

```bash
export NVIDIA_API_KEYS=cle1,cle2   # ne jamais committer les clés
export TECTONIC=/chemin/vers/tectonic
python3 pipeline/generate.py          # toutes les leçons (ou: L03 L07)
python3 pipeline/build.py             # .tex + .pdf pour Tle C, D, E
```

Modèles par défaut : rédaction `moonshotai/kimi-k3`, relecture et corrections LaTeX `nvidia/nemotron-3-ultra-550b-a55b`
(modifiables via `WRITER_MODELS` / `REVIEW_MODELS`).

Pour recompiler un cours à la main : `cd cours/Tle-C/L01-… && tectonic L01-….tex`.
