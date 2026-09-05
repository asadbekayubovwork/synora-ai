#!/usr/bin/env bash
#
# Issue the synora-ai.uz certificate as soon as DNS points at this server.
#
# The domain was still unresolved when the site was deployed, so a timer runs
# this every 10 minutes. It does nothing until the A record actually resolves to
# us, then issues the cert, switches nginx to HTTPS, and turns the timer off.
# Ordinary renewals are handled afterwards by the stock certbot.timer.
#
set -euo pipefail

DOMAIN=synora-ai.uz
EXPECTED_IP=169.58.183.151
TIMER=synora-certbot-bootstrap.timer

finish() {
  echo "$1"
  systemctl disable --now "$TIMER" >/dev/null 2>&1 || true
  exit 0
}

[ -d "/etc/letsencrypt/live/$DOMAIN" ] && finish "Certificate already present; stopping timer."

resolves_here() {
  dig +short A "$1" @1.1.1.1 2>/dev/null | grep -qx "$EXPECTED_IP"
}

if ! resolves_here "$DOMAIN"; then
  echo "$DOMAIN does not resolve to $EXPECTED_IP yet; will retry."
  exit 0
fi

args=(-d "$DOMAIN")
# Only ask for www if it resolves too — an unresolvable name fails the whole order.
if resolves_here "www.$DOMAIN"; then
  args+=(-d "www.$DOMAIN")
  echo "Including www.$DOMAIN"
fi

echo "Requesting certificate for: ${args[*]}"
certbot --nginx --non-interactive --agree-tos --redirect --keep-until-expiring "${args[@]}"
nginx -t && systemctl reload nginx

finish "Certificate issued for $DOMAIN; stopping timer."
