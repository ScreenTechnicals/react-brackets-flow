"use client";
import type { Edge, Node } from "@xyflow/react";
import { Controls, MiniMap, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React from "react";
import MatchNode from "./match";

// ----------------------------------------------------------------
// Define Types
// ----------------------------------------------------------------

interface Party {
  name: string;
}

export interface Match {
  id: string;
  name: string;
  topParty: Party | null;
  numberOfRounds: number;
  bottomParty: Party | null;
}

// Extend MatchNodeData so it satisfies Record<string, unknown>
interface MatchNodeData extends Record<string, unknown> {
  match: Match;
  topParty: Party;
  bottomParty: Party;
}

// Update RoundLabelData so it also extends Record<string, unknown>
interface RoundLabelData extends Record<string, unknown> {
  label: string;
}

// Create a union type for node data
type MyNodeData = MatchNodeData | RoundLabelData;

// ----------------------------------------------------------------
// Component Props
// ----------------------------------------------------------------

interface DoubleEliminationBracketFlowProps {
  matches: {
    upper: Match[]; // winners bracket
    lower: Match[]; // losers bracket
  };
}

// ----------------------------------------------------------------
// Round Label Node Component with Custom CSS
// ----------------------------------------------------------------

const RoundLabel = ({ data }: { data: RoundLabelData }) => {
  return (
    <div className="p-2 bg-blue-500 text-white font-bold rounded shadow">
      {data.label}
    </div>
  );
};

// ----------------------------------------------------------------
// Dynamically Generate Rounds from a Flat Matches Array
// ----------------------------------------------------------------

const generateRounds = (matchesArr: Match[]): Match[][] => {
  // Special case: if there are exactly 3 matches,
  // use the first 2 as Round 1 and the last as Final.
  if (matchesArr.length === 3) {
    return [matchesArr.slice(0, 2), matchesArr.slice(2)];
  }

  // Default logic: group matches with both teams defined as the first round,
  // and matches with null teams as later rounds.
  const firstRoundMatches: Match[] = [];
  const laterMatches: Match[] = [];

  matchesArr.forEach((match) => {
    if (match.topParty && match.bottomParty) {
      firstRoundMatches.push(match);
    } else {
      laterMatches.push(match);
    }
  });

  const rounds: Match[][] = [];
  rounds.push(firstRoundMatches);

  let prevRoundCount = firstRoundMatches.length;
  const remaining = [...laterMatches];

  while (remaining.length > 0) {
    const roundCount = Math.ceil(prevRoundCount / 2);
    const roundMatches = remaining.splice(0, roundCount);
    rounds.push(roundMatches);
    prevRoundCount = roundMatches.length;
  }

  return rounds;
};

// ----------------------------------------------------------------
// Layout Configuration
// ----------------------------------------------------------------

const labelY = 50; // fixed y coordinate for round labels (top row)
const offsetForMatchNodes = 150; // vertical gap between round labels and match nodes
const xSpacing = 400; // horizontal space between rounds
const ySpacing = 200; // vertical space between match nodes

// Compute a dynamic baseY for match nodes based on the maximum number of matches in any round.
const computeBaseY = (rounds: Match[][]): number => {
  const maxMatches = Math.max(...rounds.map((round) => round.length));
  return labelY + offsetForMatchNodes + ((maxMatches - 1) * ySpacing) / 2;
};

// ----------------------------------------------------------------
// Generate Nodes for ReactFlow (Match Nodes)
// ----------------------------------------------------------------
// (Added an optional verticalOffset parameter for lower bracket adjustments.)
const generateMatchNodes = (
  rounds: Match[][],
  baseY: number,
  verticalOffset: number = 0
): Node<MatchNodeData>[] => {
  const nodes: Node<MatchNodeData>[] = [];

  rounds.forEach((round, roundIndex) => {
    const totalMatches = round.length;
    const roundYOffset = baseY - ((totalMatches - 1) * ySpacing) / 2;

    round.forEach((match, matchIndex) => {
      nodes.push({
        id: match.id,
        type: "custom",
        position: {
          x: 100 + roundIndex * xSpacing,
          y: roundYOffset + matchIndex * ySpacing + verticalOffset,
        },
        data: {
          match,
          topParty:
            match.topParty ||
            ({
              name: `Winner ${
                rounds[roundIndex - 1]?.[matchIndex * 2]?.id || "TBD"
              }`,
            } as Party),
          bottomParty:
            match.bottomParty ||
            ({
              name: `Winner ${
                rounds[roundIndex - 1]?.[matchIndex * 2 + 1]?.id || "TBD"
              }`,
            } as Party),
        },
      });
    });
  });

  return nodes;
};

// ----------------------------------------------------------------
// Generate Nodes for ReactFlow (Round Label Nodes)
// ----------------------------------------------------------------
// (Accepts verticalOffset to adjust the label positions for lower bracket.)
const generateRoundLabelNodes = (
  rounds: Match[][],
  verticalOffset: number = 0
): Node<RoundLabelData>[] => {
  const labelNodes: Node<RoundLabelData>[] = [];

  rounds.forEach((_, roundIndex) => {
    const label =
      roundIndex === rounds.length - 1 ? "Final" : `Round ${roundIndex + 1}`;
    labelNodes.push({
      id: `round-label-${roundIndex}-${verticalOffset}`, // unique id per bracket
      type: "label",
      position: {
        x: 100 + roundIndex * xSpacing,
        y: labelY + verticalOffset, // adjusted by verticalOffset if needed
      },
      style: { zIndex: 999 },
      data: { label },
    });
  });

  return labelNodes;
};

// ----------------------------------------------------------------
// Generate Edges for ReactFlow
// ----------------------------------------------------------------
// (Also accepts verticalOffset to keep ids unique if necessary.)
const generateEdges = (
  rounds: Match[][],
  verticalOffset: number = 0
): Edge[] => {
  const edges: Edge[] = [];

  rounds.forEach((round, roundIndex) => {
    if (roundIndex === 0) return; // no incoming edges for first round

    round.forEach((match, matchIndex) => {
      const prevRound = rounds[roundIndex - 1];
      if (!prevRound) return;

      const topSource = prevRound[matchIndex * 2]?.id;
      const bottomSource = prevRound[matchIndex * 2 + 1]?.id;

      if (topSource) {
        edges.push({
          id: `${topSource}-${match.id}-${verticalOffset}`,
          source: topSource,
          target: match.id,
          type: "smoothstep",
        });
      }
      if (bottomSource) {
        edges.push({
          id: `${bottomSource}-${match.id}-${verticalOffset}`,
          source: bottomSource,
          target: match.id,
          type: "smoothstep",
        });
      }
    });
  });

  return edges;
};

// ----------------------------------------------------------------
// Main Component for Double Elimination Bracket Flow
// ----------------------------------------------------------------

const DoubleEliminationBracketFlow: React.FC<
  DoubleEliminationBracketFlowProps
> = ({ matches }) => {
  // --- Upper Bracket (Winners) ---
  const upperRounds = generateRounds(matches.upper);
  const upperBaseY = computeBaseY(upperRounds);
  const upperMatchNodes = generateMatchNodes(upperRounds, upperBaseY);
  const upperRoundLabelNodes = generateRoundLabelNodes(upperRounds);
  const upperEdges = generateEdges(upperRounds);

  // --- Lower Bracket (Losers) ---
  // Define an offset so the lower bracket appears further down.
  const lowerBracketOffset = 600; // adjust this value to suit your layout
  const lowerRounds = generateRounds(matches.lower);
  const lowerBaseY = computeBaseY(lowerRounds); // compute without offset
  const lowerMatchNodes = generateMatchNodes(
    lowerRounds,
    lowerBaseY,
    lowerBracketOffset
  );
  const lowerRoundLabelNodes = generateRoundLabelNodes(
    lowerRounds,
    lowerBracketOffset
  );
  const lowerEdges = generateEdges(lowerRounds, lowerBracketOffset);

  // Combine nodes and edges from both brackets.
  const nodes: Node<MyNodeData>[] = [
    ...upperMatchNodes,
    ...upperRoundLabelNodes,
    ...lowerMatchNodes,
    ...lowerRoundLabelNodes,
  ];
  const edges: Edge[] = [...upperEdges, ...lowerEdges];

  return (
    <div className="w-full h-full flex items-center justify-center">
      <ReactFlow
        fitView
        nodes={nodes}
        edges={edges}
        nodeTypes={{ custom: MatchNode, label: RoundLabel }}
      >
        <MiniMap
          nodeBorderRadius={2}
          nodeColor={(node: Node<MyNodeData>) => {
            if (node.type === "custom") return "#0041d0";
            if (node.type === "label") return "#ff0072";
            return "#fff";
          }}
          nodeStrokeColor={(node: Node<MyNodeData>) => {
            if (node.type === "custom") return "#0041d0";
            if (node.type === "label") return "#ff0072";
            return "#eee";
          }}
        />
        <Controls
          fitViewOptions={{ padding: 0.3 }}
          showInteractive={false}
          style={{ color: "#000" }}
        />
      </ReactFlow>
    </div>
  );
};

export default DoubleEliminationBracketFlow;
