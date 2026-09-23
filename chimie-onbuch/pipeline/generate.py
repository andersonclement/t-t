#!/usr/bin/env python3
"""Pipeline de génération des cours signés OnBuch+ (Chimie, Terminale C/D/E).

Étapes par leçon (chaque étape est mise en cache dans build/<id>/, un nouvel
appel reprend là où il s'était arrêté) :

  1. plan.json        — plan détaillé calé sur le programme officiel
  2. sNN.tex          — rédaction de chaque section (modèle « rédacteur »)
  3. sNN.rev.tex      — relecture scientifique + pédagogique (modèle « relecteur »)
  4. compilation      — chaque bloc est compilé seul ; en cas d'erreur, le log
                        est renvoyé au modèle qui corrige (plusieurs essais)
  5. parties annexes  — travaux pratiques, méthodes & exercices résolus,
                        exercices, corrigés, fiche bilan

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
WRITER_MODELS = os.environ.get("WRITER_MODELS", "moonshotai/kimi-k3,z-ai/glm-5.3").split(",")
REVIEW_MODELS = os.environ.get("REVIEW_MODELS", "z-ai/glm-5.3,moonshotai/kimi-k3").split(",")
_key_cycle = itertools.cycle(range(max(1, len(KEYS))))
_lock = threading.Lock()
_slots = threading.BoundedSemaphore(int(os.environ.get("MAX_CONCURRENT", "20")))


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
        with _lock:
            key = KEYS[next(_key_cycle)]
        try:
            t0 = time.time()
            with _slots:
                text, finish = _call(model, key, messages, max_tokens, temperature)
            log(f"    ↳ {model} {len(text)} car. en {time.time()-t0:.0f}s ({finish})")
            if finish == "length":
                # Sortie tronquée : on demande la suite une fois.
                cont = messages + [{"role": "assistant", "content": text},
                                   {"role": "user", "content": "Continue EXACTEMENT là où tu t'es arrêté, sans rien répéter, sans commentaire."}]
                with _slots:
                    more, _ = _call(model, key, cont, max_tokens, temperature)
                text += more
            return text
        except RateLimited:
            # Quota momentanément dépassé : on attend sans consommer d'essai.
            waits += 1
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
SYSTEM = r"""Tu es un professeur agrégé de chimie, auteur de manuels de référence pour les lycées du Cameroun, et concepteur de cours numériques PREMIUM pour l'application OnBuch+. Tes cours sont réputés être les plus clairs, les plus complets et les plus rigoureux : chaque notion est introduite par une situation concrète, expliquée pas à pas, illustrée, puis consolidée par des exemples chiffrés et des mises en garde sur les erreurs fréquentes. Tu respectes strictement le programme officiel MINESEC de Terminale C, D, E (approche par les compétences : familles de situations, savoirs, savoir-faire, savoir-être). Tu écris en français impeccable, au niveau d'un élève de Terminale scientifique qui prépare le Baccalauréat, avec un ton chaleureux et motivant (tutoiement autorisé avec parcimonie). Tu utilises des exemples du contexte camerounais quand c'est pertinent (vin de palme, bili-bili, huile de palme et savonneries artisanales, CIMENCAM, SONARA, bière, vinaigre, jus de bissap, pharmacopée, Mont Cameroun, etc.) sans jamais sacrifier la rigueur.

