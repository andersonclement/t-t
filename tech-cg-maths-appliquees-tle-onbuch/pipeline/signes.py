#!/usr/bin/env python3
"""Générateur de tableaux de signes corrects pour un produit de facteurs
affines de coefficient directeur positif (x - r).

  tableau(["-2", "1", "2"], [("$x+2$", 0), ("$x-1$", 1), ("$x-2$", 2)], "$P(x)$")

Les racines sont données dans l'ordre croissant ; chaque facteur indique
l'indice de sa racine. Une colonne par valeur (−∞, racines, +∞) et une par
intervalle : les signes vont dans les colonnes d'intervalle, les 0 sous leur
racine, et la dernière ligne (le produit) est calculée.
"""


def tableau(racines, facteurs, produit, var="$x$"):
    n = len(racines)
    valeurs = ["$-\\infty$"] + [f"${r}$" for r in racines] + ["$+\\infty$"]
    ncol = 2 * (n + 1) + 1          # valeurs et intervalles alternés
    lignes = []
    tete = []
    for i, v in enumerate(valeurs):
        tete.append(v)
        if i < len(valeurs) - 1:
            tete.append("")
    lignes.append([var] + tete)
    signes_produit = [1] * (n + 1)   # un signe par intervalle
    for label, k in facteurs:
        row = []
        for i, v in enumerate(valeurs):
            # case sous la valeur i
            row.append("$0$" if 1 <= i <= n and i - 1 == k else "")
            if i < len(valeurs) - 1:
                # intervalle i : entre valeurs[i] et valeurs[i+1] ; x - r > 0 si l'intervalle est après r
                pos = i > k
                row.append("$+$" if pos else "$-$")
                signes_produit[i] *= 1 if pos else -1
        lignes.append([label] + row)
    zeros = {k for _, k in facteurs}
    prow = []
    for i, v in enumerate(valeurs):
        prow.append("$0$" if 1 <= i <= n and (i - 1) in zeros else "")
        if i < len(valeurs) - 1:
            prow.append("$+$" if signes_produit[i] > 0 else "$-$")
    lignes.append([produit] + prow)
    spec = "|c|" + "c" * ncol + "|"
    body = [" & ".join(l) + " \\\\" for l in lignes]
    return ("\\begin{tabular}{" + spec + "}\\hline\n" + body[0] + "\\hline\n" +
            "\n".join(body[1:-1]) + "\\hline\n" + body[-1] + "\\hline\n\\end{tabular}")


if __name__ == "__main__":
    print(tableau(["-2", "1", "2"], [("$x+2$", 0), ("$x-1$", 1), ("$x-2$", 2)], "$P(x)$"))
