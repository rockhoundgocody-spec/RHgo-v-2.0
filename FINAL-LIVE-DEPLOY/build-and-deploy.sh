#!/bin/bash
set -e
echo "🔥 Building RockHound-GO V2.5..."
npm install
npm run build
echo "🚀 Deploying..."
docker compose up -d --build
echo "✅ LIVE at your server IP or domain. The kids are waiting."