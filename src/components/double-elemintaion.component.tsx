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
  // The matches are provided as two flat arrays:
  // - upper: winners bracket matches
  // - lower: losers bracket matches
  matches: {
    upper: Match[];
    lower: Match[];
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
// Helper: Split a flat matches array into rounds based on expected sizes
// ----------------------------------------------------------------

const splitMatchesIntoRounds = (
  matches: Match[],
  roundSizes: number[]
): Match[][] => {
  const rounds: Match[][] = [];
  let start = 0;
  for (const size of roundSizes) {
    rounds.push(matches.slice(start, start + size));
    start += size;
  }
  return rounds;
};

// ----------------------------------------------------------------
// Layout Configuration
// ----------------------------------------------------------------

const labelY = 50; // fixed y coordinate for the round labels (common for both brackets)
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
// An optional verticalOffset parameter lets us position the lower bracket further down.
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
// Only one set of round labels is generated (without a vertical offset).
const generateRoundLabelNodes = (
  rounds: Match[][],
  verticalOffset: number = 0
): Node<RoundLabelData>[] => {
  const labelNodes: Node<RoundLabelData>[] = [];
  rounds.forEach((_, roundIndex) => {
    const label =
      roundIndex === rounds.length - 1 ? "Final" : `Round ${roundIndex + 1}`;
    labelNodes.push({
      id: `round-label-${roundIndex}`,
      type: "label",
      position: {
        x: 100 + roundIndex * xSpacing,
        y: labelY + verticalOffset,
      },
      style: { zIndex: 999 },
      data: { label },
    });
  });
  return labelNodes;
};

// ----------------------------------------------------------------
// Generate Edges for ReactFlow (within a bracket)
// ----------------------------------------------------------------
// This helper assumes that each round (after the first) has half as many matches as the previous round.
const generateEdges = (
  rounds: Match[][],
  verticalOffset: number = 0
): Edge[] => {
  const edges: Edge[] = [];
  rounds.forEach((round, roundIndex) => {
    if (roundIndex === 0) return; // first round has no incoming edges
    round.forEach((match, matchIndex) => {
      const prevRound = rounds[roundIndex - 1];
      if (!prevRound) return;
      const topSource = prevRound[matchIndex * 2]?.id;
      const bottomSource = prevRound[matchIndex * 2 + 1]?.id;
      if (topSource) {
        edges.push({
          id: `${topSource}-${match.id}`,
          source: topSource,
          target: match.id,
          type: "smoothstep",
        });
      }
      if (bottomSource) {
        edges.push({
          id: `${bottomSource}-${match.id}`,
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
// Main Component: Double Elimination Bracket Flow
// ----------------------------------------------------------------

const DoubleEliminationBracketFlow: React.FC<
  DoubleEliminationBracketFlowProps
> = ({ matches }) => {
  // For an 8-player tournament, define the expected round sizes.
  // — Upper (winners) bracket sizes: 4 matches in R1, 2 in R2, 1 in winners final.
  const winnersRoundSizes = [4, 2, 1];
  // — Lower (losers) bracket sizes: 2 matches in R1, 1 in losers final.
  const losersRoundSizes = [2, 1];

  const winnersRounds = splitMatchesIntoRounds(
    matches.upper,
    winnersRoundSizes
  );
  const losersRounds = splitMatchesIntoRounds(matches.lower, losersRoundSizes);

  const winnersBaseY = computeBaseY(winnersRounds);
  const losersBaseY = computeBaseY(losersRounds);
  // Offset for positioning the lower bracket further down.
  const lowerBracketOffset = 600;

  const upperMatchNodes = generateMatchNodes(winnersRounds, winnersBaseY);
  const lowerMatchNodes = generateMatchNodes(
    losersRounds,
    losersBaseY,
    lowerBracketOffset
  );

  // Generate a single row of round labels (based on winnersRounds).
  const roundLabelNodes = generateRoundLabelNodes(winnersRounds);

  const upperEdges = generateEdges(winnersRounds);
  const lowerEdges = generateEdges(losersRounds, lowerBracketOffset);

  // --- Create the Grand Final Node ---
  // We assume the grand final node is not part of the input and is placed to the right of both brackets.
  const winnersFinalMatch = winnersRounds[winnersRounds.length - 1][0];
  const losersFinalMatch = losersRounds[losersRounds.length - 1][0];

  const winnersFinalX = 100 + (winnersRounds.length - 1) * xSpacing;
  const winnersFinalY =
    winnersBaseY -
    ((winnersRounds[winnersRounds.length - 1].length - 1) * ySpacing) / 2;
  const losersFinalX = 100 + (losersRounds.length - 1) * xSpacing;
  const losersFinalY =
    losersBaseY -
    ((losersRounds[losersRounds.length - 1].length - 1) * ySpacing) / 2 +
    lowerBracketOffset;

  // Position the Grand Final node to the right of both finals.
  const grandFinalX = Math.max(winnersFinalX, losersFinalX) + xSpacing;
  const grandFinalY = (winnersFinalY + losersFinalY) / 2;

  const grandFinalMatch: Match = {
    id: "grand-final",
    name: "Grand Final",
    numberOfRounds: 1,
    topParty: null,
    bottomParty: null,
  };

  const grandFinalNode: Node<MatchNodeData> = {
    id: grandFinalMatch.id,
    type: "custom",
    position: { x: grandFinalX, y: grandFinalY },
    data: {
      match: grandFinalMatch,
      topParty: { name: "Winner (Upper Bracket)" },
      bottomParty: { name: "Winner (Lower Bracket)" },
    },
  };

  // Create edges from the winners final and losers final to the grand final.
  const extraEdges: Edge[] = [
    {
      id: `edge-${winnersFinalMatch.id}-grand-final`,
      source: winnersFinalMatch.id,
      target: grandFinalMatch.id,
      type: "smoothstep",
    },
    {
      id: `edge-${losersFinalMatch.id}-grand-final`,
      source: losersFinalMatch.id,
      target: grandFinalMatch.id,
      type: "smoothstep",
    },
  ];

  const nodes: Node<MyNodeData>[] = [
    ...upperMatchNodes,
    ...lowerMatchNodes,
    ...roundLabelNodes, // Only one row of round labels is rendered
    grandFinalNode,
  ];
  const edges: Edge[] = [...upperEdges, ...lowerEdges, ...extraEdges];

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
