#!/usr/bin/env python3
"""Pipeline de génération des cours signés OnBuch+ (Mathématiques, Terminale
A, C, D, E, TI).

Beaucoup de leçons ont un contenu identique entre plusieurs séries : chaque
leçon n'est donc rédigée QU'UNE SEULE FOIS (champ "series" de lessons.json)
et réutilisée telle quelle pour toutes les séries listées — build.py se
charge de dupliquer uniquement la mise en page (page de garde, en-tête).
Quand une série ajoute un peu de contenu au socle commun, ce supplément est
une section "extra" générée à part (rapide) et insérée uniquement dans les
séries concernées, sans regénérer toute la leçon (champ "extra").

Étapes par leçon (chaque étape est mise en cache dans build/<id>/, un nouvel
appel reprend là où il s'était arrêté) :

  1. plan.json        — plan détaillé calé sur le programme officiel
  2. sNN.tex          — rédaction de chaque section (modèle « rédacteur »)
  3. sNN.rev.tex      — relecture scientifique + pédagogique (modèle « relecteur »)
  4. compilation      — chaque bloc est compilé seul ; en cas d'erreur, le log
                        est renvoyé au modèle qui corrige (plusieurs essais)
  5. parties annexes  — activité d'intégration, méthodes & exercices résolus,
                        exercices, corrigés, fiche bilan
  6. extra_<id>       — sections complémentaires propres à certaines séries

Le contenu final est assemblé par build.py.

Clés : variable d'environnement NVIDIA_API_KEYS (séparées par des virgules).
Ne jamais les committer.
"""
import concurrent.futures as cf
import itertools
import json
import os
import random
import re
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
PREAMBLE = ROOT / "preamble.tex"
FONTS = ROOT / "fonts"
TECTONIC = os.environ.get("TECTONIC", "tectonic")
API = "https://integrate.api.nvidia.com/v1/chat/completions"

KEYS = [k.strip() for k in os.environ.get("NVIDIA_API_KEYS", "").split(",") if k.strip()]
WRITER_MODELS = os.environ.get("WRITER_MODELS", "moonshotai/kimi-k3,nvidia/nemotron-3-ultra-550b-a55b").split(",")
REVIEW_MODELS = os.environ.get("REVIEW_MODELS", "nvidia/nemotron-3-ultra-550b-a55b,moonshotai/kimi-k3").split(",")
_key_cycle = itertools.cycle(range(max(1, len(KEYS))))
_lock = threading.Lock()
# Une file par modèle : les longues rédactions Kimi ne bloquent plus les
# relectures (et inversement).
_slots_per_model = {}


def _slots(model):
    with _lock:
        if model not in _slots_per_model:
            n = int(os.environ.get("MAX_CONCURRENT", "12"))
            _slots_per_model[model] = threading.BoundedSemaphore(n)
        return _slots_per_model[model]


def _busy(model):
    sem = _slots(model)
    return sem._value == 0  # noqa: SLF001


def log(*a):
    with _lock:
        print(time.strftime("%H:%M:%S"), *a, flush=True)


# ---------------------------------------------------------------------------
# LLM
# ---------------------------------------------------------------------------
def _call(model, key, messages, max_tokens, temperature):
    """Appel en streaming (évite les coupures sur les longues générations)."""
    body = {"model": model, "messages": messages, "max_tokens": max_tokens,
            "temperature": temperature, "top_p": 0.95, "stream": True}
    r = requests.post(API, json=body, stream=True, timeout=(30, 600),
                      headers={"Authorization": f"Bearer {key}", "Accept": "text/event-stream"})
    if r.status_code == 429:
        raise RateLimited()
    if r.status_code != 200:
        raise RuntimeError(f"HTTP {r.status_code}: {r.text[:300]}")
    r.encoding = "utf-8"  # le flux SSE n'annonce pas de charset (sinon décodé en latin-1)
    out, finish = [], None
    for line in r.iter_lines(decode_unicode=True):
        if not line or not line.startswith("data:"):
            continue
        data = line[5:].strip()
        if data == "[DONE]":
            break
        try:
            ch = json.loads(data)["choices"][0]
        except (KeyError, IndexError, json.JSONDecodeError):
            continue
        delta = ch.get("delta") or {}
        if delta.get("content"):
            out.append(delta["content"])
        finish = ch.get("finish_reason") or finish
    text = "".join(out)
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.S).strip()
    if not text:
        raise RuntimeError("réponse vide")
    return text, finish


class RateLimited(Exception):
    pass


def llm(messages, models, max_tokens=16000, temperature=0.6, tries=6):
    last = None
    attempt, waits = 0, 0
    while attempt < tries:
        # Modèle principal d'abord ; les modèles de repli prennent le relais
        # après des erreurs répétées ou lorsque le quota (429) sature.
        idx = attempt if attempt >= 2 else 0
        idx += waits // 3
        model = models[idx % len(models)]
        # Si le modèle principal est saturé, on bascule sur le suivant plutôt
        # que d'attendre (les deux modèles rédigent et relisent bien).
        if attempt == 0 and _busy(model) and len(models) > 1 and not _busy(models[(idx + 1) % len(models)]):
            model = models[(idx + 1) % len(models)]
        with _lock:
            key = KEYS[next(_key_cycle)]
        try:
            t0 = time.time()
            with _slots(model):
                text, finish = _call(model, key, messages, max_tokens, temperature)
            log(f"    ↳ {model} {len(text)} car. en {time.time()-t0:.0f}s ({finish})")
            if finish == "length":
                # Sortie tronquée : on demande la suite une fois.
                cont = messages + [{"role": "assistant", "content": text},
                                   {"role": "user", "content": "Continue EXACTEMENT là où tu t'es arrêté, sans rien répéter, sans commentaire."}]
                with _slots(model):
                    more, _ = _call(model, key, cont, max_tokens, temperature)
                text += more
            return text
        except RateLimited:
            # Quota momentanément dépassé : on attend sans consommer d'essai.
            waits += 1
            if waits % 10 == 1:
                log(f"    … 429 sur {model} (attente n°{waits})")
            if waits > 300:
                raise RuntimeError("429 persistants")
            time.sleep(random.uniform(10, 30))
        except Exception as e:  # noqa: BLE001
            last = e
            log(f"    ! {model}: {e} — nouvel essai")
            time.sleep(min(60, 5 * 2 ** attempt))
            attempt += 1
    raise RuntimeError(f"échec LLM : {last}")


