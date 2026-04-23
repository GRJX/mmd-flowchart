import { getBlockConfig } from "@/config/blockConfig";
import type { Block, Connection } from "@/types/domain";

/**
 * Return the set of block IDs that violate input/output caps (FO §12).
 * Violations arise from externally-edited files where e.g. an Action has
 * two outgoing edges.
 */
export function computeViolations(
  blocks: Record<string, Block>,
  connections: Record<string, Connection>,
): Set<string> {
  const inCount = new Map<string, number>();
  const outCount = new Map<string, number>();
  const decisionYes = new Map<string, number>();
  const decisionNo = new Map<string, number>();

  for (const c of Object.values(connections)) {
    inCount.set(c.target, (inCount.get(c.target) ?? 0) + 1);
    outCount.set(c.source, (outCount.get(c.source) ?? 0) + 1);
    if (c.kind === "yes") decisionYes.set(c.source, (decisionYes.get(c.source) ?? 0) + 1);
    if (c.kind === "no") decisionNo.set(c.source, (decisionNo.get(c.source) ?? 0) + 1);
  }

  const violations = new Set<string>();
  for (const b of Object.values(blocks)) {
    const cfg = getBlockConfig(b.type);
    const ins = inCount.get(b.id) ?? 0;
    const outs = outCount.get(b.id) ?? 0;
    if (cfg.maxInputs !== null && ins > cfg.maxInputs) violations.add(b.id);
    if (cfg.maxOutputs !== null && outs > cfg.maxOutputs) violations.add(b.id);
    if ((decisionYes.get(b.id) ?? 0) > 1) violations.add(b.id);
    if ((decisionNo.get(b.id) ?? 0) > 1) violations.add(b.id);
  }
  return violations;
}
