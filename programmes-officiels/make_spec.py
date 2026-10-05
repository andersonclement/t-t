#!/usr/bin/env python3
"""Enseignement technique STT — pipelines par SPÉCIALITÉ (SES, Comptabilité de Gestion), matières de base uniquement
(sans langues, Anglais, Français, Géographie). Sortie : tech-<spec>-<matière>-<1re|tle>-onbuch/
  python3 make_spec.py [spec ...]"""
import json,re,sys,shutil,os,subprocess
from pathlib import Path
import make_tech as mt
REPO=mt.REPO
SPECS={"ses":("Sciences Economiques et Sociales","STT-SES"),"cg":("Comptabilite de Gestion","STT-CG")}
EXCL=("Anglais","Français","Géographie","Allemand","Chinois","Espagnol")
CTX="Tu es un professeur agrégé de {m}, auteur de manuels pour l'enseignement technique du Cameroun (séries tertiaires STT) et concepteur de cours numériques PREMIUM pour l'application OnBuch+. "
ID={
"compta":CTX.format(m="comptabilité (SYSCOHADA révisé / plan comptable OHADA)")+"Tes cours présentent chaque notion avec des exemples chiffrés exacts en FCFA, des écritures comptables en tableaux (journal, grand livre, balance), des schémas de circuit comptable simples, des exercices corrigés pas à pas et des erreurs fréquentes. Vérifie systématiquement l'équilibre débit/crédit et les calculs. Aucune carte.",
"cgao":CTX.format(m="comptabilité et gestion assistées par ordinateur")+"Tes cours expliquent la saisie, le paramétrage, les traitements et les éditions d'un logiciel de comptabilité/gestion et d'un tableur, sans captures d'écran : utilise des tableaux, des listes d'étapes numérotées et des schémas simples ; exercices pratiques corrigés. Aucune carte.",
"droit":CTX.format(m="droit (droit camerounais et OHADA)")+"Tes cours exposent les notions juridiques avec des cas pratiques, des articles de loi cités brièvement et exactement, des schémas simples et des exercices corrigés (qualification, règle, application, conclusion). Aucune carte.",
"eco":CTX.format(m="sciences économiques")+"Tes cours présentent les notions économiques avec des exemples camerounais et africains, des données chiffrées plausibles et indiquées comme ordres de grandeur, des graphiques simples (TikZ/pgfplots) et des exercices corrigés. Aucune carte.",
"ses":CTX.format(m="sciences économiques et sociales (économie, sociologie, démographie)")+"Tes cours articulent notions, auteurs (cités brièvement), exemples camerounais et africains, tableaux et graphiques simples, et préparent aux épreuves du Probatoire (dissertation, étude de document). Aucune carte.",
"redac":CTX.format(m="rédaction professionnelle et correspondance")+"Tes cours donnent des modèles complets de lettres, rapports, comptes rendus et notes de service, des règles de mise en page, des critères de qualité et des exercices corrigés. Aucune carte.",
"mathapp":CTX.format(m="mathématiques appliquées à la gestion")+"Tes cours traitent mathématiques financières, statistiques et probabilités avec des exemples de gestion (intérêts, annuités, séries statistiques), des formules exactes, des tableaux et des exercices corrigés avec calculs détaillés.",
}
# préfixe de la matière dans la fiche -> (slug, nom affiché, base, clé identité ou SUBJ, cadre)
MAP=[("Comptabilité d’entreprises","compta-entreprises","Comptabilité d'entreprises","geo-onbuch","compta"),
("Comptabilité et gestion assistées","cgao","Comptabilité et gestion assistées par ordinateur","geo-onbuch","cgao"),
("Gestion de l’information financière","gestion-info-financiere","Gestion de l'information financière","geo-onbuch","compta"),
("Comptabilité de management","compta-management","Comptabilité de management","geo-onbuch","compta"),
("Finance d’entreprises","finance-entreprises","Finance d'entreprises","geo-onbuch","compta"),
("Comptabilité","comptabilite","Comptabilité","geo-onbuch","compta"),
("Droit","droit","Droit","geo-onbuch","droit"),
("Economie générale","economie-generale","Économie générale","geo-onbuch","eco"),
("Economie d’entreprise","economie-entreprise","Économie d'entreprise","geo-onbuch","eco"),
("Sciences économiques et sociales","sciences-eco-sociales","Sciences économiques et sociales","geo-onbuch","ses"),
("Rédaction professionnelle","redaction-professionnelle","Rédaction professionnelle","geo-onbuch","redac"),
("Mathématiques appliquées","maths-appliquees","Mathématiques appliquées","maths1-onbuch","mathapp"),
("Mathématiques","maths","Mathématiques","maths1-onbuch","Mathématiques"),
("ECM","ecm","ECM","geo-onbuch","ECM"),("Histoire","histoire","Histoire","geo-onbuch","Histoire"),("Philosophie","philosophie","Philosophie","geo-onbuch","Philosophie")]
def lookup(raw):
    for pre,slug,disp,base,idk in MAP:
        if raw.startswith(pre):
            m=re.match(r"[^:]*?\s(II|I)\s*:",raw)
            if m: slug+="-"+m.group(1).lower(); disp+=" "+m.group(1)
            return slug,disp,base,idk