# ---------------------------------------------------------------------------
# Contrat LaTeX transmis aux modèles
# ---------------------------------------------------------------------------
SYSTEM = r"""Tu es un professeur agrégé de mathématiques, auteur de manuels de référence pour les lycées du Cameroun, et concepteur de cours numériques PREMIUM pour l'application OnBuch+. Tes cours sont réputés être les plus clairs, les plus complets et les plus rigoureux : chaque notion est introduite par une intuition ou une situation concrète, démontrée ou justifiée proprement, illustrée par des exemples chiffrés et des figures, puis consolidée par des exercices résolus et des mises en garde sur les erreurs fréquentes. Tu respectes strictement le programme officiel MINESEC de Terminale (approche par les compétences : familles de situations, savoirs, savoir-faire, savoir-être), pour la série précisée dans la consigne. Tu écris en français mathématique impeccable, rigoureux mais accessible, au niveau d'un élève de Terminale qui prépare le Baccalauréat, avec un ton chaleureux et motivant (tutoiement autorisé avec parcimonie). Tu utilises des exemples du contexte camerounais quand c'est pertinent et naturel (transport, agriculture, télécommunications MTN/Orange, commerce, examens, CAMTEL, électrification rurale, cartographie, etc.) sans jamais sacrifier la rigueur mathématique.

Tu produis UNIQUEMENT du code LaTeX (corps de document, compilé avec XeLaTeX), sans aucune explication autour, sans balises Markdown ``` .

CONTRAT LaTeX (obligatoire) :
- Interdit : \documentclass, \usepackage, \begin{document}, \end{document}, \section, \subsection, \chapter, \includegraphics, \begin{figure}, \begin{table}, \input, \newcommand, \def, \label/\ref, Markdown (**gras**, # titres), \verb, emojis.
- Titres : \coursec{Titre de section} (niveau 1, numéroté automatiquement) et \courssub{Sous-titre} (niveau 2, numéroté automatiquement). Pour un titre de niveau 3 : \textbf{...}\par. Ne numérote JAMAIS les titres toi-même.
- Boîtes pédagogiques (titre optionnel entre crochets) :
  \begin{definition}[Titre]...\end{definition}
  \begin{propriete}[Titre]...\end{propriete}  (théorème, propriété, formule — précise si une démonstration est exigible au Bac)
  \begin{aretenir}[Titre]...\end{aretenir}
  \begin{exemplebox}[Titre]...\end{exemplebox}
  \begin{methode}[Titre]...\end{methode}  (démarche en étapes numérotées)
  \begin{attention}[Titre]...\end{attention}  (erreurs fréquentes, pièges de rédaction, conditions d'application oubliées)
  \begin{experience}[Titre]...\end{experience}  (à utiliser pour une DÉMONSTRATION guidée pas à pas d'un théorème, ou une activité de découverte)
  \begin{savaistu}[Titre]...\end{savaistu}  (culture mathématique, histoire des maths, applications réelles, Cameroun)
  \begin{exoresolu}[Titre]Énoncé ... \tcblower Solution détaillée ...\end{exoresolu}
  \begin{exercice}[Titre]...\end{exercice}
  \begin{corrige}[Exercice n]...\end{corrige}
  Ne jamais imbriquer une boîte dans une autre boîte.
- Mot-clé mis en valeur : \cle{mot}. Gras : \textbf{}. Italique : \emph{}.
- Mathématiques : $...$ pour les formules en ligne, \[ ... \] pour les formules centrées isolées, \begin{align*} ... \end{align*} pour des calculs alignés sur plusieurs lignes (utilise \\ et & pour aligner sur le signe =). Ensembles usuels : \mathbb{R}, \mathbb{N}, \mathbb{Z}, \mathbb{C}. Matrices : \begin{pmatrix} a & b \\ c & d \end{pmatrix}. Système d'équations : \begin{cases} ... \end{cases}. Vecteurs : \vec{u} ou \overrightarrow{AB}. N'utilise JAMAIS de packages non chargés (pas de \mathbbm, pas de \dfrac en dehors d'amsmath qui est déjà chargé — \dfrac fonctionne).
- Grandeurs et unités si besoin : \SI{0,10}{km} ; nombres décimaux avec virgule (\num{1,25} ou simplement 1,25 en dehors de siunitx).
- TABLEAU DE VARIATIONS : une colonne par valeur remarquable ET une colonne entre deux valeurs (pour le signe et la flèche). Les TROIS lignes ont EXACTEMENT le même nombre de cases, égal au nombre de colonnes déclarées. Modèle pour x allant de a à b avec un extremum en c :
  \begin{tabular}{|c|ccccc|}\hline $x$ & $a$ & & $c$ & & $b$ \\ \hline $f'(x)$ & & $-$ & $0$ & $+$ & \\ \hline $f$ & $f(a)$ & $\searrow$ & $f(c)$ & $\nearrow$ & $f(b)$ \\ \hline\end{tabular}
  Les signes vont dans la ligne de f', les flèches UNIQUEMENT dans la ligne de f. Valeur interdite : dédoubler sa colonne et séparer par || dans la déclaration (ex. |c|ccc||ccc|).
- Tableaux : \begin{center}\begin{tabularx}{\linewidth}{|l|X|X|}\hline ... \end{tabularx}\end{center} ou tabular + booktabs. En-têtes colorés possibles : \rowcolor{popblueL}. Un tableau de signes ou de variations se fait avec \begin{tabular}{|c|ccccc|} ... (flèches \nearrow \searrow autorisées, ou décris simplement croissant/décroissant si le rendu est plus sûr).
- Illustrations : place chaque figure dans \begin{popfigure} ... \legende{Légende}\end{popfigure}. Utilise TikZ (schémas géométriques, arbres de probabilité, graphes orientés/non orientés, cartes mentales) et pgfplots (courbes de fonctions, nuages de points, diagrammes). Couleurs autorisées : popink, poporange, popdark, poppurple, popgreen, popblue, poppink, popgold, popmuted, popline, popcream, et leurs teintes popblueL, poporangeL, popgreenL, poppurpleL, poppinkL, popgoldL (ou mélanges comme popblue!30). Style de courbe prêt à l'emploi : \addplot[popcurve,domain=-3:3,samples=200]{...};. Largeur max des figures : \linewidth. Garde le code TikZ simple, correct et compilable (bibliothèques disponibles : arrows.meta, positioning, calc, shapes.geometric, decorations.pathmorphing, patterns, mindmap, trees, fit, backgrounds, matrix, intersections).
- DANS TOUT CODE TikZ / pgfplots (coordonnées, options, domain, xtick, dimensions), les nombres décimaux s'écrivent avec un POINT : (7.389,2), xtick={1,2.718}, 0.55cm, domain=-1.5:1.5. La virgule y sépare les valeurs ; la virgule décimale française est réservée au texte et aux formules.
- Listes : itemize / enumerate classiques.
- Le symbole % doit être échappé \% ; les caractères & _ # doivent être échappés hors des environnements qui les attendent (donc PAS dans $...$, \[...\], pmatrix, cases, tabular).
"""


