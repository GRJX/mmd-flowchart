import { expect } from "@playwright/test";
import { ConnectionPage } from "../pages/connection.page";

/**
 * Asserts the connection system is in its idle / pristine state — nothing
 * connection-related should be visible before a DiagramFile is loaded.
 */
export async function assertConnectionSystemIdleState(
  conn: ConnectionPage,
): Promise<void> {
  await expect(conn.connHandles).toHaveCount(0);
  await expect(conn.ynPickerOverlay).toHaveCount(0);
  await expect(conn.edges).toHaveCount(0);
  await expect(conn.edgeWaypointHandles).toHaveCount(0);
}

/**
 * Asserts the YNPicker dialog is not present in the DOM.
 * Called both on cold load and after any action that should not trigger it.
 */
export async function assertYNPickerAbsent(
  conn: ConnectionPage,
): Promise<void> {
  await expect(conn.ynPickerOverlay).toHaveCount(0);
  await expect(conn.ynPicker).toHaveCount(0);
}

/**
 * Asserts the full YNPicker structure when it IS rendered.
 * Requires the picker to already be in the DOM (only used in tests where
 * pendingConnection is populated — manual QA or future injectable fixture).
 */
export async function assertYNPickerStructure(
  conn: ConnectionPage,
  sourceLabel: string,
): Promise<void> {
  await expect(conn.ynPicker).toBeVisible();
  await expect(conn.ynPicker).toHaveAttribute("role", "dialog");
  await expect(conn.ynPicker).toHaveAttribute("aria-modal", "true");
  await expect(conn.ynPicker).toHaveAttribute(
    "aria-label",
    "Choose connection type",
  );
  await expect(conn.ynPickerTitle).toHaveText("Choose path type");
  await expect(conn.ynPickerClose).toBeVisible();
  await expect(conn.ynPickerClose).toHaveAttribute("aria-label", "Cancel");
  await expect(conn.ynPickerBtnY).toBeVisible();
  await expect(conn.ynPickerBtnN).toBeVisible();
  await expect(conn.ynPickerCancelBtn).toBeVisible();
  await expect(conn.page.locator(".yn-picker-hint")).toContainText(sourceLabel);
}

/**
 * Asserts that the .conn-handle:hover CSS rule changes colour only — the
 * declared width and height must remain identical to the base rule (10px)
 * and must NOT be overridden in the :hover rule.
 *
 * Implementation approach: we walk document.styleSheets and inspect the
 * CSSStyleRule declarations for both `.conn-handle` and `.conn-handle:hover`,
 * then compare their size properties.
 */
export async function assertConnHandleHoverColourOnlyNoSizeIncrease(
  page: import("@playwright/test").Page,
): Promise<void> {
  const result = await page.evaluate(() => {
    type RuleMap = Record<string, string>;
    const collected: Record<string, RuleMap> = {};

    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules ?? [])) {
          const sel = (rule as CSSStyleRule).selectorText;
          if (sel === ".conn-handle" || sel === ".conn-handle:hover") {
            const style = (rule as CSSStyleRule).style;
            const props: RuleMap = {};
            for (let i = 0; i < style.length; i++) {
              const prop = style.item(i);
              props[prop] = style.getPropertyValue(prop);
            }
            collected[sel] = props;
          }
        }
      } catch {
        // cross-origin sheet — skip
      }
    }
    return collected;
  });

  // Both rules must have been found
  expect(
    result[".conn-handle"],
    ".conn-handle base CSS rule not found in stylesheet",
  ).toBeTruthy();
  expect(
    result[".conn-handle:hover"],
    ".conn-handle:hover CSS rule not found in stylesheet",
  ).toBeTruthy();

  const base = result[".conn-handle"] ?? {};
  const hover = result[".conn-handle:hover"] ?? {};

  // Hover rule must declare a background-color change
  expect(
    hover["background-color"],
    ".conn-handle:hover must declare a background-color",
  ).toBeTruthy();

  // Hover rule must NOT declare width or height (no size increase)
  expect(
    hover["width"],
    ".conn-handle:hover must NOT change width (colour-only hover)",
  ).toBeFalsy();
  expect(
    hover["height"],
    ".conn-handle:hover must NOT change height (colour-only hover)",
  ).toBeFalsy();
  expect(
    hover["min-width"],
    ".conn-handle:hover must NOT change min-width",
  ).toBeFalsy();
  expect(
    hover["min-height"],
    ".conn-handle:hover must NOT change min-height",
  ).toBeFalsy();
  expect(
    hover["transform"],
    ".conn-handle:hover must NOT use transform (scale) to resize",
  ).toBeFalsy();

  // The base size declarations must still be present (10 px)
  expect(
    base["width"],
    ".conn-handle base rule must declare explicit width",
  ).toBeTruthy();
  expect(
    base["height"],
    ".conn-handle base rule must declare explicit height",
  ).toBeTruthy();
}