Tu produis UNIQUEMENT du code LaTeX (corps de document, compilé avec XeLaTeX), sans aucune explication autour, sans balises Markdown ``` .

CONTRAT LaTeX (obligatoire) :
- Interdit : \documentclass, \usepackage, \begin{document}, \end{document}, \section, \subsection, \chapter, \includegraphics, \begin{figure}, \begin{table}, \input, \newcommand, \def, \label/\ref, Markdown (**gras**, # titres), \verb, emojis.
- Titres : \coursec{Titre de section} (niveau 1, numéroté automatiquement) et \courssub{Sous-titre} (niveau 2, numéroté automatiquement). Pour un titre de niveau 3 : \textbf{...}\par. Ne numérote JAMAIS les titres toi-même.
- Boîtes pédagogiques (titre optionnel entre crochets) :
  \begin{definition}[Titre]...\end{definition}
  \begin{propriete}[Titre]...\end{propriete}
  \begin{aretenir}[Titre]...\end{aretenir}
  \begin{exemplebox}[Titre]...\end{exemplebox}
  \begin{methode}[Titre]...\end{methode}  (démarche en étapes numérotées)
  \begin{attention}[Titre]...\end{attention}  (erreurs fréquentes, pièges, sécurité)
  \begin{experience}[Titre]...\end{experience}  (dispositif, protocole, observations, interprétation)
  \begin{savaistu}[Titre]...\end{savaistu}  (culture scientifique, histoire, applications, Cameroun)
  \begin{exoresolu}[Titre]Énoncé ... \tcblower Solution détaillée ...\end{exoresolu}
  \begin{exercice}[Titre]...\end{exercice}
  \begin{corrige}[Exercice n]...\end{corrige}
  Ne jamais imbriquer une boîte dans une autre boîte.
- Mot-clé mis en valeur : \cle{mot}. Gras : \textbf{}. Italique : \emph{}.
- Chimie : formules et équations avec mhchem : \ce{CH3-CH2-OH}, \ce{CH3COOH + C2H5OH <=> CH3COOC2H5 + H2O}, \ce{H3O+}, \ce{Cr2O7^2-}, flèches \ce{->}, \ce{<=>}. Pour une équation centrée : \[ \ce{...} \]. Couples : \ce{CH3COOH}/\ce{CH3COO-}.
- Formules développées / semi-développées : chemfig, simples et robustes, ex. \chemfig{CH_3-CH_2-C(=[1]O)-[7]OH}, \chemfig{H_3C-CH(-[2]OH)-CH_3}. Pour les représentations de Cram : \chemfig{C(-[2]H)(<[5]CH_3)(<:[7]OH)-COOH} etc. Pas de \chemname, pas de \schemestart.
- Grandeurs et unités : \SI{0,10}{mol.L^{-1}}, \SI{25}{\celsius}, \SI{20,0}{mL} ; nombres décimaux avec virgule ; maths en $...$ et \[...\] ; alignements avec \begin{align*}.
- Tableaux : \begin{center}\begin{tabularx}{\linewidth}{|l|X|X|}\hline ... \end{tabularx}\end{center} ou tabular + booktabs. En-têtes colorés possibles : \rowcolor{popblueL}. Tableau d'avancement fortement recommandé dans les calculs.
- Illustrations : place chaque figure dans \begin{popfigure} ... \legende{Légende}\end{popfigure}. Utilise TikZ (dispositifs expérimentaux schématisés : bécher, burette, erlenmeyer, chauffage à reflux, pH-mètre ; diagrammes de prédominance ; axes de pKa ; cartes mentales) et pgfplots (courbes de dosage pH=f(V), courbes cinétiques x=f(t) avec tangentes, graphes). Couleurs autorisées : popink, poporange, popdark, poppurple, popgreen, popblue, poppink, popgold, popmuted, popline, popcream, et leurs teintes popblueL, poporangeL, popgreenL, poppurpleL, poppinkL, popgoldL (ou mélanges comme popblue!30). Style de courbe prêt à l'emploi : \addplot[popcurve,domain=0:20,samples=200]{...};. Largeur max des figures : \linewidth. Garde le code TikZ simple, correct et compilable (bibliothèques disponibles : arrows.meta, positioning, calc, shapes.geometric, decorations.pathmorphing, patterns).
- Listes : itemize / enumerate classiques.
- Le symbole % doit être échappé \% ; les caractères & _ # doivent être échappés hors des environnements qui les attendent.
"""


def strip_fences(t):
    t = re.sub(r"^```[a-zA-Z]*\s*\n", "", t.strip())
    t = re.sub(r"\n```\s*$", "", t)
    t = t.replace("```latex", "").replace("```", "")
    return t.strip()


def sanitize(t):
    t = strip_fences(t)
    for pat in [r"\\documentclass.*?\n", r"\\usepackage.*?\n", r"\\begin\{document\}", r"\\end\{document\}"]:
        t = re.sub(pat, "", t)
    t = re.sub(r"\\(sub)*section\*?\{", r"\\courssub{", t)
    return t.strip()


# ---------------------------------------------------------------------------
# Compilation d'essai
# ---------------------------------------------------------------------------
HEADER = r"""\newcommand{\DOCMATIERE}{Chimie}\newcommand{\DOCNIVEAU}{Tle C}\newcommand{\DOCMODULE}{Test}\newcommand{\DOCLECON}{00}\newcommand{\DOCTITRE}{Test}
\input{preamble.tex}
\begin{document}
"""