def strip_fences(t):
    t = re.sub(r"^```[a-zA-Z]*\s*\n", "", t.strip())
    t = re.sub(r"\n```\s*$", "", t)
    t = t.replace("```latex", "").replace("```", "")
    return t.strip()


def sanitize(t):
    # Réponse du type « Voici ... ```latex ... ``` » : on garde le plus long bloc de code.
    blocks = re.findall(r"```[a-zA-Z]*\s*\n(.*?)```", t, flags=re.S)
    if blocks:
        t = max(blocks, key=len)
    m = re.search(r"\\begin\{document\}(.*?)(\\end\{document\}|$)", t, flags=re.S)
    if m:
        t = m.group(1)
    t = strip_fences(t)
    for pat in [r"\\documentclass.*?\n", r"\\usepackage.*?\n", r"\\begin\{document\}", r"\\end\{document\}"]:
        t = re.sub(pat, "", t)
    t = re.sub(r"\\(sub)*section\*?\{", r"\\courssub{", t)
    return t.strip()


# ---------------------------------------------------------------------------
# Compilation d'essai
# ---------------------------------------------------------------------------
HEADER = r"""\newcommand{\DOCMATIERE}{Mathématiques}\newcommand{\DOCNIVEAU}{Tle C}\newcommand{\DOCMODULE}{Test}\newcommand{\DOCLECON}{00}\newcommand{\DOCTITRE}{Test}
\input{preamble.tex}
\begin{document}
"""


def autofix(body):
    """Corrections mécaniques sûres, appliquées avant compilation (sans modèle).
    - virgule décimale dans une dimension TikZ : 0,55cm -> 0.55cm, aspect=2,6 -> 2.6
    - coordonnée calculée non protégée dans un \\foreach : (\\x,\\y) déjà sûr, rien à faire
    """
    body = re.sub(r"((?:=|\band)\s*-?)(\d+),(\d+)\s*(cm|mm|pt|em|ex)\b", r"\1\2.\3\4", body)
    body = re.sub(r"\b(aspect|scale|xscale|yscale|opacity|line width|inner sep|outer sep|minimum size|minimum width|minimum height|text width|samples|domain|xmin|xmax|ymin|ymax)\s*=\s*(-?\d+),(\d+)",
                  r"\1=\2.\3", body)
    # domain=-1,45:1,45 -> domain=-1.45:1.45
    body = re.sub(r"domain\s*=\s*(-?\d+(?:[.,]\d+)?)\s*:\s*(-?\d+(?:[.,]\d+)?)",
                  lambda m: f"domain={m.group(1).replace(',', '.')}:{m.group(2).replace(',', '.')}", body)
    # 0,9\linewidth -> 0.9\linewidth
    body = re.sub(r"(?<![\w.])(\d+),(\d+)\s*\\(linewidth|textwidth)", r"\1.\2\\\3", body)
    # at={(0,02,0,98)} (2D écrit à la française : 3 virgules) -> (0.02,0.98)
    body = re.sub(r"\((-?\d+),(\d+),(-?\d+),(\d+)\)", r"(\1.\2,\3.\4)", body)
    # Titre de boîte contenant [ ou ] (intervalles ]a;b[) : on le protège par
    # des accolades, sinon l'argument optionnel [..] est coupé.
    def _protect(m):
        title = m.group(2)
        if ("[" in title or "]" in title) and not (title.startswith("{") and title.endswith("}")):
            return f"\\begin{{{m.group(1)}}}[{{{title}}}]"
        return m.group(0)
    body = re.sub(r"\\begin\{(definition|propriete|aretenir|exemplebox|methode|attention|experience|savaistu|exoresolu|exercice|corrige)\}\[(.*)\][ \t]*$",
                  _protect, body, flags=re.M)
    # Titres numérotés à la main (\\courssub{2.3 Titre}) : la numérotation est
    # automatique, on retire le numéro tapé par le modèle.
    body = re.sub(r"\\(coursec|courssub)\{\s*\d+(?:\.\d+)*\s*[.)\-–:]?\s+", r"\\\1{", body)
    body = _tabularx_sans_x(body)
    # \tcblower est un séparateur, pas un environnement
    body = body.replace("\\begin{tcblower}", "\\tcblower").replace("\\end{tcblower}", "")
    # \node[...]{texte avec \\} sans align= : TikZ refuse le saut de ligne
    body = _node_align(body)
    # Fautes de frappe sur \begin : \begin{savaistu][Titre] ou \begin{tabularx{\linewidth}
    body = re.sub(r"\\begin\{([a-zA-Z*]+)\]\[", r"\\begin{\1}[", body)
    body = re.sub(r"\\begin\{(tabularx|tabular|array|minipage)\{", r"\\begin{\1}{", body)
    # calc TikZ : le coefficient précède le point, ($(U)*0.55$) -> ($0.55*(U)$)
    body = re.sub(r"\(\$\s*\(([^()$]+)\)\s*\*\s*(-?[\d.]+)\s*\$\)", r"($\2*(\1)$)", body)
    # label=above right:$L(1,2,5)$ : les virgules de l'étiquette coupent les options
    body = re.sub(r"(?<![{\w])label=([a-z ]+:\$[^$]*,[^$]*\$)", r"label={\1}", body)
    # Indice/exposant fait d'une commande à argument : x_\mathcal{P} -> x_{\mathcal{P}}
    body = re.sub(r"([_^])\\(math[a-z]+|text|operatorname)\{([^{}]*)\}", r"\1{\\\2{\3}}", body)
    body = _align_close(body)
    body = _fill_const(body)
    body = _safe_sqrt(body)
    body = _close_lists(body)
    # Libellés de graduations : $0,05$ dans une liste {…} coupe à la virgule -> $0{,}05$
    body = re.sub(r"((?:x|y)ticklabels\s*=\s*\{)((?:[^{}]|\{[^{}]*\})*)(\})",
                  lambda m: m.group(1) + re.sub(r"\$(-?\d+),(\d+)\$", r"$\1{,}\2$", m.group(2)) + m.group(3), body)
    return body


