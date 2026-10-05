# PLAN — « Tu n'es pas nul », par Ludovic A.

> Document d'architecture éditoriale. Il fait autorité pour la rédaction des chapitres, après le BRIEF (qui prime en cas de conflit sur les règles d'honnêteté). Aucun chapitre n'est écrit ici : seulement ce qu'il doit faire, contenir, éviter.

---

## 0. Vue d'ensemble

### 0.1 Titre, sous-titre, thèse, épigraphe

- **Titre définitif** : *Tu n'es pas nul*
- **Sous-titre** : *Ce que tes notes ne prouvent pas*
  (Il reprend le verbe central de la thèse, « prouver », et place le livre sur le terrain de la preuve plutôt que sur celui du réconfort.)
- **Signature** : Ludovic A.
- **Phrase-thèse** (à ne jamais citer telle quelle dans le livre ; elle sert de boussole) :
  « Nul » est une sentence ; ce qu'elle désigne est presque toujours un manque, et un manque, à la différence d'une sentence, se travaille.
- **Épigraphe** (non attribuée, en italique, seule sur sa page) :
  *On a écrit un mot sur toi. Ce n'était pas ton nom.*
  (Elle annonce le motif de l'étiquette du cahier, qui ne se résout qu'à la dernière page.)

### 0.2 Architecture générale et principe de composition

Le livre est construit comme une descente puis une remontée, avec un point noir exactement au milieu.

- **Partie I — Le verdict** descend : du dehors (le rang, la note) vers le dedans (la voix intérieure). Chaque chapitre va un cran plus profond. La partie se termine au point le plus bas, dans la tête d'une adolescente qui se traite de nulle dans deux langues.
- **Le milieu du livre** est un chapitre de 700 mots, *Vingt et une heures* : le courant saute, on ne voit plus rien, et c'est là, dans le noir, qu'on découvre qu'on sait encore quelque chose. La lumière ne revient pas dans ce chapitre. Elle reviendra dans l'épilogue.
- **Partie II — Le travail** remonte : méthodes solides, sans magie, de la plus intime (comprendre) à la plus exposée (la salle d'examen). Elle se termine sur une élève qui écrit son nom en haut d'une copie.
- **Partie III — Le monde** élargit : ce qui ne dépend pas de toi, la famille, puis l'auteur lui-même au travail (les deux chapitres OnBuch, où le « je » prend enfin du corps), puis le sommet émotionnel du livre : une lettre à une élève qui n'a pas trouvé son nom sur la liste.
- **L'épilogue** revient au premier élève, au premier mot, et le déplace.

Alternance interne obligatoire de chaque chapitre : **scène → idée → pratique → retour à la scène**. La scène d'ouverture n'est jamais abandonnée : on y revient au moins une fois au milieu et à la chute. Un chapitre qui ouvre sur un personnage et se termine sur une généralité est raté.

Respirations prévues : le prologue (court), l'interlude (très court, au milieu), la lettre (forme différente, à la fin de la partie III), l'épilogue (court). Le lecteur ne doit jamais lire plus de cinq chapitres « pleins » d'affilée sans un changement de forme.

### 0.3 Budget de mots

| Bloc | Mots visés |
|---|---|
| Liminaire | 100 |
| Prologue | 1 800 |
| Partie I (5 chapitres) | 16 400 |
| Partie II (5 chapitres + interlude) | 19 300 |
| Partie III (5 chapitres) | 17 400 |
| Épilogue | 1 400 |
| Note de l'auteur | 600 |
| Remerciements | 150 |
| Postface | 1 600 |
| **Total** | **≈ 58 750** |

Tolérance par chapitre : ± 10 %. Le total ne doit pas dépasser 60 000 mots ; s'il menace de le faire, on coupe dans les parties argumentatives, jamais dans les scènes.

### 0.4 Ordre de lecture et fichiers

Les titres de partie figurent en tête du premier chapitre de chaque partie (ligne `## Partie I — Le verdict` avant le titre du chapitre). Pas de fichier séparé pour les pages de partie.

| N° fichier | Fichier | Pièce | Mots |
|---|---|---|---|
| 00 | `chapitres/00-liminaire.md` | Titre, dédicace, épigraphe, avertissement | 100 |
| 01 | `chapitres/01-prologue-le-mot.md` | Prologue — Le mot | 1 800 |
| 02 | `chapitres/02-le-rang.md` | I.1 — Le rang | 3 200 |
| 03 | `chapitres/03-les-marches-manquantes.md` | I.2 — Les marches manquantes | 3 400 |
| 04 | `chapitres/04-la-main.md` | I.3 — La main | 3 200 |
| 05 | `chapitres/05-le-cahier-du-voisin.md` | I.4 — Le cahier du voisin | 3 000 |
| 06 | `chapitres/06-la-voix-de-dedans.md` | I.5 — La voix de dedans | 3 600 |
| 07 | `chapitres/07-redescendre.md` | II.1 — Redescendre | 3 800 |
| 08 | `chapitres/08-fermer-le-cahier.md` | II.2 — Fermer le cahier | 4 000 |
| 09 | `chapitres/09-vingt-et-une-heures.md` | Interlude — Vingt et une heures | 700 |
| 10 | `chapitres/10-dormir-n-est-pas-tricher.md` | II.3 — Dormir n'est pas tricher | 3 600 |
| 11 | `chapitres/11-l-encre-rouge.md` | II.4 — L'encre rouge | 3 600 |
| 12 | `chapitres/12-la-copie-double.md` | II.5 — La copie double | 3 600 |
| 13 | `chapitres/13-ce-qui-ne-depend-pas-de-toi.md` | III.1 — Ce qui ne dépend pas de toi | 3 600 |
| 14 | `chapitres/14-ce-qu-on-attend-de-toi.md` | III.2 — Ce qu'on attend de toi | 3 600 |
| 15 | `chapitres/15-la-lampe.md` | III.3 — La lampe (OnBuch, pourquoi) | 3 200 |
| 16 | `chapitres/16-atelier.md` | III.4 — Atelier (OnBuch, comment) | 4 000 |
| 17 | `chapitres/17-lettre-a-aicha.md` | III.5 — Lettre à Aïcha | 3 000 |
| 18 | `chapitres/18-epilogue-le-mot-encore.md` | Épilogue — Le mot, encore | 1 400 |
| 19 | `chapitres/19-note-de-l-auteur.md` | Note de l'auteur | 600 |
| 20 | `chapitres/20-remerciements.md` | Remerciements | 150 |
| 21 | `chapitres/21-postface-parents-enseignants.md` | Postface — Pour les parents et les enseignants | 1 600 |

Numérotation des chapitres dans le texte imprimé : 1 à 15 pour les chapitres de partie ; l'interlude, le prologue et l'épilogue ne sont pas numérotés.

### 0.5 Gabarit de chaque fichier chapitre

```
## Partie X — Titre de partie        (seulement pour le 1er chapitre d'une partie)

# N. Titre du chapitre

[Scène d'ouverture, en prose, sans intertitre]

[Cœur : 2 à 4 mouvements, séparés par un astérisme centré « * » — pas d'intertitres explicatifs]

### Ce soir, essaie ceci

[Prose, 250 à 500 mots, consignes concrètes datées dans le temps : ce soir, demain, dans trois jours]

[Retour à la scène et chute]

> **Pour le cahier**
> 3 à 5 lignes d'exercice écrit, à faire dans le cahier de brouillon.
```

Variantes autorisées : *Ce soir, essaie ceci* peut se placer avant le dernier mouvement plutôt qu'en fin ; un chapitre peut contenir deux passages pratiques (le second sans intertitre, fondu dans la prose). Exceptions prévues : interlude, lettre, épilogue (voir leurs fiches).

---

## 1. Les chapitres

Abréviations : **F** = fonction dans l'arc ; **O** = scène d'ouverture ; **I** = idées-force et faits ; **P** = passage pratique ; **C** = chute ; **M** = marqueurs ; **L** = liens et échos ; **X** = interdits de chapitre.

Toutes les références scientifiques citées ci-dessous sont des pistes **à vérifier avant publication** (auteurs, années, résultats). Les formuler toujours avec prudence (voir §5.4). Si une référence ne peut être vérifiée, on garde l'idée sans le nom.

---

### 00 — Liminaire (`00-liminaire.md`) — 100 mots

Contenu, dans l'ordre :
1. Titre, sous-titre, nom de l'auteur.
2. `⟦À COMPLÉTER PAR LUDOVIC : la dédicace, si tu en veux une — à qui, en une ligne⟧`
3. L'épigraphe : *On a écrit un mot sur toi. Ce n'était pas ton nom.*
4. L'avertissement, seul, en bas de page, en petits caractères : « Les prénoms et les parcours de ce livre sont composés à partir de situations réelles et typiques ; aucun n'est une personne précise. »

Rien d'autre. Pas de table des matières commentée, pas d'« avant-propos ».

---

### 01 — Prologue — Le mot (`01-prologue-le-mot.md`) — 1 800 mots

**F** — La blessure initiale et le contrat de lecture. Poser le mot, montrer ce qu'il fait, dire ce que le livre fera et ne fera pas. Planter trois motifs : l'étiquette du cahier, le cahier de brouillon du lecteur, la phrase-écho « ça ne prouve pas ce que tu crois ».

**O** — Ebolowa, une fin d'après-midi de saison sèche, une classe de cinquième où l'on s'assoit à trois par banc ; la chaleur tient sous la tôle. Le professeur de mathématiques rend les copies de la séquence en lisant les notes à voix haute, vite, parce qu'il lui reste deux autres classes à voir. « Essomba : quatre. Toujours nul. » Rodrigue, douze ans, rit le premier, pour que le rire des autres arrive sur un rire déjà commencé. Le soir, sur l'étiquette de son cahier de brouillon, à la ligne « Nom : », un camarade a barré « Rodrigue Essomba » et écrit au stylo à bille, en capitales : NUL. Rodrigue n'arrache pas l'étiquette. Il la garde, comme on garde une cicatrice qu'on n'a pas choisie.

**I** —
- La différence entre « j'ai eu quatre » (un événement, daté, partiel) et « je suis nul » (une identité, définitive, totale). Le mot fait passer de l'un à l'autre en une seconde : c'est sa violence propre.
- Un verdict arrête l'enquête ; un manque l'ouvre. On ne demande plus « qu'est-ce qui manque ? » à quelqu'un qu'on a déclaré nul.
- Justice rendue au professeur : un homme fatigué, des classes pléthoriques, une phrase dite sans y penser, que l'élève, lui, gardera des années. Ni excuse ni procès : constat de l'asymétrie entre celui qui dit et celui qui reçoit.
- Le mot s'accorde (« nul, ou nulle ») ; la blessure aussi. Une phrase, pas plus, pour inclure les lectrices sans alourdir le livre.
- Contrat : ce livre ne promet pas la réussite ; il promet de ne pas mentir. Il dira ce qui marche (avec ses limites), ce qui ne dépend pas de toi, et ce qui en dépend un peu.
- Première occurrence de la phrase-écho : *Ce que tu viens de vivre ne prouve pas ce que tu crois.*
- Pas de science dans ce chapitre.

**P** — *Ce soir, essaie ceci* : prends un cahier de brouillon neuf (ou les dernières pages d'un vieux), il sera le compagnon du livre. Sur la première page, écris la date, puis une seule phrase que quelqu'un a dite sur toi et que tu entends encore. Ne la commente pas. Ferme le cahier. On reviendra à cette page à la toute fin.

**C** — Retour à Rodrigue, le soir, sous l'ampoule de la cuisine : il regarde l'étiquette, il ouvre le cahier à la dernière page et fait ses exercices dessous, comme si de rien n'était. Dernière phrase sobre, du type : « L'étiquette est restée. Pour l'instant, c'est tout ce qu'on peut dire d'elle. »

**M** — 1 marqueur, placé après la scène de Rodrigue, dans un paragraphe en « je » qui tient seul si le marqueur est vide :
`⟦À COMPLÉTER PAR LUDOVIC : un moment où tu as entendu, reçu ou prononcé un verdict de ce genre — sur toi ou sur un autre — et ce qu'il t'a fait⟧`
Le paragraphe autour doit commencer par une phrase générale (« Ce mot, tout le monde l'a entendu un jour, ou l'a dit ») et finir par une phrase qui reprend le fil du livre, de sorte que le marqueur puisse faire trois lignes ou trois pages.

**L** — Étiquette → ch. 06 (écho intérieur), ch. 12 (Grâce écrit son nom), épilogue (résolution). Cahier du lecteur → tous les « Pour le cahier » → épilogue. Ebolowa et Rodrigue → ch. 03, 07, 14, épilogue.

**X** —
1. Pas de professeur-monstre ; pas de nom pour ce professeur.
2. Pas de statistiques sur l'échec scolaire, même vagues (« des millions d'élèves »).
3. Pas d'annonce du plan (« dans ce livre, nous verrons… »).
4. Pas de « tu es capable de tout », « tu es unique », « crois en toi ».
5. Pas de résolution : rien ne doit consoler Rodrigue dans le prologue.

**Pour le cahier** — remplacé par la consigne de la première page (ci-dessus).

---

### 02 — Le rang (`02-le-rang.md`) — 3 200 mots

## Partie I — Le verdict (en tête de fichier)

**F** — Ouvrir la partie I par la machine du verdict, vue de l'intérieur, et par un enseignant qui tient. Démonter la note comme instrument de mesure : utile, imparfait, partiel. Le lecteur doit sortir du chapitre capable de lire un bulletin comme une carte, pas comme un jugement.

**O** — Bafoussam, décembre, fin du premier trimestre. Monsieur Hilaire Kamga, professeur de mathématiques, calcule les moyennes de sa seconde C à la table de sa salle à manger, sous une lampe de bureau dont il faut tenir le fil d'une certaine façon pour qu'elle reste allumée. Plus de soixante-dix noms. La calculatrice, le registre, les copies empilées. Il remarque que la quarante-sixième et le quarante-septième sont séparés de deux centièmes. Il remarque aussi que Divine Nfor a seize en mathématiques et un rang de trente et unième : le rang ne voit pas le seize. Dans un petit cahier à couverture verte, son « cahier des noms », il écrit pour chaque élève une chose réussie dans le trimestre. Personne ne le lui demande.

**I** —
- Une note est une mesure prise un jour donné, sur une tâche donnée, dans des conditions données. Elle dit quelque chose de vrai ; elle ne dit pas tout.
- La docimologie : dès les années 1930, les travaux d'Henri Piéron et de ses collaborateurs ont montré que des copies identiques, confiées à des correcteurs différents, pouvaient recevoir des notes très éloignées. Depuis, de nombreuses études ont confirmé que la note dépend aussi du correcteur, de l'ordre des copies, de l'écriture. Formuler sans chiffre et sans cynisme : cela ne rend pas les notes inutiles, cela rend les verdicts imprudents.
- Le rang est relatif : il dépend autant des autres que de toi. Changer de classe peut changer ton rang sans que tu changes.
- L'effet des attentes (Rosenthal et Jacobson, *Pygmalion à l'école*, 1968) : l'étude a été très discutée ; les travaux ultérieurs suggèrent que les attentes des enseignants ont un effet réel mais en général modeste. Ne pas en faire une fatalité ; s'en servir pour dire que le regard compte, dans les deux sens.
- Ce que la moyenne écrase : la composition (16 en maths et 7 en français font une moyenne qui ne ressemble à aucun des deux), la trajectoire (passer de 4 à 8 est un progrès que le rang peut cacher).
- Rendre justice : la plupart des enseignants savent tout cela et notent quand même, parce qu'il faut bien noter. Kamga n'est pas un saint ; il est fatigué, il donne des répétitions le samedi pour joindre les deux bouts, il se trompe parfois. Il tient.
- Première apparition (simple mention) de la liste des admis affichée au portail en fin d'année : le rang de décembre en est la répétition générale.

