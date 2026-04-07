import type { BlockType } from "../types/diagram";

/**
 * Tracks the block type currently being dragged from the palette.
 * Set on dragstart, cleared on drop / dragleave.
 * A plain module-level variable is used because dataTransfer.getData()
 * returns an empty string during `dragover` in Firefox (security restriction).
 */
let _type: BlockType | null = null;

export function getDragBlockType(): BlockType | null {
  return _type;
}
export function setDragBlockType(t: BlockType | null): void {
  _type = t;
}