def _fill_const(body):
    """fill between[of=F and {0}] : pgfplots exige deux chemins nommés. Chaque
    constante {k} devient une droite horizontale invisible y = k, nommée et
    tracée sur le domaine du soft clip."""
    counter = [0]

    def fix(m):
        indent, opts, a, b, rest = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)
        dom = re.search(r"domain\s*=\s*([-\d.]+\s*:\s*[-\d.]+)", rest)
        dom = f", domain={dom.group(1)}" if dom else ""
        pre, names = [], []
        for side in (a, b):
            c = re.fullmatch(r"\{\s*(-?[\d.]+)\s*\}", side.strip())
            if c:
                counter[0] += 1
                name = f"hconst{counter[0]}"
                pre.append(f"{indent}\\addplot[draw=none, forget plot, name path={name}{dom}] {{{c.group(1)}}};\n")
                names.append(name)
            else:
                names.append(side.strip())
        return "".join(pre) + f"{indent}\\addplot[{opts}] fill between[of={names[0]} and {names[1]}{rest}"
    return re.sub(r"(?m)^([ \t]*)\\addplot\[([^\]]*)\]\s*fill between\[of=\s*(\{[^{}]*\}|[\w-]+)\s+and\s+(\{[^{}]*\}|[\w-]+)(.*)$", fix, body)


def _align_close(body):
    """\\begin{align*} refermé par \\] au lieu de \\end{align*} (erreur fréquente)."""
    def fix(m):
        inner = m.group(2)
        if "\\end{" + m.group(1) + "}" in inner or "\\[" in inner:
            return m.group(0)
        return "\\begin{" + m.group(1) + "}" + inner + "\\end{" + m.group(1) + "}"
    return re.sub(r"\\begin\{(align\*?)\}(.*?)\\\]", fix, body, flags=re.S)


def _safe_sqrt(body):
    """Dans les tracés TikZ/pgfplots, sqrt(x) avec x négatif par arrondi aux
    bornes (ellipses, hyperboles) fait échouer la compilation : on protège
    par sqrt(max(0, x)), sans effet là où x est positif. Hors tracés (texte,
    formules LaTeX), rien n'est modifié."""
    lines = body.split("\n")
    for i, l in enumerate(lines):
        if "sqrt(" not in l or not re.search(r"plot|\\addplot|domain|declare function|\\draw", l):
            continue
        out, k = [], 0
        while True:
            j = l.find("sqrt(", k)
            if j < 0:
                out.append(l[k:])
                break
            start = j + len("sqrt(")
            depth, e = 1, start
            while e < len(l) and depth:
                depth += (l[e] == "(") - (l[e] == ")")
                e += 1
            inner = l[start:e - 1]
            out.append(l[k:start])
            out.append(inner if inner.startswith("max(0,") else f"max(0,{inner})")
            out.append(")")
            k = e
        lines[i] = "".join(out)
    return "\n".join(lines)


_ENV_RE = re.compile(r"\\(begin|end)\{([^}]+)\}")


def _close_lists(body):
    """Ferme les listes (enumerate/itemize) oubliées : si un environnement se
    ferme alors qu'une liste ouverte à l'intérieur ne l'est pas, on insère les
    \\end{...} manquants juste avant."""
    out, last, stack = [], 0, []
    for m in _ENV_RE.finditer(body):
        kind, env = m.group(1), m.group(2)
        if kind == "begin":
            stack.append(env)
            continue
        if env in stack and stack[-1] != env:
            # listes ouvertes au-dessus de l'environnement qui se ferme
            missing = []
            while stack and stack[-1] != env and stack[-1] in ("enumerate", "itemize"):
                missing.append(stack.pop())
            if stack and stack[-1] == env:
                out.append(body[last:m.start()])
                out.append("".join(f"\\end{{{e}}}\n" for e in missing))
                last = m.start()
            else:
                stack.extend(reversed(missing))
        if stack and stack[-1] == env:
            stack.pop()
    out.append(body[last:])
    return "".join(out)


_NODE_RE = re.compile(r"\\node\[([^\]]*)\]([^{;\n]*\{)")


