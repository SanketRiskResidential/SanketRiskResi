"""Google Drive helper for the nightly backup.
  python backup/gdrive.py authorize            (one time: sign in with a code)
  python backup/gdrive.py upload <file>        (nightly: upload + delete copies older than KEEP_DAYS)
Env: GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, BACKUP_PASSPHRASE. Token is kept encrypted in state/gdrive.gpg.
Uses the 'drive.file' permission: the job can only see files it created itself.
"""
import os, sys, json, time, subprocess, datetime, pathlib, re
import requests

CID = os.environ["GDRIVE_CLIENT_ID"]
SECRET = os.environ["GDRIVE_CLIENT_SECRET"]
PASS = os.environ["BACKUP_PASSPHRASE"]
SCOPE = "https://www.googleapis.com/auth/drive.file"
FOLDER = "SanketResidential-Backups"
KEEP_DAYS = int(os.environ.get("KEEP_DAYS", "30"))
API = "https://www.googleapis.com/drive/v3"
state = pathlib.Path("state"); state.mkdir(exist_ok=True)
enc, plain = state / "gdrive.gpg", state / "gdrive.json"

def gpg(args):
    subprocess.run(["gpg", "--batch", "--yes", "--pinentry-mode", "loopback", "--passphrase", PASS] + args, check=True)

def save_token(refresh):
    plain.write_text(json.dumps({"refresh_token": refresh}))
    gpg(["-c", "--cipher-algo", "AES256", "-o", str(enc), str(plain)])
    plain.unlink()

def authorize():
    r = requests.post("https://oauth2.googleapis.com/device/code", data={"client_id": CID, "scope": SCOPE}); r.raise_for_status()
    d = r.json()
    print("\n=================================================")
    print("ON YOUR TABLET open:  " + d.get("verification_url", "https://www.google.com/device"))
    print("and enter this code:  " + d["user_code"])
    print("Sign in as the Google account that should hold the backups.")
    print("(you have about 15 minutes)")
    print("=================================================\n", flush=True)
    end = time.time() + d["expires_in"]; interval = d.get("interval", 5)
    while time.time() < end:
        time.sleep(interval)
        t = requests.post("https://oauth2.googleapis.com/token", data={"client_id": CID, "client_secret": SECRET, "device_code": d["device_code"],
                          "grant_type": "urn:ietf:params:oauth:grant-type:device_code"})
        j = t.json()
        if "refresh_token" in j:
            save_token(j["refresh_token"]); print("Signed in. Token saved (encrypted)."); return
        if j.get("error") == "slow_down": interval += 5
        elif j.get("error") != "authorization_pending":
            raise SystemExit("Sign-in failed: " + json.dumps(j))
    raise SystemExit("Timed out waiting for sign-in. Run the workflow again.")

def access_token():
    gpg(["-d", "-o", str(plain), str(enc)])
    refresh = json.loads(plain.read_text())["refresh_token"]; plain.unlink()
    t = requests.post("https://oauth2.googleapis.com/token", data={"client_id": CID, "client_secret": SECRET, "refresh_token": refresh, "grant_type": "refresh_token"})
    j = t.json()
    if "access_token" not in j:
        raise SystemExit("Google sign-in expired or was revoked - run the 'Google Drive sign-in' workflow again. " + json.dumps(j))
    return j["access_token"]

def folder_id(H):
    q = f"name = '{FOLDER}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    r = requests.get(API + "/files", headers=H, params={"q": q, "fields": "files(id,name)", "spaces": "drive"}); r.raise_for_status()
    files = r.json().get("files", [])
    if files: return files[0]["id"]
    r = requests.post(API + "/files", headers=H, json={"name": FOLDER, "mimeType": "application/vnd.google-apps.folder"}); r.raise_for_status()
    return r.json()["id"]

def upload(path):
    H = {"Authorization": "Bearer " + access_token()}
    fid = folder_id(H)
    p = pathlib.Path(path); size = p.stat().st_size
    s = requests.post("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable", headers={**H, "X-Upload-Content-Type": "application/octet-stream", "X-Upload-Content-Length": str(size)},
                      json={"name": p.name, "parents": [fid]}); s.raise_for_status()
    url = s.headers["Location"]; chunk = 256 * 1024 * 16
    with open(p, "rb") as f:
        pos = 0
        while pos < size:
            data = f.read(chunk)
            r = requests.put(url, data=data, headers={"Content-Length": str(len(data)), "Content-Range": f"bytes {pos}-{pos+len(data)-1}/{size}"})
            if r.status_code not in (200, 201, 308): raise SystemExit("Upload failed: %s %s" % (r.status_code, r.text[:300]))
            pos += len(data)
    print("Uploaded", p.name, size, "bytes")
    cutoff = datetime.date.today() - datetime.timedelta(days=KEEP_DAYS)
    page = None
    while True:
        params = {"q": f"'{fid}' in parents and trashed = false", "fields": "nextPageToken,files(id,name)", "pageSize": 1000}
        if page: params["pageToken"] = page
        r = requests.get(API + "/files", headers=H, params=params); r.raise_for_status(); j = r.json()
        for it in j.get("files", []):
            m = re.match(r"sanket-residential-(\d{4}-\d{2}-\d{2})", it["name"])
            if m and datetime.date.fromisoformat(m.group(1)) < cutoff:
                requests.delete(API + "/files/" + it["id"], headers=H); print("Deleted old copy", it["name"])
        page = j.get("nextPageToken")
        if not page: break

if __name__ == "__main__":
    if sys.argv[1] == "authorize": authorize()
    else:
        if not enc.exists(): raise SystemExit("No Google sign-in yet - run the 'Google Drive sign-in' workflow first.")
        upload(sys.argv[2])
