import re,sys,glob,math
COLS=["popblue","poporange","popgreen","poppurple","poppink","popgold","popblue!50","poporange!50","popgreen!50","poppurple!50"]
pat=re.compile(r"\\pie\s*\[[^\]]*\]\s*\{(.*?)\}\s*(?=\\end\{tikzpicture\})",re.S)
def build(m):
    items=[]
    for it in re.split(r",\s*\n|,\s*(?=\d)",m.group(1).strip()):
        mm=re.match(r"\s*([\d.,]+)\s*/\s*(.+?)\s*$",it,re.S)
        if mm: items.append((float(mm.group(1).replace(",",".")),mm.group(2).strip().rstrip(",")))
    tot=sum(v for v,_ in items); a=0.0; out=[]
    for k,(v,lab) in enumerate(items):
        b=a+360*v/tot; c=COLS[k%len(COLS)]
        out.append(f"\\fill[{c}] (0,0) -- ({a:.2f}:2.3) arc ({a:.2f}:{b:.2f}:2.3) -- cycle;")
        if v/tot>=0.06: out.append(f"\\node[white,font=\\scriptsize\\bfseries] at ({(a+b)/2:.2f}:1.55) {{{v:g}\\,\\%}};")
        out.append(f"\\fill[{c}] (3.0,{1.9-0.42*k:.2f}) rectangle ++(0.28,0.28); \\node[anchor=west,font=\\scriptsize] at (3.35,{2.04-0.42*k:.2f}) {{{lab} ({v:g}\\,\\%)}};")
        a=b
    out.append("\\draw[white,thick] (0,0) circle (2.3);")
    return "\n".join(out)+"\n"
for f in glob.glob("build/N*/*.rev.tex"):
    s=open(f).read(); t=pat.sub(build,s)
    if t!=s: open(f,"w").write(t); print("fix",f)
