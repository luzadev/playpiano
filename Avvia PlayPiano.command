#!/bin/bash
# Avvia PlayPiano su http://localhost:8765 (necessario perché Ollama accetti le richieste della pagina)
cd "$(dirname "$0")" || exit 1
PORT=8765
if lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "PlayPiano è già in esecuzione: apro il browser."
  open "http://localhost:$PORT/"
  exit 0
fi
echo "PlayPiano in esecuzione su http://localhost:$PORT/"
echo "Lascia aperta questa finestra mentre usi l'app. Chiudila (o premi Ctrl+C) per terminare."
( sleep 1; open "http://localhost:$PORT/" ) &
exec python3 -m http.server "$PORT" --bind 127.0.0.1
