// MatchNode.tsx
import { Handle, Position } from "@xyflow/react";
import React, { useCallback } from "react";

interface MatchNodeProps {
  id: string;
  data: {
    match: {
      id: string;
      state: string;
      numberOfRounds: number;
      name?: string;
      round: string; // e.g. "upper-r1", "lower-finals", etc.
    };
    topParty: { name: string } | null;
    bottomParty: { name: string } | null;
    topHovered: boolean;
    bottomHovered: boolean;
    resultFallback: string;
    teamNameFallback: string;
  };
}

const MatchNode: React.FC<MatchNodeProps> = ({ data }) => {
  const {
    match,
    topParty,
    bottomParty,
    topHovered,
    bottomHovered,
    teamNameFallback,
  } = data;
  const { state, numberOfRounds, name, round } = match;
  const hasMatchData = !!state;

  const onInfoMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      console.log("Match hovered:", {
        match,
        topParty,
        bottomParty,
        position: [e.clientX, e.clientY],
      });
    },
    [match, topParty, bottomParty]
  );

  return (
    <div className="relative flex flex-col items-center w-64 p-2 border bg-black/50 border-gray-600 text-sm rounded-md">
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 bg-gray-500"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 bg-gray-500"
      />

      {/* Top Team */}
      <div
        className={`p-2 w-full text-center ${
          topHovered ? "bg-gray-700" : "bg-gray-800"
        }`}
      >
        {topParty?.name || teamNameFallback}
      </div>

      {/* Middle Section */}
      <div className="flex flex-wrap items-center my-2">
        <div className="flex-1 h-[1px] bg-gray-500"></div>
        {numberOfRounds > 1 && (
          <span className="mx-2 text-gray-400">Best of {numberOfRounds}</span>
        )}
        {hasMatchData && (
          <div
            className="w-6 h-6 bg-gray-600 flex items-center justify-center"
            onMouseEnter={onInfoMouseEnter}
          >
            ℹ️
          </div>
        )}
      </div>

      {/* Bottom Team */}
      <div
        className={`p-2 w-full text-center ${
          bottomHovered ? "bg-gray-700" : "bg-gray-800"
        }`}
      >
        {bottomParty?.name || teamNameFallback}
      </div>

      {/* Optional: If you want to also show a match-specific name at the bottom */}
      {name && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-gray-400 text-xs">
          {name}
        </div>
      )}
    </div>
  );
};

export default MatchNode;
