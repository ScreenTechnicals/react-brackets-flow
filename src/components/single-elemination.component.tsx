"use client";

import type { Edge, Node } from "@xyflow/react";
import { Controls, MiniMap, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React from "react";
import MatchNode from "./match";

// ----------------------------------------------------------------
// Define Types
// ----------------------------------------------------------------

export interface Party {
  name?: string;
  id?: string;
  resultText?: string;
}

export interface MatchType {
  id: string;
  name: string;
  topParty: Party | null;
  numberOfRounds?: number;
  bottomParty: Party | null;
  scoreMapping?: any;
  state?: any;
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

interface BracketFlowProps {
  matches: MatchType[];
}

// ----------------------------------------------------------------
// Round Label Node Component with Custom CSS
// ----------------------------------------------------------------

const RoundLabel = ({ data }: { data: RoundLabelData }) => {
  return (
    <div className="p-2 font-bold text-white bg-blue-500 rounded shadow">
      {data.label}
    </div>
  );
};

// ----------------------------------------------------------------
// Dynamically Generate Rounds from the Flat Matches Array
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

// ----------------------------------------------------------------
// Layout Configuration
// ----------------------------------------------------------------

const labelY = 50; // fixed y coordinate for round labels (top row)
const offsetForMatchNodes = 150; // vertical gap between round labels and match nodes
const xSpacing = 400; // horizontal space between rounds
const ySpacing = 200; // vertical space between match nodes

// Compute a dynamic baseY for match nodes based on the maximum number of matches in any round.
const computeBaseY = (rounds: MatchType[][]): number => {
  const maxMatches = Math.max(...rounds.map((round) => round.length));
  return labelY + offsetForMatchNodes + ((maxMatches - 1) * ySpacing) / 2;
};

// ----------------------------------------------------------------
// Generate Nodes for ReactFlow (Match Nodes)
// ----------------------------------------------------------------

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

// ----------------------------------------------------------------
// Generate Nodes for ReactFlow (Round Label Nodes)
// ----------------------------------------------------------------

const generateRoundLabelNodes = (
  rounds: MatchType[][]
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
    <div className="flex justify-center items-center w-full h-full">
      <ReactFlow
        fitView
        edges={edges}
        nodeTypes={{ custom: MatchNode, label: RoundLabel }}
        nodes={nodes}
      >
        {/* <Background /> */}
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

export default SingleEliminationBracketFlow;
