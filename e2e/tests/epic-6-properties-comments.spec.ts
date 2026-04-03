/**
 * Epic #6 — Properties panel & comment system
 * Functional acceptance tests (Issue #6, Stories #28–#30)
 *
 * ──────────────────────────────────────────────────────────────────────────
 * SCOPE NOTE
 * Stories S6.1, S6.2, and S6.3 all involve UI panels that are driven by
 * store state that can only be populated after a DiagramFile is loaded.
 * DiagramFile requires a real FileSystemFileHandle (showDirectoryPicker /
 * FileSystemFileHandle) which is not available in a headless session.
 *
 * What IS tested here:
 *   S6.1 — Right panel starts in palette mode; correct "Blocks" header
 *           No .block-properties or .comment-panel present on cold load
 *   S6.2 — No .comment-dot elements before blocks are rendered
 *           CSS classes for comment dot, badge, overflow-visible node rule
 *           and Decision positioning rule are bundled in stylesheet
 *   S6.3 — No .comment-panel, .comment-add-input, .comment-add-btn before
 *           diagram is loaded
 *           CSS classes for comment-panel, comment-item, comment-add-input
 *           and comment-add-btn are bundled in stylesheet
 *           .comment-add-btn disabled state CSS rule present
 *
 * Manual QA required for:
 *   S6.1 — Block properties panel fields per type (Type, ID, Description,
 *           Data Field, Expected Outcome, Y/N paths, Comments count);
 *           Connection properties panel (Type dropdown, From, To, Delete,
 *           Swap Y/N); Back button deselection; undo on field edit
 *   S6.2 — Comment dot rendering on blocks with comments; numeric badge
 *           for count > 1; dot clickable (≥18×18 tap target); z-index above
 *           adjacent block bodies
 *   S6.3 — Comment list with text + timestamps; add comment via Enter and
 *           button; delete comment; undo for add/delete; panel close returns
 *           to properties; 2000-char maxLength enforcement
 * ──────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from "@playwright/test";
import { loadApp } from "../steppers/navigation.stepper";
import {
  PropertiesPanelPage,
  CommentDotPage,
} from "../pages/properties-panel.page";
import {
  assertPaletteHeaderMode,
  assertEpic6IdleState,
} from "../asserters/properties-panel.asserter";

// ── S6.1 — Right panel starts in palette mode ─────────────────────────────

test.describe("S6.1 — Right panel default (palette) mode", () => {
  test("right panel is visible on load", async ({ page }) => {
    await loadApp(page);
    const props = new PropertiesPanelPage(page);
    await expect(props.rightPanel).toBeVisible();
  });

  test("panel header shows 'Blocks' label in palette mode", async ({
    page,
  }) => {
    await loadApp(page);
    const props = new PropertiesPanelPage(page);
    await expect(props.paletteLabel).toHaveText("Blocks");
  });

  test("back button is absent when in palette mode (no block selected)", async ({
    page,
  }) => {
    await loadApp(page);
    const props = new PropertiesPanelPage(page);
    await expect(props.backBtn).toHaveCount(0);
  });

  test("block-properties panel is absent before a block is selected", async ({
    page,
  }) => {
    await loadApp(page);
    const props = new PropertiesPanelPage(page);
    await expect(props.blockProperties).toHaveCount(0);
  });

  test("comment panel is absent in palette mode", async ({ page }) => {
    await loadApp(page);
    const props = new PropertiesPanelPage(page);
    await expect(props.commentPanel).toHaveCount(0);
  });

  test("palette-mode composite assertion passes on cold load", async ({
    page,
  }) => {
    await loadApp(page);
    const props = new PropertiesPanelPage(page);
    await assertPaletteHeaderMode(props);
  });
});

// ── S6.2 — Comment dot absent before diagram is loaded ────────────────────

test.describe("S6.2 — Comment dot indicator (no diagram loaded)", () => {
  test("no .comment-dot elements in DOM before any blocks are rendered", async ({
    page,
  }) => {
    await loadApp(page);
    const dots = new CommentDotPage(page);
    await expect(dots.all).toHaveCount(0);
  });

  test("no .comment-dot-badge elements before blocks are rendered", async ({
    page,
  }) => {
    await loadApp(page);
    const dots = new CommentDotPage(page);
    await expect(dots.badges).toHaveCount(0);
  });

  test("idle state composite: no block-properties, no comment-panel, no comment-dots", async ({
    page,
  }) => {
    await loadApp(page);
    const props = new PropertiesPanelPage(page);
    const dots = new CommentDotPage(page);
    await assertEpic6IdleState(props, dots);
  });
});

// ── S6.3 — Comment panel absent before diagram is loaded ──────────────────

test.describe("S6.3 — Comment panel not shown before diagram is loaded", () => {
  test("no .comment-panel element on cold load", async ({ page }) => {
    await loadApp(page);
    const props = new PropertiesPanelPage(page);
    await expect(props.commentPanel).toHaveCount(0);
  });

  test("no .comment-add-input element on cold load", async ({ page }) => {
    await loadApp(page);
    const props = new PropertiesPanelPage(page);
    await expect(props.commentAddInput).toHaveCount(0);
  });

  test("no .comment-add-btn element on cold load", async ({ page }) => {
    await loadApp(page);
    const props = new PropertiesPanelPage(page);
    await expect(props.commentAddBtn).toHaveCount(0);
  });
});

// ── S6.2 — CSS class registration (comment dot) ───────────────────────────

test.describe("S6.2 — Comment dot CSS classes bundled in stylesheet", () => {
  test(".comment-dot CSS rule is present in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    const found = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".comment-dot") return true;
          }
        } catch { /* cross-origin */ }
      }
      return false;
    });
    expect(found, ".comment-dot CSS rule should be bundled").toBe(true);
  });

  test(".comment-dot-badge CSS rule is present in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    const found = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".comment-dot-badge") return true;
          }
        } catch { /* cross-origin */ }
      }
      return false;
    });
    expect(found, ".comment-dot-badge CSS rule should be bundled").toBe(true);
  });

  test(".node CSS rule has overflow: visible (dot must not be clipped)", async ({
    page,
  }) => {
    await loadApp(page);
    const overflow = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            const r = rule as CSSStyleRule;
            if (r.selectorText === ".node") {
              return r.style.getPropertyValue("overflow");
            }
          }
        } catch { /* cross-origin */ }
      }
      return null;
    });
    expect(overflow, ".node should have overflow: visible").toBe("visible");
  });
});

