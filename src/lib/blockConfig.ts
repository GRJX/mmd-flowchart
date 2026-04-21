import type { BlockType } from '../types/diagram'

/**
 * Per-type configuration record — single source of truth for all block-type
 * properties. Adding or changing a type requires updating exactly one place.
 */
export interface BlockConfig {
  /** ID prefix used when generating block IDs (S, E, A, D, R). */
  prefix: string
  /** Default label when a new block is created. */
  defaultLabel: string
  /** Maximum number of incoming connections (Infinity = unlimited). */
  maxInputs: number
  /** Maximum number of outgoing connections. */
  maxOutputs: number
  /** Canvas dimensions (width × height in pixels). */
  dims: { width: number; height: number }
  /** Drag-ghost dimensions for the palette drag image. */
  ghostDims: { width: number; height: number }
  /** Opening bracket for the Mermaid node definition (e.g. "([", "[", "{"). */
  mermaidOpen: string
  /** Closing bracket for the Mermaid node definition (e.g. "])", "]", "}"). */
  mermaidClose: string
}

export const BLOCK_CONFIG: Record<BlockType, BlockConfig> = {
  start: {
    prefix:       'S',
    defaultLabel: 'Start',
    maxInputs:    0,
    maxOutputs:   1,
    dims:         { width: 48,  height: 48  },
    ghostDims:    { width: 72,  height: 72  },
    mermaidOpen:  '([',
    mermaidClose: '])',
  },
  end: {
    prefix:       'E',
    defaultLabel: 'End',
    maxInputs:    Infinity,
    maxOutputs:   0,
    dims:         { width: 48,  height: 48  },
    ghostDims:    { width: 72,  height: 72  },
    mermaidOpen:  '([',
    mermaidClose: '])',
  },
  action: {
    prefix:       'A',
    defaultLabel: 'Action/State',
    maxInputs:    1,
    maxOutputs:   1,
    dims:         { width: 128, height: 96  },
    ghostDims:    { width: 120, height: 88  },
    mermaidOpen:  '[',
    mermaidClose: ']',
  },
  decision: {
    prefix:       'D',
    defaultLabel: 'Condition?',
    maxInputs:    1,
    maxOutputs:   2,
    dims:         { width: 128, height: 96  },
    ghostDims:    { width: 120, height: 120 },
    mermaidOpen:  '{',
    mermaidClose: '}',
  },
  result: {
    prefix:       'R',
    defaultLabel: 'Result',
    maxInputs:    1,
    maxOutputs:   1,
    dims:         { width: 128, height: 96  },
    ghostDims:    { width: 120, height: 88  },
    mermaidOpen:  '[/',
    mermaidClose: '/]',
  },
}
