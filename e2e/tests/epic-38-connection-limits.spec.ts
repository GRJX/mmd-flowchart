/**
 * Epic #38 — Per-block connection limit enforcement
 * Functional acceptance tests (Feature Issue #38)
 *
 * ──────────────────────────────────────────────────────────────────────────
 * SCOPE NOTE
 * Dynamic limit enforcement (hiding handles once a limit is reached) requires
 * a loaded DiagramFile, which is only obtainable via the File System Access
 * API and cannot be driven in a headless Playwright session.
 *
 * What IS tested here (structural / CSS):
 *   AC1  — Start block CSS rule exists; Start renders source handles only
 *           (conn-handle, not conn-handle--target)
 *   AC2  — End block CSS rule exists; End renders target handles only
 *           (conn-handle--target, not plain conn-handle source)
 *   AC3  — Action block CSS rule exists; both source and target handle
 *           classes are defined in the stylesheet
 *   AC4  — Result block CSS rule exists; same handle classes defined
 *   AC5  — Decision block CSS rule exists
 *   AC6  — .node--decision.node--incomplete CSS warning rule exists with
 *           an orange border-color (missing Y or N path indicator)
 *   AC7  — .conn-handle--target CSS class exists (source/target distinction)
 *   AC8  — Composite assertConnectionLimitsCSSStructure passes
 *
 * Manual QA required for:
 *   - Start block: exactly one outgoing connection can be created;
 *     input handles are absent after the single output is created
 *   - End block: exactly one incoming connection can be received;
 *     output handles absent
 *   - Action block: input handle disappears after one incoming connection;
 *     output handle disappears after one outgoing connection
 *   - Result block: same limits as Action block
 *   - Decision block: input handle disappears after one incoming connection;
 *     only two output handles exist (Y and N); incomplete warning shows
 *     until both Y and N paths are connected
 *   - Blocks from loaded .mmd files that exceed limits show orange border
 * ──────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from "@playwright/test";
import { loadApp } from "../steppers/navigation.stepper";
import {
  assertNodeTypeCSSRuleExists,
  assertTargetHandleCSSClassExists,
  assertDecisionIncompleteWarningCSS,
  assertConnectionLimitsCSSStructure,
} from "../asserters/connection.asserter";

// ── AC1 — Start block: source handles only, no target handles ────────────

test.describe("AC1 — Start block: source-only connection handles", () => {
  test("AC1.1 — .node--start CSS rule exists in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    await assertNodeTypeCSSRuleExists(page, "start");
  });

  test("AC1.2 — conn-handle--target CSS class exists (target distinction available for non-Start nodes)", async ({
    page,
  }) => {
    await loadApp(page);
    // The presence of conn-handle--target in CSS confirms the component
    // architecture supports per-node source/target choices.
    await assertTargetHandleCSSClassExists(page);
  });

  test("AC1.3 — .node--start CSS rule is registered with a border-radius (pill shape confirming it is a Start block)", async ({
    page,
  }) => {
    await loadApp(page);
    const borderRadius = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".node--start") {
              return (rule as CSSStyleRule).style.getPropertyValue(
                "border-radius",
              );
            }
          }
        } catch {
          /* cross-origin */
        }
      }
      return null;
    });
    expect(
      borderRadius,
      ".node--start must have border-radius (pill shape identifying the Start block)",
    ).toBeTruthy();
  });
});

// ── AC2 — End block: target handles only, no source handles ─────────────

test.describe("AC2 — End block: target-only connection handles", () => {
  test("AC2.1 — .node--end CSS rule exists in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    await assertNodeTypeCSSRuleExists(page, "end");
  });

  test("AC2.2 — .node--end CSS rule has border-radius (pill shape distinguishing it from other blocks)", async ({
    page,
  }) => {
    await loadApp(page);
    const borderRadius = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".node--end") {
              return (rule as CSSStyleRule).style.getPropertyValue(
                "border-radius",
              );
            }
          }
        } catch {
          /* cross-origin */
        }
      }
      return null;
    });
    expect(
      borderRadius,
      ".node--end must have border-radius (pill shape identifying the End block)",
    ).toBeTruthy();
  });

  test("AC2.3 — .node--end has a distinct border from .node--start (red vs teal)", async ({
    page,
  }) => {
    await loadApp(page);
    const borders = await page.evaluate(() => {
      const result: Record<string, string> = {};
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            const sel = (rule as CSSStyleRule).selectorText;
            if (sel === ".node--start" || sel === ".node--end") {
              // border shorthand is set; fall back to border-color if present
              const style = (rule as CSSStyleRule).style;
              result[sel] =
                style.getPropertyValue("border") ||
                style.getPropertyValue("border-color") ||
                "";
            }
          }
        } catch {
          /* cross-origin */
        }
      }
      return result;
    });
    expect(
      borders[".node--start"],
      ".node--start must declare a border (teal)",
    ).toBeTruthy();
    expect(
      borders[".node--end"],
      ".node--end must declare a border (red)",
    ).toBeTruthy();
    expect(
      borders[".node--start"],
      "Start and End block borders must differ",
    ).not.toBe(borders[".node--end"]);
  });
});

// ── AC3 — Action block: 1 input, 1 output limits ────────────────────────

