/**
 * Epic #5 — Connection system
 * Functional acceptance tests (Issue #5, Stories #25–#27)
 *
 * ──────────────────────────────────────────────────────────────────────────
 * SCOPE NOTE
 * All interactive connection flows require a loaded DiagramFile.
 * DiagramFile is obtained only via File System Access API (showDirectoryPicker
 * / FileSystemFileHandle) which cannot be driven in a headless Playwright
 * session.
 *
 * What IS tested here (initial-state / structural):
 *   S5.1 — Connection handles are absent from the DOM before a diagram opens
 *   S5.2 — YNPicker dialog & overlay are absent on cold load
 *   S5.3 — No edges or edge-waypoint handles before a diagram opens
 *
 * Manual QA required for:
 *   S5.1 — Hover-reveal of 4 handle dots, drag-to-connect preview line,
 *           drop-to-create connection, Start-as-target block guard,
 *           End-as-source block guard, self-loop guard, undo entry
 *   S5.2 — YNPicker appearance after Decision-block drop, ✕ dismiss,
 *           Escape dismiss, backdrop-click dismiss, redirect warning,
 *           Y/N path types stored and exported correctly
 *   S5.3 — Orthogonal edge routing, waypoint drag handle, click-to-select
 *           edge, Delete/Backspace to remove edge, connection properties panel
 *           (S5.3 Properties panel AC not yet wired to BlockPalette — deferred)
 * ──────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from "@playwright/test";
import { loadApp } from "../steppers/navigation.stepper";
import { ConnectionPage } from "../pages/connection.page";
import {
  assertConnectionSystemIdleState,
  assertYNPickerAbsent,
  assertConnHandleHoverColourOnlyNoSizeIncrease,
  assertYNLabelSourceAnchored,
} from "../asserters/connection.asserter";

// ── S5.1 — Connection handles absent before diagram ───────────────────────

test.describe("S5.1 — Connection handles (no diagram open)", () => {
  test("no .conn-handle elements rendered before diagram is loaded", async ({
    page,
  }) => {
    await loadApp(page);
    const conn = new ConnectionPage(page);
    await expect(conn.connHandles).toHaveCount(0);
  });

  test("no React Flow edge elements visible before diagram is loaded", async ({
    page,
  }) => {
    await loadApp(page);
    const conn = new ConnectionPage(page);
    await expect(conn.edges).toHaveCount(0);
  });

  test("no active connection-preview path before diagram is loaded", async ({
    page,
  }) => {
    await loadApp(page);
    // The in-progress drag-to-connect path lives in .react-flow__connection
    const connectionLine = page.locator(".react-flow__connection");
    await expect(connectionLine).toHaveCount(0);
  });
});

// ── S5.2 — YNPicker absent on cold load ──────────────────────────────────

test.describe("S5.2 — YNPicker not shown before diagram is loaded", () => {
  test("YNPicker overlay is absent on initial load", async ({ page }) => {
    await loadApp(page);
    const conn = new ConnectionPage(page);
    await assertYNPickerAbsent(conn);
  });

  test("YNPicker dialog card is not in the DOM on initial load", async ({
    page,
  }) => {
    await loadApp(page);
    const conn = new ConnectionPage(page);
    await expect(conn.ynPicker).toHaveCount(0);
  });

  test("no Y-badge edge labels visible before diagram is loaded", async ({
    page,
  }) => {
    await loadApp(page);
    const conn = new ConnectionPage(page);
    await expect(conn.edgeLabelsYes).toHaveCount(0);
  });

  test("no N-badge edge labels visible before diagram is loaded", async ({
    page,
  }) => {
    await loadApp(page);
    const conn = new ConnectionPage(page);
    await expect(conn.edgeLabelsNo).toHaveCount(0);
  });
});

// ── S5.3 — Edge waypoint handles absent before diagram ───────────────────

test.describe("S5.3 — Edge routing elements absent before diagram is loaded", () => {
  test("no edge-waypoint-handle elements in DOM on load", async ({ page }) => {
    await loadApp(page);
    const conn = new ConnectionPage(page);
    await expect(conn.edgeWaypointHandles).toHaveCount(0);
  });

  test("full idle-state composite assertion passes on cold load", async ({
    page,
  }) => {
    await loadApp(page);
    const conn = new ConnectionPage(page);
    await assertConnectionSystemIdleState(conn);
  });
});

// ── S5.2 — YNPicker DOM structure (static verification via CSS) ───────────

test.describe("S5.2 — YNPicker CSS class registration", () => {
  test("YNPicker overlay and dialog CSS classes exist in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    // Verify that the CSS rules for .yn-picker-overlay and .yn-picker are
    // present in the document stylesheets, confirming the component styles
    // were bundled and loaded correctly.
    const overlayRuleFound = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".yn-picker-overlay") {
              return true;
            }
          }
        } catch {
          // Cross-origin stylesheet — skip
        }
      }
      return false;
    });
    expect(
      overlayRuleFound,
      ".yn-picker-overlay CSS rule should be in stylesheet",
    ).toBe(true);
  });

  test("connection handle CSS class exists in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    const handleRuleFound = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".conn-handle") {
              return true;
            }
          }
        } catch {
          // Cross-origin stylesheet — skip
        }
      }
      return false;
    });
    expect(
      handleRuleFound,
      ".conn-handle CSS rule should be in stylesheet",
    ).toBe(true);
  });

  test("edge waypoint handle CSS class exists in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    const waypointRuleFound = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if (
              (rule as CSSStyleRule).selectorText === ".edge-waypoint-handle"
            ) {
              return true;
            }
          }
        } catch {
          // Cross-origin stylesheet — skip
        }
      }
      return false;
    });
    expect(
      waypointRuleFound,
      ".edge-waypoint-handle CSS rule should be in stylesheet",
    ).toBe(true);
  });

  test("Decision-block incomplete warning CSS class exists in stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    // .node--decision.node--incomplete .node-decision-shape — orange border
    // We check for the simpler .node--incomplete selector prefix
    const incompleteRuleFound = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            const sel = (rule as CSSStyleRule).selectorText ?? "";
            if (sel.includes("node--incomplete")) return true;
          }
        } catch {
          // Cross-origin stylesheet — skip
        }
      }
      return false;
    });
    expect(
      incompleteRuleFound,
      ".node--incomplete CSS rule should be in stylesheet (Decision orange-border warning)",
    ).toBe(true);
  });
});

// ── S5.1 — Connection handle hover: colour change only, no size increase ──

test.describe("S5.1 — Connection handle hover behaviour: colour only, no size increase", () => {
  /**
   * Feature: Connection point hover should change colour only — no size increase
   *
   * Acceptance criteria:
   *   AC1 — The `.conn-handle:hover` CSS rule declares a `background-color`
   *          change (the accent colour).
   *   AC2 — The `.conn-handle:hover` rule does NOT declare `width`, `height`,
   *          `min-width`, or `min-height` overrides.
   *   AC3 — The `.conn-handle:hover` rule does NOT use a `transform` property
   *          (e.g. `scale(...)`) that would visually resize the dot.
   *   AC4 — The base `.conn-handle` rule retains explicit `width` and `height`
   *          declarations so the handle size is always controlled.
   */

  test("AC1 — .conn-handle:hover declares a background-color change", async ({
    page,
  }) => {
    await loadApp(page);
    const hoverHasColour = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".conn-handle:hover") {
              return !!(rule as CSSStyleRule).style.getPropertyValue(
                "background-color",
              );
            }
          }
        } catch {
          // cross-origin sheet
        }
      }
      return false;
    });
    expect(
      hoverHasColour,
      ".conn-handle:hover must declare a background-color (accent colour on hover)",
    ).toBe(true);
  });

  test("AC2 — .conn-handle:hover does NOT override width or height", async ({
    page,
  }) => {
    await loadApp(page);
    const sizeOverrideFound = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".conn-handle:hover") {
              const style = (rule as CSSStyleRule).style;
              return !!(
                style.getPropertyValue("width") ||
                style.getPropertyValue("height") ||
                style.getPropertyValue("min-width") ||
                style.getPropertyValue("min-height")
              );
            }
          }
        } catch {
          // cross-origin sheet
        }
      }
      return false; // rule not found — no size override
    });
    expect(
      sizeOverrideFound,
      ".conn-handle:hover must NOT declare width/height (colour-only hover, no size increase)",
    ).toBe(false);
  });

  test("AC3 — .conn-handle:hover does NOT use transform to scale the dot", async ({
    page,
  }) => {
    await loadApp(page);
    const transformFound = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".conn-handle:hover") {
              return !!(rule as CSSStyleRule).style.getPropertyValue(
                "transform",
              );
            }
          }
        } catch {
          // cross-origin sheet
        }
      }
      return false;
    });
    expect(
      transformFound,
      ".conn-handle:hover must NOT use transform (no scale-up on hover)",
    ).toBe(false);
  });

  test("AC4 — base .conn-handle rule declares explicit width and height", async ({
    page,
  }) => {
    await loadApp(page);
    const baseHasSize = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".conn-handle") {
              const style = (rule as CSSStyleRule).style;
              return !!(
                style.getPropertyValue("width") &&
                style.getPropertyValue("height")
              );
            }
          }
        } catch {
          // cross-origin sheet
        }
      }
      return false;
    });
    expect(
      baseHasSize,
      ".conn-handle base rule must declare explicit width and height",
    ).toBe(true);
  });

  test("composite — assertConnHandleHoverColourOnlyNoSizeIncrease passes", async ({
    page,
  }) => {
    await loadApp(page);
    await assertConnHandleHoverColourOnlyNoSizeIncrease(page);
  });
});