def build(spec,classe,raw):
    sname,tag=SPECS[spec]; slug,disp,base,idk=lookup(raw)
    short,cls,_=mt.CL[classe]; niv=f"{'1re' if short=='1re' else 'Tle'} {tag}"
    ident,cadre0=(ID[idk],"") if idk in ID else (mt.SUBJ[idk][2],mt.SUBJ[idk][3])
    rows,nv=mt.merge(classe,raw)
    name=f"tech-{spec}-{slug}-{short}-onbuch"
    tmp=REPO/"programmes-officiels"/"_tmp_rows.json"; tmp.write_text(json.dumps({"rows":rows},ensure_ascii=False))
    cadre_full=f"Enseignement technique tertiaire (STT), spécialité {sname.replace('Comptabilite','Comptabilité').replace('Economiques','Économiques')}, classe de {cls}. Programme officiel : {raw}. Reste strictement dans les chapitres et séances listés ; niveau Probatoire / Baccalauréat technique. {cadre0}"
    subprocess.run([sys.executable,str(REPO/"programmes-officiels"/"make_pipeline.py"),base,name,str(tmp),disp,f"{cls} technique","T",cls+" (STT)",cadre_full],check=True,capture_output=True)
    D=REPO/name
    g=D/"pipeline"/"generate.py"; s=g.read_text()
    m=re.search(r'(SYSTEM = r""")(NIVEAU ET CADRE.*?\n\n)(.*?)(\n\nTu produis UNIQUEMENT)',s,re.S)
    s=s[:m.start(3)]+ident.replace("\\","\\\\")+s[m.end(3):]
    s=re.sub(r"SERIES_NOMS = \{[^}]*\}",f'SERIES_NOMS = {{"T": "{niv}"}}',s)
    s=re.sub(r"(\\newcommand\{\\DOCNIVEAU\}\{)[^}]*(\})",lambda k:k.group(1)+niv+k.group(2),s,count=1)
    s=s.replace("BEPC","Probatoire / Baccalauréat technique")
    g.write_text(s)
    b=D/"pipeline"/"build.py"; t=b.read_text()
    t=re.sub(r'f"[A-Za-z0-9èé]+-\{serie\}"',f'"{short}-{spec}"',t); t=t.replace("cours/3eme/",f"cours/{short}-{spec}/")
    t=re.sub(r"SERIES_NOMS = \{[^}]*\}",f'SERIES_NOMS = {{"T": "{niv}"}}',t)
    b.write_text(t)
    f=D/"fonts"
    if f.exists() and not f.is_symlink(): shutil.rmtree(f); f.symlink_to(os.path.relpath(REPO/"geo-onbuch"/"fonts",D))
    return name,len(json.loads((D/"pipeline"/"lessons.json").read_text())["lessons"])
if __name__=="__main__":
    out=[]; ALL=list(mt.R)
    for spec in (sys.argv[1:] or SPECS):
        sname=SPECS[spec][0]
        sid={e["specialty"]["designation"]:e["specialty"]["id"] for e in json.load(open(REPO/"programmes-officiels"/"tech_tree.json"))}[sname]
        full=[r for r in ALL if r["specialty"]==sid]
        mt.R=full
        for classe in mt.CL:
            for raw in sorted({r["subject"] for r in full if r["classe"]==classe}):
                if raw.startswith(EXCL) or not lookup(raw): 
                    print("ignoré:",spec,classe,raw); continue
                out.append(build(spec,classe,raw)); print(out[-1],flush=True)
    print(sum(x[1] for x in out),"unités,",len(out),"pipelines")
