# MMD Flowchart

Visuele editor voor Mermaid-flowcharts (`.mmd`). Sleep blokken op een canvas en verbind ze; de extensie schrijft er een leesbaar `.mmd`-bestand van.

## Openen

1. Open een `.mmd`-bestand in VS Code.
2. Klik rechtsboven in de editor op de **preview-knop** (het icoon met het vergrootglas op een pagina, net als bij Markdown).
3. De flowchart opent naast de tekst. Beide blijven gelijk: wijzig je links de tekst, dan verandert rechts de flowchart, en andersom.

Andere manieren:

- Rechtsklik op een `.mmd`-bestand in de verkenner → **Open preview naast de tekst**.
- Command palette (`Ctrl/Cmd+Shift+P`) → **MMD Flowchart: Open preview naast de tekst**.

Terug naar de tekst: klik in de flowchart rechtsboven op **Open als tekst**.

Een nieuw diagram maak je met *New File… → `naam.mmd`*. Een leeg bestand begint met één Start-blok.

## Werken met de editor

- **Blok toevoegen** — sleep een bloktype uit het palet rechts naar het canvas, of klik erop.
- **Snel doorbouwen** — een nieuw geplaatst blok krijgt een **+**; klik erop om direct een volgend blok te kiezen en te verbinden.
- **Verbinden** — beweeg over een blok; sleep van een verbindingspunt naar een ander blok.
- **Bewerken** — dubbelklik op een blok om het label te wijzigen, of selecteer het en gebruik het paneel rechts (datafield, expected outcome, commentaar).
- **Decision** — de richting van de uitgaande lijn bepaalt het pad: rechts/links = **Y**, onder = **N**.
- **Uitlijnen** — de Align-knop in de toolbar zet alle blokken op een vast raster.
- **Exporteren** — via de exportknop in de toolbar als PNG of SVG; VS Code vraagt waar het bestand moet komen.

## Opslaan

De editor slaat niet zelf op. Elke wijziging gaat direct naar het bestand in VS Code, dat dan als gewijzigd wordt gemarkeerd. Opslaan doe je zoals altijd met `Ctrl/Cmd+S` (of via de autosave-instelling van VS Code).

## Sneltoetsen

| Actie | Sneltoets |
|---|---|
| Opslaan | `Ctrl/Cmd+S` |
| Undo / redo | `Ctrl/Cmd+Z` / `Ctrl/Cmd+Shift+Z` |
| Alles selecteren | `Ctrl/Cmd+A` |
| Kopiëren / plakken | `Ctrl/Cmd+C` / `Ctrl/Cmd+V` |
| Dupliceren | `Ctrl/Cmd+D` |
| Verwijderen | `Delete` / `Backspace` |
| Passend maken | `Ctrl/Cmd+Shift+F` |
| Meerdere blokken selecteren | `Shift` + slepen |

## Goed om te weten

- Diagrammen die geen flowchart zijn, of meer dan 200 blokken hebben, openen alleen-lezen.
- De editor volgt het licht/donker-thema van VS Code.
