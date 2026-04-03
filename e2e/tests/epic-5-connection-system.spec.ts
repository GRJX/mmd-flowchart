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
    expect(overlayRuleFound, ".yn-picker-overlay CSS rule should be in stylesheet").toBe(true);
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
    expect(handleRuleFound, ".conn-handle CSS rule should be in stylesheet").toBe(true);
  });

  test("edge waypoint handle CSS class exists in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    const waypointRuleFound = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".edge-waypoint-handle") {
              return true;
            }
          }
        } catch {
          // Cross-origin stylesheet — skip
        }
      }
      return false;
    });
    expect(waypointRuleFound, ".edge-waypoint-handle CSS rule should be in stylesheet").toBe(true);
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