/**
 * Asserts the CSS structure that supports source-anchored Y/N edge labels
 * (fix for bug #39 — labels were drifting to edge midpoint instead of staying
 * near the decision diamond exit point).
 *
 * Verifies:
 *  - `.edge-label` base rule exists with `pointer-events: none` and
 *    `position: absolute` (required for EdgeLabelRenderer source-offset
 *    translate positioning).
 *  - `.edge-label--yes` exists and declares a `color` (teal).
 *  - `.edge-label--no` exists and declares a `color` (red).
 *  - Neither badge rule contains a `left`, `top`, `right`, or `bottom`
 *    property that would hardcode a midpoint offset, confirming the labels
 *    rely on inline `transform: translate(sourceX, sourceY)` injected by
 *    the OrthogonalEdge component.
 */
export async function assertYNLabelSourceAnchored(
  page: import("@playwright/test").Page,
): Promise<void> {
  type RuleMap = Record<string, string>;

  const collected = await page.evaluate((): Record<string, RuleMap> => {
    const result: Record<string, RuleMap> = {};
    const targets = new Set([
      ".edge-label",
      ".edge-label--yes",
      ".edge-label--no",
    ]);

    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules ?? [])) {
          const sel = (rule as CSSStyleRule).selectorText;
          if (targets.has(sel)) {
            const style = (rule as CSSStyleRule).style;
            const props: RuleMap = {};
            for (let i = 0; i < style.length; i++) {
              const prop = style.item(i);
              props[prop] = style.getPropertyValue(prop);
            }
            result[sel] = props;
          }
        }
      } catch {
        // cross-origin sheet — skip
      }
    }
    return result;
  });

  // ── Base .edge-label rule ──────────────────────────────────────────────
  expect(
    collected[".edge-label"],
    ".edge-label CSS rule not found in stylesheet",
  ).toBeTruthy();

  const base = collected[".edge-label"] ?? {};

  expect(
    base["pointer-events"],
    ".edge-label must have pointer-events: none (labels must not block interaction)",
  ).toBe("none");

  // ── .edge-label--yes ──────────────────────────────────────────────────
  expect(
    collected[".edge-label--yes"],
    ".edge-label--yes CSS rule not found in stylesheet",
  ).toBeTruthy();

  const yes = collected[".edge-label--yes"] ?? {};

  expect(
    yes["color"],
    ".edge-label--yes must declare a color (teal)",
  ).toBeTruthy();

  // Must not hardcode a positional offset that would place it at the midpoint
  expect(
    yes["left"],
    ".edge-label--yes must NOT declare left (position controlled by inline transform)",
  ).toBeFalsy();
  expect(
    yes["top"],
    ".edge-label--yes must NOT declare top (position controlled by inline transform)",
  ).toBeFalsy();

  // ── .edge-label--no ───────────────────────────────────────────────────
  expect(
    collected[".edge-label--no"],
    ".edge-label--no CSS rule not found in stylesheet",
  ).toBeTruthy();

  const no = collected[".edge-label--no"] ?? {};

  expect(
    no["color"],
    ".edge-label--no must declare a color (red)",
  ).toBeTruthy();

  expect(
    no["left"],
    ".edge-label--no must NOT declare left (position controlled by inline transform)",
  ).toBeFalsy();
  expect(
    no["top"],
    ".edge-label--no must NOT declare top (position controlled by inline transform)",
  ).toBeFalsy();
}

