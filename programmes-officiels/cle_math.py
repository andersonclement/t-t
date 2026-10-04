import re
def fix(s):
    out=[];i=0
    while True:
        j=s.find("\\cle{",i)
        if j<0: out.append(s[i:]);break
        out.append(s[i:j]); k=j+5; d=1
        while k<len(s) and d:
            d+=(s[k]=="{")-(s[k]=="}"); k+=1
        inner=s[j+5:k-1]
        if "$" not in inner and re.search(r"\\(d?frac|sqrt|times|cdot|leq?|geq?|pi|approx)\b|[\^_]",inner):
            inner="$"+inner+"$"
        out.append("\\cle{"+inner+"}"); i=k
    return "".join(out)
