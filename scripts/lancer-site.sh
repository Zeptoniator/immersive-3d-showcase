#!/usr/bin/env bash
#
# Lance NOVA CORE en local et ouvre le navigateur.
#
# Utilisé par le raccourci du bureau. Le script compile le site si nécessaire,
# sert le résultat avec `vite preview`, puis ouvre la page. Ctrl+C arrête le
# serveur.

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# nvm n'est pas chargé dans une session lancée depuis le bureau : on le source
# explicitement pour retrouver la bonne version de Node.
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js est introuvable. Installez-le (nvm install --lts) puis relancez." >&2
  read -r -p "Appuyez sur Entrée pour fermer." _
  exit 1
fi

echo "Projet   : $PROJECT_DIR"
echo "Node.js  : $(node --version)"
echo

if [ ! -d node_modules ]; then
  echo "→ Installation des dépendances…"
  npm install
fi

# Recompile si dist est absent ou plus ancien que les sources.
if [ ! -d dist ] || [ -n "$(find src index.html public -newer dist -print -quit 2>/dev/null)" ]; then
  echo "→ Compilation de production…"
  npm run build
else
  echo "→ Build à jour, compilation ignorée."
fi

# Cherche un port libre à partir de 4173.
PORT=4173
while ss -ltn "sport = :$PORT" 2>/dev/null | grep -q LISTEN; do
  PORT=$((PORT + 1))
done

URL="http://127.0.0.1:$PORT/"
echo
echo "→ Démarrage du serveur sur $URL"
echo "  (Ctrl+C pour arrêter)"
echo

npm run preview -- --port "$PORT" --strictPort &
SERVER_PID=$!

# Arrête proprement le serveur à la fermeture du script.
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT INT TERM

# Attend que le serveur réponde avant d'ouvrir le navigateur.
for _ in $(seq 1 60); do
  if curl -sf -o /dev/null "$URL"; then break; fi
  sleep 0.5
done

xdg-open "$URL" >/dev/null 2>&1 || echo "Ouvrez manuellement : $URL"

wait "$SERVER_PID"
