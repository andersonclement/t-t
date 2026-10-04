#!/usr/bin/env python3
"""Crée <dest>/ à partir d'un pipeline existant <base>/ et d'une fiche de progression
MINESEC (JSON de fetch_progression.py).  Une « unité » = un chapitre (maths), une séquence (SVT),
une unité d'apprentissage (informatique) ; les leçons/séances deviennent les savoirs de l'unité.
python3 make_pipeline.py <base> <dest> <progression.json> <Matière> <Niveau> <clé_série> <CLASSE> <Cadre>"""
import json,re,sys,shutil,unicodedata
from pathlib import Path
REPO=Path(__file__).resolve().parents[1]
base,dest,prog,matiere,niveau,key,classe,cadre=sys.argv[1:9]
START=re.compile(r"^\s*\"?\s*(Chap\s*\d+|S[ÉE]Q\.?\s*\d+|UA\s*\d+)\s*:?\s*",re.I)
def sent(s):
    s=re.sub(r"\s+"," ",s).strip().strip('"').strip(". ")
    return s[:1].upper()+(s[1:].lower() if s.isupper() else s[1:])
def slug(s):
    s=unicodedata.normalize("NFKD",s.replace("’"," ").replace("'"," ")).encode("ascii","ignore").decode().lower()
    stop={"le","la","les","l","de","du","des","d","un","une","et","au","aux","en","dans","a","sur"}
    w=[x for x in re.split(r"[^a-z0-9]+",s) if x]; w=[x for x in w if x not in stop] or w
    return "-".join(w)[:55].strip("-")
rows=json.load(open(prog))["rows"]; units=[]
for r in rows:
    ch=r["chapitre"].strip(); t=re.sub(r"\s+"," ",r["titre"]).strip()
    m=START.match(ch)
    if m or not units:
        title=sent(START.sub("",ch)) if m else sent(ch)
        units.append(dict(titre=title,rows=[]))
    units[-1]["rows"].append(t)
lessons=[]
for i,u in enumerate(units,1):
    sav=[];sf=[]
    for t in u["rows"]:
        tl=t.lower()
        if tl.startswith("prise de contact"): continue
        if tl.startswith("tp") or "travaux pratiques" in tl: sf.append(t); continue
        if "activités d'intégration" in tl or "activites d'integration" in tl or "apprentissage de l" in tl: sf.append("Activités d'intégration : exercices et problèmes de synthèse de l'unité"); continue
        sav.append(re.sub(r"^(Leçon|Séance)\s*\d+\s*:?\s*","",t,flags=re.I).strip() or t)
    sf=list(dict.fromkeys(sf+["Appliquer les notions de l'unité à des situations concrètes de la vie courante","Rédiger et justifier une démarche, une réponse ou une conclusion"]))
    n=len(u["rows"])
    lessons.append({"id":f"N{i:02d}","slug":slug(u["titre"]),"titre":u["titre"],"module":f"{matiere} – classe de {niveau}","series":[key],
      "duree":{key:f"{n} séance{'s' if n>1 else ''} (fiche de progression harmonisée)"},
      "famille":f"Fiche de progression harmonisée MINESEC 2026-27 – {matiere}, classe de {niveau}",
      "savoirs":sav or [u["titre"]],"savoir_faire":sf})
cat={"matiere":matiere,"classe":classe,"series":[key],"source":f"Fiche de progression harmonisée MINESEC 2026-27 (minesec-ige.com) – {matiere}, classe de {niveau}. {len(units)} unités. Cadre : {cadre}","lessons":lessons}
D=REPO/dest; B=REPO/base
if D.exists(): shutil.rmtree(D)
shutil.copytree(B,D,ignore=shutil.ignore_patterns("build","cours","td","__pycache__"))
json.dump(cat,open(D/"pipeline"/"lessons.json","w"),ensure_ascii=False,indent=1)
NIV=f"NIVEAU ET CADRE (PRIORITAIRE, prime sur tout ce qui suit) : tu rédiges pour la classe de {niveau} (collège, élèves de 14-15 ans, examen : BEPC), au programme officiel MINESEC. {cadre} Les mentions de Première, de Terminale, de lycée ou de Baccalauréat ci-dessous ne s'appliquent pas : adapte-les à la classe de {niveau} et au BEPC. Tu ne dois JAMAIS dépasser le programme de {niveau} ni les savoirs listés pour l'unité : pas de hors-programme, pas de notion de classes supérieures.\n\n"
g=D/"pipeline"/"generate.py"; s=g.read_text()
s=re.sub(r'SYSTEM = r"""','SYSTEM = r"""'+NIV.replace("\\","\\\\"),s,count=1)
s=re.sub(r'"""Pipeline de génération[^\n]*\n',f'"""Pipeline de génération des cours signés OnBuch+ ({matiere}, classe de {niveau}).\n',s,count=1)
s=re.sub(r"SERIES_NOMS = \{[^}]*\}",f'SERIES_NOMS = {{"{key}": "{niveau}"}}',s)
s=re.sub(r"(\\newcommand\{\\DOCMATIERE\}\{)[^}]*(\}\\newcommand\{\\DOCNIVEAU\}\{)[^}]*(\})",lambda m:m.group(1)+matiere+m.group(2)+niveau+m.group(3),s,count=1)
s=re.sub(r"programme officiel de (Première|Terminale)",f"programme officiel MINESEC de la classe de {niveau}",s)
s=s.replace("notion de Première ou de début d'année utile","notion de 4ème ou de début d'année utile").replace("idée d'exercice type Bac","idée d'exercice type BEPC").replace("vocabulaire du Bac camerounais","vocabulaire du BEPC camerounais")
g.write_text(s)
b=D/"pipeline"/"build.py"; t=b.read_text()
t=re.sub(r"SERIES_NOMS = \{[^}]*\}",f'SERIES_NOMS = {{"{key}": "{niveau}"}}',t)
t=re.sub(r'SERIES_NOMS\.get\(serie, f"[^"]*"\)',f'SERIES_NOMS.get(serie, "{niveau}")',t)
t=re.sub(r'f"(Tle|1ère)-\{serie\}"','"3eme"',t); t=t.replace("cours/Tle-<S>/","cours/3eme/")
b.write_text(t)
print(dest,len(units),"unités,",sum(len(u["rows"]) for u in units),"séances")
