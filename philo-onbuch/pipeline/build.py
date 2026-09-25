#!/usr/bin/env python3
"""Assemble les blocs générés (build/<id>/*.ok.tex) en un cours complet par
série, puis compile le PDF.

Chaque leçon n'est rédigée qu'une fois (pipeline/generate.py) et est ici
dupliquée pour toutes les séries listées dans son champ "series" — seuls la
page de garde et l'en-tête changent (niveau affiché), le contenu est
identique. Quand une leçon porte un champ "extra" (compléments propres à
certaines séries, eux aussi rédigés une seule fois), la section
correspondante n'est insérée QUE dans les séries concernées par ce
complément.

Sortie : cours/Tle-<S>/<id>-<slug>/<id>-<slug>.tex et .pdf
Chaque .tex est autonome (préambule inclus) ; il se compile depuis son
dossier avec `tectonic <fichier>.tex` (polices dans maths-onbuch/fonts/).
"""
import concurrent.futures as cf
import json
import os
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from generate import autofix  # noqa: E402  (corrections mécaniques sûres)

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
OUT = ROOT / "cours"
TECTONIC = os.environ.get("TECTONIC", "tectonic")
EXTRAS = [("activite", "Activité d'intégration"), ("methodes", "Méthodes et exercices résolus"),
          ("exercices", "Exercices"), ("corriges", "Corrigés des exercices"), ("bilan", "Fiche bilan")]
SERIES_NOMS = {"A": "Tle A"}


def esc(s):
    """Échappe un texte brut issu du plan (hors segments $...$).
    Un nombre impair de $ (ex. variable PHP $_GET citée en prose, sans
    intention mathématique) ne peut former de paire équilibrée : on
    échappe alors tous les $ comme du texte brut plutôt que de laisser
    un mode mathématique non refermé se propager dans tout le document."""
    if s.count("$") % 2 == 1:
        parts = [s]
    else:
        parts = re.split(r"(\$[^$]*\$)", s)
    out = []
    for i, p in enumerate(parts):
        if i % 2:
            out.append(p)
        else:
            p = p.replace("\\", "\\textbackslash{}")
            for c in "%&#_$":
                p = p.replace(c, "\\" + c)
            p = p.replace("^", "\\^{}").replace("~", "\\~{}")
            out.append(p)
    return "".join(out)


def items(lst):
    return "\\begin{itemize}\n" + "\n".join(f"\\item {esc(x)}" for x in lst) + "\n\\end{itemize}"


def duree_for(L, serie):
    d = L["duree"]
    return d[serie] if isinstance(d, dict) else d


