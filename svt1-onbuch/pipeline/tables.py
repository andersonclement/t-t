#!/usr/bin/env python3
"""Repère les tableaux dont une ligne n'a pas autant de cases que de colonnes
déclarées (cause n°1 des « Extra alignment tab » : tableaux de variations).

  python3 pipeline/tables.py build/MA03/exercices.rev.tex [...]
"""
import re
import sys

TAB = re.compile(r"\\begin\{(tabular)\}\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}(.*?)\\end\{tabular\}", re.S)


def ncols(spec):
    spec = re.sub(r"[@!><]\{(?:[^{}]|\{[^{}]*\})*\}", "", spec)       # @{..} >{..} <{..}
    n = 0
    for m in re.finditer(r"\*\{(\d+)\}\{([^{}]*)\}", spec):
        n += int(m.group(1)) * len(re.findall(r"[lcrXCLR]|p\{", m.group(2)))
    spec = re.sub(r"\*\{\d+\}\{[^{}]*\}", "", spec)
    spec = re.sub(r"[pmb]\{[^{}]*\}", "c", spec)
    return n + len(re.findall(r"[lcrXCLR]", spec))


def cells(row):
    row = re.sub(r"\\multicolumn\{(\d+)\}", lambda m: "&" * (int(m.group(1)) - 1), row)
    depth, n = 0, 1
    for ch in row:
        depth += (ch == "{") - (ch == "}")
        n += (ch == "&" and depth == 0)
    return n


def check(path):
    t = open(path, encoding="utf-8").read()
    bad = []
    for m in TAB.finditer(t):
        k = ncols(m.group(2))
        rows = [r for r in re.split(r"\\\\", m.group(3)) if "&" in r]
        counts = [cells(r) for r in rows]
        if counts and max(counts) != k:
            line = t[:m.start()].count("\n") + 1
            bad.append((line, k, counts))
    return bad


if __name__ == "__main__":
    for p in sys.argv[1:]:
        for line, k, counts in check(p):
            print(f"{p}:{line} colonnes déclarées {k}, cases par ligne {counts}")