def compile_check(body):
    """Compile le bloc seul. Renvoie (ok, extrait_du_log)."""
    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        (d / "preamble.tex").write_text(PREAMBLE.read_text())
        (d / "fonts").symlink_to(FONTS)
        (d / "t.tex").write_text(HEADER + body + "\n\\end{document}\n")
        try:
            p = subprocess.run([TECTONIC, "--keep-logs", "-c", "minimal", "t.tex"], cwd=d,
                               capture_output=True, text=True, timeout=400)
        except subprocess.TimeoutExpired:
            return False, "Compilation interrompue (délai dépassé) : boucle infinie probable dans le code TikZ/pgfplots."
        ok = p.returncode == 0 and (d / "t.pdf").exists()
        out = p.stdout + p.stderr
        logf = d / "t.log"
        if not ok and logf.exists():
            lines = logf.read_text(errors="ignore").splitlines()
            errs = []
            for i, l in enumerate(lines):
                if l.startswith("!"):
                    errs.append("\n".join(lines[i:i + 6]))
            out = "\n---\n".join(errs[:6]) or out
        # numéro de ligne relatif au corps
        out = re.sub(r"t\.tex:(\d+)", lambda m: f"ligne {int(m.group(1)) - HEADER.count(chr(10))}", out)
        return ok, out[-3500:]


def compile_fix(body, what, tries=4):
    for i in range(tries):
        ok, err = compile_check(body)
        if ok:
            return body, True
        log(f"  ✗ compilation {what} (essai {i+1}) : {err.strip().splitlines()[0] if err.strip() else '?'}")
        numbered = "\n".join(f"{n+1:4d}| {l}" for n, l in enumerate(body.splitlines()))
        body = sanitize(llm([
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": f"Ce code LaTeX ne compile pas avec XeLaTeX. Erreurs :\n{err}\n\nCode (numéroté pour référence) :\n{numbered}\n\n"
             "Renvoie le code COMPLET corrigé (sans les numéros de ligne), en conservant intégralement le contenu pédagogique. "
             "Corrige la cause de l'erreur ; si une figure TikZ/chemfig est trop complexe, simplifie-la en gardant son intention. Réponds uniquement avec le LaTeX."}],
            WRITER_MODELS, temperature=0.2))
    ok, _ = compile_check(body)
    return body, ok


# ---------------------------------------------------------------------------
# Étapes
# ---------------------------------------------------------------------------
def lesson_brief(L):
    return (f"CLASSE : Terminale C, D, E (programme identique)\nLEÇON {L['id'][1:]} : {L['titre']}\n{L['module']} — durée conseillée {L['duree']}\n"
            f"Famille de situations : {L['famille']}\n\nSAVOIRS (programme officiel) :\n- " + "\n- ".join(L["savoirs"]) +
            "\n\nSAVOIR-FAIRE (programme officiel) :\n- " + "\n- ".join(L["savoir_faire"]))