def assemble(cat, L, serie):
    d = BUILD / L["id"]
    plan = json.loads((d / "plan.json").read_text())
    n = len(plan["sections"])
    sections = [autofix((d / f"s{i+1:02d}.ok.tex").read_text()) for i in range(n)]
    extras = [(title, autofix((d / f"{k}.ok.tex").read_text())) for k, title in EXTRAS]
    # Certains modèles corrigent les exercices directement dans la partie
    # « Exercices » : la partie « Corrigés » existe déjà, on retire ce doublon.
    extras = [(t, re.sub(r"\\begin\{corrige\}.*?\\end\{corrige\}\s*", "", c, flags=re.S) if t == "Exercices" else c)
              for t, c in extras]
    # Compléments propres à cette série (champ "extra" de lessons.json) :
    # insérés comme sections de cours supplémentaires, juste avant l'activité
    # d'intégration, uniquement pour les séries concernées.
    complements = []
    for ex in L.get("extra", []):
        if serie in ex["series"]:
            content = autofix((d / f"extra_{ex['id']}.ok.tex").read_text())
            complements.append((ex["titre"], content))
    niveau = SERIES_NOMS.get(serie, f"Tle {serie}")
    num = L["id"].lstrip("M")
    objectifs_cover = esc(plan["description"]) + "\n\\vspace{4pt}\n" + \
        "\\begin{multicols}{2}\\small\n" + items(plan["objectifs"][:6]) + "\\end{multicols}"
    sommaire_items = [esc(s["titre"]) for s in plan["sections"]] + [esc(t) for t, _ in complements] + \
        [title for _, title in EXTRAS]
    sommaire = "\\begin{enumerate}\n" + "\n".join(f"\\item {t}" for t in sommaire_items) + "\n\\end{enumerate}"
    matiere = cat["matiere"]
    body = [
        f"\\pagegarde{{{esc(L['titre'])}}}{{{matiere}}}{{{niveau}}}{{{esc(L['module'])}}}{{{num}}}{{{esc(duree_for(L, serie))}}}{{{objectifs_cover}}}",
        "\\begin{sommaire}\n\\begin{multicols}{2}\n" + sommaire + "\n\\end{multicols}\n\\end{sommaire}",
        "\\begin{objectifs}\n" + items(plan["objectifs"]) + "\n\\end{objectifs}",
        "\\begin{prerequis}\n" + items(plan["prerequis"]) + "\n\\end{prerequis}",
        "\\newpage",
    ]
    body += sections
    for titre, content in complements:
        body += ["\\newpage", content]  # le \coursec{titre} est déjà dans le contenu généré
    for title, content in extras:
        body += ["\\newpage", f"\\coursec{{{title}}}", content]
    body.append("\\findecours")
    rel_fonts = os.path.relpath(ROOT / "fonts", OUT / f"Tle-{serie}" / f"{L['id']}-{L['slug']}") + "/"
    preamble = (ROOT / "preamble.tex").read_text().replace("Path=fonts/", f"Path={rel_fonts}")
    tex = (
        f"% {L['titre']} — {matiere} {niveau} — Cours signé OnBuch+\n"
        f"% Programme officiel MINESEC. Compiler avec : tectonic {L['id']}-{L['slug']}.tex\n"
        f"\\newcommand{{\\DOCMATIERE}}{{{matiere}}}\n\\newcommand{{\\DOCNIVEAU}}{{{niveau}}}\n"
        f"\\newcommand{{\\DOCMODULE}}{{{esc(L['module'])}}}\n\\newcommand{{\\DOCLECON}}{{{num}}}\n"
        f"\\newcommand{{\\DOCTITRE}}{{{esc(L['titre'])}}}\n"
        + preamble + "\n\\begin{document}\n\n" + "\n\n".join(body) + "\n\n\\end{document}\n")
    # Garde-fou : caractères d'un autre alphabet laissés par un modèle (ex. « 保持 »)
    for m in re.finditer(r"[\u0400-\u04FF\u0590-\u06FF\u3000-\u9FFF\uAC00-\uD7AF\uFF00-\uFFEF]", tex):
        print(f"⚠ {L['id']} {serie} : caractère suspect « {tex[max(0, m.start()-30):m.end()+10]} »")
    out = OUT / f"Tle-{serie}" / f"{L['id']}-{L['slug']}"
    out.mkdir(parents=True, exist_ok=True)
    f = out / f"{L['id']}-{L['slug']}.tex"
    f.write_text(tex)
    return f


def compile_pdf(f):
    p = subprocess.run([TECTONIC, "-c", "minimal", f.name], cwd=f.parent, capture_output=True, text=True, timeout=900)
    ok = p.returncode == 0
    print(("✔ " if ok else "✗ ") + str(f.relative_to(ROOT)), flush=True)
    if not ok:
        print((p.stdout + p.stderr)[-2500:])
    return ok


def main():
    cat = json.loads((ROOT / "pipeline" / "lessons.json").read_text())
    only = set(sys.argv[1:])
    files = []
    for L in cat["lessons"]:
        if only and L["id"] not in only:
            continue
        if not (BUILD / L["id"] / "DONE").exists():
            print(f"… {L['id']} pas encore généré")
            continue
        for s in L["series"]:
            files.append(assemble(cat, L, s))
    with cf.ThreadPoolExecutor(int(os.environ.get("WORKERS", "4"))) as ex:
        res = list(ex.map(compile_pdf, files))
    print(f"{sum(res)}/{len(res)} PDF compilés")


if __name__ == "__main__":
    main()