**P** — *Ce soir, essaie ceci* : reprends ton dernier bulletin (ou tes dernières notes). À côté de chaque moyenne, écris sur ton cahier combien de devoirs elle résume et de quel type (exercice, rédaction, oral, contrôle surprise). Puis, pour la matière où tu es le plus bas, écris la note que tu croyais avoir avant de la recevoir. L'écart entre ce que tu croyais et ce que tu as eu est une information précieuse, plus utile que le rang : il dit si tu sais évaluer toi-même ce que tu sais.

**C** — Kamga éteint la lampe, le fil se décroche tout seul. Les bulletins partiront demain avec leurs rangs imprimés. Dans le cahier vert, à la ligne de Divine, il a écrit : « Démonstration du 14 novembre : propre, juste, et elle a trouvé une autre méthode que la mienne. » Ce cahier, aucun bulletin ne le reproduit.

**M** — Aucun.

**L** — Kamga → ch. 07, 11, 12, postface. Divine → ch. 06, 11. Cahier vert → ch. 11, postface. Liste au portail → ch. 17, épilogue. Encre rouge de Kamga → ch. 11.

**X** —
1. Pas de « les notes ne servent à rien » ni d'appel à les supprimer.
2. Pas d'attaque contre le système éducatif camerounais, le ministère ou les conseils de classe.
3. Pas d'anecdote sur les notes de l'auteur.
4. Ne pas traiter la peur de lever la main (ch. 04) ni la comparaison avec les autres (ch. 05).
5. Pas de chiffre sur les écarts entre correcteurs.

> **Pour le cahier** — Écris deux phrases : « Ma note de ___ dit que… » et « Elle ne dit pas que… ». Fais-le pour une seule matière, mais fais-le honnêtement : la première phrase compte autant que la seconde.

---

### 03 — Les marches manquantes (`03-les-marches-manquantes.md`) — 3 400 mots

**F** — Expliquer l'origine la plus fréquente de la « nullité » : les bases manquantes, en cascade. Diagnostiquer, sans encore réparer (la réparation est au ch. 07). Planter l'image de l'escalier et le talent mathématique de Mama Odile.

**O** — Ebolowa, novembre, la nuit. Rodrigue, en troisième, est devant un exercice de calcul littéral. Une ligne bloque tout : 2/3 + 1/4. Il sait qu'il devrait savoir. En face de lui, à la même table, sa mère, Mama Odile, trésorière de sa tontine, fait les comptes du mois de tête : qui a cotisé, qui doit, combien revient à qui, avec les parts et les retards. Elle ne pose aucune opération. Elle ne se trompe pas. Par la fenêtre, la maison du voisin, en chantier depuis des années : un escalier de béton nu, sans rampe, où il manque deux marches que personne n'a encore coulées.

**I** —
- Le savoir scolaire est cumulatif, surtout en mathématiques, en physique, en langues : chaque leçon s'appuie sur les précédentes. Quand une marche manque, la suivante n'est pas « difficile » : elle est inaccessible, et l'élève prend pour une incapacité ce qui est une absence.
- Les connaissances préalables comptent parmi les meilleurs prédicteurs de ce qu'on apprend ensuite ; de nombreuses études convergent sur ce point.
- L'effet Matthieu (Keith Stanovich, 1986, à propos de la lecture) : les petits écarts du début tendent à s'agrandir, parce que celui qui lit bien lit plus et progresse plus. Le présenter comme une tendance documentée, pas comme une loi.
- La mémoire de travail est limitée : on ne peut manipuler consciemment que quelques éléments à la fois. Quand une base n'est pas automatisée (les tables, les fractions, les accords), elle occupe cette place, et il ne reste plus rien pour la leçon du jour. C'est pour cela que l'élève « ne comprend rien » : il n'a plus de place pour comprendre.
- Chaque matière a son escalier : la conjugaison sous la dissertation, la proportionnalité sous la physique, le vocabulaire sous l'anglais.
- La honte de redescendre : en troisième, on n'ose pas réapprendre ce qu'on aurait dû savoir en CM2. C'est elle, plus que la difficulté, qui bloque.
- Mama Odile ne « connaît pas les fractions » : elle connaît les parts. Le savoir mathématique existe hors de l'école, sous d'autres noms. Ne pas idéaliser : elle-même dira qu'elle ne saurait pas faire l'exercice de son fils.
- Phrase-écho : un manque se comble.

**P** — *Ce soir, essaie ceci* : prends un exercice que tu as raté récemment. Pour la première étape qui t'a bloqué, écris : « Pour faire ça, il fallait savoir… ». Puis, pour ce que tu viens d'écrire, recommence : « Et pour savoir ça, il fallait savoir… ». Descends ainsi jusqu'à tomber sur une chose dont tu es sûr. La marche juste au-dessus est la tienne. Ne la répare pas encore : note-la, c'est tout. Le diagnostic est déjà un travail.

**C** — Rodrigue regarde sa mère compter. Il lui demande comment elle fait. Elle hausse les épaules : « Je partage. » Il note, au bas de sa page, « partager », sans savoir encore pourquoi. Le chantier du voisin, dans le noir, garde ses deux marches manquantes.

**M** — Aucun.

**L** — Escalier → ch. 07 (redescendre), ch. 16 (TD à trois niveaux), épilogue (le voisin a posé une rampe). Mama Odile et la tontine → ch. 14, postface. « Partager » → épilogue (les parts, les fractions de Bella).

**X** —
1. Ne pas donner la méthode de réparation complète (ch. 07).
2. Pas de « c'est la faute des profs du primaire ».
3. Pas de pourcentage d'élèves sans bases.
4. Ne pas faire de Mama Odile un génie méconnu : son savoir est réel, limité, et elle le sait.
5. Pas de neuro-mythe ; ne pas parler de « cerveau des maths ».

> **Pour le cahier** — Dessine un escalier de cinq marches pour la matière qui te fait le plus peur. Sur chaque marche, écris une notion, de la plus ancienne en bas à celle d'aujourd'hui en haut. Entoure la marche où tu n'es plus sûr.

---

### 04 — La main (`04-la-main.md`) — 3 200 mots

**F** — La peur de demander, la honte, le regard des autres. Montrer que ne pas demander est la façon la plus sûre d'aggraver les marches manquantes. Premier contact avec l'effet de l'anxiété sur la pensée.

**O** — Douala, octobre, une salle de Première A4 au lycée, de l'autre côté du pont sur le Wouri pour Grâce Ewane qui vient chaque matin de Bonabéri. Cours de mathématiques. La pluie commence sur la tôle et couvre la voix du professeur au moment exact où il passe d'une ligne à l'autre au tableau. Grâce a raté l'étape. Sa main se lève à moitié, sous la table, puis se transforme en geste pour remettre une mèche. Elle a calculé : si elle demande, quarante têtes se tournent. Elle copie la ligne sans la comprendre.

