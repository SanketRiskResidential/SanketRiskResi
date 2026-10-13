"""OneDrive helper for the nightly backup.
  python backup/onedrive.py authorize            (one time: sign in with a code)
  python backup/onedrive.py upload <file>        (nightly: upload + delete copies older than KEEP_DAYS)
Env: ONEDRIVE_CLIENT_ID, BACKUP_PASSPHRASE. Token is kept encrypted in state/onedrive.gpg.
"""
import os, sys, json, time, subprocess, datetime, pathlib, re
import requests

CID = os.environ["ONEDRIVE_CLIENT_ID"]
PASS = os.environ["BACKUP_PASSPHRASE"]
TENANT = "https://login.microsoftonline.com/consumers/oauth2/v2.0"
SCOPE = "Files.ReadWrite offline_access"
FOLDER = "SanketResidential-Backups"
KEEP_DAYS = int(os.environ.get("KEEP_DAYS", "30"))
state = pathlib.Path("state"); state.mkdir(exist_ok=True)
enc, plain = state / "onedrive.gpg", state / "onedrive.json"

def gpg(args):
    subprocess.run(["gpg", "--batch", "--yes", "--pinentry-mode", "loopback", "--passphrase", PASS] + args, check=True)

def save_token(refresh):
    plain.write_text(json.dumps({"refresh_token": refresh}))
    gpg(["-c", "--cipher-algo", "AES256", "-o", str(enc), str(plain)])
    plain.unlink()

def authorize():
    r = requests.post(TENANT + "/devicecode", data={"client_id": CID, "scope": SCOPE}); r.raise_for_status()
    d = r.json()
    print("\n=================================================")
    print("ON YOUR TABLET open:  " + d["verification_uri"])
    print("and enter this code:  " + d["user_code"])
    print("(you have about 15 minutes)")
    print("=================================================\n", flush=True)
    end = time.time() + d["expires_in"]
    while time.time() < end:
        time.sleep(d.get("interval", 5))
        t = requests.post(TENANT + "/token", data={"grant_type": "urn:ietf:params:oauth:grant-type:device_code", "client_id": CID, "device_code": d["device_code"]})
        j = t.json()
        if "access_token" in j:
            save_token(j["refresh_token"]); print("Signed in. Token saved (encrypted)."); return
        if j.get("error") != "authorization_pending":
            raise SystemExit("Sign-in failed: " + json.dumps(j))
    raise SystemExit("Timed out waiting for sign-in. Run the workflow again.")

def access_token():
    gpg(["-d", "-o", str(plain), str(enc)])
    refresh = json.loads(plain.read_text())["refresh_token"]; plain.unlink()
    t = requests.post(TENANT + "/token", data={"grant_type": "refresh_token", "client_id": CID, "refresh_token": refresh, "scope": SCOPE})
    j = t.json()
    if "access_token" not in j:
        raise SystemExit("OneDrive sign-in expired or was revoked - run 'OneDrive sign-in' workflow again. " + json.dumps(j))
    save_token(j.get("refresh_token", refresh))      # tokens rotate; keep the newest
    return j["access_token"]

def upload(path):
    tok = access_token(); H = {"Authorization": "Bearer " + tok}
    p = pathlib.Path(path); size = p.stat().st_size
    s = requests.post(f"https://graph.microsoft.com/v1.0/me/drive/root:/{FOLDER}/{p.name}:/createUploadSession", headers=H,
                      json={"item": {"@microsoft.graph.conflictBehavior": "replace"}}); s.raise_for_status()
    url = s.json()["uploadUrl"]; chunk = 320 * 1024 * 10
    with open(p, "rb") as f:
        pos = 0
        while pos < size:
            data = f.read(chunk)
            r = requests.put(url, data=data, headers={"Content-Length": str(len(data)), "Content-Range": f"bytes {pos}-{pos+len(data)-1}/{size}"})
            if r.status_code not in (200, 201, 202): raise SystemExit("Upload failed: %s %s" % (r.status_code, r.text[:300]))
            pos += len(data)
    print("Uploaded", p.name, size, "bytes")
    # prune old copies
    cutoff = datetime.date.today() - datetime.timedelta(days=KEEP_DAYS)
    url = f"https://graph.microsoft.com/v1.0/me/drive/root:/{FOLDER}:/children?$select=id,name&$top=200"
    while url:
        r = requests.get(url, headers=H); r.raise_for_status(); j = r.json()
        for it in j.get("value", []):
            m = re.match(r"sanket-residential-(\d{4}-\d{2}-\d{2})", it["name"])
            if m and datetime.date.fromisoformat(m.group(1)) < cutoff:
                requests.delete("https://graph.microsoft.com/v1.0/me/drive/items/" + it["id"], headers=H); print("Deleted old copy", it["name"])
        url = j.get("@odata.nextLink")

if __name__ == "__main__":
    if sys.argv[1] == "authorize": authorize()
    else:
        if not enc.exists(): raise SystemExit("No OneDrive token yet - run the 'OneDrive sign-in' workflow first.")
        upload(sys.argv[2])
