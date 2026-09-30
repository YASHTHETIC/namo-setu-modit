#!/usr/bin/env bash
# =============================================================================
# MODIT — one-shot Hostinger (Ubuntu) setup
#
# Installs: Nginx, PostgreSQL, Redis, Node 22, Python 3.12 (via uv), PM2.
# Deploys: FastAPI backend (port 8000) + Next.js frontend (port 3001),
#          runs DB migrations + seeds, wires Nginx (+ SSL when a domain is
#          given).
#
# Usage (as root, on the VPS):
#   bash <(curl -fsSL https://raw.githubusercontent.com/YASHTHETIC/namo-setu-modit/main/deploy/setup.sh)
#
# Non-interactive:
#   DOMAIN=modit.in CERTBOT_EMAIL=you@x.com RAZORPAY_KEY_ID=rzp_test_xxx \
#   bash <(curl -fsSL .../deploy/setup.sh)
# =============================================================================
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
export NEXT_TELEMETRY_DISABLED=1

REPO_URL="https://github.com/YASHTHETIC/namo-setu-modit.git"
APP_DIR="/opt/modit"
ENV_FILE="$APP_DIR/.env"
WEB_ENV="$APP_DIR/apps/modit/web/.env.local"
ECOSYSTEM="$APP_DIR/deploy/ecosystem.config.js"

DOMAIN="${DOMAIN:-}"
API_SUBDOMAIN="${API_SUBDOMAIN:-api}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
RAZORPAY_KEY_ID="${RAZORPAY_KEY_ID:-}"

stage() { printf '\n\033[1;36m=== %s ===\033[0m\n' "$*"; }
warn()  { printf '\033[1;33mWARN: %s\033[0m\n' "$*"; }
die()   { printf '\033[1;31mERROR: %s\033[0m\n' "$*"; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Run as root. Prefix with: sudo bash <(curl ...)"

# ---------------------------------------------------------------------------
# 0. Configuration
# ---------------------------------------------------------------------------
stage "Configuration"
SERVER_IP="$(curl -fsSL --max-time 5 https://api.ipify.org 2>/dev/null || true)"
[ -n "$SERVER_IP" ] || SERVER_IP="$(hostname -I | awk '{print $1}')"
[ -n "$SERVER_IP" ] || die "Could not detect server IP"

if [ -t 0 ] && [ -z "$DOMAIN" ]; then
  read -r -p "Domain for the site (blank = deploy by IP, add domain later) [$SERVER_IP]: " DOMAIN
fi
if [ -n "$DOMAIN" ]; then
  if [ -t 0 ] && [ -z "$CERTBOT_EMAIL" ]; then
    read -r -p "Email for SSL certificates: " CERTBOT_EMAIL
  fi
  [ -n "$CERTBOT_EMAIL" ] || warn "No email given — SSL will be skipped (plain HTTP for now)"
  FRONTEND_URL="https://$DOMAIN"
  API_BASE="https://$API_SUBDOMAIN.$DOMAIN/api/v1"
  CORS_ORIGINS="https://$DOMAIN,https://www.$DOMAIN,https://$API_SUBDOMAIN.$DOMAIN,https://modit-web-prod.vercel.app,http://$SERVER_IP"
else
  DOMAIN=""
  FRONTEND_URL="http://$SERVER_IP"
  API_BASE="http://$SERVER_IP/api/v1"
  CORS_ORIGINS="http://$SERVER_IP,http://localhost:3001,http://localhost:3000"
fi
if [ -t 0 ] && [ -z "$RAZORPAY_KEY_ID" ]; then
  read -r -p "Razorpay key id (blank = keep demo/test placeholder): " RAZORPAY_KEY_ID
fi

echo "  IP:      $SERVER_IP"
echo "  Domain:  ${DOMAIN:-<none — IP mode>}"
echo "  Frontend:$FRONTEND_URL"
echo "  API:     $API_BASE"

# ---------------------------------------------------------------------------
# 1. System packages
# ---------------------------------------------------------------------------
stage "System packages (apt)"
apt-get update -y -qq
apt-get install -y -qq curl git nginx postgresql redis-server ufw certbot \
  python3-certbot-nginx build-essential ca-certificates gnupg openssl xz-utils >/dev/null

# Node.js 22 — NodeSource first, official tarball as fallback (new Ubuntu codenames)
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | sed 's/v//' | cut -d. -f1)" -lt 18 ]; then
  stage "Node.js 22"
  (
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null 2>&1 \
      && apt-get install -y -qq nodejs >/dev/null 2>&1
  ) || true
  if ! command -v node >/dev/null 2>&1 || [ "$(node -v | sed 's/v//' | cut -d. -f1)" -lt 18 ]; then
    NODE_TGZ="$(curl -fsSL https://nodejs.org/dist/latest-v22.x/ \
      | grep -oE 'node-v22\.[0-9.]+-linux-x64\.tar\.xz' | head -1)"
    [ -n "$NODE_TGZ" ] || die "Could not download Node.js"
    curl -fsSL "https://nodejs.org/dist/latest-v22.x/$NODE_TGZ" -o /tmp/node.tar.xz
    tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 --no-overwrite-dir
    rm -f /tmp/node.tar.xz
    hash -r
  fi
