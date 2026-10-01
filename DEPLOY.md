# Deploy MODIT on Hostinger VPS

Everything is automated. Total hands-on time: **~5 minutes** (plus ~10 min of unattended install/build).

## Before you start

1. VPS running Ubuntu (KVM 2 works) — root password saved from Hostinger panel.
2. **DNS** (only if you have a domain): A records `@ → VPS IP` and `api → VPS IP`.
   No domain yet? Just skip — it deploys by IP and you can add SSL later.
3. Open **Web console** in the Hostinger panel (or SSH in as root).

## Deploy (one command)

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/YASHTHETIC/modit/main/deploy/setup.sh)
```

It asks 3 things, then works alone:

| Prompt | Answer |
|---|---|
| Domain | your domain (e.g. `modit.in`) — **blank = IP mode** |
| Email for SSL | your email (needed only for HTTPS) |
| Razorpay key id | paste `rzp_test_...` or blank for demo |

The script installs everything (Nginx, PostgreSQL, Redis, Node 22, Python 3.12, PM2),
clones the code, creates `.env` files **on the server only** (chmod 600, never in git),
runs migrations + seeds, builds the frontend, starts both processes, configures
Nginx and SSL, opens the firewall, and verifies all ports.

Skip prompts (non-interactive):

```bash
DOMAIN=modit.in CERTBOT_EMAIL=you@example.com RAZORPAY_KEY_ID=rzp_test_xxx \
bash <(curl -fsSL https://raw.githubusercontent.com/YASHTHETIC/modit/main/deploy/setup.sh)
```

## Verify

```bash
pm2 status                                  # both apps: online
curl -s http://127.0.0.1:8000/api/v1/healthz   # {"status":"ok"...}
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3001/   # 200
```

Then open your domain (or `http://SERVER_IP`) in a browser.

## Updates after pushing new code

```bash
cd /opt/modit
git pull
npm install --legacy-peer-deps
npm run build --workspace=@modit/web
pm2 restart modit-web modit-api
# only if migrations changed:
.venv/bin/python -m alembic -c backend/alembic.ini upgrade head
```

## Where things live

| What | Where |
|---|---|
| Code | `/opt/modit` |
| Backend secrets | `/opt/modit/.env` (chmod 600 — **never in git**) |
| Frontend env | `/opt/modit/apps/modit/web/.env.local` (chmod 600) |
| Processes | PM2: `modit-api` (:8000), `modit-web` (:3001) |
| Logs | `pm2 logs` · `/var/log/modit-api-*.log` · `/var/log/modit-web-*.log` · `/var/log/nginx/` |
| Database | `modit` (user `modit`) on local PostgreSQL |
| Re-run setup | safe — keeps existing `.env` files, skips what exists |

## Backups & restore

- Nightly `pg_dump` at 2am to `/var/backups/modit/` (keeps 7 days) + one snapshot
  right after every deploy. PM2 logs rotate at 50MB (keep 7).
- List: `ls -lh /var/backups/modit/`
- Restore to a scratch DB first (never straight over production):
  ```bash
  sudo -u postgres psql -c "CREATE DATABASE modit_restore OWNER modit;"
  zcat /var/backups/modit/<file>.sql.gz | sudo -u postgres psql -d modit_restore
  ```
  Verify, then swap: `ALTER DATABASE modit RENAME TO modit_old; ALTER DATABASE modit_restore RENAME TO modit;` + `pm2 restart modit-api`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Site 502 | `pm2 status` → if an app is stopped: `pm2 logs modit-api` (or `modit-web`) |
| Empty/odd catalog | `pm2 logs modit-api` during seeds; re-run: `cd /opt/modit/backend && PYTHONPATH=".." DATABASE_URL=$(grep '^DATABASE_URL=' /opt/modit/.env \| cut -d= -f2-) ../.venv/bin/python -m seeds.runner` |
| SSL failed | Point DNS first (`ping yourdomain` = VPS IP), then: `certbot --nginx -d yourdomain.com -d api.yourdomain.com -m you@email.com` |
| DB not reachable | `systemctl status postgresql`; check `DATABASE_URL` in `/opt/modit/.env` |
| Port 80 blocked | `ufw status` · also check Hostinger's panel firewall |
| Razorpay "key invalid" | It's the **test** key — go live by setting `NEXT_PUBLIC_RAZORPAY_KEY_ID` (live) in `.env.local`, rebuild, restart |

## Security notes

- `.env` files exist **only on the server**, created by the script (chmod 600).
  Git ignores them; history never contained them (repo has only `.env.example`).
- `VAPID_PRIVATE_KEY` lives in `.env.local` on the server — not `NEXT_PUBLIC_*`,
  never shipped to browsers.
- Rotate JWT/database passwords by editing `/opt/modit/.env` + Postgres, then
  `pm2 restart modit-api`.

## Private repo access (server updates)

The repo is private, so the server authenticates with a read-only **deploy key**
(no passwords/tokens to remember):

```bash
# 1. on the server: create a key (Enter x3 at prompts)
ssh-keygen -t ed25519 -f /root/.ssh/modit_deploy -N ""
cat /root/.ssh/modit_deploy.pub        # copy this output
# 2. on your PC: GitHub repo → Settings → Deploy keys → Add deploy key
#    (title "vps", paste key, leave "Allow write access" UNCHECKED) → Add key
# 3. on the server: use the key for github + point at the renamed repo
echo "Host github.com" >> /root/.ssh/config
echo "  IdentityFile /root/.ssh/modit_deploy" >> /root/.ssh/config
ssh-keyscan github.com >> /root/.ssh/known_hosts
git -C /opt/modit remote set-url origin git@github.com:YASHTHETIC/modit.git
git -C /opt/modit pull                 # "Already up to date" = working
```

Alternative for a fresh clone without SSH: export a read-only tokeninline —
`GITHUB_TOKEN=<token> bash setup.sh` — or download the script with
`curl -H "Authorization: Bearer <token>" -fsSL https://raw.githubusercontent.com/YASHTHETIC/modit/main/deploy/setup.sh`.
