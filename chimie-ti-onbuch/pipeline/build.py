#!/usr/bin/env python3
"""Assemble les blocs générés (build/<id>/*.ok.tex) en un cours complet par
série, puis compile le PDF.

Programme de Chimie Terminale TI (série unique).

Sortie : cours/Tle-<S>/<id>-<slug>/<id>-<slug>.tex et .pdf
Chaque .tex est autonome (préambule inclus) ; il se compile depuis son
dossier avec `tectonic <fichier>.tex` (polices dans chimie-ti-onbuch/fonts/).
"""
import concurrent.futures as cf
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
OUT = ROOT / "cours"
TECTONIC = os.environ.get("TECTONIC", "tectonic")
EXTRAS = [("tp", "Travaux pratiques"), ("methodes", "Méthodes et exercices résolus"),
          ("exercices", "Exercices"), ("corriges", "Corrigés des exercices"), ("bilan", "Fiche bilan")]


def esc(s):
    """Échappe un texte brut issu du plan (hors segments $...$ et \\ce{...})."""
    parts = re.split(r"(\$[^$]*\$|\\ce\{[^}]*\})", s)
    out = []
    for i, p in enumerate(parts):
        if i % 2:
            out.append(p)
        else:
            p = p.replace("\\", "\\textbackslash{}")
            for c in "%&#_":
                p = p.replace(c, "\\" + c)
            p = p.replace("^", "\\^{}").replace("~", "\\~{}")
            out.append(p)
    return "".join(out)


def items(lst):
    return "\\begin{itemize}\n" + "\n".join(f"\\item {esc(x)}" for x in lst) + "\n\\end{itemize}"


def assemble(L, serie):
    d = BUILD / L["id"]
    plan = json.loads((d / "plan.json").read_text())
    n = len(plan["sections"])
    sections = [(d / f"s{i+1:02d}.ok.tex").read_text() for i in range(n)]
    extras = [(title, (d / f"{k}.ok.tex").read_text()) for k, title in EXTRAS]
    # Certains modèles corrigent les exercices directement dans la partie
    # « Exercices » : la partie « Corrigés » existe déjà, on retire ce doublon.
    extras = [(t, re.sub(r"\\begin\{corrige\}.*?\\end\{corrige\}\s*", "", c, flags=re.S) if t == "Exercices" else c)
              for t, c in extras]
    rel_fonts = os.path.relpath(ROOT / "fonts", OUT / f"Tle-{serie}" / f"{L['id']}-{L['slug']}") + "/"
    preamble = (ROOT / "preamble.tex").read_text().replace("Path=fonts/", f"Path={rel_fonts}")
    niveau = f"Tle {serie}"
    num = L["id"][1:]
    objectifs_cover = esc(plan["description"]) + "\n\\vspace{4pt}\n" + \
        "\\begin{multicols}{2}\\small\n" + items(plan["objectifs"][:6]) + "\\end{multicols}"
    sommaire = "\\begin{enumerate}\n" + "\n".join(
        f"\\item {esc(s['titre'])}" for s in plan["sections"]) + "\n" + "\n".join(
        f"\\item {t}" for t, _ in extras) + "\n\\end{enumerate}"
    body = [
        f"\\pagegarde{{{esc(L['titre'])}}}{{Chimie}}{{{niveau}}}{{{esc(L['module'])}}}{{{num}}}{{{esc(L['duree'])}}}{{{objectifs_cover}}}",
        "\\begin{sommaire}\n\\begin{multicols}{2}\n" + sommaire + "\n\\end{multicols}\n\\end{sommaire}",
        "\\begin{objectifs}\n" + items(plan["objectifs"]) + "\n\\end{objectifs}",
        "\\begin{prerequis}\n" + items(plan["prerequis"]) + "\n\\end{prerequis}",
        "\\newpage",
    ]
    body += sections
    for title, content in extras:
        body += ["\\newpage", f"\\coursec{{{title}}}", content]
    body.append("\\findecours")
    tex = (
        f"% {L['titre']} — Chimie {niveau} — Cours signé OnBuch+\n"
        f"% Programme officiel MINESEC, Terminale TI. Compiler avec : tectonic {L['id']}-{L['slug']}.tex\n"
        f"\\newcommand{{\\DOCMATIERE}}{{Chimie}}\n\\newcommand{{\\DOCNIVEAU}}{{{niveau}}}\n"
        f"\\newcommand{{\\DOCMODULE}}{{{esc(L['module'])}}}\n\\newcommand{{\\DOCLECON}}{{{num}}}\n"
        f"\\newcommand{{\\DOCTITRE}}{{{esc(L['titre'])}}}\n"
        + preamble + "\n\\begin{document}\n\n" + "\n\n".join(body) + "\n\n\\end{document}\n")
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
        for s in cat["series"]:
            files.append(assemble(L, s))
    with cf.ThreadPoolExecutor(int(os.environ.get("WORKERS", "4"))) as ex:
        res = list(ex.map(compile_pdf, files))
    print(f"{sum(res)}/{len(res)} PDF compilés")


if __name__ == "__main__":
    main()
