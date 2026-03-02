import React from "react";
import {
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { useGraphStore } from "../app/store";
import { NODE_DEFS_BY_TYPE } from "../nodes/nodeRegistry";
import { WIRE_COLORS, type WireType } from "../shared/wireTypes";

export function TypedEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    source,
    sourceHandleId,
  } = props;

  const executionState = useGraphStore((s) => s.executionState);
  const sourceNodeState = useGraphStore((s) => s.nodeStates[source]);
  const sourceNodeType = useGraphStore(
    (s) => s.nodes.find((n) => n.id === source)?.type
  );

  // Determine wire type from source port
  let wireType: WireType = "data";
  if (sourceNodeType && sourceHandleId) {
    const def = NODE_DEFS_BY_TYPE[sourceNodeType];
    const port = def?.outputs.find((p) => p.id === sourceHandleId);
    if (port) wireType = port.type;
  }

  const color = WIRE_COLORS[wireType];
  const isActive =
    executionState === "running" &&
    sourceNodeState?.status === "running";

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 12,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: isActive ? 2.5 : 1.5,
          opacity: isActive ? 1 : 0.6,
          transition: "stroke-width 0.2s, opacity 0.2s",
        }}
      />
      {isActive && (
        <BaseEdge
          id={`${id}-animated`}
          path={edgePath}
          style={{
            stroke: color,
            strokeWidth: 2.5,
            strokeDasharray: "6 4",
            strokeDashoffset: 0,
            animation: "dash 0.5s linear infinite",
            opacity: 0.8,
          }}
        />
      )}
    </>
  );
}
