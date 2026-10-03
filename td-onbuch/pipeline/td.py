#!/usr/bin/env python3
"""Génère 3 fiches de TD (facile, moyen, difficile ; 5 pages max) par chapitre
de tous les cours *-onbuch, via l'API NVIDIA. Réutilise le préambule OnBuch+ de
chaque matière.  python3 td-onbuch/pipeline/td.py [--part i/n] [--only matiere-onbuch]
Sortie : <matiere>-onbuch/td/<id>-<slug>/TD<k>-<niveau>.pdf (+ .tex)"""
import concurrent.futures as cf, json, os, re, subprocess, sys, threading
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "chimie-ti-onbuch" / "pipeline"))
import generate as g   # noqa: E402
import build as b      # noqa: E402

MODELS = ["nvidia/nemotron-3-ultra-550b-a55b", "moonshotai/kimi-k3"]
g.REVIEW_MODELS = MODELS
MAXP = 5
LEVELS = [
    (1, "facile", "Facile",
     "5 à 6 exercices COURTS d'application directe du cours : questions de cours, vrai/faux justifiés, QCM, calculs ou manipulations à une étape, complétion de phrases/tableaux. Aucune difficulté cachée."),
    (2, "moyen", "Moyen",
     "4 à 5 exercices de niveau devoir de classe : applications à plusieurs étapes, courts problèmes contextualisés (contexte camerounais), exploitation de données/tableaux/documents, justification rédigée."),
    (3, "difficile", "Difficile",
     "3 à 4 exercices de synthèse de niveau Baccalauréat/concours : problèmes longs et progressifs, raisonnement autonome, démonstrations ou analyses critiques, questions ouvertes, liens entre notions."),
]
lock = threading.Lock()


def esc(s):
    return b.esc(s)


def system(cat):
    return (f"Tu es un professeur agrégé de {cat['matiere']}, auteur de fiches de travaux dirigés (TD) pour l'application OnBuch+, "
            f"au programme officiel MINESEC du Cameroun ({cat['matiere']}, classe de {cat['classe']}). Tu écris en français impeccable, "
            "avec des énoncés clairs, rigoureux, non ambigus, réalistes et progressifs. Tu produis du code LaTeX (XeLaTeX) compilable du premier coup.")


def prompt(cat, L, lv):
    k, name, label, cons = lv
    info = {"titre": L["titre"], "module": L.get("module"), "savoirs": L.get("savoirs"), "savoir_faire": L.get("savoir_faire")}
    return (f"Rédige une FICHE DE TD de niveau {label.upper()} sur le chapitre suivant ({cat['matiere']}, {cat['classe']}, séries {', '.join(L.get('series') or cat['series'])}).\n"
            f"CHAPITRE (JSON) : {json.dumps(info, ensure_ascii=False)}\n\n"
            f"CONSIGNES DE NIVEAU : {cons}\n\n"
            "FORMAT (très strict) :\n"
            "- Réponds UNIQUEMENT avec le corps LaTeX, sans \\documentclass, sans préambule, sans \\begin{document}, sans balises markdown.\n"
            "- Une courte phrase d'introduction/consigne (2 lignes max), puis les exercices, chacun dans \\begin{exercice}[Titre court] ... \\end{exercice} (numérotation automatique, ne numérote pas toi-même).\n"
            "- Dans un exercice : énoncé, puis les questions dans \\begin{enumerate} ... \\end{enumerate} (numérotation par défaut). Barème facultatif noté (2 pts).\n"
            "- AUCUNE correction, AUCUNE solution, AUCUN indice de résultat : énoncés seulement.\n"
            "- LONGUEUR : la fiche doit tenir sur 4 pages A4 au maximum (environ 6000 caractères de LaTeX). Sois concis.\n"
            "- Maths/unités : $...$, \\SI{valeur}{unité} avec unités SI standard, \\ce{...} pour les formules chimiques (uniquement si pertinent). "
            "Pas de \\section, pas de \\newpage, pas d'environnement ou de macro inventés. Tableaux : tabular/tabularx simples. "
            "Figures : seulement si indispensables, très simples (TikZ basique), sinon décris la situation par le texte ou un tableau. "
            "Échappe correctement & % # _ dans le texte. Code informatique : \\begin{verbatim}...\\end{verbatim} ou \\texttt{}.\n"
            "- Reste strictement dans le programme du chapitre. Réponds maintenant.")


def banner(cat, L, lv, niveau):
    k, name, label, _ = lv
    num = re.sub(r"\D", "", L["id"]) or L["id"]
    return (r"\begin{tcolorbox}[enhanced,colback=popink,colframe=popink,arc=10pt,boxrule=0pt,left=12pt,right=12pt,top=9pt,bottom=9pt]" "\n"
            rf"{{\color{{white}}\popxbold\small FICHE DE TD {k}/3 \textbullet\ {label.upper()} \hfill {esc(cat['matiere'])} \textbullet\ {esc(niveau)}\par}}" "\n"
            rf"\vspace{{4pt}}{{\color{{white}}\popxbold\Large {esc(L['titre'])}\par}}" "\n"
            rf"\vspace{{3pt}}{{\color{{white}}\small {esc(L.get('module') or '')}\par}}" "\n"
            r"\end{tcolorbox}" "\n\\vspace{4pt}\n")


