#!/usr/bin/env python3
"""Phase 1 enseignement technique : crée tech-<matière>-<1re|tle>-onbuch/ pour le tronc commun.
Fusionne toutes les versions de progression (spécialités) d'une matière+classe en unités uniques."""
import json,re,sys,shutil,os,unicodedata,collections
from pathlib import Path
REPO=Path(__file__).resolve().parents[1]
R=[r for r in json.load(open(REPO/"programmes-officiels"/"tech_progressions.json")) if r["n"]>0]
def strip_acc(s): return unicodedata.normalize("NFKD",s).encode("ascii","ignore").decode()
def key(s): return re.sub(r"[^a-z0-9]+"," ",strip_acc(s).lower()).strip()
SUITE=re.compile(r"\(\s*(suite|continues?|cont\.)[^)]*\)|\bsuite et fin\b|\(suite\)",re.I)
PREF=re.compile(r"^\s*(chap(itre)?|s[ée]quence|sequence|module|unit[ée]?|ua|th[èe]me|theme|lesson|le[cç]on)\s*\d*\s*[:.\-–]*\s*",re.I)
EVAL=re.compile(r"^\s*(evaluation|évaluation|composition|devoir|examen|bilan|remédiation|correction|prise de contact|synth[eè]se de fin)",re.I)
def clean(s): return re.sub(r"\s+"," ",PREF.sub("",SUITE.sub("",s))).strip(" :.-–")
def merge(classe,subject):
    vs={}
    for r in R:
        if r["subject"]==subject and r["classe"]==classe: vs.setdefault(r["sig"],r)
    vs=sorted(vs.values(),key=lambda r:-r["n"])
    chaps=collections.OrderedDict()
    for v in vs:
        cur=None
        for x in v["rows"]:
            ch=x["chapitre"].strip()
            if ch: cur=clean(ch)
            if not cur or not key(cur): continue
            t=clean(x["titre"])
            if not t or EVAL.match(t) or "activités d'intégration" in t.lower(): 
                if "intégration" in t.lower(): chaps.setdefault(key(cur),dict(title=cur,l=collections.OrderedDict())) ["l"].setdefault("__int__","Activités d'intégration")
                continue
            c=chaps.setdefault(key(cur),dict(title=cur,l=collections.OrderedDict()))
            c["l"].setdefault(key(t),t)
    rows=[]
    for i,c in enumerate(chaps.values(),1):
        ls=[v for k,v in c["l"].items() if k!="__int__"]+(["Activités d'intégration"] if "__int__" in c["l"] else [])
        if not ls: continue
        for j,t in enumerate(ls):
            rows.append(dict(n=str(len(rows)+1),trimestre="",periode="",chapitre=(f"Chap{i}: {c['title']}" if j==0 else ""),titre=t))
    return rows,len(vs)
