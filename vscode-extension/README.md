# MMD Flowchart Editor — VSCode-extensie

De bestaande browser-editor (React + Vite, zie de repo-root) als **custom
editor** voor `.mmd`-bestanden. De editor claimt `.mmd` bewust *niet*
automatisch (priority `option`): dubbelklikken opent de gewone teksteditor,
git-diffs blijven tekst, en Mermaid-preview-extensies blijven gewoon werken.
Het canvas open je expliciet:

- rechtermuisklik op een `.mmd`-bestand in de Explorer → **Open in MMD
  Flowchart Editor**, of
- rechtermuisklik op de editor-tab → *Reopen Editor With… → MMD Flowchart*.

VSCode bezit het bestand volledig: buffer, dirty-status, opslaan (handmatig
of auto-save), hot exit en tekst-undo. De webview bewerkt alleen de
*inhoud* — elke canvas-wijziging wordt (gedebounced) als volledige
geserialiseerde tekst in het TextDocument gezet; elke documentwijziging
(externe edit, tekst-undo, git checkout) wordt teruggeduwd naar het canvas.

```
┌────────────────────────────┐   "mmd-edit" (tekst)   ┌──────────────────────┐
│ Webview (media/webview/)   │ ─────────────────────► │ Extension host       │
│ React-app, single-document │ ◄───────────────────── │ CustomTextEditor     │
│ (src/lib/vscode/bridge.ts) │   "mmd-document"       │ WorkspaceEdit + save │
└────────────────────────────┘                        └──────────────────────┘
```

- Berichttypes: `../src/lib/vscode/protocol.ts` (gedeeld met de webview-app).
- Webview-build: `../vite.vscode.config.ts` (vaste bestandsnamen, `base: "./"`).
- In de browser draait dezelfde app onverminderd door (eigen sidebar +
  File System Access API); de modus wordt at runtime gedetecteerd.

## Bouwen

```bash
# 1. Webview-bundel (vanuit de repo-root) → vscode-extension/media/webview/
npm run build:webview

# 2. Extension host (vanuit deze map)
npm install
npm run build
```

## Draaien (development)

Open de map `vscode-extension/` in VSCode en druk op **F5** (Run Extension).
Open in het dev-venster een workspace met `.mmd`-bestanden en kies
rechtermuisklik → *Open in MMD Flowchart Editor*.

Packagen en installeren:

```bash
npm run package         # maakt mmd-flowchart-<versie>.vsix
code --install-extension mmd-flowchart-0.1.0.vsix
```

## Gedrag & keuzes

- **Opslaan** volgt de VSCode-instellingen van de gebruiker (auto-save of
  Ctrl/Cmd+S). Ctrl/Cmd+S in het canvas wordt doorgestuurd naar VSCode.
- **Undo**: het canvas heeft z'n eigen undo/redo (Ctrl/Cmd+Z in de webview);
  VSCode's tekst-undo (menu Edit → Undo, of undo in de teksteditor-weergave)
  rolt het document terug en het canvas volgt. Beide paden convergeren
  omdat document ↔ canvas altijd gesynchroniseerd worden.
- **Exporteren** (PNG/SVG) loopt via een native save-dialoog van VSCode.
- Bestanden aanmaken/hernoemen/verplaatsen/verwijderen: gewoon in de
  Explorer — de extensie heeft daar geen eigen UI meer voor.
