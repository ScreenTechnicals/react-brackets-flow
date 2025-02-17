"use client";

import type { Edge, Node } from "@xyflow/react";
import { Controls, MiniMap, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React from "react";
import Match from "./match";

// ----------------------------------------------------------------
// Define Types
// ----------------------------------------------------------------

export interface Party {
  name?: string;
  id: string;
  resultText?: string;
}

export interface MatchType {
  id: string;
  name: string;
  topParty: Party | null;
  numberOfRounds?: number;
  bottomParty: Party | null;
  scoreMapping?: any;
  state: any;
}

// Extend MatchNodeData so it satisfies Record<string, unknown>
interface MatchNodeData extends Record<string, unknown> {
  match: MatchType;
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

export interface BracketFlowProps {
  // For single elimination, you pass an array of matches.
  // For double elimination, you pass an object with upper and lower arrays.
  matches: MatchType[] | { upper: MatchType[]; lower: MatchType[] };
}

// ----------------------------------------------------------------
// Round Label Node Component with Custom CSS
// ----------------------------------------------------------------

const RoundLabel = ({ data }: { data: RoundLabelData }) => {
  return (
    <div className="p-2 font-bold text-white">{data.label || "Round"}</div>
  );
};

// ----------------------------------------------------------------
// Helper Functions (Same as Single Elimination)
// ----------------------------------------------------------------

const generateRounds = (matchesArr: MatchType[]): MatchType[][] => {
  const totalMatches = matchesArr.length;
  const totalTeams = totalMatches + 1;
  const roundsCount = Math.log2(totalTeams);

  if (!Number.isInteger(roundsCount)) {
    console.warn("Bracket is not a complete single-elimination bracket.");
    return [matchesArr];
  }

  const rounds: MatchType[][] = [];
  let index = 0;
  for (let round = 0; round < roundsCount; round++) {
    const matchesInRound = totalTeams / Math.pow(2, round + 1);
    rounds.push(matchesArr.slice(index, index + matchesInRound));
    index += matchesInRound;
  }

  return rounds;
};

const labelY = 50; // fixed y coordinate for round labels (top row)
const offsetForMatchNodes = 150; // vertical gap between round labels and match nodes
const xSpacing = 400; // horizontal space between rounds
const ySpacing = 200; // vertical space between match nodes

const computeBaseY = (rounds: MatchType[][]): number => {
  const maxMatches = Math.max(...rounds.map((round) => round.length));
  return labelY + offsetForMatchNodes + ((maxMatches - 1) * ySpacing) / 2;
};

const generateMatchNodes = (
  rounds: MatchType[][],
  baseY: number
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
          y: roundYOffset + matchIndex * ySpacing,
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

const generateRoundLabelNodes = (
  rounds: MatchType[][]
): Node<RoundLabelData>[] => {
  return rounds.map((_, roundIndex) => ({
    id: `round-label-${roundIndex}`,
    type: "label",
    position: {
      x: 100 + roundIndex * xSpacing,
      y: labelY,
    },
    data: {
      label:
        roundIndex === rounds.length - 1 ? "Final" : `Round ${roundIndex + 1}`,
    },
  }));
};

const generateEdges = (rounds: MatchType[][]): Edge[] => {
  const edges: Edge[] = [];

  rounds.forEach((round, roundIndex) => {
    if (roundIndex === 0) return; // No incoming edges for the first round.

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
// Main Component: DoubleEliminationBracketFlow
// ----------------------------------------------------------------

const DoubleEliminationBracketFlow: React.FC<BracketFlowProps> = ({
  matches,
}) => {
  // Check if we received double elimination data
  const isDoubleElimination =
    typeof matches === "object" && "upper" in matches && "lower" in matches;

  // If not, fall back to single elimination view.
  if (!isDoubleElimination) {
    return <SingleEliminationBracketFlow matches={matches} />;
  }

  // Destructure upper and lower matches
  const { upper, lower } = matches as {
    upper: MatchType[];
    lower: MatchType[];
  };

  // ---------------------------
  // Upper Bracket
  // ---------------------------
  const upperRounds = generateRounds(upper);
  const upperBaseY = computeBaseY(upperRounds);
  const upperMatchNodes = generateMatchNodes(upperRounds, upperBaseY);
  const upperLabelNodes = generateRoundLabelNodes(upperRounds);
  const upperEdges = generateEdges(upperRounds);

  // Determine the bottom-most y position in the upper bracket to offset the lower bracket
  const upperNodesCombined = [...upperMatchNodes, ...upperLabelNodes];
  const upperMaxY = Math.max(
    ...upperNodesCombined.map((node) => node.position.y)
  );

  // ---------------------------
  // Lower Bracket
  // ---------------------------
  const lowerRounds = generateRounds(lower);
  const lowerBaseY = computeBaseY(lowerRounds);
  const lowerMatchNodesUnshifted = generateMatchNodes(lowerRounds, lowerBaseY);
  const lowerLabelNodesUnshifted = generateRoundLabelNodes(lowerRounds);
  const lowerEdges = generateEdges(lowerRounds);

  // Apply vertical offset to lower bracket nodes to place them below the upper bracket.
  const lowerYOffset = upperMaxY + 200; // adjust this value for spacing between brackets

  const lowerMatchNodes = lowerMatchNodesUnshifted.map((node) => ({
    ...node,
    position: { ...node.position, y: node.position.y + lowerYOffset },
  }));
  const lowerLabelNodes = lowerLabelNodesUnshifted.map((node) => ({
    ...node,
    position: { ...node.position, y: node.position.y + lowerYOffset },
  }));

  // ---------------------------
  // Optionally, add overall bracket labels (Upper/Lower)
  // ---------------------------
  const overallUpperLabel: Node<RoundLabelData> = {
    id: "overall-upper-label",
    type: "label",
    position: { x: 20, y: 10 },
    data: { label: "Upper Bracket" },
  };

  const overallLowerLabel: Node<RoundLabelData> = {
    id: "overall-lower-label",
    type: "label",
    position: { x: 20, y: lowerYOffset - 40 },
    data: { label: "Lower Bracket" },
  };

  // ---------------------------
  // Combine Nodes & Edges
  // ---------------------------
  const nodes: Node<MyNodeData>[] = [
    ...upperMatchNodes,
    ...upperLabelNodes,
    ...lowerMatchNodes,
    ...lowerLabelNodes,
    overallUpperLabel,
    overallLowerLabel,
  ];
  const edges: Edge[] = [...upperEdges, ...lowerEdges];

  return (
    <div className="flex justify-center items-center w-full h-full">
      <ReactFlow
        fitView
        nodes={nodes}
        edges={edges}
        nodeTypes={{ custom: Match, label: RoundLabel }}
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
          fitViewOptions={{
            padding: 0.3,
          }}
          showInteractive={false}
          style={{ color: "#000" }}
        />
      </ReactFlow>
    </div>
  );
};

// ----------------------------------------------------------------
// Fallback Single Elimination Component (Existing Code)
// ----------------------------------------------------------------

const SingleEliminationBracketFlow: React.FC<{ matches: MatchType[] }> = ({
  matches,
}) => {
  const rounds = generateRounds(matches);
  const baseY = computeBaseY(rounds);

  const matchNodes = generateMatchNodes(rounds, baseY);
  const roundLabelNodes = generateRoundLabelNodes(rounds);
  const nodes: Node<MyNodeData>[] = [...matchNodes, ...roundLabelNodes];
  const edges = generateEdges(rounds);

  return (
    <div className="flex justify-center items-center w-full h-full">
      <ReactFlow
        fitView
        nodes={nodes}
        edges={edges}
        nodeTypes={{ custom: Match, label: RoundLabel }}
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
          fitViewOptions={{
            padding: 0.3,
          }}
          showInteractive={false}
          style={{ color: "#000" }}
        />
      </ReactFlow>
    </div>
  );
};

// ----------------------------------------------------------------
// Export Main Component
// ----------------------------------------------------------------

export default DoubleEliminationBracketFlow;
