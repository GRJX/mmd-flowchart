import type { Block, BlockType } from "../types/diagram";

const BLOCK_PREFIXES: Record<BlockType, string> = {
  start: "S",
  end: "E",
  action: "A",
  decision: "D",
  result: "R",
};

const BLOCK_DEFAULTS: Record<BlockType, string> = {
  start: "Start",
  end: "End",
  action: "Action",
  decision: "Condition?",
  result: "Result",
};

/**
 * Generate a stable, human-readable ID for a new block of the given type.
 * Start block is always 'S'. Others increment: E1, E2, A1, A2, D1, ...
 */
export function generateBlockId(
  type: BlockType,
  existing: Map<string, Block>,
): string {
  if (type === "start") return "S";
  const prefix = BLOCK_PREFIXES[type];
  let n = 1;
  while (existing.has(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}

/**
 * Create a new Block with default values at the given canvas position.
 * ID is derived from the existing blocks map to ensure uniqueness.
 */
export function createBlock(
  type: BlockType,
  position: { x: number; y: number },
  existing: Map<string, Block>,
): Block {
  return {
    id: generateBlockId(type, existing),
    type,
    label: BLOCK_DEFAULTS[type],
    position,
    dataField: null,
    expectedOutcome: null,
    comments: [],
  };
}
