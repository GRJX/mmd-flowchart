import type { BlockType, HandleSide } from "@/types/domain";

/**
 * Per-type configuration. FO.md §2: add a new block type by extending this
 * table — no conditional logic elsewhere in the codebase.
 */

export type HandleDirection = HandleSide;

export const ALL_SIDES: HandleSide[] = ["top", "right", "bottom", "left"];

export interface BlockTypeConfig {
  type: BlockType;
  displayName: string;
  idPrefix: string;
  singleton: boolean;
  maxInputs: number | null;
  maxOutputs: number | null;
  labelEditable: boolean;
  defaultLabel: string;
  supportsDataField: boolean;
  supportsExpectedOutcome: boolean;
  availableInPalette: boolean;
  availableInQuickAdd: boolean;
  defaultSize: { width: number; height: number };
  /** Sides on which the block accepts incoming connections (target handles). */
  incomingSides: HandleDirection[];
  /** Sides from which outgoing connections may start (source handles). */
  outgoingHandles: HandleDirection[];
  /** Default label voor verbinding per handle-richting (Decision: right=Y, bottom=N). */
  outgoingLabelByHandle?: Partial<Record<HandleDirection, string>>;
  /** Connection kind per handle-richting (Decision). */
  outgoingKindByHandle?: Partial<Record<HandleDirection, "yes" | "no" | "default">>;
}

export const BLOCK_CONFIG: Record<BlockType, BlockTypeConfig> = {
  start: {
    type: "start",
    displayName: "Start",
    idPrefix: "S",
    singleton: true,
    maxInputs: 0,
    maxOutputs: 1,
    labelEditable: false,
    defaultLabel: "Start",
    supportsDataField: true,
    supportsExpectedOutcome: false,
    availableInPalette: true,
    availableInQuickAdd: false,
    defaultSize: { width: 96, height: 96 },
    incomingSides: [],
    outgoingHandles: ["bottom"],
    outgoingLabelByHandle: { bottom: "" },
    outgoingKindByHandle: { bottom: "default" },
  },
  end: {
    type: "end",
    displayName: "End",
    idPrefix: "E",
    singleton: false,
    maxInputs: null, // onbeperkt
    maxOutputs: 0,
    labelEditable: false,
    defaultLabel: "End",
    supportsDataField: false,
    supportsExpectedOutcome: false,
    availableInPalette: true,
    availableInQuickAdd: true,
    defaultSize: { width: 96, height: 96 },
    incomingSides: ["top", "right", "bottom", "left"],
    outgoingHandles: [],
  },
  action: {
    type: "action",
    displayName: "Action",
    idPrefix: "A",
    singleton: false,
    maxInputs: null,
    maxOutputs: 1,
    labelEditable: true,
    defaultLabel: "Action/State",
    supportsDataField: true,
    supportsExpectedOutcome: false,
    availableInPalette: true,
    availableInQuickAdd: true,
    defaultSize: { width: 176, height: 72 },
    incomingSides: ["top", "right", "bottom", "left"],
    outgoingHandles: ["top", "right", "bottom", "left"],
    outgoingLabelByHandle: { top: "", right: "", bottom: "", left: "" },
    outgoingKindByHandle: {
      top: "default",
      right: "default",
      bottom: "default",
      left: "default",
    },
  },
  decision: {
    type: "decision",
    displayName: "Decision",
    idPrefix: "D",
    singleton: false,
    maxInputs: null,
    maxOutputs: 2,
    labelEditable: true,
    defaultLabel: "Condition?",
    supportsDataField: false,
    supportsExpectedOutcome: false,
    availableInPalette: true,
    availableInQuickAdd: true,
    defaultSize: { width: 160, height: 104 },
    incomingSides: ["top", "right", "bottom", "left"],
    outgoingHandles: ["right", "bottom", "left"],
    outgoingLabelByHandle: { right: "Y", bottom: "N", left: "Y" },
    outgoingKindByHandle: { right: "yes", bottom: "no", left: "yes" },
  },
  result: {
    type: "result",
    displayName: "Result",
    idPrefix: "R",
    singleton: false,
    maxInputs: null,
    maxOutputs: 1,
    labelEditable: true,
    defaultLabel: "Result",
    supportsDataField: false,
    supportsExpectedOutcome: true,
    availableInPalette: true,
    availableInQuickAdd: true,
    defaultSize: { width: 176, height: 72 },
    incomingSides: ["top", "right", "bottom", "left"],
    outgoingHandles: ["top", "right", "bottom", "left"],
    outgoingLabelByHandle: { top: "", right: "", bottom: "", left: "" },
    outgoingKindByHandle: {
      top: "default",
      right: "default",
      bottom: "default",
      left: "default",
    },
  },
};

export const BLOCK_TYPES_ORDERED: BlockType[] = [
  "start",
  "action",
  "decision",
  "result",
  "end",
];

export function getBlockConfig(type: BlockType): BlockTypeConfig {
  return BLOCK_CONFIG[type];
}