fi
echo "  node $(node -v) / npm $(npm -v)"
npm install -g pm2 >/dev/null 2>&1

# Python 3.12 via uv (pinned deps are tested on 3.12; Ubuntu 26.x ships newer)
if [ ! -x "$APP_DIR/.venv/bin/python" ]; then
  stage "Python 3.12 (uv)"
  if ! command -v uv >/dev/null 2>&1; then
    curl -LsSf https://astral.sh/uv/install.sh | sh >/dev/null
    export PATH="$HOME/.local/bin:$PATH"
  fi
fi

# ---------------------------------------------------------------------------
# 2. Code
# ---------------------------------------------------------------------------
stage "Code"
mkdir -p /opt
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"
git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true

# ---------------------------------------------------------------------------
# 3. PostgreSQL — idempotent role + database
# ---------------------------------------------------------------------------
stage "PostgreSQL"
if [ -f "$ENV_FILE" ]; then
  DB_PASS="$(grep -oP '(?<=//modit:)[^@]+' "$ENV_FILE" || true)"
  [ -n "$DB_PASS" ] || DB_PASS="$(openssl rand -hex 16)"
else
  DB_PASS="$(openssl rand -hex 16)"
fi
sudo -u postgres psql -v ON_ERROR_STOP=1 >/dev/null <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'modit') THEN
    CREATE ROLE modit LOGIN PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE modit OWNER modit'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'modit') \gexec
SQL
echo "  role=modit database=modit ready"

# ---------------------------------------------------------------------------
# 4. Backend .env (created once, never committed, chmod 600)
# ---------------------------------------------------------------------------
stage "Backend .env"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<EOF
ENVIRONMENT=production
LOG_LEVEL=INFO
DATABASE_URL=postgresql+asyncpg://modit:${DB_PASS}@127.0.0.1:5432/modit
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=$(openssl rand -hex 32)
BACKEND_CORS_ORIGINS=${CORS_ORIGINS}
FRONTEND_URL=${FRONTEND_URL}
EOF
  chmod 600 "$ENV_FILE"
  echo "  created $ENV_FILE"
else
  echo "  kept existing $ENV_FILE"
  if [ -n "$DOMAIN" ]; then
    sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=${FRONTEND_URL}|" "$ENV_FILE"
    sed -i "s|^BACKEND_CORS_ORIGINS=.*|BACKEND_CORS_ORIGINS=${CORS_ORIGINS}|" "$ENV_FILE"
    echo "  updated URLs for domain mode"
  fi
