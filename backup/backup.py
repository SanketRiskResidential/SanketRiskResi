"""Nightly backup of SanketRisk Home (Supabase): database + stored files -> one .tar.gz.
Env: SUPABASE_DB_URL (session pooler string), SUPABASE_URL, SUPABASE_SERVICE_KEY.
Usage: python backup/backup.py <output.tar.gz>
"""
import os, sys, json, subprocess, tarfile, datetime, pathlib
import requests

out = pathlib.Path(sys.argv[1])
work = pathlib.Path("work"); work.mkdir(exist_ok=True)
db = os.environ["SUPABASE_DB_URL"]
base = os.environ["SUPABASE_URL"].rstrip("/")
key = os.environ["SUPABASE_SERVICE_KEY"]
H = {"apikey": key}
if key.startswith("eyJ"):            # legacy JWT-style key also needs the bearer header
    H["Authorization"] = "Bearer " + key
manifest = {"created_utc": datetime.datetime.utcnow().isoformat() + "Z", "problems": []}

def run(cmd):
    subprocess.run(cmd, check=True)

# 1) database: everything in the public schema (tables, data, functions, policies) ...
run(["pg_dump", db, "--schema=public", "--no-owner", "--no-privileges", "-f", str(work / "database-public.sql")])
# ... plus user accounts (restore only if you ever need to rebuild Auth)
run(["pg_dump", db, "--data-only", "--column-inserts", "--table=auth.users", "--table=auth.identities", "-f", str(work / "auth-users.sql")])
size = (work / "database-public.sql").stat().st_size
manifest["database_sql_bytes"] = size
if size < 5000:
    raise SystemExit("database dump is suspiciously small (%d bytes) - failing so you get an email" % size)

# 2) stored files (photos etc.)
def list_objects(bucket, prefix=""):
    found, offset = [], 0
    while True:
        r = requests.post(f"{base}/storage/v1/object/list/{bucket}", headers=H, timeout=60,
                          json={"prefix": prefix, "limit": 100, "offset": offset, "sortBy": {"column": "name", "order": "asc"}})
        r.raise_for_status()
        items = r.json()
        for it in items:
            path = (prefix + "/" if prefix else "") + it["name"]
            if it.get("id") is None:          # folder
                found += list_objects(bucket, path)
            else:
                found.append(path)
        if len(items) < 100:
            return found
        offset += 100

r = requests.get(f"{base}/storage/v1/bucket", headers=H, timeout=60); r.raise_for_status()
total = 0
manifest["buckets"] = {}
for b in r.json():
    name = b["name"]; paths = list_objects(name); ok = 0
    for p in paths:
        try:
            d = requests.get(f"{base}/storage/v1/object/{name}/{p}", headers=H, timeout=120)
            d.raise_for_status()
            dest = work / "storage" / name / p
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(d.content); ok += 1
        except Exception as e:
            manifest["problems"].append(f"{name}/{p}: {e}")
    manifest["buckets"][name] = {"files_listed": len(paths), "files_saved": ok}
    total += ok

(work / "manifest.json").write_text(json.dumps(manifest, indent=2))
with tarfile.open(out, "w:gz") as t:
    t.add(work, arcname="sanket-residential-backup")
print(json.dumps(manifest, indent=2))
if manifest["problems"]:
    raise SystemExit("some stored files could not be saved - see above")
