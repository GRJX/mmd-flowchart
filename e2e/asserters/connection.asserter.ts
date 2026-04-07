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
export async function assertYNPickerAbsent(conn: ConnectionPage): Promise<void> {
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