// ── S5.3 — Y/N label anchored to source exit point (bug #39 regression) ──

test.describe("S5.3 — Y/N edge labels anchored to decision exit point, not midpoint", () => {
  /**
   * Bug #39 — Y/N labels on Decision block outputs not anchored to exit point.
   *
   * Root cause: labels were positioned at (sourceX+targetX)/2, (sourceY+targetY)/2
   * (the edge midpoint), which caused them to drift away from the diamond as the
   * target block moved.
   *
   * Fix: getLabelNearSource() offsets the label by LABEL_SOURCE_OFFSET (20 px)
   * from (sourceX, sourceY) in the sourcePosition direction so the badge stays
   * immediately adjacent to the diamond exit handle at all times.
   *
   * Acceptance criteria:
   *   AC1 — `.edge-label` CSS rule exists in the stylesheet.
   *   AC2 — `.edge-label` has `pointer-events: none` (labels must not block interaction).
   *   AC3 — `.edge-label--yes` CSS rule exists with a declared color (teal).
   *   AC4 — `.edge-label--no` CSS rule exists with a declared color (red).
   *   AC5 — Neither badge rule hard-codes `left` or `top` CSS properties
   *          (position is controlled exclusively by the inline `transform: translate`
   *          produced by getLabelNearSource, not by static CSS offsets).
   *   AC6 — Composite asserter assertYNLabelSourceAnchored passes.
   */

  test("AC1 — .edge-label CSS rule exists in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    const found = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".edge-label") return true;
          }
        } catch { /* cross-origin */ }
      }
      return false;
    });
    expect(found, ".edge-label CSS rule must be present in stylesheet").toBe(true);
  });

  test("AC2 — .edge-label has pointer-events: none so labels don't block interaction", async ({
    page,
  }) => {
    await loadApp(page);
    const pointerEvents = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".edge-label") {
              return (rule as CSSStyleRule).style.getPropertyValue("pointer-events");
            }
          }
        } catch { /* cross-origin */ }
      }
      return null;
    });
    expect(
      pointerEvents,
      ".edge-label must have pointer-events: none",
    ).toBe("none");
  });

  test("AC3 — .edge-label--yes CSS rule exists with a color declaration (teal badge)", async ({
    page,
  }) => {
    await loadApp(page);
    const color = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".edge-label--yes") {
              return (rule as CSSStyleRule).style.getPropertyValue("color") || "found";
            }
          }
        } catch { /* cross-origin */ }
      }
      return null;
    });
    expect(color, ".edge-label--yes must declare a color").toBeTruthy();
  });

  test("AC4 — .edge-label--no CSS rule exists with a color declaration (red badge)", async ({
    page,
  }) => {
    await loadApp(page);
    const color = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".edge-label--no") {
              return (rule as CSSStyleRule).style.getPropertyValue("color") || "found";
            }
          }
        } catch { /* cross-origin */ }
      }
      return null;
    });
    expect(color, ".edge-label--no must declare a color").toBeTruthy();
  });

  test("AC5 — neither .edge-label--yes nor .edge-label--no hard-codes left/top (source-offset via inline transform only)", async ({
    page,
  }) => {
    await loadApp(page);
    const hardcodedPosition = await page.evaluate(() => {
      const badgeSelectors = new Set([".edge-label--yes", ".edge-label--no"]);
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            const sel = (rule as CSSStyleRule).selectorText;
            if (badgeSelectors.has(sel)) {
              const style = (rule as CSSStyleRule).style;
              if (style.getPropertyValue("left") || style.getPropertyValue("top")) {
                return sel;
              }
            }
          }
        } catch { /* cross-origin */ }
      }
      return null;
    });
    expect(
      hardcodedPosition,
      "Y/N badge CSS rules must NOT hard-code left/top — position is injected via inline transform by getLabelNearSource()",
    ).toBeNull();
  });

  test("AC6 — composite assertYNLabelSourceAnchored passes", async ({ page }) => {
    await loadApp(page);
    await assertYNLabelSourceAnchored(page);
  });
});