**I** —
- L'effet projecteur (Thomas Gilovich et ses collègues, 2000) : nous surestimons nettement à quel point les autres remarquent ce que nous faisons. Les quarante têtes se tournent moins longtemps, et oublient plus vite, que Grâce ne le croit.
- La « question bête » est très souvent la question de la moitié de la classe. Celle qui la pose rend service.
- L'anxiété consomme de la mémoire de travail : les travaux de Mark Ashcraft sur l'anxiété mathématique, ceux de Sian Beilock sur la performance sous pression, suggèrent que l'inquiétude occupe une partie des ressources dont on aurait besoin pour raisonner. On ne comprend pas moins bien parce qu'on est bête, on comprend moins bien parce qu'on a peur, et la peur prend de la place. (Développer ici ; le ch. 12 ne fera que le rappeler.)
- Le coût composé : une question non posée aujourd'hui est une marche manquante demain (lien explicite au ch. 03).
- Il existe d'autres façons de demander que lever la main : après le cours, par écrit, par le délégué, par un camarade, au professeur qu'on croise dans la cour. Un enseignant préfère presque toujours une question tardive à une copie vide.
- Gravité : quand le regard des autres devient moquerie répétée, insultes, mise à l'écart, c'est du harcèlement. On ne le règle pas seul ; on en parle à un adulte de confiance (parent, enseignant, surveillant général, conseiller d'orientation). Un paragraphe, sobre, sans détails.

**P** — *Ce soir, essaie ceci* : avant le prochain cours de la matière qui te fait peur, écris sur un petit papier une question précise (« À la ligne 3, pourquoi le signe change ? » plutôt que « je n'ai pas compris »). Tu n'es pas obligé de la poser en classe. Donne-la au professeur à la fin, ou pose-la à la sortie. La semaine suivante, pose-en une à voix haute. Une seule. L'objectif n'est pas d'être courageux, c'est d'être précis : une question précise fait moins peur qu'une question vague, parce qu'elle prouve que tu as travaillé.

**C** — Grâce écrit sa question au dos d'un rouleau de tickets de caisse pris au kiosque de sa tante. Elle le pose sur le bureau en sortant, sans un mot. Le lendemain, le professeur commence par : « Quelqu'un m'a demandé hier pourquoi… » Dans la salle, des têtes hochent. Grâce ne lève pas les yeux. Elle compte les têtes.

**M** — Aucun.

**L** — Pluie sur la tôle → ch. 11, ch. 17. Tickets de caisse de Grâce → ch. 12. Mémoire de travail → rappel bref ch. 12. Demander de l'aide → approfondi ch. 11.

**X** —
1. Pas de « ose ! », « affronte tes peurs », « sors de ta zone de confort ».
2. Ne pas présenter la timidité comme un défaut de caractère.
3. Ne pas affirmer la « menace du stéréotype » comme un effet établi (résultats discutés) ; mieux vaut ne pas l'invoquer.
4. Pas de comparaison entre élèves (ch. 05).
5. Pas de professeur qui humilie : celui de Grâce est simplement pressé.

> **Pour le cahier** — Écris la dernière question que tu n'as pas posée. Puis réécris-la de façon plus précise, en nommant la ligne, le mot ou l'étape. Garde-la pour le prochain cours.

---

### 05 — Le cahier du voisin (`05-le-cahier-du-voisin.md`) — 3 000 mots

**F** — La comparaison. Montrer qu'elle est inévitable, qu'elle trompe souvent, et qu'on peut la rendre utile. Introduire Ibrahim et la dignité des mains, sans encore plaider pour le technique (ch. 14).

**O** — Ngaoundéré, novembre, lycée technique, Première F3 électrotechnique. Devoir de français : une dissertation. Ibrahim Saïdou a écrit une demi-page. Son voisin de banc en est à la deuxième copie double. Ibrahim regarde l'écriture serrée, les paragraphes qui ont l'air de savoir où ils vont. Le soir même, chez son oncle, il remet en marche un ventilateur que tout le monde croyait mort ; l'oncle le remercie puis lui demande, devant la famille réunie, s'il compte « faire comme Moussa », son grand frère étudiant en médecine, dont la photo en blouse est au mur.

**I** —
- Leon Festinger (1954) : nous nous évaluons en grande partie en nous comparant aux autres. Ce n'est pas un vice, c'est une manière ordinaire de se situer.
- La comparaison porte sur ce qui se voit : la longueur de la copie, la note affichée, la photo en blouse. Elle ignore ce qui ne se voit pas : les heures, les aides, les répétiteurs, les nuits, les échecs du voisin.
- L'effet « gros poisson dans une petite mare » (Herbert Marsh, à partir des années 1980) : à niveau égal, un élève a tendance à se juger moins bon dans une classe forte que dans une classe faible. Preuve que l'image de soi dépend de l'entourage autant que de soi.
- Les écrans montrent des vitrines (réussites, photos de résultats), jamais des arrière-boutiques. Une phrase ou deux, pas de sermon.
- Comparer utilement : copier des méthodes, pas des identités. Demander « comment tu travailles ? » plutôt que « combien tu as eu ? ».
- La seule comparaison qui mesure ton chemin : toi, il y a trois mois. D'où l'intérêt du cahier.
- Ibrahim n'est pas « nul en français » et « fort en technique » : il est quelqu'un qui n'a pas encore les outils de la dissertation et qui a ceux du diagnostic. Le chapitre ne conclut pas sur sa « vraie voie ».

**P** — *Ce soir, essaie ceci* : choisis une personne qui réussit dans la matière où tu peines. Demain, pose-lui une seule question : « Comment tu t'y prends, concrètement, la veille d'un devoir ? » Écoute la réponse sans la comparer à la tienne. Essaie une seule de ses habitudes pendant une semaine. Puis, dans ton cahier, relis ce que tu écrivais à la première page et regarde ce qui a bougé depuis.

**C** — Le ventilateur tourne. Ibrahim ne répond pas à l'oncle ; il serre la dernière vis. Sur la table, sa demi-page de français est restée pliée en deux. La phrase finale ne tranche rien.

**M** — Aucun.

**L** — Ibrahim et le ventilateur → interlude (le ventilateur s'arrête), ch. 14, ch. 16 (écho du mot « atelier »). Moussa → ch. 14. Comparaison à soi-même → ch. 08, épilogue.

**X** —
1. Pas de « ne te compare jamais aux autres » (conseil impossible).
2. Ne pas dénigrer Moussa ni les études de médecine.
3. Pas de plaidoyer pour les filières techniques (réservé au ch. 14).
4. Pas de sermon sur les réseaux sociaux.
5. Pas de « chacun son talent » : la formule dispense de travailler le français.

> **Pour le cahier** — Écris le nom d'une personne à qui tu te compares souvent. Sous son nom, deux colonnes en prose : ce que tu vois d'elle, ce que tu ne vois pas. La deuxième doit être plus longue que la première.

---

### 06 — La voix de dedans (`06-la-voix-de-dedans.md`) — 3 600 mots

**F** — Le point le plus bas du livre. Comment le verdict extérieur devient voix intérieure. Démonter cette voix sans la remplacer par une autre voix fausse (« pense positif »). Traiter avec nuance la « mentalité de croissance ». Signaler, avec gravité, le moment où la voix devient un danger.

**O** — Bafoussam, janvier, la nuit. Divine Nfor, quinze ans, seconde C, a récupéré une dictée : vingt-trois fautes, entourées en rouge. Sa famille est arrivée de Bamenda il y a trois ans ; elle pense en anglais, compte en anglais, rêve parfois en pidgin, et passe ses journées en français. Dans son lit, la voix commence. Elle parle d'abord en anglais, puis en français, et dans les deux langues elle dit la même chose. (Rendre cette voix en italique, brève, sans caricature de langue.)

**I** —
- La voix intérieure est souvent une voix extérieure qu'on a gardée : celle d'un professeur, d'un parent, d'un camarade, du prologue. Elle a l'accent de quelqu'un.
- Les attributions (travaux de Bernard Weiner) : la façon dont on explique un échec compte. « Je suis nulle » est une explication stable, générale, intérieure ; « je n'ai pas encore automatisé les accords du participe passé » est précise et modifiable. La seconde n'est pas plus gentille : elle est plus exacte.
- L'impuissance apprise (Martin Seligman et Steven Maier, années 1960, théorie révisée par eux-mêmes en 2016) : à force d'échecs vécus comme incontrôlables, on cesse d'essayer. Formuler prudemment, en signalant que la théorie a évolué.
- La distance : des travaux d'Ethan Kross et de ses collègues suggèrent que se parler à la deuxième personne ou par son prénom aide à prendre du recul. Clin d'œil, sans insister : c'est peut-être pour cela que ce livre te tutoie.
- La « mentalité de croissance » (Carol Dweck) : l'idée que les capacités se développent est plus exacte que l'idée qu'elles sont fixées. Mais les études à grande échelle suggèrent que les interventions qui l'enseignent ont des effets moyens modestes, plus nets chez certains élèves en difficulté et dans des contextes qui les soutiennent. Le slogan peut même nuire quand il sert à accuser l'élève (« tu n'as pas le bon état d'esprit »). Ce livre n'a pas besoin du slogan ; il a besoin de méthodes et de vérité.
- Gravité : si la voix ne s'arrête plus, si le sommeil part, si plus rien n'a de goût, si l'idée vient de disparaître ou de se faire du mal, ce n'est plus une question de méthode. On en parle à un adulte de confiance, à un médecin, aujourd'hui. Paragraphe sobre, sans détails, sans dramatisation, détaché du reste du chapitre par un astérisme.
- Phrase-écho (variante) : ce que tu te dis ne prouve pas ce que tu crois.

**P** — *Ce soir, essaie ceci* : écris mot pour mot la phrase que ta voix intérieure t'a dite aujourd'hui. Puis réécris-la en la rendant précise : quoi, dans quelle matière, sur quel point, depuis quand. Enfin, écris ce que tu dirais à ton meilleur ami s'il te montrait la même copie. Relis les trois phrases. Celle qui est vraie n'est pas toujours la plus douce, mais ce n'est presque jamais la première.

**C** — Divine se relève, allume la lampe torche de son téléphone, ouvre un carnet bleu qu'elle avait acheté pour autre chose. Elle recopie les vingt-trois fautes, une par ligne, et à côté de chacune, la règle. Elle n'en fait que sept ce soir-là. La voix se tait un peu, pas complètement. Fin de la partie I.

**M** — Aucun.

**L** — Carnet bleu → ch. 11 (carnet d'erreurs). Encre rouge → ch. 11. Étiquette du prologue (la voix comme étiquette intérieure). Lampe torche → interlude, épilogue. Gravité → ch. 17, postface.

**X** —
1. Pas de « pense positif », d'affirmations à répéter devant le miroir.
2. Pas de présentation de la mentalité de croissance comme prouvée ou miraculeuse.
3. Pas de description détaillée d'idées suicidaires ou d'automutilation.
4. Pas de diagnostic psychologique posé sur un personnage.
5. Ne pas faire de la langue de Divine un handicap folklorique : son bilinguisme est aussi une force, dite en une phrase, sans en faire la morale.

> **Pour le cahier** — Recopie ta phrase intérieure du jour. En dessous, réécris-la avec un « pas encore » et un détail précis. Exemple de forme : « Je ne sais pas encore accorder les participes avec avoir. »

---

### 07 — Redescendre (`07-redescendre.md`) — 3 800 mots

## Partie II — Le travail (en tête de fichier)

**F** — Ouvrir la remontée. Comprendre avant de réciter ; reconstruire les bases en marche arrière ; les matières qu'on déteste. Montrer que Rodrigue possède déjà la méthode, ailleurs. Planter discrètement l'équation-produit nul.

**O** — Ebolowa, un samedi de février, la boutique de réparation de téléphones de tonton Fabrice, au carrefour. Rodrigue y passe ses samedis. Une cliente apporte un téléphone dont l'écran reste noir. Rodrigue ne dit pas « il est nul » : il remonte. Batterie, nappe, connecteur, écran. Il teste chaque élément, du symptôme vers la cause. Il trouve. Tonton Fabrice ne le félicite pas, il lui tend le suivant.

**I** —
- Le diagnostic du ch. 03 donne la marche ; ici, on la répare. La méthode du téléphone est la méthode de l'escalier : partir du symptôme, remonter vers la cause, réparer en bas, retester en haut.
- Comprendre et retenir ne s'opposent pas : on retient mieux ce qu'on comprend, et l'automatisation de certaines bases (tables, formules) libère la mémoire de travail pour comprendre le reste. Le par-cœur n'est pas l'ennemi ; le par-cœur sans compréhension est fragile.
- Les exemples résolus (théorie de la charge cognitive, John Sweller) : pour un débutant, étudier un exercice corrigé pas à pas est souvent plus efficace que chercher seul à l'aveugle ; puis on retire progressivement l'aide.
- L'auto-explication (travaux de Michelene Chi) : expliquer à voix haute pourquoi chaque étape est là améliore la compréhension.
- Neuro-mythes à démonter ici, en peu de lignes : les « styles d'apprentissage » (visuel, auditif, kinesthésique) — une revue de Harold Pashler et de ses collègues (2008) n'a pas trouvé de preuve solide qu'adapter l'enseignement à un style déclaré améliore l'apprentissage ; et l'idée qu'on n'utiliserait que 10 % de son cerveau, qui est fausse.
- Redescendre sans honte : emprunter le manuel du petit frère, de la petite cousine, une classe en dessous. Un quart d'heure par jour, sur une seule marche, plutôt que trois heures un dimanche.
- Les matières qu'on déteste : la haine d'une matière est souvent une incompréhension ancienne qui s'est donné un caractère. On ne demande pas d'aimer ; on observe que l'intérêt tend à venir avec un peu de compétence, pas avant (formuler comme une observation fréquente, pas comme une loi).
- Kamga, à Bafoussam, en une scène brève : une élève ne comprend pas son explication ; il en donne une deuxième, différente, avec des haricots sur la table. Rendre justice aux enseignants qui expliquent autrement.
- Plant : en classe, Rodrigue recopie la propriété « un produit de facteurs est nul si et seulement si l'un au moins des facteurs est nul » sans y voir autre chose qu'une ligne de plus. Une phrase, pas de commentaire.

**P** — *Ce soir, essaie ceci* : reprends la marche entourée au ch. 03. Trouve un manuel ou un cahier d'une classe inférieure où elle est expliquée. Lis l'exemple résolu, cache-le, refais-le seul. Explique chaque étape à voix haute, au mur s'il le faut. Fais trois exercices de cette marche par jour pendant dix jours, pas plus de vingt minutes. Ne passe à la marche suivante que lorsque tu peux faire l'exercice sans regarder.

**C** — Rodrigue, le soir, reprend 2/3 + 1/4. Il pense aux parts de sa mère. Il trouve onze douzièmes. Personne n'applaudit ; la radio de la boutique parle d'un match. Il passe à la ligne suivante.

**M** — Aucun.

**L** — Ch. 03 (diagnostic) ; boutique de tonton Fabrice → ch. 10 (le téléphone), épilogue ; produit nul → épilogue ; Kamga → ch. 11 ; « atelier » de réparation → ch. 16.

**X** —
1. Ne pas refaire le diagnostic de la cascade (ch. 03).
2. Pas de mépris pour le par-cœur.
3. Pas de test de rappel ni de pratique espacée en détail (ch. 08) ; une phrase de renvoi au plus.
4. Pas de progrès miracle : dix jours ne réparent qu'une marche.
5. Ne jamais valider les styles d'apprentissage, même en passant.

> **Pour le cahier** — Écris la marche que tu répares cette semaine, puis un exemple résolu recopié de ta main, avec, à côté de chaque ligne, un « parce que… ».

---

### 08 — Fermer le cahier (`08-fermer-le-cahier.md`) — 4 000 mots

**F** — Le cœur méthodologique du livre : se tester plutôt que relire, espacer, organiser le temps long. Le chapitre le plus riche en science ; il doit rester le plus incarné.

**O** — Yaoundé, janvier, une chambre de mini-cité près du campus de Ngoa-Ekellé. Nadège Kenfack, dix-neuf ans, première année de sciences biologiques, relit pour la quatrième fois ses notes surlignées en quatre couleurs. Tout lui paraît familier, presque évident. Le lendemain, à l'examen, devant la première question, rien ne vient. Elle reconnaissait ; elle ne savait pas retrouver.

**I** —
- L'illusion de maîtrise : relire donne une impression de familiarité qu'on confond avec le savoir. Reconnaître n'est pas rappeler.
- L'effet de test : dans une expérience devenue classique (Henry Roediger et Jeffrey Karpicke, 2006), des étudiants qui s'étaient testés sur un texte s'en souvenaient mieux une semaine plus tard que ceux qui l'avaient relu, alors qu'ils se sentaient moins sûrs d'eux. De nombreuses études vont dans le même sens.
- Une revue de John Dunlosky et de ses collègues (2013) a classé les techniques d'étude : se tester et espacer ses révisions y apparaissent parmi les plus utiles ; relire et surligner parmi les moins utiles. Le dire sans humilier Nadège ni le lecteur qui surligne.
- La courbe de l'oubli (Hermann Ebbinghaus, 1885) et la pratique espacée : on oublie vite après avoir appris, et revenir sur une notion à intervalles croissants ralentit l'oubli. Une méta-analyse de Nicholas Cepeda et de ses collègues (2006) confirme largement l'avantage de l'espacement. Ne pas donner de pourcentages.
- Les difficultés désirables (Robert Bjork) : ce qui coûte un effort au moment d'apprendre (chercher, se tromper, attendre avant de revoir) aide souvent à retenir. C'est pour cela que la bonne méthode paraît moins agréable que la mauvaise.
- L'entrelacement (Doug Rohrer et ses collègues, surtout en mathématiques) : mélanger des types d'exercices plutôt que d'en faire vingt identiques ; résultats prometteurs, à présenter comme tels.
- La boîte de Leitner, fabriquée avec un carton d'emballage découpé : des cartes question-réponse qui avancent quand on sait et reculent quand on oublie. Méthode sans courant, sans connexion, sans argent.
- Le temps long : un calendrier à rebours depuis l'examen ; un peu, souvent ; rien de spectaculaire.

**P** — *Ce soir, essaie ceci* : après avoir étudié une leçon, ferme le cahier. Sur une page de brouillon, écris tout ce dont tu te souviens, sans regarder, pendant dix minutes. Puis rouvre et corrige d'une autre couleur ce qui manque ou ce qui est faux. Écris trois questions sur cette leçon et date-les : tu y répondras sans notes demain, puis dans quelques jours, puis la semaine suivante. Les intervalles exacts importent moins que le fait de revenir.

Second passage pratique, fondu dans la prose : fabriquer la boîte de Leitner en carton, trois compartiments.

**C** — Nadège ferme son classeur. Dans le couloir de la mini-cité, une radio, des sandales qui traînent. Elle découpe un carton de lait en poudre en rectangles et écrit trois questions. Elle ne sait pas encore si ça marchera. Elle sait que relire ne marchait pas.

**M** — Aucun.

**L** — Interlude (le rappel dans le noir) ; ch. 11 (le carnet d'erreurs se révise de la même façon) ; ch. 12 (annales en conditions réelles) ; ch. 13 (Nadège au cybercafé, résultat partiel du rattrapage) ; ch. 16 (pourquoi un corrigé ne doit pas être lu trop tôt).

**X** —
1. Pas de sommeil (ch. 10) ni de jour d'examen (ch. 12).
2. Pas de méthode à nom de marque ni de chiffres d'oubli (« on oublie 70 % en 24 h »).
3. Pas de honte pour ceux qui surlignent.
4. Pas de liste à puces des « 7 techniques » : la prose porte la méthode.
5. Pas de retour sur les bases manquantes (ch. 03, 07).

> **Pour le cahier** — Écris aujourd'hui trois questions sur ta leçon du jour. Note à côté la date où tu y répondras sans regarder. Le jour venu, coche celles que tu as retrouvées.

---

### 09 — Interlude — Vingt et une heures (`09-vingt-et-une-heures.md`) — 700 mots

**F** — Le centre exact du livre. Une respiration, une seule scène, et la preuve vécue de la méthode du ch. 08 : on peut savoir dans le noir. La lumière ne revient pas.

**O / forme** — Deuxième personne, présent, phrases plus courtes que partout ailleurs. Il est 21 h. Tu es au milieu d'une leçon. Le courant part. Le quartier pousse ce soupir collectif qu'on connaît. Un groupe électrogène démarre deux maisons plus loin, pas chez toi. Tu ne vois plus ta page. Tu pourrais chercher la bougie. Tu ne la cherches pas tout de suite. Tu fermes les yeux, puisqu'ils ne servent plus, et tu récites ce que tu as appris ce soir. Ce qui revient. Ce qui ne revient pas. Les trois questions écrites hier.
Insert de quatre ou cinq phrases : à Ngaoundéré, au même moment, Ibrahim sait que c'est le transformateur du quartier ; le ventilateur ralentit et s'arrête ; il récite à mi-voix la loi d'Ohm pour s'occuper.
Retour au « tu ». Dans le noir, tu découvres ce que tu sais vraiment : ce qui est là sans la page.

**I** — Aucune référence scientifique. Rien n'est expliqué : tout a été expliqué au ch. 08.

**P** — Une seule phrase pratique, fondue dans le texte, sans intertitre : « Ce soir, si le courant part, ne cherche pas la bougie tout de suite. »

**C** — Le courant ne revient pas. Le chapitre s'arrête dans le noir, sur une phrase très courte.

**M** — Aucun.

**L** — Ch. 08 (rappel) ; ventilateur d'Ibrahim (ch. 05) ; épilogue (le courant revient, cri du quartier). Lampe torche → ch. 06, épilogue.

**X** —
1. Pas de plainte contre la compagnie d'électricité, pas de nom d'entreprise.
2. Pas d'explication scientifique.
3. Pas de misérabilisme (« dans l'obscurité de la misère… »).
4. Ne pas dépasser 800 mots.
5. Pas de « Pour le cahier » : le cahier est fermé, il fait noir.

---

### 10 — Dormir n'est pas tricher (`10-dormir-n-est-pas-tricher.md`) — 3 600 mots

**F** — Le corps : sommeil, chaleur, alimentation, mouvement ; l'attention et le téléphone. Dire la vérité sans moralisme ni promesse.

**O** — Garoua, février, la veille d'un bac blanc. 2 h du matin. Aïcha Bello, Terminale D, révise à la lumière d'une lampe solaire qui faiblit, chargée toute la journée sur le toit. Il fait chaud même la nuit. Sa petite sœur Hadja dort sur la natte près de la porte, là où passe l'air. Aïcha boit un café soluble trop sucré. Elle a l'impression que dormir serait tricher avec le travail. Le lendemain, elle lit trois fois la même question de SVT sans en saisir la fin.

**I** —
- Le sommeil participe à la consolidation de la mémoire : de nombreux travaux (par exemple la revue de Susanne Diekelmann et Jan Born, 2010) suggèrent que ce qu'on a appris dans la journée est en partie stabilisé pendant la nuit. Formuler avec prudence ; éviter les affirmations spectaculaires popularisées sur le sujet.
- Le manque de sommeil dégrade l'attention, l'humeur et le raisonnement ; la nuit blanche avant un examen coûte en général plus qu'elle ne rapporte.
- Chez les adolescents, l'horloge biologique tend à se décaler vers des couchers plus tardifs (travaux de Mary Carskadon) : ce n'est pas de la paresse. Le dire, sans promettre de solution à l'heure d'entrée en classe.
- La chaleur, le bruit, la promiscuité : des conseils modestes et sans argent (l'heure fraîche, l'eau, les révisions difficiles tôt le matin).
- Manger, bouger, boire : quelques effets raisonnables, rien de miraculeux ; pas de régime, pas de complément.
- L'attention : passer d'une tâche à l'autre a un coût (travaux sur la commutation de tâches, Stephen Monsell et d'autres) ; le multitâche est surtout une alternance rapide et coûteuse. Chaque notification est une petite interruption.
- Le téléphone : une étude d'Adrian Ward et de ses collègues (2017) a suggéré que la simple présence du téléphone pouvait réduire certaines performances ; d'autres équipes n'ont pas toujours retrouvé l'effet. Garder la conclusion la plus prudente : éloigner le téléphone pendant le travail ne coûte rien et aide probablement.
- La lumière bleue : effet discuté et sans doute modeste ; ce qui empêche de dormir, c'est souvent ce qu'on regarde plus que la couleur de l'écran.
- Le forfait : le téléphone est aussi un outil de travail cher ; gaspiller ses données sur des vidéos le soir de révision, c'est payer deux fois. Une phrase, sans sermon.
- Écho : Rodrigue répare des téléphones et perd des heures sur le sien. Ironie douce, deux phrases.

**P** — *Ce soir, essaie ceci* : fixe-toi une heure de coucher pour la semaine qui précède ton prochain devoir important, et tiens-la même si tu n'as pas fini. La veille, ne révise rien de nouveau après le dîner : relis tes questions, réponds-y, dors. Et pendant tes séances de travail, donne ton téléphone à quelqu'un de la maison pour quarante-cinq minutes, ou mets-le hors de portée et hors réseau. Note dans ton cahier ce que tu as fait pendant ces quarante-cinq minutes.

**C** — La semaine suivante, à 23 h, Aïcha éteint. La lampe solaire, de toute façon, clignote. Elle la laisse s'éteindre seule. Hadja, dans son sommeil, tire le pagne à elle.

**M** — Aucun.

**L** — Lampe solaire → ch. 13, 15, 17. Aïcha et Hadja → ch. 12 (évocation), ch. 17. Rodrigue et les téléphones → ch. 07, épilogue. Nadège et ses nuits au cybercafé → ch. 13.

**X** —
1. Pas de dogme des « huit heures obligatoires ».
2. Pas de panique sur la lumière bleue ni sur « les jeunes accros aux écrans ».
3. Pas de conseil alimentaire précis, de régime, de complément, de boisson énergisante recommandée ou proscrite par marque.
4. Ne pas revenir sur l'effet de test (ch. 08).
5. Pas d'affirmation chiffrée sur le temps d'écran.

> **Pour le cahier** — Note pendant cinq soirs l'heure où tu t'es couché et une phrase sur ton attention du lendemain. Ne conclus rien avant le cinquième soir.

---

### 11 — L'encre rouge (`11-l-encre-rouge.md`) — 3 600 mots

**F** — L'erreur comme matériau ; demander de l'aide ; travailler à plusieurs. Le chapitre où l'élève et l'enseignant se rejoignent.

**O** — Bafoussam, mars, la nuit. Il pleut sur la tôle. Kamga corrige quarante copies de seconde au stylo rouge. Il trouve la même erreur trente fois (une confusion sur le signe dans une inéquation). Il pose son stylo : trente fois la même erreur, ce n'est pas trente élèves nuls, c'est une leçon qu'il faut refaire. Le lendemain, Divine vient le voir après le cours avec son carnet bleu, ouvert à une page où elle a recopié son erreur et une question écrite (écho au ch. 04). Plus tard, sous le manguier de la cour, elle et deux camarades se relaient au petit tableau d'ardoise d'une salle vide.

**I** —
- Une erreur est une information : elle montre où la pensée a bifurqué. On peut la classer (lecture, attention, méthode, notion) et chaque type appelle un remède différent.
- L'effet d'hypercorrection (Janet Metcalfe et ses collègues) : les erreurs commises avec assurance, une fois corrigées, sont souvent particulièrement bien retenues. Raison de plus pour regarder ses erreurs plutôt que de les cacher.
- Le retour ne sert que s'il est utilisé : les synthèses de John Hattie et Helen Timperley (2007) suggèrent que le retour d'information fait partie des leviers puissants, à condition qu'il dise où l'on en est et quoi faire ensuite. L'encre rouge ne sert à rien si la copie va directement au fond du sac.
- L'échec productif (Manu Kapur) : chercher et se tromper avant qu'on vous montre la solution peut aider, dans certaines conditions. Prudence ; ne pas en faire une règle universelle.
- Demander de l'aide est une compétence : savoir à qui, quand, et avec quelle question. Une question précise (« ligne 4 ») vaut dix « je n'ai rien compris ».
- Travailler à plusieurs : expliquer à quelqu'un aide à comprendre (des études suggèrent que le simple fait de s'attendre à enseigner améliore l'apprentissage, par exemple John Nestojko et ses collègues, 2014) ; le tutorat entre pairs profite souvent aux deux. Mais un groupe peut aussi devenir un salon : règles simples pour qu'il travaille (une heure, un objectif, chacun au tableau, pas de copie des devoirs).
- Copier le devoir d'un camarade : une note empruntée, une marche qui reste manquante. Une phrase, pas de leçon de morale.

**P** — *Ce soir, essaie ceci* : ouvre un carnet d'erreurs (ou une partie de ton cahier). Pour chaque erreur de ta dernière copie, écris en une phrase ce que tu as fait, pourquoi, ce qu'il fallait faire, et un exercice semblable à refaire dans trois jours. Puis, cette semaine, propose à deux camarades une heure de « tour de tableau » : chacun explique à voix haute un exercice aux autres, sans notes ; les autres posent les questions.

**C** — Kamga, tard, voit son stylo rouge s'épuiser au milieu d'un mot. Il finit la correction au bleu. Il trouve que ça ne change rien à ce qu'il écrit. Dans le cahier vert, à la ligne de Divine : « Est venue avec sa question écrite. »

**M** — Aucun.

**L** — Pluie sur la tôle (ch. 04, ch. 17) ; carnet bleu (ch. 06) ; cahier vert (ch. 02, postface) ; question écrite (ch. 04) ; ch. 08 (réviser le carnet d'erreurs de façon espacée) ; ch. 16 (l'auteur qui corrige ses propres contenus : encre et vérification).

**X** —
1. Pas de « l'échec est une chance », « il n'y a pas d'erreurs, que des leçons ».
2. Ne pas réexpliquer la peur de lever la main (ch. 04) ; un renvoi suffit.
3. Pas d'examen ni de stress d'examen (ch. 12).
4. Ne pas accabler les enseignants qui rendent les copies sans commentaire : dire qu'ils manquent de temps.
5. Pas de citation sur l'erreur attribuée à un savant célèbre.

> **Pour le cahier** — Recopie ta dernière erreur importante. À côté, écris de quel type elle est (lecture, attention, méthode, notion) et la date où tu referas un exercice du même genre.

---

### 12 — La copie double (`12-la-copie-double.md`) — 3 600 mots

**F** — Les examens et la peur d'examen ; clore la partie II sur un geste de dignité : écrire son nom.

**O** — Douala, juin, le matin du Probatoire. File devant le centre d'examen, appel des noms dans un ordre qui n'est pas celui de la classe, cartes d'identité, salle inconnue, odeur de craie et de peinture fraîche. Les surveillants distribuent les copies doubles. Grâce Ewane a les mains moites. Elle a glissé dans sa trousse un bout de rouleau de tickets où elle a écrit trois choses à faire pendant les dix premières minutes. Le sujet est posé, face cachée.

**I** —
- Le stress d'examen est normal ; il peut aider à un certain niveau et nuire au-delà. La célèbre courbe en cloche (attribuée à Yerkes et Dodson) est une simplification ; garder l'idée, pas la certitude.
- Rappel bref (une phrase, renvoi au ch. 04) : l'inquiétude occupe la mémoire de travail.
- La réévaluation : des travaux de Jeremy Jamieson et de ses collègues (2010) suggèrent qu'interpréter les signes physiques du stress (cœur rapide, mains moites) comme une préparation du corps plutôt que comme un danger peut améliorer la performance.
- L'écriture expressive : une étude de Gerardo Ramirez et Sian Beilock (2011) a suggéré qu'écrire ses inquiétudes quelques minutes avant un examen aidait des élèves anxieux ; les reproductions ont donné des résultats mitigés. La proposer comme une piste, pas comme une recette.
- La respiration lente, avec une expiration plus longue que l'inspiration, aide beaucoup de gens à se calmer ; le dire simplement, sans physiologie de comptoir.
- La meilleure préparation à l'examen est l'examen : s'entraîner sur des annales, chronométré, dans des conditions proches (lien ch. 08 : c'est l'effet de test en grandeur réelle).
- La stratégie dans la salle : lire tout le sujet, commencer par ce qu'on sait, répartir le temps, laisser de la place, garder dix minutes pour relire.
- La veille et le matin : dormir (renvoi ch. 10), manger, arriver tôt. Après : ne pas faire le corrigé dans la cour avec ceux qui sont sûrs d'eux.
- La fraude : on n'en parle qu'une fois, sobrement : elle vole d'abord celui qui la commet, et elle peut coûter beaucoup plus que l'examen.
- Gravité : crises de panique, malaises répétés → en parler à un médecin ou à l'infirmerie, avant la période d'examens.

**P** — *Ce soir, essaie ceci* : choisis un samedi matin, à l'heure exacte de l'épreuve. Prends une annale. Mets-toi à une table dégagée, chronomètre, copie double, pas de téléphone. Fais l'épreuve entière. Corrige-la ensuite avec le corrigé, honnêtement, comme un correcteur sévère. Et écris sur un petit papier tes trois gestes des dix premières minutes : par exemple respirer, lire tout le sujet, choisir l'exercice par lequel commencer.

**C** — Le sujet se retourne. Grâce respire, lit, ne comprend pas la première question, passe à la deuxième. Avant tout cela, elle a fait la seule chose qui soit entièrement sûre ce matin-là : en haut de la copie double, dans le cadre prévu, elle a écrit son nom. Le chapitre ne dit pas comment s'est passé l'examen. Fin de la partie II.

**M** — Aucun.

**L** — Étiquette du prologue / épigraphe (le nom à sa place) ; tickets de Grâce (ch. 04) ; ch. 08 ; ch. 10 ; ch. 17 (résultats, autre élève, autre examen) ; le résultat de Grâce n'est jamais donné dans le livre.

**X** —
1. Aucune promesse sur le résultat ; ne pas révéler le résultat de Grâce.
2. Pas de « garde ton calme », « reste zen » sans moyen concret.
3. Pas de détails sur le sommeil (ch. 10).
4. Pas d'anecdote glorieuse de fraude ni de complaisance.
5. Ne pas réexpliquer la mémoire de travail.

> **Pour le cahier** — Écris tes trois gestes des dix premières minutes. Recopie-les sur un papier que tu emporteras le jour de l'examen.

---

### 13 — Ce qui ne dépend pas de toi (`13-ce-qui-ne-depend-pas-de-toi.md`) — 3 600 mots

## Partie III — Le monde (en tête de fichier)

**F** — Ouvrir la partie III en regardant la structure en face : inégalités, argent, électricité, connexion, temps, distance. Ni excuse ni destin. Préparer la lampe du ch. 15.

**O** — Yaoundé, mars, un cybercafé de Ngoa-Ekellé où Nadège travaille trois soirs par semaine. Elle encaisse, imprime des mémoires, débloque l'imprimante. Entre deux clients, elle révise sur le comptoir avec ses cartes de carton (ch. 08). Elle connaît le prix d'une heure de connexion, celui d'une page imprimée, ce que coûte un forfait, ce qu'elle gagne en un soir. Une étudiante entre, avec un ordinateur neuf et un répétiteur payé par ses parents. Nadège ne la déteste pas. Elle fait le compte de ce qu'elle a. Le résultat du rattrapage : elle a validé une partie des unités, pas toutes.

**I** —
- Les inégalités existent et pèsent : argent, livres, électricité, connexion, temps libre (ceux qui travaillent, ceux qui gardent des frères et sœurs), distance (les heures de trajet de Grâce sur le pont), santé, enseignants absents ou débordés, classes pléthoriques, concours où les places sont rares et dont on doute parfois de la transparence. Les nommer sans chiffre inventé et sans accuser personne nommément.
- La sociologie l'a montré depuis longtemps (Pierre Bourdieu et Jean-Claude Passeron, *Les Héritiers*, 1964) : l'école peut transformer des avantages de naissance en apparence de mérite personnel. Paraphrase, sans guillemets. Ce que cela veut dire pour toi : une partie de ta note ne te mesure pas.
- La rareté prend de la place dans la tête : des travaux de Sendhil Mullainathan et Eldar Shafir suggèrent que les soucis d'argent mobilisent l'attention ; certains résultats sont discutés. Une idée utile : être épuisé par le manque n'est pas être paresseux.
- La distinction stoïcienne (Épictète, au début du *Manuel*, en paraphrase) : certaines choses dépendent de nous, d'autres non. La version honnête de cette idée : la frontière est floue, et elle se déplace un peu quand on s'associe.
- Ni excuse, ni destin : reconnaître la structure, pour ne pas s'accuser de ce qui ne vient pas de soi ; agir sur la petite marge, pour ne pas lui céder ce qui pourrait en venir. Parler de probabilités, de leviers, de petites marges.
- Les leviers collectifs : partager un forfait, se prêter les manuels et les annales, la bibliothèque du lycée ou de la faculté, le groupe de travail, les heures où l'enseignant est disponible, les grands frères et grandes sœurs.
- Pas un mot sur OnBuch dans ce chapitre (voir §7).

**P** — *Ce soir, essaie ceci* : dans ton cahier, dresse la carte de ce que tu as. Les heures où tu peux travailler (même vingt minutes), les endroits où il y a de la lumière et du calme, les personnes qui savent quelque chose que tu ne sais pas, les objets (manuels, annales, cahiers d'un ancien). Puis choisis un seul levier dans cette carte, et utilise-le cette semaine. Un seul.

**C** — Nadège ferme le cybercafé à 22 h, descend la rue. Sous le lampadaire du carrefour, trois élèves lisent debout, un cahier ouvert sur le capot d'une voiture garée. L'un d'eux éclaire une page avec son téléphone parce que l'ampoule ne suffit pas. Elle passe. Phrase-écho : avec ce qu'ils ont.

**M** — Aucun.

**L** — Ch. 08 (cartes de Nadège) ; ch. 04 et 12 (trajet de Grâce) ; ch. 10 (lampe solaire d'Aïcha) ; ch. 15 (le lampadaire devient la scène d'ouverture) ; postface.

**X** —
1. Pas de « quand on veut, on peut » ni de « résilience » en slogan.
2. Pas de misérabilisme ni de portrait de la pauvreté comme décor.
3. Pas d'accusation de gouvernement, de parti, d'entreprise, de région, d'ethnie.
4. Aucune statistique d'accès à l'électricité ou à internet.
5. Aucune mention d'OnBuch.

> **Pour le cahier** — Deux colonnes, en phrases : « Ce qui ne dépend pas de moi cette semaine » et « Ce qui dépend un peu de moi cette semaine ». La seconde colonne doit contenir au moins une chose que tu feras demain.

---

### 14 — Ce qu'on attend de toi (`14-ce-qu-on-attend-de-toi.md`) — 3 600 mots

**F** — La famille et ses attentes ; l'orientation ; la dignité des filières techniques, professionnelles et des métiers des mains. Réconcilier sans naïveté.

**O** — Ebolowa, mai, le soir. Sur la table de la cuisine, la fiche d'orientation de fin de troisième. Rodrigue veut le lycée technique, la série électronique. Mama Odile veut « un bureau », un métier où l'on ne se salit pas les mains, où l'on ne dépend pas d'une boutique au carrefour. Elle dit une phrase dure, « tu veux finir comme qui ? », qu'elle regrette avant de l'avoir finie. La petite cousine Bella écoute en faisant semblant de dormir. Montage parallèle bref : Ibrahim dans l'atelier du lycée technique de Ngaoundéré, mesurant deux fois avant de couper ; Grâce dont la famille parle d'infirmerie alors qu'elle ne sait pas encore ce qu'elle veut.

**I** —
- Les attentes des parents sont faites d'amour, de peur et de calcul économique ; souvent des trois à la fois. Une phrase dure est souvent une peur mal habillée.
- Des recherches sur la motivation (théorie de l'autodétermination, Edward Deci et Richard Ryan) suggèrent qu'on s'engage plus durablement quand on se sent compétent, un peu autonome, et relié aux autres. Ce n'est pas un droit à faire ce qu'on veut ; c'est une raison de parler avec ses parents plutôt que contre eux.
- Les filières techniques et professionnelles, les métiers manuels : exigeants, intelligents, utiles, dignes. Un électricien qui diagnostique une panne raisonne. Ne pas présenter le technique comme le refuge de ceux qui « n'ont pas pu ».
- Aucune voie ne garantit un emploi : ni le diplôme général, ni le métier. Le dire sans chiffres, sans désespoir.
- S'informer : parler à des gens qui exercent vraiment le métier, pas seulement à ceux qui en parlent ; visiter un lycée technique, un atelier, un service hospitalier.
- La conversation avec les parents : écouter leur peur, présenter un projet concret, accepter de ne pas tout obtenir le premier soir.
- Gravité : quand les attentes deviennent contrainte violente, mariage forcé, menaces, coups, ce n'est plus une discussion d'orientation : on en parle à un adulte de confiance hors de la famille (enseignant, conseiller d'orientation, responsable religieux ou communautaire de confiance, travailleur social). Un paragraphe sobre.
- Pas de « suis ta passion » : on peut ne pas avoir de passion à seize ans ; on peut en avoir une qui ne nourrit pas ; on peut construire un goût en travaillant.

**P** — *Ce soir, essaie ceci* : choisis un adulte qui exerce un métier qui t'intéresse (ou que tes parents rêvent pour toi). Demande-lui dix minutes. Pose-lui quatre questions : ce qu'il fait vraiment dans une journée, ce qu'il a dû apprendre, ce qui est dur, ce qu'il n'avait pas imaginé. Note ses réponses. Puis prépare, pour tes parents, une phrase d'ouverture qui commence par leur inquiétude avant la tienne.

**C** — Mama Odile ne signe pas la fiche ce soir-là. Elle dit : « On va aller voir ce lycée. » Elle range la fiche sous la nappe en plastique. Bella, qui ne dort pas, compte les fleurs de la nappe. (Fait fixe : Rodrigue demandera la série électronique du lycée technique ; sa mère accepte après la visite, ce que l'épilogue confirme en une phrase.)

**M** — Aucun.

**L** — Mama Odile (ch. 03, postface) ; Ibrahim (ch. 05, interlude, ch. 16) ; Grâce (ch. 04, 12) ; Bella (épilogue) ; « atelier » → ch. 16.

**X** —
1. Pas de technique comme « plan B » ou consolation.
2. Pas de parents ridiculisés ou présentés comme obstacles.
3. Pas de « suis ta passion », « fais ce que tu aimes et tu ne travailleras jamais ».
4. Pas de promesse d'emploi, pas de chiffres sur le marché du travail.
5. Ne pas refaire l'analyse des inégalités (ch. 13).

> **Pour le cahier** — Écris ce que ta famille attend de toi, en une phrase. Puis ce que tu attends de toi, en une phrase. Puis ce que tu ne sais pas encore. La troisième phrase a le droit d'être la plus longue.

---

### 15 — La lampe (`15-la-lampe.md`) — 3 200 mots

**F** — Le premier des deux chapitres OnBuch : *pourquoi*. Le « je » prend du corps. La scène du manque, la naissance de l'idée (sous marqueur), le refus du miracle. Cahier des charges complet au §7.

**O** — Le lampadaire du carrefour, vu au ch. 13, mais cette fois on s'arrête. Trois élèves (composites, sans prénom ou avec des prénoms qui ne reviendront pas) : l'un tient un polycopié photocopié tant de fois que les lettres sont devenues grises et que la moitié des schémas a disparu ; l'autre cherche sur son téléphone un cours qui corresponde à ce que le professeur a fait, et tombe sur des cours d'autres programmes, d'autres pays ; le troisième a une explication dans son cahier, mais elle ne passe pas, il l'a relue dix fois. Personne pour expliquer autrement à 21 h.

**I** —
- La scène du manque, précise : cours introuvables, polycopiés illisibles, explications qui ne passent pas, élèves seuls le soir.
- Le « je » de l'auteur : ce qu'il voit dans cette scène, pourquoi elle l'arrête. Marqueur 1 pour le moment réel.
- Le choix du programme officiel du MINESEC : pour que ce qu'on trouve corresponde à ce qu'on fait en classe, classe par classe, du collège à la terminale, générale et technique.
- Ce qu'est OnBuch, en une ou deux phrases neutres : des cours structurés par leçon, des fiches de travaux dirigés à trois niveaux, des corrigés, des fiches méthode.
- La métaphore de la lampe, filée sans lourdeur : une lampe ne marche pas à ta place, elle éclaire la marche suivante ; elle ne remplace ni le soleil (le professeur, la classe) ni les jambes (ton travail).
- L'ironie honnête : un outil sur téléphone suppose un téléphone, de la batterie, souvent de la connexion. Ceux qui manquent le plus de cours peuvent manquer aussi de cela. L'auteur le sait et le dit.
- Pour quoi : donner une chance honnête, pas un miracle.

**P** — *Ce soir, essaie ceci* : fais la liste de tes lampes. Toutes les sources qui peuvent éclairer la leçon qui te résiste : ton manuel, ton professeur, un camarade, un grand frère, les annales, la bibliothèque, un cahier d'un ancien, une application si tu en as une. Choisis-en deux pour la leçon la plus difficile de la semaine, et confronte ce qu'elles disent. Si deux lampes disent la même chose, tu peux avancer ; si elles se contredisent, tu as trouvé ta question pour le professeur.

**C** — Le lampadaire grésille et s'éteint. Les trois élèves ne rentrent pas : ils vont sous le suivant, vingt mètres plus loin, et rouvrent leurs cahiers. Pas de commentaire.

**M** — 2 marqueurs (voir §7.3 pour la formulation exacte et leur contexte) :
`⟦À COMPLÉTER PAR LUDOVIC : le moment précis où l'idée de construire OnBuch est née — où tu étais, ce que tu as vu, entendu ou vécu ce jour-là⟧`
`⟦À COMPLÉTER PAR LUDOVIC : ta propre expérience du manque de cours ou d'explications, comme élève ou auprès d'élèves que tu connais — un souvenir concret⟧`

**L** — Ch. 13 (lampadaire) ; lampe solaire d'Aïcha (ch. 10, 17) ; lampe torche (ch. 06, interlude, épilogue) ; escalier (ch. 03) ; ch. 16.

**X** — (en plus du §7)
1. Pas de témoignage d'utilisateur, réel ou inventé.
2. Pas de chiffre (utilisateurs, leçons, téléchargements, notes en hausse).
3. Pas de « révolution », « innovation », « solution », « plateforme ».
4. Pas de critique des autres ressources, écoles, répétiteurs ou applications.
5. Pas de lien, de prix, de magasin d'applications, d'appel au téléchargement.

> **Pour le cahier** — Écris le nom de la leçon qui te résiste le plus. Sous elle, les deux lampes que tu vas utiliser, et la date.

---

### 16 — Atelier (`16-atelier.md`) — 4 000 mots

**F** — Le second chapitre OnBuch : *comment*. Le travail réel, ses erreurs, l'IA, la vérification, la fatigue, les doutes, les limites. Le chapitre où l'auteur se montre faillible, et où le livre parle de transmission. Cahier des charges au §7.

**O** — La nuit, un écran, un brouillon de leçon produit avec l'aide d'un outil d'intelligence artificielle. À côté de l'écran, un cahier de brouillon et un stylo. L'auteur refait un calcul de l'exercice 3 à la main, ligne par ligne, et trouve un résultat différent. Marqueur 1 pour l'erreur réelle. Écho silencieux : Ibrahim qui mesure deux fois avant de couper, tonton Fabrice qui teste chaque pièce, Kamga qui corrige au rouge puis au bleu.

**I** —
- Le travail concret : matière par matière, classe par classe, leçon par leçon, en suivant le programme officiel du MINESEC.
- Pourquoi des TD à trois niveaux : parce que l'escalier (ch. 03, 07) n'a pas la même marche pour tout le monde. Ne pas nommer les niveaux.
- Pourquoi des corrigés, et comment s'en servir : après avoir cherché, jamais avant (lien ch. 08 : un corrigé lu trop tôt fabrique de la familiarité, pas du savoir).
- Pourquoi des fiches méthode : parce que beaucoup d'élèves savent la leçon et ne savent pas quoi faire devant une consigne.
- L'IA : une grande partie du contenu est produite avec son aide, puis vérifiée, corrigée et mise en page avec soin. Ce qu'elle fait bien : proposer un premier jet, des variantes. Ce qu'elle fait mal : affirmer avec assurance des choses fausses, se tromper dans un calcul, sortir du programme, utiliser des notations ou des exemples d'ailleurs, écrire d'une voix qui n'est celle de personne. D'où la vigilance humaine, qui ne garantit pas l'absence d'erreur mais la réduit.
- Le temps, la fatigue, les doutes : rater, recommencer, se demander si cela sert. Marqueur 2 pour une soirée réelle.
- Les limites : OnBuch n'est pas un professeur, ne remplace ni la classe ni l'effort, ne règle ni le courant ni la connexion, contient sans doute encore des erreurs. Un outil parmi d'autres.
- Conseil au lecteur sur l'IA (s'il y a accès) : s'en servir pour se faire poser des questions, pour vérifier une étape qu'on a déjà tentée, jamais pour faire le devoir à sa place ; vérifier ce qu'elle dit comme on vérifie un camarade trop sûr de lui.
- Transmettre : faire des cours, c'est expliquer autrement à quelqu'un qu'on ne verra jamais. Rendre justice aux enseignants dont le travail et les programmes rendent ce travail possible.

**P** — *Ce soir, essaie ceci* : prends un corrigé, n'importe lequel (manuel, annale, camarade, application). Choisis une étape et vérifie-la toi-même, sans faire confiance. Si tu trouves une erreur, écris-la dans ton carnet d'erreurs, avec la bonne réponse : tu viens de faire ce que fait un correcteur. Si tu n'en trouves pas, tu as au moins compris une étape au lieu de la recopier.

**C** — Tard. Le fichier est enregistré. L'auteur sait qu'il reste une erreur quelque part, dans une leçon ou une autre ; il ne sait pas où. Il note dans le cahier de brouillon la leçon à reprendre demain. Il éteint l'écran. Phrase courte.

**M** — 2 marqueurs (voir §7.3) :
`⟦À COMPLÉTER PAR LUDOVIC : une erreur réelle trouvée dans un contenu produit avec l'aide de l'IA — la matière, la classe, la nature de l'erreur, et comment tu l'as repérée et corrigée⟧`
`⟦À COMPLÉTER PAR LUDOVIC : une soirée ou une journée de travail réelle sur OnBuch — l'heure, le lieu, ce qui fatigue, ce qui fait douter, ce qui fait continuer⟧`

**L** — Escalier (ch. 03, 07) ; ch. 08 (corrigé trop tôt) ; ch. 11 (encre, carnet d'erreurs) ; Ibrahim (ch. 05, 14) ; tonton Fabrice (ch. 07) ; cahier de brouillon (prologue, épilogue).

**X** — (en plus du §7)
1. Pas de jargon technique (modèle, invite, base de données) au-delà d'un mot expliqué.
2. Pas d'affirmation générale sur ce que « l'IA va changer » dans l'éducation.
3. Pas d'autoportrait héroïque (nuits sans sommeil glorifiées, sacrifice) : la fatigue est dite, pas exhibée.
4. Pas de nom d'outil d'IA, de partenaire, de collaborateur ; ne pas dire si l'auteur travaille seul ou en équipe.
5. Pas de comparaison avec d'autres applications ou sites.

> **Pour le cahier** — Écris une étape d'un corrigé que tu as vérifiée toi-même aujourd'hui, et ce que tu as constaté.

---

### 17 — Lettre à Aïcha (`17-lettre-a-aicha.md`) — 3 000 mots

**F** — Le sommet émotionnel. L'échec à un examen n'est pas une fin ; qui tu deviens ; ce que réussir veut dire ; la transmission (Hadja regarde). Forme : une lettre de l'auteur à une élève composite, la seule fois où le livre s'adresse à quelqu'un d'autre que « toi ».

**Forme** — Commence par « Aïcha, ». Pas de date (« le lendemain des résultats »). Tutoiement. Une phrase, au début ou à la fin, qui reconnaît qu'Aïcha est composée de beaucoup d'élèves (« Tu n'existes pas sous ce nom, et pourtant tu existes dans chaque ville où l'on affiche des listes »). Signature : « Ludovic ». Pas d'intertitre. Paragraphes plus courts que dans le reste du livre.

**O** — Ce que l'auteur imagine de la veille et du matin (sans prétendre y avoir été) : à Garoua, en juillet, le réseau qui ne charge pas la page des résultats, la décision d'aller au portail du lycée, la pluie de saison, Hadja qui tient le parapluie. La liste lue trois fois, de haut en bas puis de bas en haut. Le nom qui n'y est pas.

**I** —
- Nommer l'échec comme échec : il a une date, une session, un relevé de notes. Il dit quelque chose (cette fois, à cette session, le seuil n'a pas été atteint). Il ne dit pas tout. Phrase-écho : ça ne prouve pas ce que tu crois.
- Le droit au chagrin. Ne rien décider dans la semaine.
- Dans trois semaines : lire le relevé, matière par matière, comme au ch. 02 ; regarder les options (redoubler, se présenter en candidate libre, une autre voie de formation) sans hiérarchie de dignité ; en parler avec ceux qui l'aiment.
- Le corps : dormir, manger, sortir, voir des gens (renvoi discret au ch. 10).
- Gravité, dite directement : si l'idée vient de disparaître, de se faire du mal, de ne plus être là, ce soir même on parle à quelqu'un — un parent, un adulte de confiance, un médecin, un centre de santé. Marqueur pour une ressource vérifiée.
- Qui tu deviens : tu es aussi la personne qui sait dessiner une cellule mieux que le manuel, l'aînée qui a appris à Hadja à lire l'heure, celle qui se relèvera ou non, à son rythme. Ne pas inventer une vocation de rechange.
- Ce que réussir veut dire : pas un slogan. Garder le droit de vouloir le diplôme, fort ; ne pas faire semblant que ça ne compte pas. Et pourtant : une vie ne se lit pas sur une seule liste.
- Transmettre : Hadja t'a regardée tomber. Elle apprendra autant de la façon dont tu te relèves que de la façon dont tu aurais réussi.

**P** — Inversion volontaire, unique dans le livre : « Ce soir, n'essaie rien. » Un paragraphe : ce soir on n'ouvre pas le cahier, on mange, on dort. La consigne pratique est repoussée : dans trois semaines, ouvre le relevé et le cahier, et écris ce que chaque note dit et ne dit pas.

**C** — Pas de promesse que l'année prochaine sera la bonne. Dernières lignes sobres, concrètes : la lampe solaire qui recharge sur le toit, Hadja qui demande si elle peut l'emprunter pour ses devoirs, et Aïcha qui dit oui. Signature.

**M** — 1 marqueur (indispensable, non biographique) :
`⟦À COMPLÉTER PAR LUDOVIC : une ligne d'écoute, un service ou une structure d'aide psychologique vérifiés au Cameroun, avec le contact exact à jour⟧`
Si le marqueur reste vide, le paragraphe doit tenir avec « un adulte de confiance, un médecin, un centre de santé ».

**L** — Liste au portail (ch. 02, épilogue) ; pluie sur la tôle (ch. 04, 11) ; lampe solaire (ch. 10, 15) ; Hadja (ch. 10) ; relevé (ch. 02) ; gravité (ch. 06, postface).

**X** —
1. Pas de « ce n'est pas un échec, c'est une leçon ».
2. Pas de liste de célébrités qui ont échoué avant de réussir.
3. Pas de promesse qu'elle réussira l'année suivante ; ne pas révéler la suite.
4. Ne pas comparer son sort au succès de Rodrigue.
5. Pas de remontée lyrique finale, pas de « relève-toi et brille ».

> **Pour le cahier** — Pas d'encadré. La lettre se suffit.

---

### 18 — Épilogue — Le mot, encore (`18-epilogue-le-mot-encore.md`) — 1 400 mots

**F** — Fermer la boucle. On ne guérit pas un mot, on le déplace. La lumière revient. Le nom remplace le mot.

**O** — Ebolowa, juillet, le soir. Rodrigue a eu son BEPC, sans mention, de peu : une phrase, pas plus, et sans fête (il l'a lu sur le téléphone d'un voisin, puis sur la liste). Il entrera au lycée technique à la rentrée. Le courant est parti. À la lumière de la lampe torche d'un téléphone posé debout contre un verre, il aide sa cousine Bella, en CM2, à faire des fractions. Elle s'énerve, pose son crayon : « Je suis nulle. »

**I** —
- Rodrigue hésite. Il entend le prologue. Puis il prend son cahier de brouillon et écrit le mot « nul », à sa place mathématique : un nombre nul, c'est zéro. Il lui explique, à sa façon, la propriété recopiée au ch. 07 : un produit est nul quand un seul de ses facteurs est nul. Il suffit d'un facteur à zéro pour que tout le résultat ait l'air nul : le sommeil, une marche, une lampe, quelqu'un pour expliquer. On ne change pas tout ; on cherche le facteur. Le dire avec ses mots à lui, maladroits, justes.
- Il lui montre les parts, comme Mama Odile.
- Un paragraphe en « je », bref : on ne guérit pas d'un mot ; on peut le changer de place. Ce n'est pas une morale, c'est une opération.
- Le chantier du voisin : quelqu'un a posé une rampe à l'escalier. Les deux marches manquent encore. Une phrase.

**P** — Pas d'intertitre « Ce soir ». À la place, le dernier « Pour le cahier ».

**C** — Le courant revient. Le quartier pousse ce cri qui monte de toutes les maisons à la fois. Bella reprend son crayon. Plus tard, Rodrigue retrouve son vieux cahier de cinquième, décolle l'étiquette barrée et écrit, sur une étiquette neuve, à la ligne « Nom : », son nom. Dernière phrase du livre, brève, qui contient ou fait entendre « avec ce que tu as ». Elle ne doit pas être une maxime ; elle doit être un geste.

**M** — Aucun.

**L** — Prologue (étiquette, le mot) ; ch. 03 (parts, escalier) ; ch. 07 (produit nul) ; interlude (le courant revient enfin) ; ch. 12 (le nom écrit) ; ch. 14 (lycée technique, Bella) ; épigraphe.

**X** —
1. Pas de récapitulatif du livre.
2. Pas de morale en liste ni de « Et toi, que feras-tu ? ».
3. Pas de larmes, d'embrassade, de discours de Rodrigue.
4. Ne donner les résultats d'aucun autre personnage.
5. Pas de retour d'OnBuch.

> **Pour le cahier** — Retourne à la première page. Relis la phrase que tu y as écrite. Ne la rature pas. En dessous, réécris-la à sa juste place : ce qu'elle disait d'un moment, d'une copie, d'une marche ; pas de toi.

---

### 19 — Note de l'auteur (`19-note-de-l-auteur.md`) — 600 mots

- La phrase exacte sur les composites : « Les prénoms et les parcours de ce livre sont composés à partir de situations réelles et typiques ; aucun n'est une personne précise. » Puis deux ou trois phrases sur la manière de les composer, sans prétendre à des rencontres précises.
- Sur la science : ce livre s'appuie sur des travaux de psychologie cognitive et de sciences de l'éducation ; il a tenté de les rapporter avec prudence ; la recherche avance et se corrige. Liste brève, en prose, des pistes de lecture (auteurs et années du §5.6), vérifiées avant publication.
- Sur OnBuch (OnBuch+) : une phrase factuelle, sans appel à l'action, renvoyant aux ch. 15–16.
- `⟦À COMPLÉTER PAR LUDOVIC : pourquoi tu as écrit ce livre, en tes mots, si tu veux l'ajouter — quelques lignes⟧` (facultatif ; le texte tient sans).

### 20 — Remerciements (`20-remerciements.md`) — 150 mots

- Remerciements génériques : aux enseignants qui tiennent, aux parents qui veillent sans toujours savoir comment aider, aux élèves qui ont posé leurs questions.
- `⟦À COMPLÉTER PAR LUDOVIC : les personnes que tu veux remercier nommément⟧`

### 21 — Postface — Pour les parents et les enseignants (`21-postface-parents-enseignants.md`) — 1 600 mots

**F** — Parler aux adultes, court, sans leçon. Leur rendre justice et leur confier quelques gestes.

**O** — Deux images en miroir : Mama Odile assise à côté de Rodrigue la nuit, sans pouvoir l'aider sur la leçon, et pourtant présente ; Kamga et son cahier vert.

**I** — Ce qu'un mot fait (rappel du prologue, une phrase). Ce qu'on peut dire à la place de « nul » : nommer la tâche, pas la personne (« cet exercice n'est pas encore acquis »). Demander « explique-moi ce que tu as compris » plutôt que « tu as appris ? ». Protéger le sommeil. Regarder le relevé avec l'enfant, pas seulement le rang. Aux enseignants : leurs contraintes reconnues (effectifs, temps, salaires dits sans chiffre) ; un commentaire précis sur une copie compte ; les noms comptent. Repérer les signes de détresse et orienter vers un professionnel. Pas d'injonction ; des propositions.

**C** — Une phrase sobre sur la place des adultes : celle qui éclaire la marche, pas celle qui la monte.

**X** — Pas de culpabilisation des parents ; pas de leçon de pédagogie aux enseignants ; pas de nouvelle science ; pas d'OnBuch ; pas de liste à puces.

---

## 2. Calendrier narratif et tableau de rythme

### 2.1 Chronologie de l'année du livre (année jamais nommée)

| Moment | Événement | Chapitre |
|---|---|---|
| Deux ans avant | Rodrigue, en 5e, entend « Toujours nul » ; l'étiquette | Prologue |
| Octobre | Grâce et la main sous la table, pluie à Douala | 04 |
| Novembre | Rodrigue et 2/3 + 1/4 ; Ibrahim et la dissertation | 03, 05 |
| Décembre | Kamga calcule les rangs du 1er trimestre | 02 |
| Janvier | Divine et la dictée (23 fautes) ; Nadège échoue à la session de janvier | 06, 08 |
| Février | Rodrigue à la boutique ; Aïcha veille avant le bac blanc | 07, 10 |
| Mars | Kamga corrige sous la pluie ; Nadège au cybercafé, rattrapage partiellement validé | 11, 13 |
| Mai | Fiche d'orientation chez Rodrigue | 14 |
| Juin | Probatoire de Grâce (et d'Ibrahim, hors champ) ; BEPC de Rodrigue ; Bac d'Aïcha | 12 |
| Juillet | Résultats du Bac : Aïcha n'est pas admise ; Rodrigue admis au BEPC, de peu | 17, épilogue |
| Non daté | Les scènes de l'auteur | 15, 16 |

L'ordre de lecture n'est pas chronologique (le ch. 02 se passe en décembre, après le ch. 03) ; c'est voulu. Ne jamais écrire « quelques semaines plus tôt » d'un chapitre à l'autre : chaque chapitre date sa scène par le mois, la saison ou un événement scolaire.

### 2.2 Rythme par chapitre

| Ch. | Dominante | Personnage | Lieu | Intensité (1-5) |
|---|---|---|---|---|
| Prologue | Scène | Rodrigue | Ebolowa | 4 |
| 02 | Idée | Kamga | Bafoussam | 2 |
| 03 | Scène / idée | Rodrigue, Mama Odile | Ebolowa | 3 |
| 04 | Scène | Grâce | Douala | 3 |
| 05 | Idée | Ibrahim | Ngaoundéré | 3 |
| 06 | Intérieur | Divine | Bafoussam | 5 |
| 07 | Pratique | Rodrigue (+ Kamga) | Ebolowa | 2 |
| 08 | Pratique / science | Nadège | Yaoundé | 3 |
| Interlude | Respiration | Tu (+ Ibrahim) | Partout | 3 |
| 10 | Corps | Aïcha | Garoua | 3 |
| 11 | Pratique / relation | Kamga, Divine | Bafoussam | 3 |
| 12 | Tension | Grâce | Douala | 4 |
| 13 | Monde | Nadège | Yaoundé | 3 |
| 14 | Famille | Rodrigue, Mama Odile (+ Ibrahim, Grâce) | Ebolowa | 4 |
| 15 | Je | L'auteur | Non localisé | 3 |
| 16 | Je / travail | L'auteur | Non localisé | 3 |
| 17 | Lettre | Aïcha, Hadja | Garoua | 5 |
| Épilogue | Scène | Rodrigue, Bella | Ebolowa | 4 |

Aucun personnage n'ouvre deux chapitres consécutifs. Aucune ville n'ouvre deux chapitres consécutifs. Toute modification de l'ordre doit préserver ces deux règles.

---

## 3. Bible des personnages composites

Règles communes :
- Ils sont annoncés comme composites dans le liminaire et la note. Le narrateur **ne prétend jamais les avoir rencontrés** (« j'ai connu Rodrigue » est interdit) ; il les raconte comme un romancier, au présent ou au passé, à la troisième personne. Seule exception de forme : la lettre du ch. 17, qui s'adresse à Aïcha en reconnaissant qu'elle est composée.
- Pas de misérabilisme : chacun a de l'humour, une compétence, une famille qui l'aime à sa façon, et des moyens limités. Aucun ne cumule toutes les difficultés.
- Pas d'exotisme : pas de description de « l'Afrique », pas de folklore. Les détails sont ceux qu'un élève camerounais reconnaîtrait sans les remarquer.
- Les résultats d'examen ne sont donnés que pour deux d'entre eux (Rodrigue : admis de peu ; Aïcha : non admise). Pour les autres, le livre se tait.
- Pas de portrait physique au-delà d'un détail par personnage.

### Rodrigue Essomba — le fil principal
- **Âge / classe / lieu** : douze ans en 5e (prologue) ; quatorze-quinze ans en 3e pendant l'année du livre ; Ebolowa (Sud).
- **Famille** : sa mère, Mama Odile ; son père travaille au port de Kribi et rentre certains week-ends (jamais en scène) ; sa cousine Bella, en CM2, vit avec eux ; son oncle, tonton Fabrice, tient une boutique de réparation de téléphones au carrefour.
- **Traits singuliers** : rit le premier pour désamorcer ; méthodique et patient quand il répare un téléphone, éparpillé devant une copie ; parle peu de lui ; a gardé l'étiquette barrée sans l'arracher. Détail physique : un petit tournevis toujours dans la poche de chemise.
- **Fil rouge** : prologue (le mot, l'étiquette) → 03 (les marches manquantes, les fractions) → 07 (redescendre, la boutique, la propriété du produit nul recopiée) → 10 (évoqué : perd des heures sur son propre téléphone) → 14 (orientation, lycée technique, série électronique) → épilogue (BEPC de peu, explique les fractions à Bella, écrit son nom).
- **Langue** : français familier, quelques mots de camfranglais en dialogue, jamais moqués.

### Mama Odile (Odile Essomba) — parent
- **Âge / lieu** : la quarantaine, Ebolowa ; vend des vivres (plantain, macabo, arachides) au marché.
- **Traits singuliers** : trésorière de sa tontine, calcule de tête plus vite que la calculatrice ; dit des phrases dures quand elle a peur et les regrette ; s'assoit à côté de son fils la nuit sans pouvoir l'aider sur la leçon ; garde les papiers importants sous la nappe en plastique.
- **Fil rouge** : 03 (le calcul de la tontine, « je partage ») → 14 (la fiche d'orientation, « on va aller voir ») → épilogue (évoquée par les parts) → postface (image d'ouverture).
- **Interdit** : la ridiculiser, la présenter comme ignorante, la sanctifier.

### Hilaire Kamga — enseignant
- **Âge / lieu** : un peu plus de cinquante ans ; professeur de mathématiques (PLEG) dans un lycée bilingue de Bafoussam (Ouest), plus de vingt ans de métier.
- **Traits singuliers** : un « cahier des noms » à couverture verte où il note pour chaque élève une chose réussie ; corrige au stylo rouge acheté par boîtes ; une lampe de bureau au fil capricieux ; donne des répétitions le samedi pour compléter son salaire ; rit rarement, mais franchement ; explique une deuxième fois autrement (les haricots sur la table).
- **Fil rouge** : 02 (les rangs, le cahier vert) → 07 (une deuxième explication, scène brève) → 11 (l'erreur trente fois, le rouge qui s'épuise) → 12 (évoqué : il surveille des examens, une phrase possible) → postface.
- **Interdit** : en faire un saint ou un martyr ; il se trompe, il est fatigué, il tient.

### Divine Nfor — élève
- **Âge / classe / lieu** : quinze ans, Seconde C, section francophone d'un lycée bilingue de Bafoussam ; élève de Kamga.
- **Famille** : arrivée de Bamenda il y a trois ans ; père comptable dans une entreprise de Bafoussam, mère infirmière. Le motif du départ n'est jamais développé.
- **Traits singuliers** : pense et compte en anglais ; forte en mathématiques (seize au premier trimestre), en difficulté en français écrit ; tient un carnet bleu devenu carnet d'erreurs ; joue au handball le mercredi ; traduit ses fautes pour les comprendre.
- **Fil rouge** : 02 (le seize que le rang ne voit pas) → 06 (la dictée, la voix en deux langues, le carnet bleu) → 11 (vient avec sa question écrite, groupe sous le manguier).
- **Interdit** : exploiter la crise des régions anglophones ; faire de son bilinguisme un handicap ou un exotisme.

### Grâce Ewane — élève
- **Âge / classe / lieu** : seize ans, Première A4 espagnol, Douala ; habite Bonabéri, traverse le pont sur le Wouri chaque matin pour aller au lycée.
- **Famille** : mère couturière ; une tante qui tient un kiosque de transfert d'argent et de crédit téléphonique, où Grâce aide le samedi ; la famille parle d'infirmerie pour elle.
- **Traits singuliers** : écrit au dos des rouleaux de tickets de caisse (questions, phrases, listes) ; connaît par cœur les embouteillages du pont ; chante dans une chorale (alto) ; aime l'espagnol ; a peur des mathématiques et de lever la main ; ne sait pas ce qu'elle veut faire, et le livre le lui permet.
- **Fil rouge** : 04 (la main, la pluie, la question sur un ticket) → 12 (Probatoire, les trois gestes, son nom sur la copie) → 13 (évoquée : le trajet) → 14 (évoquée : l'infirmerie). Résultat jamais donné.

### Ibrahim Saïdou — élève de l'enseignement technique
- **Âge / classe / lieu** : dix-sept ans, Première F3 (électrotechnique), lycée technique de Ngaoundéré (Adamaoua).
- **Famille** : père chauffeur de camion, souvent sur la route ; mère qui tient la maison et un petit commerce ; grand frère Moussa, étudiant en médecine loin de la maison, dont la photo en blouse est au mur ; un oncle qui aime les comparaisons.
- **Traits singuliers** : parle lentement, mesure deux fois avant de couper ; a réparé la moitié des ventilateurs du quartier ; une demi-page en dissertation ; se dit nul en français avec un sourire qui ne trompe personne.
- **Fil rouge** : 05 (la demi-page, le ventilateur, Moussa) → interlude (le transformateur, la loi d'Ohm) → 14 (l'atelier, mesurer deux fois) → 16 (écho silencieux). Résultat jamais donné.
- **Interdit** : en faire « celui qui n'est pas fait pour les études » ; Moussa n'est pas un rival.

### Nadège Kenfack — étudiante
- **Âge / lieu** : dix-neuf ans, première année de sciences biologiques à l'université de Yaoundé I ; chambre en mini-cité près de Ngoa-Ekellé ; famille installée à Bertoua (Est), commerçants (quincaillerie).
- **Traits singuliers** : surligneurs de quatre couleurs (au début) ; précise avec l'argent ; travaille trois soirs par semaine dans un cybercafé ; humour sec ; appelle sa mère le dimanche ; fabrique ses cartes de révision dans des cartons de lait en poudre.
- **Fil rouge** : 08 (l'échec de janvier, fermer le cahier, la boîte en carton) → 10 (évoquée : les nuits) → 13 (le cybercafé, la carte de ce qu'elle a, rattrapage partiellement validé, le lampadaire).
- **Interdit** : en faire une miraculée de la méthode ; son progrès est partiel.

### Aïcha Bello — élève
- **Âge / classe / lieu** : dix-huit ans, Terminale D, Garoua (Nord).
- **Famille** : père infirmier dans un centre de santé, mère couturière ; aînée de trois ; sa petite sœur Hadja, douze ans, la suit partout.
- **Traits singuliers** : dessine les schémas de SVT mieux que le manuel ; tient un calendrier mural où elle barre les jours ; ironie mordante ; veut faire pharmacie ; révise à la lampe solaire qui charge sur le toit.
- **Fil rouge** : 10 (la veille du bac blanc, dormir n'est pas tricher) → 12 (évocation possible en une phrase : elle aussi passe un examen ce mois-là) → 17 (la lettre, la liste, la pluie, Hadja et la lampe).
- **Interdit** : révéler la suite de son parcours ; en faire une victime.

### Personnages secondaires (ne jamais les développer)
Bella (cousine de Rodrigue, CM2) ; tonton Fabrice (oncle de Rodrigue, boutique de téléphones) ; Hadja (sœur d'Aïcha) ; Moussa (frère d'Ibrahim) ; l'oncle d'Ibrahim ; la tante de Grâce ; le professeur du prologue (sans nom) ; les trois élèves du lampadaire (sans prénoms).

---

## 4. Motifs récurrents et placement

Un motif n'est jamais expliqué. Il revient, légèrement transformé, et le lecteur fait le lien.

| Motif | Plantation | Retours | Résolution |
|---|---|---|---|
| **L'étiquette du cahier** (« Nom : » barré, « NUL ») | Épigraphe, prologue | 06 (la voix comme étiquette intérieure, sans le mot « étiquette »), 12 (Grâce écrit son nom sur la copie) | Épilogue : Rodrigue écrit son nom sur une étiquette neuve |
| **Le cahier de brouillon du lecteur** | Prologue (première page) | Chaque « Pour le cahier » ; 08 (page blanche) ; 16 (l'auteur vérifie à la main) | Épilogue : retour à la première page |
| **L'escalier inachevé** du voisin | 03 (deux marches manquantes, pas de rampe) | 07 (redescendre), 16 (trois niveaux de TD) | Épilogue : une rampe a été posée, les marches manquent encore |
| **La coupure de 21 h** | 09 (le noir, pas de retour) | 10 (lampe solaire), 13 (lampadaire), 15 | Épilogue : le courant revient, le cri du quartier |
| **Les lampes** (lampe de bureau de Kamga, lampe solaire d'Aïcha, lampadaire, lampe torche du téléphone) | 02 (Kamga), 06 (torche de Divine) | 10, 11, 13, 15 (titre), 17 (Hadja emprunte la lampe) | Épilogue (torche, puis la lumière revenue) |
| **La pluie sur la tôle** | 04 (couvre la voix du professeur) | 11 (Kamga corrige) | 17 (le jour des résultats) |
| **La liste au portail** | 02 (mention) | 12 (l'appel des noms, sans liste) | 17 (le nom absent) ; épilogue (le nom présent, une phrase) |
| **L'encre rouge, puis bleue** | 02 (stylo de Kamga) | 06 (23 fautes en rouge, carnet bleu), 16 (stylo de l'auteur) | 11 (le rouge s'épuise, il finit au bleu) |
| **Le produit nul** | 07 (propriété recopiée sans commentaire) | — | Épilogue (le mot remis à sa place mathématique) |
| **Les parts / partager** (Mama Odile) | 03 (« je partage ») | 07 (onze douzièmes) | Épilogue (Rodrigue montre les parts à Bella) |
| **La main levée** | 04 (à moitié, sous la table) | 11 (Divine vient avec sa question) | Épilogue : Bella lève la main à table pour poser une question à Rodrigue, une phrase, avec humour |
| **Le téléphone** (outil et voleur) | 07 (Rodrigue répare) | 10 (attention, forfait), 15 (éclaire une page), 16 (support de l'outil) | Épilogue (torche contre un verre) |
| **Le ventilateur** d'Ibrahim | 05 (il le répare) | 09 (il s'arrête), 14 (l'atelier) | — (reste suspendu) |
| **Le cahier vert de Kamga** | 02 | 11 | Postface |
| **Les tickets de caisse** de Grâce | 04 | — | 12 (les trois gestes) |

**Phrases-échos** (formulations variables, fréquence plafonnée) :
- *Ça ne prouve pas ce que tu crois* (et variantes) : prologue, 02, 06, 17, épilogue. Cinq occurrences maximum, jamais deux fois dans un même chapitre, jamais en dernière ligne de chapitre.
- *Un manque se comble* : prologue, 03, 13. Trois occurrences maximum. L'épilogue ne la cite pas : il la montre.
- *Avec ce que tu as / avec ce qu'ils ont* : 13 (chute), 15, dernière phrase du livre. Trois occurrences.
- *Ce soir* : formule rituelle des passages pratiques, inversée au ch. 17 (« Ce soir, n'essaie rien »), tournée en consigne dans l'interlude.

---

## 5. Règles de style

### 5.1 Voix

- **Tu** : un seul lecteur, singulier, élève ou étudiant. Jamais « vous » pour le lecteur (sauf dans la postface, qui s'adresse aux adultes au vouvoiement collectif). Jamais « on » quand on veut dire « tu ».
- **Je** : l'auteur. Il donne son avis, doute, observe en général, raconte son travail sur OnBuch dans les limites du §7. Il ne raconte **aucun** souvenir personnel hors marqueur. Interdit : « quand j'étais élève », « mon père me disait », « j'ai vu un jour au lycée de… ». Autorisé : « je crois que », « je ne sais pas », « je me méfie de cette idée ».
- **Accord** : « nul » au masculin générique dans le titre et dans la plupart des occurrences ; une seule phrase au prologue fait entendre « nul, ou nulle ». Ailleurs, on évite les adjectifs genrés adressés au lecteur quand c'est possible sans contorsion.
- **Registre** : français soutenu mais parlé ; on doit pouvoir lire chaque phrase à voix haute sans buter. Mots camerounais employés sans glose quand le contexte suffit (le courant, la tontine, le répétiteur, la séquence, la mini-cité, le carrefour), avec une glose brève et intégrée la première fois si nécessaire, jamais en note de bas de page.
- **Humour** : ironie douce, souvent contre l'auteur ou contre les slogans, jamais contre un élève, un parent, un enseignant, une région. Une à trois touches par chapitre, pas de blague isolée.

### 5.2 Phrase et rythme

- Longueur variée : alterner phrases longues à subordonnées et phrases de deux à cinq mots. Au moins une phrase très courte par page ; jamais trois phrases très courtes à la suite plus de deux fois par chapitre (sinon effet de manche).
- Paragraphes de 3 à 8 phrases en moyenne ; un paragraphe d'une seule phrase au maximum deux fois par chapitre.
- Le concret avant l'abstrait : toute idée générale doit être précédée ou suivie, dans les trois phrases, d'un objet, d'un geste, d'un lieu.
- Verbes précis plutôt qu'adjectifs : « elle barre les jours » plutôt que « elle est organisée ».
- Une image par idée, pas trois. Les métaphores sont prises dans le monde des personnages (la tôle, la craie, la nappe en plastique, le pont, la boutique), jamais dans le vocabulaire du développement personnel (voyage, chemin, potentiel, ailes, flamme).

### 5.3 Interdits durcis (recherche systématique avant remise)

**Ponctuation**
- Points d'exclamation : un par chapitre au maximum, et seulement dans un dialogue.
- Tirets cadratins : au plus une paire d'incise par page ; jamais deux incises dans un même paragraphe ; préférer virgules, parenthèses, deux-points.
- Points de suspension : rarement, jamais pour faire mystère.
- Questions rhétoriques : au plus deux par chapitre ; jamais en dernière phrase de chapitre.

**Constructions**
- « Non pas X mais Y », « ce n'est pas X, c'est Y » : une fois par chapitre au maximum.
- Énumérations de trois éléments : jamais deux dans le même paragraphe ; préférer deux ou quatre, ou un seul bien choisi.
- Pas d'anaphore rhétorique sur plus de deux phrases (« C'est… C'est… C'est… »).
- Pas de phrase d'ouverture commençant par « Imagine », « Et si », « Nous sommes tous », « Dans un monde où ».
- Pas de chute de chapitre en forme de maxime, de question, ou de « Et toi ? ».

**Lexique proscrit** (sauf pour le moquer explicitement, une fois dans le livre) : plonger / plongeons, il est important de noter, il faut savoir que, force est de constater, en conclusion, en somme, au final, crucial, essentiel (plus d'une fois par chapitre), clé (« la clé du succès »), booster, challenge, mindset, zone de confort, potentiel, meilleure version de toi-même, résilience (sauf une fois au ch. 13, pour la discuter), inspirant, incroyable, véritable (comme intensif), voyage / chemin / parcours (comme métaphore de la vie), naviguer, tisser, rêve(s) (sauf pour démonter « croyez en vos rêves »), succès (préférer réussite, et rarement), n'hésite pas à, à l'ère du numérique, révolutionner, transformer ta vie, game changer.

**Contenus**
- Aucune citation de célébrité, aucune citation entre guillemets d'un auteur réel sauf si exacte et vérifiée ; sinon paraphrase sans guillemets.
- Aucune statistique, aucun pourcentage, aucun « des millions de ».
- Aucune promesse (« tu réussiras », « ça marche à tous les coups »).
- Aucune morale finale plaquée.

### 5.4 Écrire la science

- Structure type : qui (nom, éventuellement année), ce qu'ils ont fait (en une phrase concrète), ce qu'ils ont trouvé, le degré de certitude (« depuis, de nombreuses études vont dans le même sens » / « les résultats ont été discutés » / « d'autres équipes n'ont pas retrouvé l'effet »).
- Verbes autorisés : suggèrent, indiquent, montrent (seulement pour les résultats très répliqués : effet de test, espacement, oubli), convergent. Interdits : prouvent, la science a démontré, les neurosciences ont révélé.
- Pas de cerveau en gros plan : on parle d'attention, de mémoire, de sommeil, pas de « zones du cerveau qui s'allument ».
- Un fait scientifique par mouvement, au maximum trois noms de chercheurs par chapitre, sauf ch. 08 (cinq).

### 5.5 Bonnes et mauvaises phrases

| À ne pas écrire | À écrire (exemples de registre, non à recopier tels quels) |
|---|---|
| Il est important de noter que le sommeil joue un rôle crucial dans la réussite scolaire. | Pendant que tu dors, ta mémoire ne range pas ta chambre ; mais beaucoup de chercheurs pensent qu'elle fait un peu de tri dans ta journée. |
| Crois en toi et tu réussiras ! | Je ne te demande pas de croire en toi. Je te demande de refaire l'exercice 3 demain soir, sans regarder le corrigé. |
| Ce n'est pas un échec, c'est une leçon. Ce n'est pas une fin, c'est un début. | C'est un échec. Il a une date, une session, un relevé. Il dit quelque chose de toi, pas tout, et ce quelque chose, on va le lire. |
| Dans sa pauvre maison sans électricité, la petite Aïcha luttait courageusement. | Chez Aïcha, la lampe solaire charge sur le toit toute la journée. Le soir, on se la dispute. Elle gagne : elle a le Bac. |
| Sous le soleil brûlant de l'Afrique, les élèves rêvent d'un avenir meilleur. | À Garoua, en mars, on révise tôt, avant que la chaleur ne s'assoie sur la ville. |
| Sors de ta zone de confort et deviens la meilleure version de toi-même. | Lève la main une fois cette semaine. Une seule. Pour une question que tu trouves bête. |
| La science a prouvé que relire ne sert à rien. | Relire donne l'impression de savoir. C'est une impression honnête, et elle ment. |
| Les professeurs ne comprennent pas leurs élèves. | Kamga a soixante-dix copies et une lampe qui s'éteint quand on touche le fil. Il corrige quand même la soixante-dixième. |
| OnBuch, l'application révolutionnaire qui va transformer ta scolarité. | C'est un outil. Il éclaire une marche. Il ne la monte pas. |
| Et toi, qu'attends-tu pour changer ta vie ? | (Rien. La chute est un geste : Bella reprend son crayon.) |
| Le mot « nul » est une sentence — une sentence injuste — une sentence qui blesse. | Le mot ne dure qu'une seconde dans la bouche du professeur. Dans la tête de l'élève, il s'installe. |

### 5.6 Références à vérifier avant publication (liste de travail)

Piéron (docimologie) ; Rosenthal & Jacobson (1968) et Jussim & Harber (2005) ; Stanovich (1986) ; Sweller (charge cognitive) ; Chi (auto-explication) ; Pashler et al. (2008) ; Ashcraft (anxiété mathématique) ; Beilock (performance sous pression) ; Gilovich, Medvec & Savitsky (2000) ; Festinger (1954) ; Marsh (gros poisson, petite mare) ; Weiner (attributions) ; Seligman & Maier (1967, révision 2016) ; Kross et al. (2014) ; Dweck ; Sisk et al. (2018) ; Yeager et al. (2019) ; Roediger & Karpicke (2006) ; Dunlosky et al. (2013) ; Ebbinghaus (1885) ; Cepeda et al. (2006) ; Bjork (difficultés désirables) ; Rohrer (entrelacement) ; Leitner ; Diekelmann & Born (2010) ; Carskadon ; Monsell (2003) ; Ward et al. (2017) ; Butterfield & Metcalfe (2001) ; Hattie & Timperley (2007) ; Kapur ; Nestojko et al. (2014) ; Jamieson et al. (2010) ; Ramirez & Beilock (2011) ; Yerkes & Dodson (1908) ; Bourdieu & Passeron (1964) ; Mullainathan & Shafir (2013) ; Épictète, *Manuel* ; Deci & Ryan.
Tout nom non vérifié est retiré du texte ; l'idée peut rester sous la forme « des chercheurs ont observé ».

---

## 6. Glossaire de continuité et faits fixes

### 6.1 Comment on nomme les choses

| On écrit | On n'écrit pas | Remarque |
|---|---|---|
| le cahier de brouillon | le brouillon (seul), le carnet (pour ce cahier-là) | « le cahier » seul est permis après la première mention dans un chapitre |
| le carnet bleu (Divine), le carnet d'erreurs | le journal d'erreurs | |
| le cahier des noms, le cahier vert (Kamga) | le carnet de Kamga | |
| le tableau ; « tableau noir » une seule fois (prologue) | le tableau vert, l'écran | |
| la craie | le marqueur | |
| la classe (le groupe et la salle) ; la salle (si ambiguïté) | l'amphi (sauf université) | |
| le banc (« à trois par banc ») | la table-banc, le pupitre | |
| la copie, la copie double | la feuille d'examen | |
| la séquence, le devoir, le bac blanc | le contrôle continu, le partiel (sauf Nadège : « l'examen », « la session ») | Six séquences par an, trois trimestres |
| la moyenne, le rang, le bulletin | le classement, le carnet de notes | |
| le relevé de notes | le relevé des résultats | Pour le Bac (ch. 17) |
| le BEPC, le Probatoire, le Baccalauréat (le Bac) | le brevet, le bac français | Majuscule à Probatoire et Bac |
| Terminale D, Première A4 espagnol, Première F3, Seconde C, la troisième, la cinquième | Tle, 1ère (en abrégé dans le texte) | Les séries en lettres capitales |
| le proviseur, le censeur, le surveillant général | le directeur, le CPE | |
| le répétiteur, les répétitions | le prof particulier, le coaching | |
| le professeur, l'enseignant, monsieur Kamga | le prof (sauf en dialogue d'élève) | |
| le courant (« le courant est parti / revenu »), la coupure | l'électricité (sauf nécessité), le black-out | Pas de nom de compagnie |
| le forfait, la connexion, les données | le data, la 4G (sauf dialogue) | Pas de prix exact |
| le téléphone | le smartphone, le portable | |
| la lampe solaire, la lampe torche du téléphone, le lampadaire | la loupiote, la torche (seul) | |
| la tôle | le toit de tôle ondulée (une fois suffit) | |
| la tontine | la caisse | |
| la boutique de tonton Fabrice | l'atelier (réservé au ch. 16 et à Ibrahim) | « atelier » : mot réservé |
| le marché, le carrefour, le pont sur le Wouri | | |
| la mini-cité, le cybercafé (« le cyber » en dialogue) | | |
| francs CFA, « quelques centaines de francs » | montants exacts | Aucun chiffre de prix |
| OnBuch | Onbuch, ON BUCH, l'appli OnBuch | « OnBuch+ » une seule fois, dans la note de l'auteur |
| le programme officiel, le MINESEC | le curriculum | |
| l'intelligence artificielle, l'IA (après première mention) | ChatGPT ou tout nom d'outil | |
| l'auteur dit « je » ; « Ludovic » seulement en signature de la lettre | Ludovic A. dans le corps du texte | |

Typographie : guillemets français « » avec espaces insécables ; espace insécable avant : ; ? ! ; heures « 21 h » ; nombres en lettres jusqu'à cent dans le texte courant, sauf notes sur vingt (« seize », « quatre » en lettres aussi dans le récit ; « 2/3 + 1/4 » en chiffres). Pensées intérieures en italique ; dialogues entre guillemets, intégrés aux paragraphes, sans tiret de dialogue.

### 6.2 Faits fixes à ne pas contredire

- Rodrigue reçoit « Toujours nul » en 5e, à douze ans, d'un professeur de mathématiques sans nom ; note : quatre. Le soir, un camarade écrit NUL sur l'étiquette de son cahier de brouillon, en capitales, au stylo à bille.
- Rodrigue est en 3e pendant l'année du livre ; il travaille le samedi chez tonton Fabrice ; il demande la série électronique du lycée technique ; il obtient le BEPC sans mention, de peu ; il entrera au lycée technique.
- Le voisin des Essomba a un escalier en chantier, deux marches manquantes ; une rampe apparaît à l'épilogue ; les marches manquent toujours.
- Kamga a une seconde C de plus de soixante-dix élèves ; Divine y a seize en mathématiques au premier trimestre et est trente et unième au rang.
- Divine fait vingt-trois fautes à la dictée de janvier ; elle en reporte sept dans le carnet bleu le premier soir.
- Kamga trouve trente fois la même erreur sur quarante copies (ch. 11) ; son stylo rouge s'épuise ; il termine au bleu.
- Grâce est en Première A4 espagnol, passe le Probatoire en juin ; son résultat n'est jamais donné.
- Ibrahim est en Première F3 ; Moussa est étudiant en médecine ; résultat d'Ibrahim jamais donné.
- Nadège échoue à la session de janvier, valide une partie des unités au rattrapage (ch. 13), pas toutes.
- Aïcha passe le Bac D en juin ; n'est pas admise (juillet) ; la suite n'est pas donnée ; Hadja a douze ans.
- Le courant part à 21 h dans l'interlude et ne revient pas dans ce chapitre ; il revient à l'épilogue.
- L'année n'est jamais nommée ; aucune date réelle d'examen n'est donnée (seulement le mois).
- Aucun personnage ne rencontre un autre personnage, sauf Kamga et Divine (même lycée) et la famille Essomba entre elle. L'auteur ne rencontre personne.
- OnBuch n'est nommé qu'aux ch. 15, 16 et dans la note de l'auteur.

---

## 7. Cahier des charges des chapitres OnBuch (15 « La lampe », 16 « Atelier »)

### 7.1 Ce qui peut être dit (faits du brief, et seulement eux)

1. Ludovic A. est l'auteur du livre et le créateur de l'application OnBuch (OnBuch+), qu'il construit pour aider élèves et étudiants.
2. Elle s'appuie sur les programmes officiels du MINESEC (Cameroun).
3. Elle propose des cours structurés par leçon, des fiches de travaux dirigés (TD) à trois niveaux, des corrigés, des fiches méthode.
4. Une grande partie du contenu est produite avec l'aide d'outils d'intelligence artificielle, puis vérifiée, corrigée et mise en page avec soin.
5. Le travail se fait matière par matière, classe par classe, du collège à la terminale, générale et technique.
6. Les motifs (pourquoi) : la scène du manque — cours introuvables, polycopiés illisibles, explications qui ne passent pas, élèves seuls le soir.
7. La manière (comment), décrite en termes généraux et vrais pour tout travail de ce genre : vérifier, corriger, rater, recommencer ; les limites de l'IA et la vigilance humaine ; le temps, la fatigue, les doutes.
8. La finalité (pour quoi) : une chance honnête, pas un miracle. Un outil parmi d'autres.

Ces faits peuvent être reformulés, développés en réflexion, illustrés par des **exemples génériques présentés comme tels** (« par exemple, une IA peut proposer un exercice de physique dont l'énoncé est juste et le résultat faux ») ; jamais par des anecdotes datées ou chiffrées.

### 7.2 Ce qui ne doit pas être dit (inconnu ou interdit)

- Aucun chiffre : utilisateurs, téléchargements, leçons, matières couvertes, heures de travail, notes améliorées, années de développement.
- Aucune date de création, aucun lieu, aucun nom de collaborateur, partenaire, financeur, établissement, institution (hors MINESEC comme source de programme ; ne jamais suggérer un partenariat ou une validation officielle).
- Aucune indication sur l'équipe : ni « seul », ni « avec mon équipe ».
- Aucune indication sur le modèle économique : ni gratuit, ni payant, ni différence entre OnBuch et OnBuch+.
- Aucune indication technique invérifiée : plateformes, fonctionnement hors connexion, taille, compatibilité.
- Aucun nom d'outil d'IA.
- Aucun témoignage d'utilisateur, aucune citation d'élève, même composite : les personnages de la Bible **n'utilisent pas** OnBuch dans le livre.
- Aucune comparaison avec d'autres applications, sites, éditeurs, répétiteurs.
- Aucune biographie : enfance, études, métier, déclic, échecs personnels — tout cela passe par les marqueurs.
- Aucun lien, adresse, code, prix, magasin d'applications, appel à télécharger, à noter, à partager.

### 7.3 Ce qui reste sous marqueur ⟦…⟧ (maximum 2 par chapitre)

**Chapitre 15 — La lampe**
1. Après la scène du lampadaire et un paragraphe en « je » qui dit ce que cette scène représente (paragraphe autonome) :
   `⟦À COMPLÉTER PAR LUDOVIC : le moment précis où l'idée de construire OnBuch est née — où tu étais, ce que tu as vu, entendu ou vécu ce jour-là⟧`
   Le paragraphe suivant doit commencer de façon à pouvoir suivre un marqueur vide ou un récit de deux pages (par exemple : « Une idée de ce genre ne vaut rien tant qu'on ne l'a pas mise au travail. »).
2. Dans le mouvement sur le manque :
   `⟦À COMPLÉTER PAR LUDOVIC : ta propre expérience du manque de cours ou d'explications, comme élève ou auprès d'élèves que tu connais — un souvenir concret⟧`

**Chapitre 16 — Atelier**
1. Dans la scène d'ouverture, au moment où le calcul refait à la main diffère de celui de l'écran ; la scène doit fonctionner en version générique si le marqueur reste vide :
   `⟦À COMPLÉTER PAR LUDOVIC : une erreur réelle trouvée dans un contenu produit avec l'aide de l'IA — la matière, la classe, la nature de l'erreur, et comment tu l'as repérée et corrigée⟧`
2. Dans le mouvement sur le temps et la fatigue :
   `⟦À COMPLÉTER PAR LUDOVIC : une soirée ou une journée de travail réelle sur OnBuch — l'heure, le lieu, ce qui fatigue, ce qui fait douter, ce qui fait continuer⟧`

Si un fait utile n'est pas dans le brief et ne relève d'aucun de ces marqueurs, **on ne l'écrit pas**.

### 7.4 Ton

- Celui d'un artisan qui parle de son établi, pas d'un fondateur qui présente son produit. Plus de verbes de travail (vérifier, refaire, relire, corriger, recommencer) que de noms de fonctionnalités.
- Le nom « OnBuch » apparaît au plus cinq fois par chapitre ; on peut dire « l'application », « ce travail », « ces cours ».
- Chaque qualité affirmée est suivie d'une limite dans le même mouvement (« les corrigés sont relus ; il en reste sans doute de faux »).
- L'ironie honnête du ch. 15 (un outil sur téléphone pour des élèves qui manquent de courant et de connexion) est obligatoire.
- Les autres ressources (professeur, manuel, camarade, annales, bibliothèque, groupe) sont nommées comme égales ou supérieures.
- Une seule phrase s'approchant d'une invitation est autorisée sur les deux chapitres, de ce registre : « Si elle peut t'éclairer, elle est là ; si elle ne le peut pas, le reste de ce livre tient sans elle. »
- Lexique proscrit propre à ces chapitres : révolutionnaire, innovant, unique, meilleur, n°1, solution, plateforme, communauté, contenu premium, gratuit, télécharge, disponible sur, rejoins, découvre, booste, garantie, des milliers, succès.
- Test final : chaque paragraphe des ch. 15–16 doit rester vrai et lisible si l'on remplace « OnBuch » par « ce travail ». Si un paragraphe ne survit pas à ce remplacement, c'est de la publicité ; on le réécrit.

---

## 8. Récapitulatif des interdits de chapitre

Les interdits complets figurent dans chaque fiche (rubrique **X**). Rappel de la répartition des sujets, pour éviter les redites :

| Sujet | Traité à fond dans | Seulement rappelé dans | Interdit dans |
|---|---|---|---|
| Docimologie, rang, bulletin | 02 | 17 (relevé) | les autres |
| Bases manquantes (diagnostic) | 03 | 07 | 08 et suivants |
| Réparation des bases, compréhension, styles d'apprentissage | 07 | 16 (TD à trois niveaux) | 03, 08 |
| Peur de demander, effet projecteur, anxiété et mémoire de travail | 04 | 11, 12 (une phrase) | 05, 06 |
| Comparaison | 05 | 13 (l'étudiante au répétiteur) | 06, 14 |
| Voix intérieure, attributions, mentalité de croissance | 06 | épilogue (implicite) | partout ailleurs |
| Test de rappel, espacement, Leitner | 08 | interlude (vécu), 11, 12, 16 | 07, 10 |
| Sommeil, corps, téléphone | 10 | 12, 17 (une phrase) | 08 |
| Erreur, retour, travail en groupe | 11 | 16 | 08, 12 |
| Examen, stress d'examen | 12 | 17 | 04, 08, 10 |
| Inégalités, structure | 13 | 15 (ironie de l'outil) | 14 |
| Famille, orientation, technique | 14 | épilogue | 05 |
| OnBuch | 15, 16 | note de l'auteur | tous les autres |
| Échec à un examen, ce que réussir veut dire | 17 | — | 12, épilogue |
| Gravité (détresse, idées noires) | 06, 17 | 04 (harcèlement), 12 (panique), 14 (violences), postface | — |

---

## 9. Grille de vérification avant remise d'un chapitre

1. La scène d'ouverture revient-elle au milieu et à la chute ?
2. Le passage « Ce soir, essaie ceci » est-il faisable ce soir, sans argent, avec un cahier ?
3. Chaque fait scientifique est-il formulé avec un degré de certitude et figure-t-il au §5.6 ?
4. Zéro statistique, zéro citation non vérifiée, zéro promesse ?
5. Zéro souvenir de l'auteur hors marqueur ; maximum deux marqueurs, chacun entouré d'un texte qui tient seul ?
6. Recherche des mots proscrits (§5.3, §7.4), des points d'exclamation, des tirets cadratins, des « non pas… mais », des triades.
7. Les interdits de la fiche sont-ils respectés ? Les faits fixes du §6.2 aussi ?
8. Les motifs prévus pour ce chapitre (§4) sont-ils posés, sans être expliqués ?
9. La chute est-elle un geste ou une image, pas une morale ni une question ?
10. Lecture à voix haute d'une page au hasard : sonne-t-elle comme ce livre, et comme aucun autre ?