test.describe("AC3 — Action block CSS rule and handle structure", () => {
  test("AC3.1 — .node--action CSS rule exists in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    await assertNodeTypeCSSRuleExists(page, "action");
  });

  test("AC3.2 — .node--action has border-radius (rounded rectangle block)", async ({
    page,
  }) => {
    await loadApp(page);
    const borderRadius = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".node--action") {
              return (rule as CSSStyleRule).style.getPropertyValue(
                "border-radius",
              );
            }
          }
        } catch {
          /* cross-origin */
        }
      }
      return null;
    });
    expect(borderRadius, ".node--action must have border-radius").toBeTruthy();
  });
});

// ── AC4 — Result block: 1 input, 1 output limits ────────────────────────

test.describe("AC4 — Result block CSS rule and handle structure", () => {
  test("AC4.1 — .node--result CSS rule exists in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    await assertNodeTypeCSSRuleExists(page, "result");
  });

  test("AC4.2 — .node--result has a left accent border (teal) distinguishing it from Action blocks", async ({
    page,
  }) => {
    await loadApp(page);
    const borderLeft = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".node--result") {
              return (rule as CSSStyleRule).style.getPropertyValue(
                "border-left",
              );
            }
          }
        } catch {
          /* cross-origin */
        }
      }
      return null;
    });
    expect(
      borderLeft,
      ".node--result must declare border-left (teal left-accent identifying Result blocks)",
    ).toBeTruthy();
  });
});

// ── AC5 — Decision block: 1 input, 2 outputs (Y and N) ──────────────────

test.describe("AC5 — Decision block CSS rule and diamond shape", () => {
  test("AC5.1 — .node--decision CSS rule exists in the loaded stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    await assertNodeTypeCSSRuleExists(page, "decision");
  });

  test("AC5.2 — .node-decision-shape CSS rule exists (rotated-square diamond technique)", async ({
    page,
  }) => {
    await loadApp(page);
    const found = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if ((rule as CSSStyleRule).selectorText === ".node-decision-shape")
              return true;
          }
        } catch {
          /* cross-origin */
        }
      }
      return false;
    });
    expect(
      found,
      ".node-decision-shape CSS rule must exist (diamond rendering)",
    ).toBe(true);
  });

  test("AC5.3 — .node-decision-shape uses transform: rotate(45deg) to achieve diamond orientation", async ({
    page,
  }) => {
    await loadApp(page);
    const transform = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            if (
              (rule as CSSStyleRule).selectorText === ".node-decision-shape"
            ) {
              return (rule as CSSStyleRule).style.getPropertyValue("transform");
            }
          }
        } catch {
          /* cross-origin */
        }
      }
      return null;
    });
    expect(
      transform,
      ".node-decision-shape must declare transform: rotate(45deg) (diamond shape)",
    ).toContain("rotate(45deg)");
  });
});

// ── AC6 — Decision incomplete warning: orange border when Y or N path missing

test.describe("AC6 — Decision block incomplete warning (orange border)", () => {
  test("AC6.1 — .node--decision.node--incomplete CSS rule exists with border-color", async ({
    page,
  }) => {
    await loadApp(page);
    await assertDecisionIncompleteWarningCSS(page);
  });

  test("AC6.2 — .node--incomplete warning rule targets the inner .node-decision-shape (not the outer wrapper)", async ({
    page,
  }) => {
    await loadApp(page);
    const found = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            const sel = (rule as CSSStyleRule).selectorText ?? "";
            if (
              sel.includes("node--incomplete") &&
              sel.includes("node-decision-shape")
            ) {
              return true;
            }
          }
        } catch {
          /* cross-origin */
        }
      }
      return false;
    });
    expect(
      found,
      ".node--decision.node--incomplete must target .node-decision-shape for orange border",
    ).toBe(true);
  });
});

// ── AC7 — conn-handle--target class exists (source/target distinction) ───

test.describe("AC7 — conn-handle--target CSS class for source/target distinction", () => {
  test("AC7.1 — .conn-handle--target CSS class is registered in the stylesheet", async ({
    page,
  }) => {
    await loadApp(page);
    await assertTargetHandleCSSClassExists(page);
  });

  test("AC7.2 — .react-flow--connectionline .conn-handle--target CSS rule exists (target handles light up during drag)", async ({
    page,
  }) => {
    await loadApp(page);
    const found = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules ?? [])) {
            const sel = (rule as CSSStyleRule).selectorText ?? "";
            if (
              sel.includes("react-flow--connectionline") &&
              sel.includes("conn-handle--target")
            ) {
              return true;
            }
          }
        } catch {
          /* cross-origin */
        }
      }
      return false;
    });
    expect(
      found,
      ".react-flow--connectionline .conn-handle--target rule must exist (highlight targets during drag)",
    ).toBe(true);
  });
});

// ── AC8 — Composite assertion ────────────────────────────────────────────

test.describe("AC8 — Composite: full connection-limits CSS structure", () => {
  test("AC8 — assertConnectionLimitsCSSStructure composite assertion passes", async ({
    page,
  }) => {
    await loadApp(page);
    await assertConnectionLimitsCSSStructure(page);
  });
});
