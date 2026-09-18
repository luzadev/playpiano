# PlayPiano

Pianoforte virtuale a 88 tasti con spartiti (MIDI e MusicXML), pentagramma, modalità apprendimento,
compositore di idee e generazione con IA locale tramite Ollama.

## Usarlo nel browser
Doppio clic su `Avvia PlayPiano.command` (macOS). Apre l'app su http://localhost:8765.

## App desktop (macOS, Windows, Linux)
Serve Node.js 20 o superiore.

    npm install          # solo la prima volta
    npm start            # avvia l'app desktop in prova

### Creare i pacchetti
    npm run dist:mac     # dist/PlayPiano-<versione>-arm64.dmg (Apple Silicon) e PlayPiano-<versione>.dmg (Intel)
    npx electron-builder --win zip --x64        # versione portatile per Windows
    npx electron-builder --linux tar.gz --x64   # versione portatile per Linux

L'AppImage per Linux richiede strumenti per processori Intel. Su un Mac con chip Apple si costruisce con Docker:

    docker run --rm --platform linux/amd64 -v "$PWD":/project -w /project \
      electronuserland/builder:wine /bin/bash -lc "npx electron-builder --linux AppImage --x64"

L'installer Windows (.exe) non si può produrre da un Mac con chip Apple. Si costruisce su un PC Windows con
`npm install` e `npm run dist:win`, oppure su GitHub con il flusso `.github/workflows/build.yml`.

I pacchetti finiscono nella cartella `dist/`.

## Note
- I pacchetti non sono firmati con un certificato a pagamento. Su macOS, al primo avvio: clic destro sull'app e poi "Apri".
  Su Windows: "Ulteriori informazioni" e poi "Esegui comunque".
- Le idee con IA richiedono Ollama in esecuzione sullo stesso computer (http://localhost:11434).
- Campioni di pianoforte: Salamander Grand Piano di Alexander Holm, licenza CC-BY 3.0 (vedi `samples/LEGGIMI.txt`).
