import requests,json,time,concurrent.futures as cf
B="https://www.minesec-ige.com/progression-sheets/options"; H={"Accept":"application/json"}
def q(**p):
    for _ in range(5):
        try: return requests.get(B,params=dict(session_id=2,sub_system_id=2,education_type_id=5,**p),headers=H,timeout=40).json()
        except Exception: time.sleep(2)
    return {}
top=q(); tree=[]
jobs=[]
for se in top["sub_education_types"]:
    secs=q(sub_education_type_id=se["id"])["sections"]
    for sec in secs:
        sp=q(sub_education_type_id=se["id"],section_id=sec["id"])["specialties"]
        for s in sp: jobs.append((se,sec,s))
def work(j):
    se,sec,s=j
    cl=q(sub_education_type_id=se["id"],section_id=sec["id"],specialty_id=s["id"])["classes"]
    out=[]
    for c in cl:
        sub=q(sub_education_type_id=se["id"],section_id=sec["id"],specialty_id=s["id"],class_id=c["id"])["subjects"]
        out.append(dict(class_id=c["id"],classe=c["designation"],subjects=sub))
    return dict(sub_edu=se,section=sec,specialty=s,classes=out)
with cf.ThreadPoolExecutor(8) as ex: tree=list(ex.map(work,jobs))
json.dump(tree,open("tech_tree.json","w"),ensure_ascii=False,indent=1)
print(len(tree),"spécialités",sum(len(t["classes"]) for t in tree),"classes")
