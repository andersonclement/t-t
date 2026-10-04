import requests,json,sys,time
B="https://www.minesec-ige.com/progression-sheets/options"
H={"Accept":"application/json"}
def q(**p):
    for _ in range(4):
        try:
            return requests.get(B,params=p,headers=H,timeout=40).json()
        except Exception as e: time.sleep(2)
    return {}
base=dict(session_id=2,sub_system_id=2)
tree={}
# Enseignement général (id 4)
g=q(**base,education_type_id=4)
tree["general"]={"raw":g}
# classes of general: try direct
print("GEN keys:",{k:len(v) for k,v in g.items()})
# Tech (id 5)
t=q(**base,education_type_id=5)
tree["tech"]={"raw":t}
print("TECH keys:",{k:len(v) for k,v in t.items()})
json.dump(tree,open("tree_top.json","w"),ensure_ascii=False,indent=1)
print(json.dumps(g,ensure_ascii=False)[:1800])
print(json.dumps(t,ensure_ascii=False)[:1800])