def step_plan(L, d):
    f = d / "plan.json"
    if f.exists():
        return json.loads(f.read_text())
    log(f"[{L['id']}] plan")
    prompt = lesson_brief(L) + r"""

Conçois le PLAN DÉTAILLÉ du cours premium correspondant. Il doit couvrir TOUS les savoirs et TOUS les savoir-faire ci-dessus, dans un ordre progressif et logique, sans hors-programme inutile (tu peux ajouter de brefs compléments utiles au Bac, signalés comme tels).

Réponds UNIQUEMENT avec un objet JSON valide (pas de Markdown) :
{
 "accroche": "situation-problème d'introduction ancrée dans le quotidien camerounais (3-5 phrases)",
 "description": "2 phrases présentant la leçon pour la page de garde",
 "objectifs": ["À la fin de cette leçon, je sais ...", "... (6 à 9 objectifs formulés en savoir-faire)"],
 "prerequis": ["notion de Première ou de début d'année utile", "... (3 à 5)"],
 "sections": [
   {"titre": "titre court de la section", "contenu": ["point précis à traiter", "..."], "illustrations": ["figure TikZ/pgfplots/chemfig à produire", "..."], "boites": ["définition de ...", "méthode pour ...", "attention : erreur fréquente ...", "exemple chiffré ...", "le savais-tu : ..."]}
 ],
 "tp": {"titre": "titre du TP", "objectif": "...", "idee": "protocole réalisable dans un lycée camerounais"},
 "exercices_idees": ["idée d'exercice type Bac", "..."]
}
Contraintes : 4 à 7 sections ; chaque section a 4 à 10 points de contenu précis, au moins 1 illustration pertinente, et 3 à 6 boîtes pédagogiques."""
    txt = llm([{"role": "system", "content": "Tu es un inspecteur pédagogique de chimie au MINESEC (Cameroun) et concepteur de cours premium. Tu réponds uniquement en JSON valide."},
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
1. Exactitude scientifique : vérifie chaque équation (équilibrage des atomes ET des charges, demi-équations rédox), chaque formule, chaque nom (nomenclature IUPAC en français), chaque valeur numérique (pKa, masses molaires, calculs refaits), chaque conclusion. Corrige toute erreur.
2. Conformité au programme officiel de Terminale C, D, E (ni trop, ni trop peu) et vocabulaire du Bac camerounais.
3. Pédagogie : explications pas à pas, transitions, pas de sauts logiques ; complète si une notion du plan est survolée ; garde les illustrations et améliore-les si utile.
4. Conformité stricte au CONTRAT LaTeX (environnements autorisés, mhchem, chemfig simple, pas de boîtes imbriquées, % échappés).
Ne raccourcis pas le contenu : la version finale doit être au moins aussi riche. Réponds uniquement avec le LaTeX final."""}],
                           REVIEW_MODELS, max_tokens=22000, temperature=0.3))
        # garde-fou : une relecture qui ampute le texte est rejetée
        if len(rev) < 0.7 * len(raw):
            log(f"[{L['id']}] relecture {what} trop courte ({len(rev)} < {len(raw)}), version initiale conservée")
            rev = raw
        rev_f.write_text(rev)
    body, ok = compile_fix(rev_f.read_text(), f"{L['id']}/{name}")
    if not ok:
        log(f"[{L['id']}] ⚠ {name} ne compile toujours pas — repli sur la version brute")
        body, ok = compile_fix(raw, f"{L['id']}/{name}-brut")
    if not ok:
        raise RuntimeError(f"{L['id']}/{name} : compilation impossible")
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

Illustrations à produire (TikZ / pgfplots / chemfig, dans popfigure) :
- """ + "\n- ".join(s.get("illustrations", [])) + """

Boîtes pédagogiques à inclure :
- """ + "\n- ".join(s.get("boites", [])) + f"""

Consignes :
- Commence par \\coursec{{{s['titre']}}} puis organise en \\courssub{{...}}.
- {"Ouvre la section par la situation d'accroche suivante, présentée de façon vivante, puis annonce la problématique : " + plan.get("accroche", "") if i == 0 else "Fais une transition naturelle avec la section précédente (« " + str(prev) + " »)."}
- Explique chaque notion comme le meilleur professeur du monde : intuition d'abord, puis définition rigoureuse, puis exemple chiffré détaillé, puis piège à éviter.
- Chaque équation chimique est écrite, équilibrée et commentée (conditions : catalyseur, température, caractéristiques).
- Au moins une illustration de qualité et au moins un exemple chiffré ou exercice résolu (exoresolu) quand la notion s'y prête.
- Longueur visée : 1500 à 2800 mots de contenu (hors code des figures). Ne traite PAS les autres sections du plan."""
        jobs.append((f"s{i+1:02d}", instr, f"section {i+1}/{n}"))
    extra = [(k, EXTRA[k][1](L, plan), k) for k in ("tp", "methodes", "exercices", "bilan")]
    with cf.ThreadPoolExecutor(len(jobs) + len(extra)) as ex:
        futs = [ex.submit(write_block, L, plan, d, *j) for j in jobs + extra]
        res = [f.result() for f in futs]
    return res[:n], dict(zip(("tp", "methodes", "exercices", "bilan"), res[n:]))


EXTRA = {
    "tp": ("Travaux pratiques", lambda L, p: f"""RÉDIGE LA PARTIE « TRAVAUX PRATIQUES » de la leçon (le titre de partie \\coursec est déjà posé : commence directement par \\courssub).
TP proposé : {p['tp'].get('titre','')} — objectif : {p['tp'].get('objectif','')} — idée : {p['tp'].get('idee','')}.
Structure : \\courssub{{Objectifs du TP}}, \\courssub{{Matériel et produits}} (tableau), \\courssub{{Sécurité}} (boîte attention avec pictogrammes décrits en mots et gestes à adopter), \\courssub{{Schéma du dispositif}} (un schéma TikZ soigné dans popfigure), \\courssub{{Protocole}} (étapes numérotées précises, quantités), \\courssub{{Observations et résultats attendus}} (tableau de mesures type avec valeurs réalistes), \\courssub{{Exploitation}} (questions guidées avec réponses dans une boîte exoresolu), \\courssub{{Conclusion}}.
Le TP doit être réalisable dans un laboratoire de lycée camerounais (prévoir des alternatives avec du matériel local si un produit manque). 1200 à 2000 mots."""),
    "methodes": ("Méthodes et exercices résolus", lambda L, p: """RÉDIGE LA PARTIE « MÉTHODES ET EXERCICES RÉSOLUS » (le titre \\coursec est déjà posé : commence directement par \\courssub).
Pour chaque savoir-faire du programme de cette leçon, donne une fiche \\begin{methode}[...] (démarche en étapes numérotées, réflexes, formules), immédiatement suivie d'un \\begin{exoresolu}[...] qui l'applique (énoncé type Bac, puis après \\tcblower une solution TRÈS détaillée : raisonnement, équations, tableau d'avancement si utile, calculs avec unités et chiffres significatifs, phrase de conclusion). Termine par une boîte attention « Les 5 erreurs qui coûtent des points au Bac ». Entre 5 et 7 couples méthode/exercice résolu."""),
    "exercices": ("Exercices", lambda L, p: """RÉDIGE LA PARTIE « EXERCICES » (le titre \\coursec est déjà posé ; commence directement par \\courssub).
Trois niveaux, chacun introduit par \\courssub : « Je vérifie mes connaissances » (4 exercices courts : QCM, vrai/faux justifié, textes à trous, définitions), « Je m'entraîne » (4 exercices d'application directe), « Je me prépare au Bac » (3 exercices longs de type Baccalauréat camerounais, contextualisés, avec plusieurs questions numérotées et données numériques complètes : masses molaires, pKa, etc.).
Chaque exercice dans un environnement \\begin{exercice}[titre court]...\\end{exercice}. NE DONNE PAS les corrections ici. Idées possibles : """ + "; ".join(p.get("exercices_idees", []))),
    "bilan": ("Fiche bilan", lambda L, p: """RÉDIGE LA « FICHE BILAN » de la leçon (le titre \\coursec est déjà posé ; ne mets pas de \\coursec).
Contenu : (1) une carte mentale TikZ lisible de la leçon (nœud central + 5 à 7 branches colorées, texte court, dans popfigure, largeur \\linewidth), (2) un environnement \\begin{bilan} ... \\end{bilan} contenant l'essentiel en listes compactes : définitions clés, équations-types à connaître par cœur, formules (dans un tabularx), méthodes express, (3) une boîte aretenir « Checklist avant le Bac » avec 8 à 12 cases à cocher ($\\square$ ...)."""),
}


def step_extra(L, plan, d, key):
    title, mk = EXTRA[key]
    return title, write_block(L, plan, d, key, mk(L, plan), key)


def step_corriges(L, plan, d, exercices):
    title = "Corrigés des exercices"
    f_ok = d / "corriges.ok.tex"
    if f_ok.exists():
        return title, f_ok.read_text()
    instr = r"""RÉDIGE LA PARTIE « CORRIGÉS DES EXERCICES » (le titre \coursec est déjà posé ; commence directement). Voici les exercices, numérotés dans l'ordre d'apparition à partir de 1:

""" + exercices + r"""

Pour CHAQUE exercice, dans l'ordre, un environnement \begin{corrige}[Exercice N — titre] ... \end{corrige} avec une correction complète et rigoureuse : réponses justifiées, équations équilibrées, calculs détaillés avec unités, tableaux d'avancement, et pour les exercices type Bac un barème indicatif et les « points de vigilance ». Vérifie deux fois chaque calcul numérique."""
    return title, write_block(L, plan, d, "corriges", instr, "corrigés")


def run_lesson(L):
    d = BUILD / L["id"]
    d.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    plan = step_plan(L, d)
    _, extra = step_sections(L, plan, d)
    step_corriges(L, plan, d, extra["exercices"])
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
