import json,re,time,hashlib,concurrent.futures as cf,requests
from fetch_progression import BASE,parse
tree=json.load(open("tech_tree.json"))
jobs=[]
for t in tree:
    for c in t["classes"]:
        if c["classe"] in ("Classe de 1ere","Classe de terminale"):
            for s in c["subjects"]:
                jobs.append((t["sub_edu"]["id"],t["section"]["id"],t["specialty"]["id"],t["specialty"]["designation"],c["class_id"],c["classe"],s["id"],s["designation"]))
print(len(jobs),"progressions à récupérer",flush=True)
tl=__import__("threading").local()
def sess():
    if not hasattr(tl,"s"):
        tl.s=requests.Session(); r=tl.s.get(BASE,timeout=40); tl.tok=re.search(r'csrf-token" content="([^"]+)',r.text).group(1)
    return tl.s,tl.tok
def work(j):
    se,sec,sp,spn,cid,cn,sid,sn=j
    for k in range(4):
        try:
            s,tok=sess()
            r=s.get(BASE+"/preview",params=dict(session_id=2,sub_system_id=2,education_type_id=5,sub_education_type_id=se,section_id=sec,specialty_id=sp,class_id=cid,subject_id=sid),headers={"Accept":"application/json","X-CSRF-TOKEN":tok},timeout=90)
            rows=parse(r.json()); break
        except Exception as e:
            time.sleep(2); rows=None; tl.__dict__.pop("s",None)
    sig=hashlib.md5("|".join(x["titre"] for x in rows).encode()).hexdigest()[:10] if rows else None
    return dict(sub_edu=se,section=sec,specialty=sp,specialty_name=spn,class_id=cid,classe=cn,subject_id=sid,subject=sn,n=len(rows) if rows is not None else -1,sig=sig,rows=rows)
with cf.ThreadPoolExecutor(10) as ex: res=list(ex.map(work,jobs))
json.dump(res,open("tech_progressions.json","w"),ensure_ascii=False)
print("ok",sum(1 for r in res if r["n"]>0),"non vides;",sum(1 for r in res if r["n"]==0),"vides;",sum(1 for r in res if r["n"]<0),"erreurs")