// ─────────────────────────────────────────────────────────────────────────────
// Issue #38 — Per-block connection limit asserters
// ─────────────────────────────────────────────────────────────────────────────

type NodeTypeName = "start" | "end" | "action" | "result" | "decision";

/**
 * Asserts that the CSS rule for a given block type exists in the loaded
 * stylesheet, confirming the component styles were bundled correctly.
 */
export async function assertNodeTypeCSSRuleExists(
  page: import("@playwright/test").Page,
  nodeType: NodeTypeName,
): Promise<void> {
  const selector = `.node--${nodeType}`;
  const found = await page.evaluate((sel: string) => {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules ?? [])) {
          if ((rule as CSSStyleRule).selectorText === sel) return true;
        }
      } catch {
        /* cross-origin */
      }
    }
    return false;
  }, selector);
  expect(found, `${selector} CSS rule must exist in the stylesheet`).toBe(true);
}

/**
 * Asserts that the `.conn-handle--target` CSS class is defined in the
 * stylesheet, confirming source and target handles are visually
 * distinguished (required for per-block limit enforcement).
 */
export async function assertTargetHandleCSSClassExists(
  page: import("@playwright/test").Page,
): Promise<void> {
  const found = await page.evaluate(() => {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules ?? [])) {
          const sel = (rule as CSSStyleRule).selectorText ?? "";
          if (sel.includes("conn-handle--target")) return true;
        }
      } catch {
        /* cross-origin */
      }
    }
    return false;
  });
  expect(
    found,
    ".conn-handle--target CSS rule must exist (source/target handle distinction)",
  ).toBe(true);
}

/**
 * Asserts that the `.node--decision.node--incomplete` CSS rule exists with
 * a border-color declaration — this is the orange warning shown on Decision
 * blocks that are missing a Y or N outgoing connection (spec §9.4).
 */
export async function assertDecisionIncompleteWarningCSS(
  page: import("@playwright/test").Page,
): Promise<void> {
  const result = await page.evaluate(() => {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules ?? [])) {
          const sel = (rule as CSSStyleRule).selectorText ?? "";
          if (sel.includes("node--incomplete")) {
            const borderColor = (rule as CSSStyleRule).style.getPropertyValue(
              "border-color",
            );
            return { found: true, hasBorderColor: !!borderColor };
          }
        }
      } catch {
        /* cross-origin */
      }
    }
    return { found: false, hasBorderColor: false };
  });
  expect(
    result.found,
    ".node--incomplete CSS rule must exist for the Decision orange-border warning",
  ).toBe(true);
  expect(
    result.hasBorderColor,
    ".node--decision.node--incomplete must declare border-color (orange warning)",
  ).toBe(true);
}

/**
 * Asserts the full per-block CSS structure required for connection limits:
 * - All five block type CSS rules present
 * - conn-handle--target CSS class present
 * - node--incomplete warning CSS present (Decision block)
 */
export async function assertConnectionLimitsCSSStructure(
  page: import("@playwright/test").Page,
): Promise<void> {
  const nodeTypes: NodeTypeName[] = [
    "start",
    "end",
    "action",
    "result",
    "decision",
  ];
  for (const t of nodeTypes) {
    await assertNodeTypeCSSRuleExists(page, t);
  }
  await assertTargetHandleCSSClassExists(page);
  await assertDecisionIncompleteWarningCSS(page);
}