fi

# ---------------------------------------------------------------------------
# 5. Backend: venv, deps, migrations, seeds
# ---------------------------------------------------------------------------
stage "Backend install"
export PATH="$HOME/.local/bin:$PATH"
if [ ! -x "$APP_DIR/.venv/bin/python" ]; then
  uv venv --python 3.12 "$APP_DIR/.venv" >/dev/null
fi
uv pip install --python "$APP_DIR/.venv/bin/python" -r "$APP_DIR/requirements.txt" >/dev/null
mkdir -p "$APP_DIR/storage"

stage "Database migrations"
"$APP_DIR/.venv/bin/python" -m alembic -c backend/alembic.ini upgrade head
TABLES="$(sudo -u postgres psql -d modit -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")"
echo "  tables: $TABLES"

stage "Seed data"
DATABASE_URL_VAL="$(grep '^DATABASE_URL=' "$ENV_FILE" | cut -d= -f2-)"
if (cd backend && PYTHONPATH=".." DATABASE_URL="$DATABASE_URL_VAL" "$APP_DIR/.venv/bin/python" -m seeds.runner); then
  echo "  seeds loaded"
else
  warn "Seeds failed — site still works (frontend falls back to built-in catalog)"
fi

# ---------------------------------------------------------------------------
# 6. Frontend: install, VAPID keys, .env.local, build
# ---------------------------------------------------------------------------
stage "Frontend install"
[ -d node_modules ] || npm install --legacy-peer-deps >/dev/null 2>&1 || npm install --legacy-peer-deps

stage "Frontend .env.local"
if [ ! -f "$WEB_ENV" ]; then
  VAPID_JSON="$(cd apps/modit/web && npx web-push generate-vapid-keys --json 2>/dev/null)"
  VAPID_PUB="$(node -e 'console.log(JSON.parse(process.argv[1]).publicKey)' "$VAPID_JSON")" || die "VAPID key generation failed"
  VAPID_PRIV="$(node -e 'console.log(JSON.parse(process.argv[1]).privateKey)' "$VAPID_JSON")" || die "VAPID key generation failed"
  {
    echo "NEXT_PUBLIC_APP_NAME=MODIT"
    echo "NEXT_PUBLIC_API_BASE_URL=${API_BASE}"
    echo "NEXT_PUBLIC_VAPID_PUBLIC_KEY=${VAPID_PUB}"
    echo "VAPID_PRIVATE_KEY=${VAPID_PRIV}"
    echo "VAPID_SUBJECT=mailto:support@modit.in"
    [ -n "$RAZORPAY_KEY_ID" ] && echo "NEXT_PUBLIC_RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}"
  } > "$WEB_ENV"
  chmod 600 "$WEB_ENV"
  echo "  created $WEB_ENV (VAPID keys generated)"
else
  if [ -n "$DOMAIN" ]; then
    sed -i "s|^NEXT_PUBLIC_API_BASE_URL=.*|NEXT_PUBLIC_API_BASE_URL=${API_BASE}|" "$WEB_ENV"
    echo "  updated API base for domain mode"
  else
    echo "  kept existing $WEB_ENV"
  fi
fi

stage "Frontend build (next build)"
npm run build --workspace=@modit/web

# ---------------------------------------------------------------------------
# 7. PM2 processes
# ---------------------------------------------------------------------------
stage "PM2 processes"
pm2 delete modit-api modit-web >/dev/null 2>&1 || true
pm2 start "$ECOSYSTEM"
pm2 save >/dev/null
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true
if [ ! -f /etc/systemd/system/pm2-root.service ]; then
  PM2_BIN="$(command -v pm2)"
  cat > /etc/systemd/system/pm2-root.service <<EOF
[Unit]
Description=PM2 process manager
After=network.target

