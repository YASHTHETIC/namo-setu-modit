#!/usr/bin/env bash
# =============================================================================
# MODIT — Fix SSL certificates & Nginx host binding for modit.in + www + api
# =============================================================================
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Error: This script must be run as root. Run with: sudo bash deploy/fix-ssl.sh"
  exit 1
fi

DOMAIN="modit.in"
API_SUB="api"
APP_DIR="/opt/modit"
ENV_FILE="$APP_DIR/.env"

EMAIL="admin@modit.in"
if [ -f "$ENV_FILE" ]; then
  DETECTED_EMAIL="$(grep '^CERTBOT_EMAIL=' "$ENV_FILE" | cut -d= -f2- || true)"
  if [ -n "$DETECTED_EMAIL" ]; then
    EMAIL="$DETECTED_EMAIL"
  fi
fi

echo "=== 1. Cleaning conflicting Nginx defaults ==="
rm -f /etc/nginx/sites-enabled/default

echo "=== 2. Requesting / Expanding Unified SAN Certificate ==="
echo "Domains: $DOMAIN, www.$DOMAIN, $API_SUB.$DOMAIN"
echo "Email: $EMAIL"

# Request unified certificate covering apex, www, and api subdomains
if certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" -d "$API_SUB.$DOMAIN" \
    --expand --non-interactive --agree-tos --no-eff-email -m "$EMAIL" --redirect; then
  echo "Certbot successfully issued & configured unified SAN certificate!"
else
  echo "Standard certbot run returned non-zero, trying certonly + manual install..."
  certbot certonly --nginx -d "$DOMAIN" -d "www.$DOMAIN" -d "$API_SUB.$DOMAIN" \
    --expand --non-interactive --agree-tos --no-eff-email -m "$EMAIL"
fi

echo "=== 3. Testing and reloading Nginx ==="
nginx -t
systemctl reload nginx

echo "=== 4. Testing SSL Handshake Locally on VPS ==="
curl -fsS -o /dev/null -v "https://$DOMAIN" 2>&1 | grep -i "SSL certificate" || true
curl -fsS -o /dev/null -v "https://www.$DOMAIN" 2>&1 | grep -i "SSL certificate" || true
curl -fsS -o /dev/null -v "https://$API_SUB.$DOMAIN/healthz" 2>&1 | grep -i "SSL certificate" || true

echo "=== SSL CONFIGURATION COMPLETE ==="
