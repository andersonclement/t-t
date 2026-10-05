"""Recherche/téléchargement d'images Wikimedia Commons avec métadonnées de licence.
  commons.py search "<requête>" [n]      -> liste titre | taille | licence
  commons.py get "File:xxx.png" <dest> [largeur]  -> télécharge (miniature) + écrit <dest>.json (auteur, licence, url)"""
import sys,json,re,subprocess,urllib.parse,html
UA="OnBuchCourseBot/1.0 (education; contact chuitcheuanderson65@gmail.com)"
API="https://commons.wikimedia.org/w/api.php"
def api(**p):
    p["format"]="json"
    import time
    for t in range(6):
        out=subprocess.run(["curl","-s","-m","40","-A",UA,"-G",API]+sum([["--data-urlencode",f"{k}={v}"] for k,v in p.items()],[]),capture_output=True,text=True).stdout
        try: return json.loads(out)
        except Exception: time.sleep(3*(t+1))
    raise SystemExit("API Commons indisponible")
def info(title,width=1000):
    d=api(action="query",titles=title,prop="imageinfo",iiprop="url|size|mime|extmetadata",iiurlwidth=width,iiextmetadatafilter="LicenseShortName|Artist|Credit|ImageDescription")
    p=list(d["query"]["pages"].values())[0]; i=p["imageinfo"][0]; m=i.get("extmetadata",{})
    g=lambda k: html.unescape(re.sub("<[^>]+>","",m.get(k,{}).get("value",""))).strip()
    return dict(title=p["title"],url=i.get("thumburl") or i["url"],orig=i["url"],page=i["descriptionurl"],w=i["width"],h=i["height"],mime=i["mime"],license=g("LicenseShortName"),author=g("Artist"),desc=g("ImageDescription")[:200])
def search(q,n=12):
    d=api(action="query",generator="search",gsrsearch=q,gsrnamespace=6,gsrlimit=n,prop="imageinfo",iiprop="size|mime|extmetadata",iiextmetadatafilter="LicenseShortName")
    for p in sorted(d.get("query",{}).get("pages",{}).values(),key=lambda p:p.get("index",0)):
        i=p["imageinfo"][0]; print(p["title"],"|",i["width"],"x",i["height"],"|",i.get("extmetadata",{}).get("LicenseShortName",{}).get("value"))
def get(title,dest,width=1000):
    j=info(title,width); ext=".png" if j["mime"] in("image/png","image/svg+xml") else ".jpg"
    path=dest if dest.endswith((".png",".jpg")) else dest+ext
    import time
    for t in range(6):
        subprocess.run(["curl","-s","-m","90","-A",UA,"-L","-o",path,j["url"]])
        import os
        if os.path.getsize(path)>2000 and open(path,"rb").read(5)[:1]!=b"<": break
        time.sleep(4*(t+1))
    j["file"]=path; json.dump(j,open(path.rsplit(".",1)[0]+".json","w"),ensure_ascii=False,indent=1); print(path,j["license"],"|",j["author"][:60])
if __name__=="__main__":
    c=sys.argv[1]
    if c=="search": search(sys.argv[2],int(sys.argv[3]) if len(sys.argv)>3 else 12)
    else: get(sys.argv[2],sys.argv[3],int(sys.argv[4]) if len(sys.argv)>4 else 1000)
