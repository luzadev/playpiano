// PlayPiano desktop: finestra Electron che carica l'app da un piccolo server locale.
// Il server serve a due cose: i campioni del pianoforte si leggono via http, e Ollama
// accetta le richieste solo da pagine con origine http://localhost (non da file://).
const { app, BrowserWindow, session, shell, Menu } = require('electron');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.mp3': 'audio/mpeg', '.mid': 'audio/midi', '.musicxml': 'application/xml', '.mxl': 'application/zip', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json' };
const ALLOWED = ['index.html', 'guida.html', 'guida-img', 'samples', 'esempi'];

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let rel; try { rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html'; } catch (_) { res.writeHead(400); return res.end(); }
      const file = path.normalize(path.join(ROOT, rel));
      if (!file.startsWith(ROOT + path.sep) || !ALLOWED.includes(rel.split('/')[0])) { res.writeHead(404); return res.end('Not found'); }
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
        res.end(data);
      });
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

let win = null;
async function createWindow() {
  const port = await startServer();
  win = new BrowserWindow({
    width: 1440, height: 960, minWidth: 720, minHeight: 560, backgroundColor: '#14110f', title: 'PlayPiano', autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false }
  });
  win.webContents.setWindowOpenHandler(({ url }) => { // la guida si apre in una finestra dell'app, i link esterni nel browser
    if (url.startsWith('http://localhost:' + port + '/')) return { action: 'allow', overrideBrowserWindowOptions: { width: 1180, height: 900, backgroundColor: '#14110f', autoHideMenuBar: true, title: 'PlayPiano · Guida' } };
    if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.on('closed', () => { win = null; });
  await win.loadURL('http://localhost:' + port + '/');
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    // tastiere MIDI: concedi il permesso senza chiedere
    const ok = p => p === 'midi' || p === 'midiSysex' || p === 'keyboardLock';
    session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => cb(ok(permission)));
    session.defaultSession.setPermissionCheckHandler((wc, permission) => ok(permission));
    if (process.platform !== 'darwin') Menu.setApplicationMenu(null);
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
  app.on('window-all-closed', () => app.quit());
}
