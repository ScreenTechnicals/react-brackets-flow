"use client";
import MatchNode from "@/components/match";
import type { Edge, Node } from "@xyflow/react";
import { Controls, MiniMap, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React from "react";

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

interface BracketFlowProps {
  matches: Match[];
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
// Dynamically Generate Rounds from the Flat Matches Array
// ----------------------------------------------------------------

const generateRounds = (matchesArr: Match[]): Match[][] => {
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
  let remaining = [...laterMatches];

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

const generateMatchNodes = (
  rounds: Match[][],
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

// ----------------------------------------------------------------
// Generate Nodes for ReactFlow (Round Label Nodes)
// ----------------------------------------------------------------

const generateRoundLabelNodes = (rounds: Match[][]): Node<RoundLabelData>[] => {
  const labelNodes: Node<RoundLabelData>[] = [];

  rounds.forEach((_, roundIndex) => {
    const label =
      roundIndex === rounds.length - 1 ? "Final" : `Round ${roundIndex + 1}`;
    labelNodes.push({
      id: `round-label-${roundIndex}`,
      type: "label",
      position: {
        x: 100 + roundIndex * xSpacing,
        y: labelY, // fixed top-row y position
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

const generateEdges = (rounds: Match[][]): Edge[] => {
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
// Main Component
// ----------------------------------------------------------------

const SingleEliminationBracketFlow: React.FC<BracketFlowProps> = ({
  matches,
}) => {
  const rounds = generateRounds(matches);
  const baseY = computeBaseY(rounds);

  const matchNodes = generateMatchNodes(rounds, baseY);
  const roundLabelNodes = generateRoundLabelNodes(rounds);

  const nodes: Node<MyNodeData>[] = [...matchNodes, ...roundLabelNodes];
  const edges = generateEdges(rounds);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={{ custom: MatchNode, label: RoundLabel }}
        fitView
      >
        {/* <Background /> */}
        <MiniMap
          nodeStrokeColor={(node: Node<MyNodeData>) => {
            if (node.type === "custom") return "#0041d0";
            if (node.type === "label") return "#ff0072";
            return "#eee";
          }}
          nodeColor={(node: Node<MyNodeData>) => {
            if (node.type === "custom") return "#0041d0";
            if (node.type === "label") return "#ff0072";
            return "#fff";
          }}
          nodeBorderRadius={2}
        />
        <Controls
          showInteractive={false}
          style={{ color: "#000" }}
          fitViewOptions={{
            padding: 0.3,
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default SingleEliminationBracketFlow;
