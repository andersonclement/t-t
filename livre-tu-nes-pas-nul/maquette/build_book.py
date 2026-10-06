#!/usr/bin/env python3
"""Markdown (chapitres/*.md) -> LaTeX -> PDF (tectonic). Livre « Tu n'es pas nul ». Usage: build_book.py [--sans-marqueurs]"""
import re,sys,glob,os,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
CH=sorted((ROOT/"chapitres").glob("*.md"))
SPEC={"&":r"\&","%":r"\%","$":r"\$","#":r"\#","_":r"\_","{":r"\{","}":r"\}","~":r"\textasciitilde{}","^":r"\textasciicircum{}","\\":r"\textbackslash{}"}
def esc(s):
    s="".join(SPEC.get(c,c) for c in s)
    return s
def inline(s):
    # marqueurs
    parts=re.split(r"(⟦.*?⟧)",s)
    out=[]
    for p in parts:
        if p.startswith("⟦"):
            out.append(r"\marqueur{"+inline(p[1:-1])+"}"); continue
        # gras / italique sur texte brut avant échappement
        toks=re.split(r"(\*\*.+?\*\*|\*[^*\s](?:[^*]*[^*\s])?\*)",p)
        for t in toks:
            if t.startswith("**") and t.endswith("**") and len(t)>4: out.append(r"\textbf{"+esc(t[2:-2])+"}")
            elif t.startswith("*") and t.endswith("*") and len(t)>2: out.append(r"\emph{"+esc(t[1:-1])+"}")
            else: out.append(esc(t))
    return "".join(out)
def conv(path):
    lines=path.read_text(encoding="utf-8").split("\n")
    out=[];i=0;para=[];quote=[];part=None
    def flush():
        nonlocal para
        if para:
            txt=" ".join(para).strip()
            if txt: out.append(inline(txt)+"\n")
            para=[]
    def flushq():
        nonlocal quote
        if quote:
            q=[x for x in quote]
            body=[]
            for x in q: body.append(x)
            txt="\n".join(body)
            m=re.match(r"\*\*(.+?)\*\*\s*\n?(.*)",txt,re.S)
            if m: out.append(r"\begin{pourcahier}{"+inline(m.group(1))+"}\n"+inline(m.group(2).replace("\n"," "))+"\n\\end{pourcahier}\n")
            else: out.append(r"\begin{quote}"+inline(txt.replace("\n"," "))+r"\end{quote}"+"\n")
            quote=[]
    for ln in lines:
        s=ln.rstrip()
        if s.startswith(">"):
            flush(); quote.append(s.lstrip(">").strip()); continue
        else: flushq()
        if re.fullmatch(r"\s*(\* \* \*|---|\*\*\*)\s*",s): flush(); out.append(r"\asterisme"+"\n"); continue
        if s.startswith(":::"):
            flush()
            out.append(r"\begin{avertissement}" if len(s)>3 and not s.strip()==":::" else r"\end{avertissement}"); out.append("\n"); continue
        m=re.match(r"^## (.+)",s)
        if m: flush(); out.append(r"\partie{"+inline(re.sub(r"^Partie\s+([IVX]+)\s*[—-]\s*","",m.group(1)))+"}{"+re.match(r"Partie\s+([IVX]+)",m.group(1)).group(1)+"}\n"); continue
        m=re.match(r"^# (.+)",s)
        if m:
            flush(); t=m.group(1); n=re.match(r"^(\d+)\.\s*(.+)",t)
            if path.name.startswith("00-"): continue
            if n: out.append(r"\chapitre{"+n.group(1)+"}{"+inline(n.group(2))+"}\n")
            else: out.append(r"\chapitresn{"+inline(t)+"}\n")
            continue
        m=re.match(r"^### (.+)",s)
        if m: flush(); out.append(r"\soustitre{"+inline(m.group(1))+"}\n"); continue
        if not s.strip(): flush(); continue
        para.append(s.strip())
    flush(); flushq()
    return "\n".join(out)
