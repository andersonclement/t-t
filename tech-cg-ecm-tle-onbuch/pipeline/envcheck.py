import re,sys
f=sys.argv[1]
s=open(f).read().split("\n"); st=[]
for i,l in enumerate(s,1):
    for m in re.finditer(r"\\(begin|end)\{([a-z*]+)\}",l):
        if m.group(1)=="begin": st.append((m.group(2),i))
        elif st and st[-1][0]==m.group(2): st.pop()
        else: print("mismatch",m.group(2),i,st[-2:])
print("unclosed",st,"total",len(s))