def wrap(cat, L, niveau, body, fonts_rel, preamble):
    num = re.sub(r"\D", "", L["id"]) or L["id"]
    return (f"\\newcommand{{\\DOCMATIERE}}{{{esc(cat['matiere'])}}}\\newcommand{{\\DOCNIVEAU}}{{{esc(niveau)}}}"
            f"\\newcommand{{\\DOCMODULE}}{{{esc(L.get('module') or '')}}}\\newcommand{{\\DOCLECON}}{{{num}}}"
            f"\\newcommand{{\\DOCTITRE}}{{{esc(L['titre'])}}}\n"
            + preamble.replace("Path=fonts/", f"Path={fonts_rel}") + "\n\\begin{document}\n" + body + "\n\\end{document}\n")


def npages(pdf):
    o = subprocess.run(["pdfinfo", str(pdf)], capture_output=True, text=True).stdout
    return int(re.search(r"Pages:\s+(\d+)", o).group(1))


def compile_pdf(tex):
    p = subprocess.run([g.TECTONIC, "-c", "minimal", tex.name], cwd=tex.parent, capture_output=True, text=True, timeout=900)
    return p.returncode == 0 and tex.with_suffix(".pdf").exists()


def drop_last_exercise(body):
    i = body.rfind("\\begin{exercice}")
    return body[:i].rstrip() + "\n" if i > 0 else body


def job(sub, cat, L, lv):
    k, name, label, _ = lv
    root = REPO / sub
    d = REPO / "td-onbuch" / "build" / sub / L["id"]
    d.mkdir(parents=True, exist_ok=True)
    out = root / "td" / f"{L['id']}-{L['slug']}"
    out.mkdir(parents=True, exist_ok=True)
    tex = out / f"TD{k}-{name}.tex"
    tag = f"{sub}/{L['id']}/{name}"
    if tex.with_suffix(".pdf").exists():
        return True
    ser = " ".join(L.get("series") or cat["series"])
    niveau = "3ème" if cat["classe"].startswith("Trois") else ("Tle " + ser if cat["classe"].startswith("Term") else "1re " + ser)
    bf = d / f"{name}.ok.tex"
    if bf.exists():
        body = bf.read_text()
    else:
        raw = g.llm([{"role": "system", "content": g.SYSTEM}, {"role": "user", "content": prompt(cat, L, lv)}],
                    MODELS, max_tokens=12000, temperature=0.6)
        body = g.sanitize(raw)
        if "\\begin{exercice}" not in body:
            g.log(f"  ✗ {tag} : pas d'exercice"); return False
        body = banner(cat, L, lv, niveau) + body
        body, ok = g.compile_fix(body, tag)
        if not ok:
            (d / f"{name}.err.tex").write_text(body); g.log(f"ÉCHEC {tag}"); return False
        bf.write_text(body)
    fonts_rel = os.path.relpath(root / "fonts", out) + "/"
    preamble = (root / "preamble.tex").read_text()
    for attempt in range(8):
        tex.write_text(wrap(cat, L, niveau, body, fonts_rel, preamble))
        if not compile_pdf(tex):
            g.log(f"ÉCHEC PDF {tag}"); return False
        n = npages(tex.with_suffix(".pdf"))
        if n <= MAXP:
            bf.write_text(body)
            g.log(f"✔ {tag} ({n} p.)"); return True
        g.log(f"  {tag} : {n} pages > {MAXP}, réduction")
        body = drop_last_exercise(body)
    return False


def main():
    args = sys.argv[1:]
    part, only = (0, 1), None
    if "--part" in args:
        i, n = args[args.index("--part") + 1].split("/"); part = (int(i), int(n))
    if "--only" in args:
        only = args[args.index("--only") + 1]
    subs = sorted([p.parent.parent.name for p in REPO.glob("*-onbuch/pipeline/lessons.json")])
    if only:
        subs = [only]
    sizes = {s: len(json.loads((REPO / s / "pipeline" / "lessons.json").read_text())["lessons"]) for s in subs}
    subs = sorted(subs, key=lambda s: -sizes[s])
    subs = [s for j, s in enumerate(subs) if j % part[1] == part[0]]
    workers = int(os.environ.get("WORKERS", "6"))
    for sub in subs:
        cat = json.loads((REPO / sub / "pipeline" / "lessons.json").read_text())
        g.SYSTEM = system(cat)
        g.PREAMBLE = REPO / sub / "preamble.tex"
        g.FONTS = REPO / sub / "fonts"
        g.HEADER = ("\\newcommand{\\DOCMATIERE}{%s}\\newcommand{\\DOCNIVEAU}{Tle}\\newcommand{\\DOCMODULE}{Test}\\newcommand{\\DOCLECON}{00}\\newcommand{\\DOCTITRE}{Test}\n"
                    "\\input{preamble.tex}\n\\begin{document}\n") % esc(cat["matiere"])
        g.log(f"=== {sub} : {len(cat['lessons'])} chapitres")
        with cf.ThreadPoolExecutor(workers) as ex:
            res = list(ex.map(lambda a: job(sub, cat, *a), [(L, lv) for L in cat["lessons"] for lv in LEVELS]))
        g.log(f"=== {sub} terminé : {sum(res)}/{len(res)}")


if __name__ == "__main__":
    main()
