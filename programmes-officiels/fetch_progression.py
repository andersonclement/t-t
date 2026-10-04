#!/usr/bin/env python3
"""Télécharge une fiche de progression harmonisée MINESEC (minesec-ige.com) et la
convertit en JSON : [{n, trimestre, periode, chapitre, titre}].
  python3 fetch_progression.py <education_type_id> <class_id> <subject_id> [sub_education_type_id section_id specialty_id] > out.json"""
import re,sys,json,requests,html as H
BASE="https://www.minesec-ige.com/progression-sheets"
def fetch(edu,cls,subj,sub_edu=None,section=None,specialty=None,session_id=2,sub_system=2):
    s=requests.Session()
    r=s.get(BASE,timeout=40); tok=re.search(r'csrf-token" content="([^"]+)',r.text).group(1)
    p=dict(session_id=session_id,sub_system_id=sub_system,education_type_id=edu,class_id=cls,subject_id=subj)
    for k,v in (("sub_education_type_id",sub_edu),("section_id",section),("specialty_id",specialty)):
        if v: p[k]=v
    r=s.get(BASE+"/preview",params=p,headers={"Accept":"application/json","X-CSRF-TOKEN":tok},timeout=90)
    return r.json()
def parse(res):
    rows=[]; cur_term=None
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>",res.get("html",""),re.S):
        tds=re.findall(r"<td[^>]*>(.*?)</td>",tr,re.S)
        if len(tds)<5: continue
        t=[re.sub(r"\s+"," ",H.unescape(re.sub(r"<[^>]+>"," ",x))).strip() for x in tds]
        rows.append(dict(n=t[0],trimestre=t[1],periode=t[2],chapitre=t[3],titre=t[4]))
    return rows
if __name__=="__main__":
    a=[int(x) if x.isdigit() else None for x in sys.argv[1:]]
    res=fetch(*a); rows=parse(res)
    print(json.dumps(dict(count=res.get("count"),rows=rows),ensure_ascii=False,indent=1))
