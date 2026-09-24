#!/usr/bin/env python3
"""Outil de correction manuelle.

  python3 pipeline/check.py            liste les blocs à corriger (*.err)
  python3 pipeline/check.py M04/s03    recompile build/M04/s03.rev.tex ; si OK,
                                       le valide (s03.ok.tex) et supprime le .err,
                                       sinon affiche l'erreur et le contexte.
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


if __name__ == "__main__":
    if len(sys.argv) == 1:
        for e in sorted(g.BUILD.glob("*/*.err")):
            first = e.read_text().splitlines()
            print(f"{e.parent.name}/{e.stem}: {first[0]} {first[1] if len(first) > 1 else ''}")
    else:
        for r in sys.argv[1:]:
            check(r)