def _node_align(body):
    out, last = [], 0
    for m in _NODE_RE.finditer(body):
        # contenu du nœud : de l'accolade ouvrante à sa fermante appariée
        start = m.end() - 1
        depth, j = 0, start
        while j < len(body):
            if body[j] == "{":
                depth += 1
            elif body[j] == "}":
                depth -= 1
                if depth == 0:
                    break
            j += 1
        text, opts = body[start:j + 1], m.group(1)
        if "\\\\" in text and "align" not in opts and "text width" not in opts:
            out.append(body[last:m.start()])
            out.append("\\node[" + (opts + ", " if opts.strip() else "") + "align=center]" + m.group(2))
            last = m.end()
    out.append(body[last:])
    return "".join(out)



def _tabularx_sans_x(body):
    """Met en cohérence tabular / tabularx (fin appariée par une pile) :
    - tabularx sans colonne X -> tabular (sinon bande vide à droite) ;
    - tabular avec des colonnes X -> tabularx{\\linewidth} (sinon erreur)."""
    tok = re.compile(r"\\begin\{(tabularx?)\}(\{[^{}]*\})?\{((?:[^{}]|\{[^{}]*\})*)\}|\\end\{(tabularx?)\}")
    out, last, stack = [], 0, []
    for m in tok.finditer(body):
        out.append(body[last:m.start()])
        if m.group(0).startswith("\\begin"):
            env, width, spec = m.group(1), m.group(2), m.group(3)
            if env == "tabularx" and not width:
                # \\begin{tabularx}{spec} sans largeur : le 1er groupe était la spec
                env_out = m.group(0)
                target = "tabularx"
            else:
                has_x = any(c in spec for c in "XCLR")
                target = "tabularx" if has_x else "tabular"
                if target == "tabularx":
                    w = width[1:-1] if width else "\\linewidth"
                    env_out = "\\begin{tabularx}{" + w + "}{" + spec + "}"
                else:
                    env_out = f"\\begin{{tabular}}{{{spec}}}"
            stack.append(target)
            out.append(env_out)
        else:
            target = stack.pop() if stack else m.group(4)
            out.append(f"\\end{{{target}}}")
        last = m.end()
    out.append(body[last:])
    return "".join(out)

def compile_check(body):
    """Compile le bloc seul. Renvoie (ok, extrait_du_log, ligne_fautive_ou_None)."""
    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        (d / "preamble.tex").write_text(PREAMBLE.read_text())
        (d / "fonts").symlink_to(FONTS)
        (d / "t.tex").write_text(HEADER + body + "\n\\end{document}\n")
        try:
            p = subprocess.run([TECTONIC, "--keep-logs", "-c", "minimal", "t.tex"], cwd=d,
                               capture_output=True, text=True, timeout=400)
        except subprocess.TimeoutExpired:
            return False, "Compilation interrompue (délai dépassé) : boucle infinie probable dans le code TikZ/pgfplots.", None
        ok = p.returncode == 0 and (d / "t.pdf").exists()
        out = p.stdout + p.stderr
        logf = d / "t.log"
        line = None
        if not ok and logf.exists():
            lines = logf.read_text(errors="ignore").splitlines()
            errs = []
            for i, l in enumerate(lines):
                if l.startswith("!"):
                    errs.append("\n".join(lines[i:i + 6]))
                    if line is None:
                        for l2 in lines[i:i + 40]:
                            m = re.match(r"l\.(\d+)", l2)
                            if m:
                                line = int(m.group(1)) - HEADER.count("\n")
                                break
            out = "\n---\n".join(errs[:4]) or out
        out = re.sub(r"t\.tex:(\d+)", lambda m: f"ligne {int(m.group(1)) - HEADER.count(chr(10))}", out)
        if line is not None and not (1 <= line <= len(body.splitlines())):
            line = None
        return ok, out[-3000:], line


BLOCK_ENVS = ("popfigure", "tikzpicture", "tabularx", "tabular", "align*", "align", "center", "itemize", "enumerate",
              "cases", "pmatrix", "bmatrix", "definition", "propriete", "aretenir", "exemplebox", "methode",
              "attention", "experience", "savaistu", "exoresolu", "exercice", "corrige", "objectifs", "prerequis", "bilan")


def fault_span(lines, n):
    """Plage [a, b) du fragment à corriger autour de la ligne n (1-indexée) :
    le plus petit environnement « bloc » qui la contient (une figure entière de
    préférence), sinon le paragraphe."""
    i = n - 1
    best = None
    for a in range(i, -1, -1):
        m = re.search(r"\\begin\{([^}]+)\}", lines[a])
        if not m or m.group(1) not in BLOCK_ENVS:
            continue
        env = m.group(1)
        depth = 0
        for b in range(a, len(lines)):
            depth += lines[b].count("\\begin{" + env + "}") - lines[b].count("\\end{" + env + "}")
            if depth <= 0:
                break
        if b >= i:
            best = (a, b + 1)
            if env in ("popfigure",) or b - a > 25:
                break
            if env != "tikzpicture":
                break
    if best and best[1] - best[0] <= 220:
        return best
    a = i
    while a > 0 and lines[a - 1].strip() and i - a < 15:
        a -= 1
    b = i + 1
    while b < len(lines) and lines[b].strip() and b - i < 15:
        b += 1
    return a, b