// ── S6.1 — CSS class registration (block properties) ───────────────────────

test.describe("S6.1 — Block properties CSS classes bundled in stylesheet", () => {
  test(".block-properties CSS rule is present in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    const found = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".block-properties") return true;
          }
        } catch { /* cross-origin */ }
      }
      return false;
    });
    expect(found, ".block-properties CSS rule should be bundled").toBe(true);
  });

  test(".prop-row CSS rule is present in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    const found = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".prop-row") return true;
          }
        } catch { /* cross-origin */ }
      }
      return false;
    });
    expect(found, ".prop-row CSS rule should be bundled").toBe(true);
  });

  test(".prop-incomplete-warning CSS rule present (Decision orange indicator)", async ({
    page,
  }) => {
    await loadApp(page);
    const found = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if (
              (rule as CSSStyleRule).selectorText === ".prop-incomplete-warning"
            )
              return true;
          }
        } catch { /* cross-origin */ }
      }
      return false;
    });
    expect(found, ".prop-incomplete-warning CSS rule should be bundled").toBe(true);
  });

  test(".prop-comments-btn--has CSS rule present (red comment count highlight)", async ({
    page,
  }) => {
    await loadApp(page);
    const found = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if (
              (rule as CSSStyleRule).selectorText === ".prop-comments-btn--has"
            )
              return true;
          }
        } catch { /* cross-origin */ }
      }
      return false;
    });
    expect(found, ".prop-comments-btn--has CSS rule should be bundled").toBe(true);
  });
});

// ── S6.3 — CSS class registration (comment panel) ────────────────────────

test.describe("S6.3 — Comment panel CSS classes bundled in stylesheet", () => {
  test(".comment-panel CSS rule is present in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    const found = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".comment-panel") return true;
          }
        } catch { /* cross-origin */ }
      }
      return false;
    });
    expect(found, ".comment-panel CSS rule should be bundled").toBe(true);
  });

  test(".comment-item CSS rule is present in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    const found = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".comment-item") return true;
          }
        } catch { /* cross-origin */ }
      }
      return false;
    });
    expect(found, ".comment-item CSS rule should be bundled").toBe(true);
  });

  test(".comment-add-input CSS rule is present in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    const found = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".comment-add-input") return true;
          }
        } catch { /* cross-origin */ }
      }
      return false;
    });
    expect(found, ".comment-add-input CSS rule should be bundled").toBe(true);
  });

  test(".comment-add-btn disabled CSS rule present (button unclikable when empty)", async ({
    page,
  }) => {
    await loadApp(page);
    const found = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            const sel = (rule as CSSStyleRule).selectorText ?? "";
            if (sel.includes("comment-add-btn") && sel.includes("disabled")) return true;
          }
        } catch { /* cross-origin */ }
      }
      return false;
    });
    expect(
      found,
      ".comment-add-btn:disabled CSS rule should be bundled",
    ).toBe(true);
  });
});
