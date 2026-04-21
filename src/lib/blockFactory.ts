import type { Block, BlockType, Connection } from '../types/diagram'
import { BLOCK_CONFIG } from './blockConfig'

// ── Connection limit helpers ──────────────────────────────────────────────────

export function canAddOutput(
  connections: Map<string, Connection>,
  sourceId: string,
  sourceType: BlockType,
): boolean {
  const count = Array.from(connections.values()).filter(c => c.sourceId === sourceId).length
  return count < BLOCK_CONFIG[sourceType].maxOutputs
}

export function canAcceptInput(
  connections: Map<string, Connection>,
  targetId: string,
  targetType: BlockType,
): boolean {
  const count = Array.from(connections.values()).filter(c => c.targetId === targetId).length
  return count < BLOCK_CONFIG[targetType].maxInputs
}

/** Returns which Y/N slots a Decision node already has filled. */
export function decisionSlotsUsed(
  connections: Map<string, Connection>,
  sourceId: string,
): { yes: boolean; no: boolean } {
  let yes = false
  let no = false
  for (const c of connections.values()) {
    if (c.sourceId !== sourceId) continue
    if (c.type === 'yes') yes = true
    if (c.type === 'no')  no  = true
  }
  return { yes, no }
}

// ── Block creation ────────────────────────────────────────────────────────────

/**
 * Generate a stable, human-readable ID for a new block of the given type.
 * Start is always 'S'. Others increment: E1, E2, A1, A2, D1, …
 */
export function generateBlockId(type: BlockType, existing: Map<string, Block>): string {
  if (type === 'start') return 'S'
  const { prefix } = BLOCK_CONFIG[type]
  let n = 1
  while (existing.has(`${prefix}${n}`)) n++
  return `${prefix}${n}`
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
    id:              generateBlockId(type, existing),
    type,
    label:           BLOCK_CONFIG[type].defaultLabel,
    position,
    dataField:       null,
    expectedOutcome: null,
    comments:        [],
  }
}
