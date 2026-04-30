import { BLOCK_CONFIG, getBlockConfig } from "@/config/blockConfig";
import type { Block, BlockType, Connection, HandleSide } from "@/types/domain";

/**
 * Allocate a new, unique ID for a block of the given type. Start uses a fixed
 * "S"; other types get the next positive integer after the highest existing
 * ID of that type (gaps are filled only at the end to keep numbering stable).
 */
export function allocateBlockId(
  type: BlockType,
  existingBlocks: Record<string, Block>,
): string {
  const cfg = getBlockConfig(type);
  if (cfg.singleton) return cfg.idPrefix;

  const prefix = cfg.idPrefix;
  const pattern = new RegExp(`^${prefix}(\\d+)$`);
  let max = 0;
  for (const id of Object.keys(existingBlocks)) {
    const m = id.match(pattern);
    if (m && m[1]) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return `${prefix}${max + 1}`;
}

/** Edge id is deterministic: `${source}-${target}-${kind}`. */
export function makeConnectionId(
  source: string,
  target: string,
  kind: Connection["kind"],
): string {
  return `${source}-${target}-${kind}`;
}

/** Handle id for a source side (where a connection leaves the block). */
export function sourceHandleId(side: HandleSide): string {
  return `${side}-src`;
}

/** Handle id for a target side (where a connection enters the block). */
export function targetHandleId(side: HandleSide): string {
  return `${side}-tgt`;
}

/** Parse the side portion of a handle id (null if it doesn't match the scheme). */
export function sideFromHandleId(handleId: string | null | undefined): HandleSide | null {
  if (!handleId) return null;
  const m = /^(top|right|bottom|left)-(src|tgt)$/.exec(handleId);
  return m ? (m[1] as HandleSide) : null;
}

export function isValidBlockId(id: string): boolean {
  for (const cfg of Object.values(BLOCK_CONFIG)) {
    if (cfg.singleton && id === cfg.idPrefix) return true;
    if (!cfg.singleton && new RegExp(`^${cfg.idPrefix}\\d+$`).test(id)) {
      return true;
    }
  }
  return false;
}

export function inferBlockTypeFromId(id: string): BlockType | null {
  for (const cfg of Object.values(BLOCK_CONFIG)) {
    if (cfg.singleton && id === cfg.idPrefix) return cfg.type;
    if (!cfg.singleton && new RegExp(`^${cfg.idPrefix}\\d+$`).test(id)) {
      return cfg.type;
    }
  }
  return null;
}
