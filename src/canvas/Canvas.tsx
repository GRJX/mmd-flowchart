import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  useReactFlow,
  type Connection as RFConnection,
  type NodeChange,
  type EdgeChange,
  type OnConnectStart,
  type OnConnectEnd,
  type OnReconnect,
  MarkerType,
} from "@xyflow/react";
import { useDiagramStore } from "@/store/diagramStore";
import { GRID_SIZE, type BlockType } from "@/types/domain";
import { DRAG_MIME } from "@/panel/Palette";
import { sideFromHandleId } from "@/lib/ids";
import {
  blocksToNodes,
  connectionsToEdges,
  type BlockNode,
  type FlowEdge,
} from "./rfAdapter";
import { computeViolations } from "./violations";
import { BlockNodeComponent } from "./nodes/BlockNode";
import { FlowEdgeComponent } from "./edges/FlowEdge";
import { getBlockConfig } from "@/config/blockConfig";

const nodeTypes = { blockNode: BlockNodeComponent };
const edgeTypes = { flowEdge: FlowEdgeComponent };

const defaultEdgeOptions = {
  type: "flowEdge" as const,
  markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
};

export function Canvas() {
  const diagram = useDiagramStore((s) => s.diagram);
  const newBlockIds = useDiagramStore((s) => s.newBlockIds);
  const selection = useDiagramStore((s) => s.selection);
  const readOnly = useDiagramStore((s) => s.readOnlyReason !== null);

  const moveBlocks = useDiagramStore((s) => s.moveBlocks);
  const setBlockPositionLive = useDiagramStore((s) => s.setBlockPositionLive);
  const selectBlock = useDiagramStore((s) => s.selectBlock);
  const selectConnection = useDiagramStore((s) => s.selectConnection);
  const clearSelection = useDiagramStore((s) => s.clearSelection);
  const setBlockSelection = useDiagramStore((s) => s.setBlockSelection);
  const addConnection = useDiagramStore((s) => s.addConnection);
  const reconnectConnection = useDiagramStore((s) => s.reconnectConnection);
  const clearNewFlag = useDiagramStore((s) => s.clearNewFlag);
  const addBlock = useDiagramStore((s) => s.addBlock);
  const removeBlocks = useDiagramStore((s) => s.removeBlocks);
  const removeConnection = useDiagramStore((s) => s.removeConnection);

  const rf = useReactFlow();

  const connectingFrom = useRef<{
    nodeId: string;
    handleId: string | null;
  } | null>(null);

  const violations = useMemo(
    () => computeViolations(diagram.blocks, diagram.connections),
    [diagram.blocks, diagram.connections],
  );

  const selectionState = useMemo(
    () => ({
      blockIds: new Set(selection.blockIds),
      connectionIds: new Set(selection.connectionIds),
    }),
    [selection],
  );

  const nodes = useMemo<BlockNode[]>(
    () =>
      blocksToNodes(
        diagram.blocks,
        diagram.connections,
        selectionState,
        newBlockIds,
        violations,
      ),
    [diagram.blocks, diagram.connections, selectionState, newBlockIds, violations],
  );

  const edges = useMemo<FlowEdge[]>(
    () => connectionsToEdges(diagram.connections, selectionState),
    [diagram.connections, selectionState],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<BlockNode>[]) => {
      const drops: { id: string; position: { x: number; y: number } }[] = [];
      for (const ch of changes) {
        if (ch.type === "position" && ch.position) {
          if (ch.dragging) {
            setBlockPositionLive(ch.id, ch.position);
          } else {
            drops.push({ id: ch.id, position: ch.position });
          }
        } else if (ch.type === "select") {
          // handled via onNodeClick / panel click
        }
      }
      if (drops.length) moveBlocks(drops);
    },
    [moveBlocks, setBlockPositionLive],
  );

  const onEdgesChange = useCallback((_changes: EdgeChange<FlowEdge>[]) => {
    // We manage edges through the store; RF's internal edge changes are ignored.
  }, []);

  const onConnectStart: OnConnectStart = useCallback((_, params) => {
    connectingFrom.current = {
      nodeId: params.nodeId ?? "",
      handleId: params.handleId ?? null,
    };
  }, []);

  const onConnectEnd: OnConnectEnd = useCallback(() => {
    connectingFrom.current = null;
  }, []);

  const onConnect = useCallback(
    (c: RFConnection) => {
      if (!c.source || !c.target) return;
      const sourceSide = sideFromHandleId(c.sourceHandle) ?? undefined;
      const targetSide = sideFromHandleId(c.targetHandle) ?? undefined;
      const id = addConnection({
        source: c.source,
        target: c.target,
        sourceSide,
        targetSide,
      });
      if (id) clearNewFlag(c.source);
    },
    [addConnection, clearNewFlag],
  );

  const onReconnect: OnReconnect<FlowEdge> = useCallback(
    (oldEdge, newConn) => {
      if (!newConn.source || !newConn.target) return;
      reconnectConnection({
        oldId: oldEdge.id,
        source: newConn.source,
        target: newConn.target,
        sourceSide: sideFromHandleId(newConn.sourceHandle) ?? undefined,
        targetSide: sideFromHandleId(newConn.targetHandle) ?? undefined,
      });
    },
    [reconnectConnection],
  );

  const onNodeClick = useCallback(
    (e: React.MouseEvent, node: BlockNode) => {
      selectBlock(node.id, e.shiftKey || e.metaKey);
    },
    [selectBlock],
  );

  const onEdgeClick = useCallback(
    (e: React.MouseEvent, edge: FlowEdge) => {
      selectConnection(edge.id, e.shiftKey || e.metaKey);
    },
    [selectConnection],
  );

  const onPaneClick = useCallback(() => clearSelection(), [clearSelection]);

  const onSelectionChange = useCallback(
    (params: { nodes: BlockNode[]; edges: FlowEdge[] }) => {
      // Fires when the user finishes a marquee (Shift+drag). Mirror RF's
      // selected nodes into the store while preserving any edge selection
      // the user already had.
      if (params.nodes.length > 1) {
        setBlockSelection(params.nodes.map((n) => n.id));
      }
    },
    [setBlockSelection],
  );

  const isValidConnection = useCallback(
    (c: RFConnection | FlowEdge) => {
      const source = c.source;
      const target = c.target;
      if (!source || !target) return false;
      if (source === target) return false;
      const src = diagram.blocks[source];
      const tgt = diagram.blocks[target];
      if (!src || !tgt) return false;
      const srcCfg = getBlockConfig(src.type);
      const tgtCfg = getBlockConfig(tgt.type);
      if (srcCfg.maxOutputs === 0) return false;
      if (tgtCfg.maxInputs === 0) return false;

      const outgoing = Object.values(diagram.connections).filter((e) => e.source === source);
      if (srcCfg.maxOutputs !== null && outgoing.length >= srcCfg.maxOutputs) {
        if (src.type !== "decision") return false;
      }
      const incoming = Object.values(diagram.connections).filter((e) => e.target === target);
      if (tgtCfg.maxInputs !== null && incoming.length >= tgtCfg.maxInputs) return false;
      return true;
    },
    [diagram.blocks, diagram.connections],
  );

  useEffect(() => {
    if (readOnly) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const t = e.target as HTMLElement | null;
      if (t) {
        const tag = t.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          t.isContentEditable
        ) {
          return;
        }
      }
      const { blockIds, connectionIds } = useDiagramStore.getState().selection;
      if (!blockIds.length && !connectionIds.length) return;
      e.preventDefault();
      if (blockIds.length) removeBlocks(blockIds);
      for (const cId of connectionIds) removeConnection(cId);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [readOnly, removeBlocks, removeConnection]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    if (readOnly) return;
    if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, [readOnly]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      if (readOnly) return;
      const type = e.dataTransfer.getData(DRAG_MIME) as BlockType | "";
      if (!type) return;
      e.preventDefault();
      const position = rf.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      addBlock({ type, position, markAsNew: true });
    },
    [addBlock, rf, readOnly],
  );

  return (
    <div className="h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onReconnect={onReconnect}
        edgesReconnectable={!readOnly}
        reconnectRadius={16}
        deleteKeyCode={null}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        isValidConnection={isValidConnection}
        snapToGrid
        snapGrid={[GRID_SIZE, GRID_SIZE]}
        connectionRadius={32}
        minZoom={0.1}
        maxZoom={4}
        selectionOnDrag={false}
        panOnDrag
        selectionKeyCode="Shift"
        multiSelectionKeyCode={["Shift", "Meta"]}
        selectNodesOnDrag={false}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        proOptions={{ hideAttribution: true }}
        fitView
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={GRID_SIZE}
          size={1}
          color="var(--claude-border)"
        />
      </ReactFlow>
    </div>
  );
}

