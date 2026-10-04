#!/usr/bin/env python3
"""Correctifs sûrs et idempotents appliqués aux build/*/*.rev.tex d'un pipeline, puis revalidation des .err.
python3 autofix_all.py <pipeline-dir> [...]"""
import re,glob,sys,subprocess,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import cle_math
BOX="methode|attention|aretenir|propriete|definition|exemplebox"
ITEMS=re.compile(r"(\\begin\{(?:"+BOX+r")\}(?:\[[^\]\n]*\])?\n)((?:\s*\\item[^\n]*\n(?:(?!\s*\\(?:item|end))[^\n]*\n)*)+)(\\end\{(?:"+BOX+r")\})")
FOREACH2=re.compile(r"(\\foreach[^\n]*\bin\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*?)\s*\n\s*\}(?=\s*\{)")
FOREACH=re.compile(r"(\\foreach[^\n]*\bin\s*\{[^{}]*?)\s*\n\s*\}")

COLMAP={"gray":"popmuted","grey":"popmuted","brown":"poporange!70!popdark","red":"poppink","yellow":"popgold","teal":"popblue!60!popgreen","cyan":"popblue!60!popgreen","turquoise":"popblue!60!popgreen","violet":"poppurple","lime":"popgreen","amber":"popgold","navy":"popink","black":"popdark","lightgray":"popmuted!20","darkgray":"popmuted!80!popdark","white":"white","beige":"popcream","cream":"popcream","rose":"poppink","lilac":"poppurple!40","indigo":"popink"}
_defined={}
def defined_for(d):
    if d not in _defined:
        t=open(os.path.join(d,"preamble.tex")).read()
        _defined[d]=set(re.findall(r"\\(?:definecolor|colorlet)\{(pop[A-Za-z]+)\}",t))
    return _defined[d]
def fix_colors(s,d):
    ok=defined_for(d)
    def r(m):
        full=m.group(0)
        if full in ok: return full
        base=m.group(1); light=m.group(2)=="L"
        key=base.lower()
        if key in COLMAP:
            c=COLMAP[key]
            return (c+"!18") if light and "!" not in c else c
        return full
    return re.sub(r"\bpop([a-z]+)(L?)\b",r,s)
