#!/usr/bin/env python3
"""Outil de correction manuelle.

  python3 pipeline/check.py            liste les blocs marqués .err
  python3 pipeline/check.py L04/s05    recompile build/L04/s05.rev.tex ; si OK,
                                       le valide (s05.ok.tex), sinon écrit un .err
                                       et affiche l'erreur et le contexte.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import generate as g  # noqa: E402


def check(ref):
    lid, name = ref.split("/")
    d = g.BUILD / lid
    body = (d / f"{name}.rev.tex").read_text()
    ok, err, line = g.compile_check(body)
    if ok:
        (d / f"{name}.ok.tex").write_text(body)
        (d / f"{name}.err").unlink(missing_ok=True)
        print(f"✔ {ref} validé")
        return True
    (d / f"{name}.err").write_text(f"ligne {line}\n{err}")
    print(f"✗ {ref} (ligne {line})\n{err[:800]}")
    if line:
        lines = body.splitlines()
        for i in range(max(0, line - 4), min(len(lines), line + 3)):
            print(f"{i+1:5d}| {lines[i][:200]}")
    return False


def finalize():
    """Marque DONE les leçons dont tous les blocs sont validés."""
    import json
    cat = json.loads((g.ROOT / "pipeline" / "lessons.json").read_text())
    for L in cat["lessons"]:
        d = g.BUILD / L["id"]
        if (d / "DONE").exists() or not (d / "plan.json").exists():
            continue
        n = len(json.loads((d / "plan.json").read_text())["sections"])
        need = [f"s{i+1:02d}" for i in range(n)] + ["tp", "methodes", "exercices", "corriges", "bilan"]
        if all((d / f"{k}.ok.tex").exists() for k in need):
            (d / "DONE").write_text("ok")
            print(f"✔ {L['id']} complète (finalisée)")


if __name__ == "__main__":
    if sys.argv[1:] == ["--finalize"]:
        finalize()
        sys.exit()
    if len(sys.argv) == 1:
        for e in sorted(g.BUILD.glob("*/*.err")):
            first = e.read_text().splitlines()
            print(f"{e.parent.name}/{e.stem}: {first[0]} {first[1] if len(first) > 1 else ''}")
    else:
        for r in sys.argv[1:]:
            check(r)
