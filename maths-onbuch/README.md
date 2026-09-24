# Cours signés OnBuch+ — Mathématiques Terminale A, C, D, E, TI

Cours premium (LaTeX + PDF), une leçon par fichier, conformes au **programme
officiel MINESEC de Mathématiques de Terminale A, C-E, D et TI**.

## Mutualisation entre séries

Beaucoup de leçons ont un contenu **strictement identique** entre plusieurs
séries (par ex. « Nombres complexes : forme algébrique » pour C, D, E, TI).
Chaque leçon n'est donc **rédigée qu'une seule fois** puis dupliquée pour
toutes les séries concernées (seule la page de garde et l'en-tête changent) —
exactement comme pour la chimie Tle C/D/E.

Quand une série ajoute un peu de contenu au socle commun (ex. la série C-E
ajoute « logarithme de base a » à la leçon commune sur le logarithme népérien),
ce supplément est rédigé une seule fois comme une courte section « extra » et
n'est inséré que dans les séries concernées, sans regénérer toute la leçon.

Voir `pipeline/lessons.json` : chaque leçon a un champ `series` (les séries
qui la reçoivent telle quelle) et, le cas échéant, un champ `extra` (liste de
compléments, chacun avec sa propre liste `series`).

La série A a un programme entièrement distinct (niveau Première) : ses 10
leçons ne sont jamais mutualisées avec les autres séries.

**Bilan** : 30 leçons de base + 8 compléments → 74 cours PDF (leçon × série),
au lieu des ~110+ qu'aurait exigé une génération naïve série par série.

## Structure

Identique à `chimie-onbuch/` : `preamble.tex` (variante sans mhchem/chemfig),
`fonts/`, `pipeline/lessons.json`, `pipeline/generate.py`, `pipeline/build.py`.

Chaque cours contient : page de garde, sommaire, objectifs/prérequis, cours
illustré (définitions, théorèmes avec ou sans démonstration, méthodes,
exemples chiffrés, schémas TikZ, courbes pgfplots), activité d'intégration,
méthodes + exercices résolus, exercices en 3 niveaux, corrigés détaillés,
fiche bilan, signature OnBuch+.

## Régénérer

```bash
export NVIDIA_API_KEYS=cle1,cle2   # ne jamais committer les clés
export TECTONIC=/chemin/vers/tectonic
python3 pipeline/generate.py          # toutes les leçons (ou: M04 M15 MA01)
python3 pipeline/build.py             # .tex + .pdf pour toutes les séries concernées
```