def fix(s):
    s=ITEMS.sub(lambda m:m.group(1)+"\\begin{enumerate}\n"+m.group(2)+"\\end{enumerate}\n"+m.group(3),s)
    s=FOREACH.sub(r"\1}",s)
    s=FOREACH2.sub(r"\1}",s)
    s=re.sub(r">\{\\centering\}",r">{\\centering\\arraybackslash}",s)
    s=re.sub(r"\\textbf\{\\tcblower ",r"\\tcblower\n\\textbf{",s)
    s=re.sub(r"(font=(?:\\[a-zA-Z]+)+)\\textcolor\{([^{}]*)\}",r"\1\\color{\2}",s)
    s=re.sub(r"(->\[|<-\[)([^\]]*)(\])",lambda m:m.group(1)+m.group(2).translate(str.maketrans("éèêëàâîïôùûüç","eeeeaaiiouuuc"))+m.group(3),s)
    s=re.sub(r"(\\ce\{[^}]*)\\cdot ?",r"\1.",s); s=re.sub(r"(\\ce\{[^}]*)·",r"\1.",s)
    s=s.replace("\\textasym{}","$\\approx$").replace("\\end{aretenu}","\\end{aretenir}").replace("\\begin{aretenu}","\\begin{aretenir}")
    s=re.sub(r"\(voir \\(aretenir|definition|propriete|methode|attention) (ci-dessus|ci-dessous)\)",r"(voir l'encadré \2)",s)
    s=re.sub(r"(\\begin\{[a-z]+\}\[)([^\]\n]*)(\])",lambda m:m.group(1)+re.sub(r"(?<!\\)&",r"\\&",m.group(2))+m.group(3),s)
    s=re.sub(r"\\texttt\{([^{}]*)\}",lambda m:"\\texttt{"+re.sub(r"(?<!\\)_",r"\\_",m.group(1))+"}",s)
    s=re.sub(r"\\begin\{tikzpicture\}.*?\\end\{tikzpicture\}",lambda m:re.sub(r"\n[ \t]*\n","\n",m.group(0)),s,flags=re.S)
    # style TikZ fermé par ] au lieu de }
    def fix_style(l):
        if "/.style={" in l and l.count("{")-l.count("}")==1:
            l2=re.sub(r"\](,?)\s*$",r"}\1",l)
            return l2
        return l
    s="\n".join(fix_style(l) for l in s.split("\n"))
    # style nommé "step" (réservé par TikZ)
    if re.search(r"\bstep/\.style",s):
        s=re.sub(r"(?<![A-Za-z])step/\.style","stepbox/.style",s)
        s=re.sub(r"\[[^\]\n]*\]",lambda m:re.sub(r"(?<=[\[,\s])step(?=[,\]\s])","stepbox",m.group(0)),s)
    s=s.replace("\\UAL\\ ","UAL ").replace("\\UAL","UAL").replace("\\milli\\meter\\mercure","\\milli\\meter\\of{Hg}")
    s=re.sub(r"\\cle\{([^{}$]*[\^_][^{}$]*)\}",lambda m:"\\cle{$"+m.group(1)+"$}",s)
    s=cle_math.fix(s)
    s=re.sub(r"^\\(attention|aretenir|definition|propriete|methode)\[([^\]\n]*)\][ \t]*(.+)$",lambda m:"\\begin{"+m.group(1)+"}["+m.group(2)+"]\n"+m.group(3)+"\n\\end{"+m.group(1)+"}",s,flags=re.M)
    s=re.sub(r"label=(?!\{)((?:above|below|left|right)[a-z ]*:)(\$[^$]*\$)",lambda m:"label={"+m.group(1)+m.group(2)+"}",s)
    s=s.replace("\\gramme","\\gram").replace("\\metre","\\meter").replace("\\litre","\\liter").replace("\\degreCelsius","\\celsius").replace("\\degreeCelsius","\\celsius").replace("\\micrometer","\\micro\\meter").replace("\\secondes","\\second").replace("\\textreregistered","\\textregistered")
    s=re.sub(r"\\n([à-ÿœ])",r"\\\\\1",s)
    s=re.sub(r"\\SI\{([<>])\s*([0-9.,]+)\}\{([^{}]*)\}",r"$\1 \\SI{\2}{\3}$",s)
    s=re.sub(r"\\env\{([^{}]*)\}\{([^{}]*)\}",r"\\SI{\1}{\2}",s)
    s=s.replace("r\\duire","réduire").replace("{propriété}","{propriete}").replace("{exemple}","{exemplebox}")
    s="\n".join((re.sub(r"(?<!\\)&",r"\\&",l) if re.match(r"\s*\\item\b",l) and "tabular" not in l else l) for l in s.split("\n"))
    s=re.sub(r"(\bat\s*)\(((?:\d+\*|-)?\([^()]*\)[^,()]*),",lambda m:m.group(1)+"({"+m.group(2)+"},",s)
    for bad in ("exemplechiffre","situation","hypothese","justify","exemple","probleme","remarque","astuce","rappel"):
        s=s.replace("{"+bad+"}","{"+("exemplebox" if bad!="justify" else "center")+"}") if bad not in ("justify",) else s.replace("\\begin{justify}","").replace("\\end{justify}","")
    s=re.sub(r"(\\begin\{lstlisting\}\[[^\]\n]*caption=\{)([^{}]*)(\})",lambda m:m.group(1)+re.sub(r"(?<!\\)_",r"\\_",m.group(2))+m.group(3),s)
    s=re.sub(r"(arc\s*\([^()]*?:[^()]*?:)\s*([^()]*?)\s+and\s+([^()]*?)\)",lambda m:(m.group(1)+"{"+m.group(2).strip()+"} and {"+m.group(3).strip()+"})") if not m.group(2).strip().startswith("{") else m.group(0),s)
    s=re.sub(r"(ellipse\s*\()\s*([^(){}]*?)\s+and\s+([^(){}]*?)\)",lambda m:m.group(1)+"{"+m.group(2)+"} and {"+m.group(3)+"})",s)
    s=re.sub(r"\\texttt\{([^{}]*)\}",lambda m:"\\texttt{"+re.sub(r"(?<!\\)\^",r"\\^{}",m.group(1))+"}",s)
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
        s=open(f).read(); t=fix_colors(fix(s),d)
        if t!=s: open(f,"w").write(t); ch+=1
    errs=sorted(glob.glob(f"{d}/build/*/*.err"))
    ok=0
    for e in errs:
        ref="/".join(e.split("/build/")[1].replace(".err","").split("/"))
        p=subprocess.run([sys.executable,"pipeline/check.py",ref],cwd=d,capture_output=True,text=True)
        ok+=("✔" in p.stdout)
    print(f"{d}: {ch} fichiers modifiés ; {ok}/{len(errs)} blocs en erreur revalidés")