def front():
    return r"""
\begin{titlepage}\centering\vspace*{3cm}
{\Huge\bfseries Tu n’es pas nul\par}\vspace{0.6cm}
{\large\itshape Ce que tes notes ne prouvent pas\par}\vspace{2.2cm}
{\Large Ludovic A.\par}\vfill{\small manuscrit — version de travail\par}\end{titlepage}
\thispagestyle{empty}\cleardoublepage
\thispagestyle{empty}\vspace*{\fill}\begin{center}\itshape On a écrit un mot sur toi.\\Ce n’était pas ton nom.\end{center}\vspace*{\fill}\cleardoublepage
"""
TEX=r"""\documentclass[10.5pt,twoside,openright]{book}
\usepackage[a5paper,inner=19mm,outer=15mm,top=20mm,bottom=22mm]{geometry}
\usepackage{fontspec}
\setmainfont{texgyrepagella}[Extension=.otf,UprightFont=*-regular,BoldFont=*-bold,ItalicFont=*-italic,BoldItalicFont=*-bolditalic,Ligatures=TeX]
\usepackage{xcolor}\usepackage{fancyhdr}\usepackage{titlesec}\usepackage{tcolorbox}\usepackage{setspace}
\definecolor{accent}{RGB}{154,52,18}\definecolor{gris}{gray}{0.45}
\setstretch{1.08}\setlength{\parindent}{1.3em}\setlength{\parskip}{0pt}\widowpenalty=10000\clubpenalty=10000\emergencystretch=2em
\pagestyle{fancy}\fancyhf{}\renewcommand{\headrulewidth}{0pt}
\fancyhead[LE]{\small\itshape Tu n’es pas nul}\fancyhead[RO]{\small\itshape\rightmark}\fancyfoot[C]{\small\thepage}
\fancypagestyle{plain}{\fancyhf{}\fancyfoot[C]{\small\thepage}\renewcommand{\headrulewidth}{0pt}}
\newcommand{\asterisme}{\par\vspace{0.7em}\centerline{\color{gris}*\quad*\quad*}\vspace{0.7em}\par\noindent}
\newcommand{\marqueur}[1]{\begingroup\color{accent}\fbox{\parbox{0.92\linewidth}{\small\sffamily\bfseries [#1]}}\endgroup}
\newcommand{\soustitre}[1]{\par\vspace{1.1em}\noindent{\bfseries\color{accent}#1}\par\vspace{0.4em}\noindent}
\newenvironment{pourcahier}[1]{\par\vspace{0.9em}\begin{tcolorbox}[colback=black!4,colframe=accent,boxrule=0pt,leftrule=2.2pt,arc=0pt,left=8pt,right=8pt,top=5pt,bottom=5pt]\small\textbf{#1}\par\smallskip}{\end{tcolorbox}\par}
\newenvironment{avertissement}{\par\small\itshape}{\par}
\newcommand{\partie}[2]{\cleardoublepage\thispagestyle{empty}\vspace*{\fill}\begin{center}{\large\color{gris}Partie #2}\\[1.2em]{\Huge\bfseries #1}\end{center}\vspace*{\fill}\cleardoublepage\markboth{}{}}
\newcommand{\chapitre}[2]{\cleardoublepage\markright{#2}\thispagestyle{plain}\vspace*{2.2cm}{\noindent\color{accent}\fontsize{54}{54}\selectfont\bfseries #1}\par\vspace{0.5em}{\noindent\LARGE\bfseries #2\par}\vspace{1.6em}\noindent\ignorespaces}
\newcommand{\chapitresn}[1]{\cleardoublepage\markright{#1}\thispagestyle{plain}\vspace*{2.8cm}{\noindent\LARGE\bfseries #1\par}\vspace{1.6em}\noindent\ignorespaces}
\begin{document}
\frontmatter
"""+"%%FRONT%%"+r"""
\mainmatter
%%BODY%%
\end{document}
"""
if __name__=="__main__":
    body=[]
    for p in CH:
        if p.name.startswith("00-"): continue
        body.append(f"%% {p.name}\n"+conv(p))
    tex=TEX.replace("%%FRONT%%",front()).replace("%%BODY%%","\n\n".join(body))
    (ROOT/"maquette"/"livre.tex").write_text(tex,encoding="utf-8")
    print("livre.tex écrit",len(tex))
