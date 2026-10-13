# MMD Flowchart Editor

Visuele editor voor Mermaid-flowcharts (`.mmd`), als extensie voor **VS Code** en **IntelliJ**.

> **Status:** in ontwikkeling; nog niet getest in een echte VS Code- of IntelliJ-installatie.

## Installeren

Download de nieuwste versie uit de **Package Registry** van dit project (*Deploy → Package Registry → mmd-flowchart*).

- **VS Code:** *Extensions → ⋯ → Install from VSIX…* en kies `mmd-flowchart-<versie>.vsix`. Open een `.mmd`-bestand via *Open With… → MMD Flowchart*.
- **IntelliJ:** *Settings → Plugins → ⚙ → Install Plugin from Disk…* en kies `mmd-flowchart-<versie>.zip`. Open een `.mmd`-bestand en kies de tab **MMD Flowchart**.

## Ontwikkelen

Vereisten: Node 20 en JDK 21.

```bash
npm install
npm run dev      # editor in de browser op http://localhost:5173
npm run build    # bouwt dist/, nodig voor beide extensies
```

| Map | Inhoud | Bouwen |
|---|---|---|
| [src/](src/) | De editor (React + Vite) | `npm run build` |
| [packages/vscode/](packages/vscode/) | VS Code-extensie | `cp -R dist packages/vscode/webview && cd packages/vscode && npm install && npm run package` |
| [packages/intellij/](packages/intellij/) | IntelliJ-plugin | `cd packages/intellij && ./gradlew buildPlugin` |

## Releasen

Push een tag, bijvoorbeeld `git tag v1.2.0 && git push origin v1.2.0`. De pipeline ([.gitlab-ci.yml](.gitlab-ci.yml)) bouwt de `.vsix` en `.zip` en zet ze in de Package Registry.

## Documentatie

- [docs/FO.md](docs/FO.md) — functionele beschrijving: bloktypen, verbindingen, sneltoetsen.
- [docs/USERFLOWS.md](docs/USERFLOWS.md) — user flows als Mermaid-diagrammen.
