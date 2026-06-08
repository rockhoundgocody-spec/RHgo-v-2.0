#!/bin/bash
# ROCKHOUND-GO — ONE-COMMAND BUILD + DEPLOY

set -e

echo "Building RockHound-GO production PWA..."
npm install
npm run build

echo "Deploying with Docker + Caddy..."
docker compose up -d --build

echo "DONE. RockHound-GO is live at the server IP or configured domain."
echo "Next: point your domain A-record to this server, edit Caddyfile if needed, then run: docker compose restart"
