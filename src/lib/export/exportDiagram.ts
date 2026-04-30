import { toPng, toSvg } from "html-to-image";
import {
  getNodesBounds,
  getViewportForBounds,
  type ReactFlowInstance,
} from "@xyflow/react";

/**
 * Export the current diagram as PNG or SVG using xyflow's built-in viewport
 * helpers. We compute the natural bounds of the nodes, pad them, and pass a
 * clone-only `transform` to html-to-image so the capture region snaps cleanly
 * to the diagram — no mutation of the live DOM, no manual math.
 *
 * The one thing we *do* fix up manually is CSS-variable-driven SVG
 * fill/stroke: html-to-image's clone doesn't always resolve them, so we
 * promote computed presentation styles to inline styles on the live DOM,
 * snapshot, then restore.
 */

const PADDING = 32;
const PNG_PIXEL_RATIO = 2;

type ExportKind = "png" | "svg";

interface Args {
  flow: ReactFlowInstance;
  fileName: string;
  kind: ExportKind;
  /** Resolved theme — determines the PNG background color. */
  theme: "light" | "dark";
}

export async function exportDiagram({
  flow,
  fileName,
  kind,
  theme,
}: Args): Promise<void> {
  const viewportEl = document.querySelector(
    ".react-flow__viewport",
  ) as HTMLElement | null;
  if (!viewportEl) throw new Error("Kon de canvas niet vinden.");

  const nodes = flow.getNodes();
  if (!nodes.length) throw new Error("Niets om te exporteren.");

  const bounds = getNodesBounds(nodes);
  const imageWidth = Math.max(1, Math.ceil(bounds.width + PADDING * 2));
  const imageHeight = Math.max(1, Math.ceil(bounds.height + PADDING * 2));

  // xyflow computes the transform that fits `bounds` into a (w × h) canvas.
  // Locking min/maxZoom to 1 keeps the export at 100% — only translation.
  const viewport = getViewportForBounds(
    bounds,
    imageWidth,
    imageHeight,
    1,
    1,
    0,
  );

  const background =
    kind === "png" ? (theme === "dark" ? "#111111" : "#ffffff") : undefined;

  const restoreStyles = inlineSvgPresentationStyles(viewportEl);

  const options = {
    width: imageWidth,
    height: imageHeight,
    backgroundColor: background,
    pixelRatio: PNG_PIXEL_RATIO,
    style: {
      width: `${imageWidth}px`,
      height: `${imageHeight}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    },
  } as const;

  try {
    const dataUrl =
      kind === "png"
        ? await toPng(viewportEl, options)
        : await toSvg(viewportEl, options);
    downloadDataUrl(dataUrl, `${stripExtension(fileName)}.${kind}`);
  } finally {
    restoreStyles();
  }
}

/**
 * Promote computed fill/stroke/etc. to inline styles on every SVG element
 * inside `root`. html-to-image's clone sometimes loses values coming from
 * CSS variables (e.g. `fill: var(--node-fill)`) — inline styles survive
 * the clone intact.
 */
function inlineSvgPresentationStyles(root: Element): () => void {
  const selector =
    "polygon, path, circle, rect, ellipse, line, polyline, g, text, tspan";
  const elements = root.querySelectorAll<SVGElement>(selector);
  const restores: Array<() => void> = [];

  elements.forEach((el) => {
    const cs = getComputedStyle(el);
    const keys = [
      "fill",
      "stroke",
      "stroke-width",
      "stroke-linejoin",
      "stroke-linecap",
      "stroke-dasharray",
      "color",
      "opacity",
    ];
    const previous: Record<string, string> = {};
    for (const prop of keys) {
      const val = cs.getPropertyValue(prop);
      if (!val) continue;
      previous[prop] = el.style.getPropertyValue(prop);
      el.style.setProperty(prop, val);
    }
    restores.push(() => {
      for (const [prop, prev] of Object.entries(previous)) {
        if (prev) el.style.setProperty(prop, prev);
        else el.style.removeProperty(prop);
      }
    });
  });

  return () => restores.forEach((fn) => fn());
}

function stripExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.substring(0, dot) : name;
}

function downloadDataUrl(dataUrl: string, fileName: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