def compile_fix(body, what, tries=6):
    for k in range(tries):
        ok, err, line = compile_check(body)
        if ok:
            return body, True
        log(f"  ✗ compilation {what} (essai {k+1}) : {err.strip().splitlines()[0] if err.strip() else '?'}")
        lines = body.splitlines()
        if line is not None and k < tries - 1:
            a, b = fault_span(lines, line)
            frag = "\n".join(lines[a:b])
            fixed = sanitize(llm([
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": f"Le fragment LaTeX ci-dessous (extrait d'un cours plus long) provoque cette erreur de compilation XeLaTeX (l'erreur est signalée vers sa ligne {line - a}) :\n{err}\n\nFRAGMENT :\n{frag}\n\n"
                 "Renvoie UNIQUEMENT le fragment corrigé, complet, prêt à remplacer l'original (même début, même fin, mêmes environnements ouverts/fermés), en conservant tout le contenu. "
                 "Corrige la cause réelle de l'erreur (syntaxe mathématique, TikZ/pgfplots, tableau). Si une figure est trop complexe, simplifie-la en gardant son intention."}],
                REVIEW_MODELS, max_tokens=12000, temperature=0.2))
            if fixed.strip():
                body = "\n".join(lines[:a] + fixed.splitlines() + lines[b:])
            continue
        numbered = "\n".join(f"{n+1:4d}| {l}" for n, l in enumerate(lines))
        body = sanitize(llm([
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": f"Ce code LaTeX ne compile pas avec XeLaTeX. Erreurs :\n{err}\n\nCode (numéroté pour référence) :\n{numbered}\n\n"
             "Renvoie le code COMPLET corrigé (sans les numéros de ligne), en conservant intégralement le contenu pédagogique. "
             "Corrige la cause de l'erreur ; si une figure TikZ est trop complexe, simplifie-la en gardant son intention. Réponds uniquement avec le LaTeX."}],
            REVIEW_MODELS, max_tokens=24000, temperature=0.2))
    ok, _, _ = compile_check(body)
    return body, ok


# ---------------------------------------------------------------------------
# Étapes
# ---------------------------------------------------------------------------
SERIES_NOMS = {"A": "Tle A", "C": "Tle C", "D": "Tle D", "E": "Tle E", "TI": "Tle TI"}


def duree_repr(duree):
    if isinstance(duree, dict):
        return " ; ".join(f"{SERIES_NOMS.get(s, s)} : {h}" for s, h in duree.items())
    return duree


def lesson_brief(L):
    series = ", ".join(SERIES_NOMS.get(s, s) for s in L["series"])
    return (f"SÉRIE(S) : {series} (contenu strictement identique pour ces séries)\nLEÇON {L['id']} : {L['titre']}\n"
            f"{L['module']} — durée indicative : {duree_repr(L['duree'])}\n"
            f"Famille de situations : {L['famille']}\n\nSAVOIRS (programme officiel) :\n- " + "\n- ".join(L["savoirs"]) +
            "\n\nSAVOIR-FAIRE (programme officiel) :\n- " + "\n- ".join(L["savoir_faire"]))


def step_plan(L, d):
    f = d / "plan.json"
    if f.exists():
        return json.loads(f.read_text())
    log(f"[{L['id']}] plan")
    prompt = lesson_brief(L) + r"""

Conçois le PLAN DÉTAILLÉ du cours premium correspondant. Il doit couvrir TOUS les savoirs et TOUS les savoir-faire ci-dessus, dans un ordre progressif et logique, sans hors-programme inutile (tu peux ajouter de brefs compléments utiles au Bac, signalés comme tels). Les théorèmes importants doivent être démontrés ou leur démonstration guidée quand c'est exigible ou formateur ; sinon, admets-les clairement en le signalant.

Réponds UNIQUEMENT avec un objet JSON valide (pas de Markdown) :
{
 "accroche": "situation-problème d'introduction ancrée dans le quotidien camerounais (3-5 phrases)",
 "description": "2 phrases présentant la leçon pour la page de garde",
 "objectifs": ["À la fin de cette leçon, je sais ...", "... (6 à 9 objectifs formulés en savoir-faire)"],
 "prerequis": ["notion de Première ou de début d'année utile", "... (3 à 5)"],
 "sections": [
   {"titre": "titre court de la section", "contenu": ["point précis à traiter", "..."], "illustrations": ["figure TikZ/pgfplots à produire", "..."], "boites": ["définition de ...", "propriété/théorème (avec ou sans démonstration) ...", "méthode pour ...", "attention : erreur fréquente ...", "exemple chiffré ...", "le savais-tu : ..."]}
 ],
 "activite": {"titre": "titre de l'activité d'intégration", "objectif": "...", "idee": "situation-problème authentique mobilisant plusieurs savoir-faire de la leçon, réalisable en classe (calcul, construction, modélisation) — pas une expérience de laboratoire"},
 "exercices_idees": ["idée d'exercice type Bac", "..."]
}
Contraintes : 4 à 7 sections ; chaque section a 4 à 10 points de contenu précis, au moins 1 illustration pertinente quand c'est naturel (graphique, schéma géométrique, arbre), et 3 à 6 boîtes pédagogiques."""
    txt = llm([{"role": "system", "content": "Tu es un inspecteur pédagogique de mathématiques au MINESEC (Cameroun) et concepteur de cours premium. Tu réponds uniquement en JSON valide."},
               {"role": "user", "content": prompt}], WRITER_MODELS, max_tokens=8000, temperature=0.4)
    m = re.search(r"\{.*\}", strip_fences(txt), re.S)
    plan = json.loads(m.group(0))
    f.write_text(json.dumps(plan, ensure_ascii=False, indent=1))
    return plan


def plan_summary(plan):
    return "\n".join(f"{i+1}. {s['titre']}" for i, s in enumerate(plan["sections"]))


