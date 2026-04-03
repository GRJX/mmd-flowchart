import { expect } from "@playwright/test";
import { type PalettePage, PALETTE_ENTRIES } from "../pages/palette.page";

/**
 * Assert the palette is in its default (palette mode) state:
 * - Panel is visible
 * - Header shows "Blocks" label
 * - All 5 block type entries are present
 */
export async function assertPaletteMode(palette: PalettePage): Promise<void> {
  await expect(palette.panel).toBeVisible();
  await expect(palette.paletteLabel).toBeVisible();
  await expect(palette.paletteLabel).toHaveText("Blocks");
  await expect(palette.entries).toHaveCount(PALETTE_ENTRIES.length);
}

/**
 * Assert all five palette entries are visible and carry their
 * correct aria-labels as specified in §6.4.
 */
export async function assertAllPaletteEntriesPresent(
  palette: PalettePage,
): Promise<void> {
  for (const { ariaLabel } of PALETTE_ENTRIES) {
    await expect(
      palette.entry(ariaLabel),
      `Palette entry "${ariaLabel}" should be visible`,
    ).toBeVisible();
  }
}

/**
 * Assert every palette entry contains an inline SVG preview element.
 */
export async function assertPalettePreviewsExist(
  palette: PalettePage,
): Promise<void> {
  const count = await palette.entries.count();
  for (let i = 0; i < count; i++) {
    const svg = palette.entries.nth(i).locator(".palette-preview svg");
    await expect(
      svg,
      `Entry ${i} should contain an SVG preview`,
    ).toBeAttached();
  }
}
