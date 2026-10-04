#!/usr/bin/env python3
"""Correctifs sûrs et idempotents appliqués aux build/*/*.rev.tex d'un pipeline, puis revalidation des .err.
python3 autofix_all.py <pipeline-dir> [...]"""
import re,glob,sys,subprocess,os
BOX="methode|attention|aretenir|propriete|definition|exemplebox"
ITEMS=re.compile(r"(\\begin\{(?:"+BOX+r")\}(?:\[[^\]\n]*\])?\n)((?:\s*\\item[^\n]*\n(?:(?!\s*\\(?:item|end))[^\n]*\n)*)+)(\\end\{(?:"+BOX+r")\})")
FOREACH=re.compile(r"(\\foreach[^\n]*\bin\s*\{[^{}]*?)\s*\n\s*\}")
def fix(s):
    s=ITEMS.sub(lambda m:m.group(1)+"\\begin{enumerate}\n"+m.group(2)+"\\end{enumerate}\n"+m.group(3),s)
    s=FOREACH.sub(r"\1}",s)
    s=re.sub(r">\{\\centering\}",r">{\\centering\\arraybackslash}",s)
    s=re.sub(r"\\textbf\{\\tcblower ",r"\\tcblower\n\\textbf{",s)
    s=re.sub(r"(font=(?:\\[a-zA-Z]+)+)\\textcolor\{([^{}]*)\}",r"\1\\color{\2}",s)
    s=re.sub(r"(->\[|<-\[)([^\]]*)(\])",lambda m:m.group(1)+m.group(2).translate(str.maketrans("éèêëàâîïôùûüç","eeeeaaiiouuuc"))+m.group(3),s)
    s=re.sub(r"(\\ce\{[^}]*)\\cdot ?",r"\1.",s); s=re.sub(r"(\\ce\{[^}]*)·",r"\1.",s)
    s=s.replace("\\textasym{}","$\\approx$").replace("\\end{aretenu}","\\end{aretenir}").replace("\\begin{aretenu}","\\begin{aretenir}")
    s=re.sub(r"\(voir \\(aretenir|definition|propriete|methode|attention) (ci-dessus|ci-dessous)\)",r"(voir l'encadré \2)",s)
    s=re.sub(r"(\\begin\{[a-z]+\}\[)([^\]\n]*)(\])",lambda m:m.group(1)+re.sub(r"(?<!\\)&",r"\\&",m.group(2))+m.group(3),s)
    s=re.sub(r"\\texttt\{([^{}]*)\}",lambda m:"\\texttt{"+re.sub(r"(?<!\\)_",r"\\_",m.group(1))+"}",s)
    s=re.sub(r"\{groupplots\}","{groupplot}",s)
    s=re.sub(r"\\SI\{([0-9.,]+)\}\{-+\}\{([0-9.,]+)\}",r"\\SIrange{\1}{\2}",s)
    s=re.sub(r"\{km\$\^2\$\}",r"{\\kilo\\meter\\squared}",s); s=re.sub(r"\{m\$\^2\$\}",r"{\\meter\\squared}",s)
    s=re.sub(r"(<?-)\\(Stealth|Latex)\b",r"\1\2",s)
    s=re.sub(r"\\n([A-ZÉÈÀÂÎÔ$(+0-9])",r"\\\\\1",s)          # \n littéral (jamais devant une minuscule : \node, \num…)
    def split_cmds(l):
        if "node" not in l: return l
        for cmd in ("\\textit{","\\emph{","\\texttt{","\\textsf{","\\textbf{"):
            out=[];i=0
            while True:
                j=l.find(cmd,i)
                if j<0: out.append(l[i:]);break
                out.append(l[i:j]); k=j+len(cmd); d=1
                while k<len(l) and d:
                    d+=(l[k]=="{")-(l[k]=="}"); k+=1
                inner=l[j+len(cmd):k-1]
                if "\\\\" in inner: inner=("}\\\\"+cmd).join(inner.split("\\\\"))
                out.append(cmd+inner+"}"); i=k
            l="".join(out)
        return l
    s="\n".join(split_cmds(l) for l in s.split("\n"))
    return s
for d in sys.argv[1:]:
    ch=0
    for f in glob.glob(f"{d}/build/N*/*.rev.tex")+glob.glob(f"{d}/build/M*/*.rev.tex"):
        s=open(f).read(); t=fix(s)
        if t!=s: open(f,"w").write(t); ch+=1
    errs=sorted(glob.glob(f"{d}/build/*/*.err"))
    ok=0
    for e in errs:
        ref="/".join(e.split("/build/")[1].replace(".err","").split("/"))
        p=subprocess.run([sys.executable,"pipeline/check.py",ref],cwd=d,capture_output=True,text=True)
        ok+=("✔" in p.stdout)
    print(f"{d}: {ch} fichiers modifiés ; {ok}/{len(errs)} blocs en erreur revalidés")