def write_block(L, plan, d, name, instruction, what):
    """Rédige → relit → compile un bloc. Cache : name.tex (brut), name.rev.tex, name.ok.tex."""
    ok_f = d / f"{name}.ok.tex"
    if ok_f.exists():
        return ok_f.read_text()
    raw_f, rev_f = d / f"{name}.tex", d / f"{name}.rev.tex"
    ctx = lesson_brief(L) + "\n\nPLAN GÉNÉRAL DE LA LEÇON :\n" + plan_summary(plan)
    if not raw_f.exists():
        log(f"[{L['id']}] rédaction {what}")
        raw = sanitize(llm([{"role": "system", "content": SYSTEM},
                            {"role": "user", "content": ctx + "\n\n" + instruction}], WRITER_MODELS, max_tokens=20000))
        raw_f.write_text(raw)
    raw = raw_f.read_text()
    if not rev_f.exists():
        log(f"[{L['id']}] relecture {what}")
        rev = sanitize(llm([{"role": "system", "content": SYSTEM},
                            {"role": "user", "content": ctx + "\n\nVoici un bloc de cours rédigé par un collègue :\n\n" + raw + r"""

Tu es maintenant RELECTEUR EXPERT. Relis ce bloc avec une exigence maximale et renvoie la VERSION FINALE COMPLÈTE corrigée et améliorée :
1. Exactitude mathématique : vérifie chaque calcul, chaque formule, chaque démonstration (hypothèses, enchaînement logique, conclusion), chaque valeur numérique. Corrige toute erreur, y compris de signe, d'indice ou de condition d'application oubliée.
2. Conformité au programme officiel de Terminale pour la ou les séries indiquées (ni trop, ni trop peu) et vocabulaire du Bac camerounais.
3. Pédagogie : explications pas à pas, transitions, pas de sauts logiques ; complète si une notion du plan est survolée ; garde les illustrations et améliore-les si utile.
4. Conformité stricte au CONTRAT LaTeX (environnements autorisés, syntaxe mathématique standard, pas de boîtes imbriquées, % échappés).
Ne raccourcis pas le contenu : la version finale doit être au moins aussi riche. Réponds uniquement avec le LaTeX final."""}],
                           REVIEW_MODELS, max_tokens=22000, temperature=0.3))
        # garde-fou : une relecture qui ampute le texte est rejetée
        if len(rev) < 0.7 * len(raw):
            log(f"[{L['id']}] relecture {what} trop courte ({len(rev)} < {len(raw)}), version initiale conservée")
            rev = raw
        rev_f.write_text(rev)
    body = autofix(rev_f.read_text())
    ok, err, line = compile_check(body)
    if not ok:
        # Pas de boucle de correction par le modèle : le bloc est signalé
        # (fichier .err) et corrigé à la main, ce qui est bien plus rapide.
        (d / f"{name}.err").write_text(f"ligne {line}\n{err}")
        log(f"  ✗ À CORRIGER {L['id']}/{name} (ligne {line}) : {err.strip().splitlines()[0] if err.strip() else '?'}")
        return None
    (d / f"{name}.err").unlink(missing_ok=True)
    ok_f.write_text(body)
    return body


def step_sections(L, plan, d):
    n = len(plan["sections"])
    jobs = []
    for i, s in enumerate(plan["sections"]):
        prev = plan["sections"][i - 1]["titre"] if i else None
        instr = f"""RÉDIGE INTÉGRALEMENT LA SECTION {i+1}/{n} : « {s['titre']} ».

Contenu à traiter (tout, en profondeur) :
- """ + "\n- ".join(s["contenu"]) + """

Illustrations à produire (TikZ / pgfplots, dans popfigure) :
- """ + "\n- ".join(s.get("illustrations", [])) + """

Boîtes pédagogiques à inclure :
- """ + "\n- ".join(s.get("boites", [])) + f"""

Consignes :
- Commence par \\coursec{{{s['titre']}}} puis organise en \\courssub{{...}}.
- {"Ouvre la section par la situation d'accroche suivante, présentée de façon vivante, puis annonce la problématique : " + plan.get("accroche", "") if i == 0 else "Fais une transition naturelle avec la section précédente (« " + str(prev) + " »)."}
- Explique chaque notion comme le meilleur professeur du monde : intuition d'abord, puis énoncé rigoureux (définition ou théorème), démonstration quand elle est exigible ou formatrice, puis exemple chiffré détaillé, puis piège à éviter.
- Au moins une illustration de qualité quand la notion s'y prête (courbe, figure géométrique, arbre, graphe) et au moins un exemple chiffré ou exercice résolu (exoresolu).
- Longueur visée : 1500 à 2800 mots de contenu (hors code des figures). Ne traite PAS les autres sections du plan."""
        jobs.append((f"s{i+1:02d}", instr, f"section {i+1}/{n}"))
    extra = [(k, EXTRA[k][1](L, plan), k) for k in ("activite", "methodes", "exercices", "bilan")]
    with cf.ThreadPoolExecutor(len(jobs) + len(extra)) as ex:
        futs = [ex.submit(write_block, L, plan, d, *j) for j in jobs + extra]
        res = [f.result() for f in futs]
    return res[:n], dict(zip(("activite", "methodes", "exercices", "bilan"), res[n:]))