[Service]
Type=forking
User=root
LimitNOFILE=64000
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.local/bin
ExecStart=${PM2_BIN} resurrect
ExecReload=${PM2_BIN} restart all
ExecStop=${PM2_BIN} kill
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF
fi
systemctl daemon-reload
systemctl enable pm2-root >/dev/null 2>&1 || true
echo "  modit-api (uvicorn :8000, 2 workers), modit-web (next :3001)"

# ---------------------------------------------------------------------------
# 8. Nginx
# ---------------------------------------------------------------------------
stage "Nginx"
if [ -n "$DOMAIN" ]; then
  cat > /etc/nginx/sites-available/modit <<EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    client_max_body_size 20m;
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    location /_next/static/ {
        alias ${APP_DIR}/apps/modit/web/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
server {
    listen 80;
    server_name ${API_SUBDOMAIN}.${DOMAIN};
    client_max_body_size 50m;
    gzip on;
    gzip_types text/css application/javascript application/json;
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
else
  cat > /etc/nginx/sites-available/modit <<EOF
server {
    listen 80 default_server;
    server_name _;
    client_max_body_size 50m;
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    location /_next/static/ {
        alias ${APP_DIR}/apps/modit/web/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
fi
ln -sf /etc/nginx/sites-available/modit /etc/nginx/sites-enabled/modit
rm -f /etc/nginx/sites-enabled/default
nginx -t >/dev/null 2>&1 || nginx -t
systemctl enable nginx >/dev/null 2>&1
systemctl restart nginx
systemctl enable --now postgresql redis-server >/dev/null 2>&1 || true

# ---------------------------------------------------------------------------
# 9. SSL (domain mode only)
# ---------------------------------------------------------------------------
if [ -n "$DOMAIN" ] && [ -n "$CERTBOT_EMAIL" ]; then
  stage "SSL (certbot)"
  if certbot --nginx -d "$DOMAIN" -d "$API_SUBDOMAIN.$DOMAIN" \
      --non-interactive --agree-tos --no-eff-email -m "$CERTBOT_EMAIL" --redirect; then
    FRONTEND_URL="https://$DOMAIN"
    echo "  SSL installed (HTTP -> HTTPS redirect on)"
  else
    warn "Certbot failed — check DNS A records for $DOMAIN and $API_SUBDOMAIN.$DOMAIN, then re-run: certbot --nginx -d $DOMAIN -d $API_SUBDOMAIN.$DOMAIN -m $CERTBOT_EMAIL"
  fi
fi

# ---------------------------------------------------------------------------
# 10. Firewall
# ---------------------------------------------------------------------------
stage "Firewall (ufw)"
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 80 >/dev/null 2>&1 || true
ufw allow 443 >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true

# ---------------------------------------------------------------------------
# 11. Verify
# ---------------------------------------------------------------------------
stage "Verifying"
ok=1
for i in $(seq 1 30); do
  if curl -fsS --max-time 3 http://127.0.0.1:8000/api/v1/healthz >/dev/null 2>&1; then ok=1; break; fi
  ok=0; sleep 2
done
[ "$ok" = 1 ] && echo "  backend  :8000  OK" || { echo "  backend  :8000  FAILED — see: pm2 logs modit-api"; }

ok=0
for i in $(seq 1 15); do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:3001/ || true)"
  [ "$code" = "200" ] && { ok=1; break; }
  sleep 2
done
[ "$ok" = 1 ] && echo "  frontend :3001  OK" || { echo "  frontend :3001  FAILED — see: pm2 logs modit-web"; }

code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1/ || true)"
echo "  nginx    :80    HTTP $code"

cat <<EOF

$(printf '\033[1;32m')DEPLOY COMPLETE$(printf '\033[0m')
  Site : $FRONTEND_URL
  API  : $API_BASE/healthz
  Logs : pm2 logs        |  status: pm2 status
  Env  : $ENV_FILE  &  $WEB_ENV   (chmod 600, never in git)
  Update flow: see DEPLOY.md
EOF
