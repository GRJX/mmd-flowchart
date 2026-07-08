# MMD Flowchart Editor — IntelliJ-plugin

Dezelfde visuele editor als de VSCode-extensie, als **extra editor-tab**
voor `.mmd`-bestanden in IntelliJ-based IDE's (IDEA, WebStorm, PyCharm, …).
Open een `.mmd`-bestand en kies onderaan het tabblad **MMD Flowchart**
naast **Text** — zoals de Markdown-preview. Tekst blijft de standaard;
diffs blijven tekst; andere Mermaid-plugins blijven werken.

De webview is exact dezelfde bundel als in VSCode (gedeeld via
`vscode-extension/media/webview/`), en het protocol is identiek
(`src/lib/host/protocol.ts`). Alleen het transport verschilt:

```
┌────────────────────────────┐  __mmdHost.postMessage  ┌──────────────────────┐
│ Webview in JCEF            │ ──────────────────────► │ MmdFileEditor.kt     │
│ React-app, host bridge     │ ◄────────────────────── │ WriteCommandAction   │
│ (src/lib/host/bridge.ts)   │  __mmdHostReceive(...)  │ + DocumentListener   │
└────────────────────────────┘                         └──────────────────────┘
```

De IDE bezit het document: opslaan (auto-save/Ctrl+S), dirty-status en
tekst-undo werken native. `WriteCommandAction` maakt elke canvas-wijziging
automatisch onderdeel van IntelliJ's undo-stack.

## Bouwen

Vereist JDK 21. De eerste build downloadt de IntelliJ-platformdistributie
(groot, eenmalig).

```bash
# 1. Webview-bundel (vanuit de repo-root)
npm run build:webview

# 2. Plugin (vanuit deze map; genereer eerst de wrapper als die ontbreekt)
gradle wrapper          # eenmalig, of open de map in IntelliJ
./gradlew buildPlugin   # → build/distributions/mmd-flowchart-intellij-0.1.0.zip
```

## Draaien (development)

```bash
./gradlew runIde
```

Er start een sandbox-IDE. Open een project met `.mmd`-bestanden, open er
één en klik op het tabblad **MMD Flowchart**.

## Installeren / delen

Deel `build/distributions/*.zip`; installeren via
*Settings → Plugins → ⚙ → Install Plugin from Disk…*. Publiceren kan naar
de [JetBrains Marketplace](https://plugins.jetbrains.com) (gratis account,
review-proces van enkele dagen).

## Status & aandachtspunten

- **Nog niet gecompileerd/getest** — dit is een scaffold; verwacht kleine
  API-correcties bij de eerste `./gradlew build`.
- **JCEF** is vereist (standaard aanwezig sinds 2020.2; `accept()` checkt
  `JBCefApp.isSupported()` en verbergt de tab anders).
- **Thema**: de app heeft een eigen licht/donker-toggle; automatische
  synchronisatie met het IDE-thema is een latere verbetering.
- Sneltoetsen binnen het canvas (Ctrl+Z/S/…) worden door de webview zelf
  afgehandeld, net als in VSCode.