EXTRA = {
    "activite": ("Activité d'intégration", lambda L, p: f"""RÉDIGE LA PARTIE « ACTIVITÉ D'INTÉGRATION » de la leçon (le titre de partie \\coursec est déjà posé : commence directement par \\courssub).
Activité proposée : {p['activite'].get('titre','')} — objectif : {p['activite'].get('objectif','')} — idée : {p['activite'].get('idee','')}.
Structure : \\courssub{{Objectifs de l'activité}}, \\courssub{{Situation}} (énoncé complet de la situation-problème authentique, contextualisée, avec toutes les données numériques nécessaires), \\courssub{{Consignes}} (questions guidées, numérotées, qui mobilisent progressivement plusieurs savoir-faire de la leçon), \\courssub{{Ressources à mobiliser}} (rappel bref des formules/théorèmes utiles), \\courssub{{Démarche et corrigé commenté}} (dans une boîte exoresolu : résolution complète, étape par étape, avec les justifications), \\courssub{{Bilan de l'activité}} (ce que l'activité a permis de mettre en évidence).
La situation doit être réaliste, ancrée dans un contexte camerounais si possible, et strictement dans le niveau de la série concernée. 1200 à 2000 mots."""),
    "methodes": ("Méthodes et exercices résolus", lambda L, p: """RÉDIGE LA PARTIE « MÉTHODES ET EXERCICES RÉSOLUS » (le titre \\coursec est déjà posé : commence directement par \\courssub).
Pour chaque savoir-faire du programme de cette leçon, donne une fiche \\begin{methode}[...] (démarche en étapes numérotées, réflexes, formules à retenir), immédiatement suivie d'un \\begin{exoresolu}[...] qui l'applique (énoncé type Bac, puis après \\tcblower une solution TRÈS détaillée : raisonnement, calculs complets, justifications rigoureuses, phrase de conclusion). Termine par une boîte attention « Les 5 erreurs qui coûtent des points au Bac » (erreurs de rédaction, conditions d'application oubliées, erreurs de calcul classiques). Entre 5 et 7 couples méthode/exercice résolu."""),
    "exercices": ("Exercices", lambda L, p: """RÉDIGE LA PARTIE « EXERCICES » (le titre \\coursec est déjà posé ; commence directement par \\courssub).
Trois niveaux, chacun introduit par \\courssub : « Je vérifie mes connaissances » (4 exercices courts : QCM, vrai/faux justifié, définitions, calculs directs), « Je m'entraîne » (4 exercices d'application directe), « Je me prépare au Bac » (3 exercices longs de type Baccalauréat camerounais, contextualisés, avec plusieurs questions numérotées et toutes les données nécessaires).
Chaque exercice dans un environnement \\begin{exercice}[titre court]...\\end{exercice}. NE DONNE PAS les corrections ici. Idées possibles : """ + "; ".join(p.get("exercices_idees", []))),
    "bilan": ("Fiche bilan", lambda L, p: """RÉDIGE LA « FICHE BILAN » de la leçon (le titre \\coursec est déjà posé ; ne mets pas de \\coursec).
Contenu : (1) une carte mentale TikZ lisible de la leçon (nœud central + 5 à 7 branches colorées, texte court, dans popfigure, largeur \\linewidth), (2) un environnement \\begin{bilan} ... \\end{bilan} contenant l'essentiel en listes compactes : définitions clés, théorèmes/formules à connaître par cœur (dans un tabularx si utile), méthodes express, (3) une boîte aretenir « Checklist avant le Bac » avec 8 à 12 cases à cocher ($\\square$ ...)."""),
}


def step_extra(L, plan, d, key):
    title, mk = EXTRA[key]
    return title, write_block(L, plan, d, key, mk(L, plan), key)


def step_corriges(L, plan, d, exercices):
    title = "Corrigés des exercices"
    f_ok = d / "corriges.ok.tex"
    if f_ok.exists():
        return title, f_ok.read_text()
    instr = r"""RÉDIGE LA PARTIE « CORRIGÉS DES EXERCICES » (le titre \coursec est déjà posé ; commence directement). Voici les exercices, numérotés dans l'ordre d'apparition à partir de 1 :

""" + exercices + r"""

Pour CHAQUE exercice, dans l'ordre, un environnement \begin{corrige}[Exercice N — titre] ... \end{corrige} avec une correction complète et rigoureuse : réponses justifiées, calculs détaillés, démonstrations complètes quand demandées, et pour les exercices type Bac un barème indicatif et les « points de vigilance » (justifications attendues, conditions d'application à citer). Vérifie deux fois chaque calcul."""
    return title, write_block(L, plan, d, "corriges", instr, "corrigés")


def step_lesson_extras(L, plan, d):
    """Sections complémentaires propres à certaines séries (champ "extra" de
    lessons.json) : un seul \\coursec par complément, mis en cache à part
    (extra_<id>.ok.tex) et injecté uniquement dans les séries concernées par
    build.py."""
    out = {}
    for ex in L.get("extra", []):
        eid = ex["id"]
        instr = f"""RÉDIGE UNE SECTION COMPLÉMENTAIRE COURTE ET AUTONOME, intitulée « {ex['titre']} ».
Ce complément s'ajoute, pour certaines séries seulement, à la leçon commune « {L['titre']} » que tu connais déjà (voir le plan général ci-dessus) : suppose que le lecteur a déjà lu et compris toute cette leçon commune, et fais une transition brève avec elle.

Savoirs à traiter :
- """ + "\n- ".join(ex["savoirs"]) + """

Savoir-faire à traiter :
- """ + "\n- ".join(ex["savoir_faire"]) + f"""

Consignes :
- Commence par \\coursec{{{ex['titre']}}} puis organise en \\courssub{{...}} si besoin.
- Même niveau d'exigence que le reste du cours : intuition, énoncé rigoureux, exemple chiffré ou exercice résolu, piège à éviter.
- Inclue au moins une boîte pédagogique (définition, propriété, méthode ou exemple) et, si pertinent, une illustration.
- Longueur : 500 à 1000 mots (c'est un complément court, pas une leçon complète)."""
        out[eid] = (ex["titre"], write_block(L, plan, d, f"extra_{eid}", instr, f"extra {eid}"))
    return out


def run_lesson(L):
    d = BUILD / L["id"]
    d.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    plan = step_plan(L, d)
    secs, extra = step_sections(L, plan, d)
    exo = extra["exercices"] if extra["exercices"] is not None else (d / "exercices.rev.tex").read_text()
    _, cor = step_corriges(L, plan, d, exo)
    extras = step_lesson_extras(L, plan, d)
    results = list(secs) + list(extra.values()) + [cor] + [v[1] for v in extras.values()]
    if any(r is None for r in results):
        log(f"[{L['id']}] ⚠ généré, mais {sum(r is None for r in results)} bloc(s) à corriger à la main")
        return
    (d / "DONE").write_text("ok")
    log(f"[{L['id']}] ✔ terminé en {(time.time()-t0)/60:.1f} min")


def main():
    if not KEYS:
        sys.exit("NVIDIA_API_KEYS manquant")
    cat = json.loads((ROOT / "pipeline" / "lessons.json").read_text())
    only = set(sys.argv[1:])
    todo = [L for L in cat["lessons"] if (not only or L["id"] in only)]
    workers = int(os.environ.get("WORKERS", "6"))
    with cf.ThreadPoolExecutor(workers) as ex:
        futs = {ex.submit(run_lesson, L): L["id"] for L in todo}
        for f in cf.as_completed(futs):
            try:
                f.result()
            except Exception as e:  # noqa: BLE001
                log(f"[{futs[f]}] ÉCHEC : {e}")


if __name__ == "__main__":
    main()