SUBJ={ # matière: (base, dossier, identité, cadre)
"Mathématiques":("maths1-onbuch","maths","Tu es un professeur agrégé de mathématiques, auteur de manuels pour l'enseignement technique du Cameroun et concepteur de cours numériques PREMIUM pour l'application OnBuch+. Tes cours sont clairs, progressifs, illustrés par des exemples tirés des métiers techniques (atelier, chantier, gestion, électricité, mécanique), avec des exercices résolus et des erreurs fréquentes signalées.","Reste strictement dans le programme de mathématiques de l'enseignement technique (chapitres listés)."),
"Français":("geo-onbuch","francais","Tu es un professeur agrégé de lettres modernes (Français), auteur de manuels pour l'enseignement technique du Cameroun et concepteur de cours numériques PREMIUM pour l'application OnBuch+. Tes cours suivent les séquences du programme (réception de textes, langue française, production d'écrits : dissertation, résumé/contraction, commentaire, expression écrite et orale), avec des extraits courts d'auteurs africains et français libres de droit ou cités brièvement, des méthodes pas à pas et des exercices corrigés. Aucun croquis cartographique : utilise tableaux et schémas simples.","Reste dans le programme de Français de l'enseignement technique (séquences listées)."),
"Anglais":("geo-onbuch","anglais","You are a senior English teacher and author of textbooks for technical secondary education in Cameroon, and a designer of PREMIUM digital courses for the OnBuch+ app. Write each lesson mainly IN ENGLISH (clear, simple, graded language for Francophone technical students), with short French glosses for key vocabulary and the instructions of the exercises in English. Follow the official modules (family and social life, economic life and occupations, environment/wellbeing/health, citizenship and human rights…) and the functions: speaking, grammar, vocabulary, reading, writing. Provide dialogues, short texts, grammar tables, vocabulary lists and corrected exercises. No maps.","Stay strictly within the English programme of technical education (listed modules and lessons). The BEPC level is replaced by the Probatoire/Baccalauréat technique level."),
"ECM":("geo-onbuch","ecm","Tu es un professeur agrégé d'Éducation à la Citoyenneté et à la Morale (ECM), auteur de manuels pour l'enseignement technique du Cameroun et concepteur de cours numériques PREMIUM pour l'application OnBuch+. Tes cours présentent les notions de citoyenneté, de droits humains, de valeurs morales et de vie en société à partir de situations concrètes (atelier, entreprise, quartier, réseaux sociaux), avec des études de cas, des textes officiels cités brièvement et des exercices corrigés. Aucun croquis cartographique.","Reste dans le programme d'ECM de l'enseignement technique (chapitres listés)."),
"Histoire":("geo-onbuch","histoire","Tu es un professeur agrégé d'Histoire, auteur de manuels pour l'enseignement technique du Cameroun et concepteur de cours numériques PREMIUM pour l'application OnBuch+. Tes cours sont rigoureux et chronologiques (faits, acteurs, causes, conséquences), appuyés sur des documents décrits, des frises chronologiques TikZ simples, des cartes schématiques et des exercices de commentaire de documents corrigés.","Reste dans le programme d'Histoire de l'enseignement technique (chapitres listés)."),
"Géographie":("geo-onbuch","geographie","Tu es un professeur agrégé de Géographie, auteur de manuels pour l'enseignement technique du Cameroun et concepteur de cours numériques PREMIUM pour l'application OnBuch+. Tes cours s'appuient sur des cartes et croquis simples, des données chiffrées exactes et des études de cas (Cameroun, Afrique, monde), avec des exercices corrigés.","Reste dans le programme de Géographie de l'enseignement technique (chapitres listés)."),
"Philosophie":("geo-onbuch","philosophie","Tu es un professeur agrégé de Philosophie, auteur de manuels pour l'enseignement technique du Cameroun et concepteur de cours numériques PREMIUM pour l'application OnBuch+. Tes cours définissent les notions, présentent les thèses des grands auteurs (cités brièvement), problématisent, argumentent et préparent à la dissertation et au commentaire, avec des exemples concrets camerounais et des exercices corrigés. Aucun croquis cartographique.","Reste dans le programme de Philosophie de l'enseignement technique (chapitres listés)."),
}
CL={"Classe de 1ere":("1re","Première","1re Tech"),"Classe de terminale":("tle","Terminale","Tle Tech")}
def build(subject,classe):
    base,slugm,ident,cadre=SUBJ[subject]; short,cls,niv=CL[classe]
    rows,nv=merge(classe,subject)
    name=f"tech-{slugm}-{short}-onbuch"
    # lessons.json via la logique de make_pipeline
    tmp=REPO/"programmes-officiels"/"_tmp_rows.json"; tmp.write_text(json.dumps({"rows":rows},ensure_ascii=False))
    import subprocess
    cadre_full=f"Enseignement technique, classe de {cls}, toutes spécialités confondues ({nv} version(s) de progression fusionnées). {cadre}"
    subprocess.run([sys.executable,str(REPO/"programmes-officiels"/"make_pipeline.py"),base,name,str(tmp),subject,f"{cls} technique","T",cls+" (enseignement technique)",cadre_full],check=True,capture_output=True)
    D=REPO/name
    # remplace l'identité du SYSTEM
    g=D/"pipeline"/"generate.py"; s=g.read_text()
    m=re.search(r'(SYSTEM = r""")(NIVEAU ET CADRE.*?\n\n)(.*?)(\n\nTu produis UNIQUEMENT)',s,re.S)
    s=s[:m.start(3)]+ident.replace("\\","\\\\")+s[m.end(3):]
    s=re.sub(r"SERIES_NOMS = \{[^}]*\}",f'SERIES_NOMS = {{"T": "{niv}"}}',s)
    s=re.sub(r"(\\newcommand\{\\DOCNIVEAU\}\{)[^}]*(\})",lambda k:k.group(1)+niv+k.group(2),s,count=1)
    s=s.replace("BEPC","Probatoire / Baccalauréat technique") if subject!="Anglais" else s
    g.write_text(s)
    b=D/"pipeline"/"build.py"; t=b.read_text()
    t=re.sub(r'f"[A-Za-z0-9èé]+-\{serie\}"',f'"{short}-tech"',t); t=t.replace("cours/3eme/",f"cours/{short}-tech/")
    t=re.sub(r"SERIES_NOMS = \{[^}]*\}",f'SERIES_NOMS = {{"T": "{niv}"}}',t)
    b.write_text(t)
    # polices partagées (évite de dupliquer des Mo)
    f=D/"fonts"
    if f.exists() and not f.is_symlink(): shutil.rmtree(f); f.symlink_to(os.path.relpath(REPO/"geo-onbuch"/"fonts",D))
    c=json.loads((D/"pipeline"/"lessons.json").read_text())
    return name,len(c["lessons"]),nv
if __name__=="__main__":
    out=[]
    for subject in SUBJ:
        for classe in CL:
            if not any(r["subject"]==subject and r["classe"]==classe for r in R): continue
            out.append(build(subject,classe)); print(out[-1],flush=True)
    print(sum(x[1] for x in out),"unités au total")
