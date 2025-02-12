"use client";
import type { Edge, Node } from "@xyflow/react";
import { Controls, MiniMap, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React from "react";
import MatchNode from "./match";
import { MatchType, Party } from "./single-elemination.component";

// ----------------------------------------------------------------
// Define Types
// ----------------------------------------------------------------

interface MatchNodeData extends Record<string, unknown> {
  match: MatchType;
  topParty: Party;
  bottomParty: Party;
}

interface RoundLabelData extends Record<string, unknown> {
  label: string;
}

type MyNodeData = MatchNodeData | RoundLabelData;

// ----------------------------------------------------------------
// Component Props
// ----------------------------------------------------------------

interface DoubleEliminationBracketFlowProps {
  matches: {
    upper: MatchType[];
    lower: MatchType[];
  };
}

// ----------------------------------------------------------------
// Round Label Node Component
// ----------------------------------------------------------------

const RoundLabel = ({ data }: { data: RoundLabelData }) => {
  return (
    <div
      style={{
        padding: 8,
        background: "#007bff",
        color: "#fff",
        fontWeight: "bold",
        borderRadius: 4,
      }}
    >
      {data.label}
    </div>
  );
};

// ----------------------------------------------------------------
// Dynamic Round Size Calculation
// ----------------------------------------------------------------
/**
 * For a knockout bracket, the number of teams equals matches.length + 1.
 * Then the number of rounds is:
 *
 *    R = ceil(log2(matches.length + 1))
 *
 * In a full bracket the rounds would be:
 *    [ firstRoundSize, 2^(R-2), 2^(R-3), …, 1 ]
 *
 * where firstRoundSize = totalMatches - (2^(R-1) - 1).
 *
 * Adjust this logic if your bracket structure differs.
 */
const getRoundSizes = (matches: MatchType[]): number[] => {
  const totalMatches = matches.length;
  const teamCount = totalMatches + 1;
  const roundsCount = Math.ceil(Math.log2(teamCount));
  let sumLaterRounds = 0;
  for (let i = 0; i < roundsCount - 1; i++) {
    sumLaterRounds += Math.pow(2, i);
  }
  const firstRoundSize = totalMatches - sumLaterRounds;
  const sizes: number[] = [firstRoundSize];
  for (let i = roundsCount - 2; i >= 0; i--) {
    sizes.push(Math.pow(2, i));
  }
  return sizes;
};

// ----------------------------------------------------------------
// Split Matches into Rounds (Using Dynamic Round Sizes)
// ----------------------------------------------------------------
const splitMatchesIntoRounds = (
  matches: MatchType[],
  roundSizes: number[]
): MatchType[][] => {
  const rounds: MatchType[][] = [];
  let start = 0;
  for (const size of roundSizes) {
    rounds.push(matches.slice(start, start + size));
    start += size;
  }
  return rounds;
};

// ----------------------------------------------------------------
// Layout Configuration Constants (Spacing Values)
// ----------------------------------------------------------------

const xSpacing = 1000; // horizontal gap between rounds (in px)
const ySpacing = 500; // vertical gap between match nodes (in px)
const offsetForMatchNodes = 600; // vertical offset below the round labels (in px)
const marginBetweenBrackets = 200; // extra space to ensure lower bracket is clearly below upper

// ----------------------------------------------------------------
// Generate Common Round Labels (One Row at the Top)
// ----------------------------------------------------------------
const generateCommonRoundLabels = (
  maxRounds: number,
  prefix: string = ""
): Node<RoundLabelData>[] => {
  const labels: Node<RoundLabelData>[] = [];
  for (let i = 0; i < maxRounds; i++) {
    const labelText =
      i === maxRounds - 1 ? `${prefix}Final` : `${prefix}Round ${i + 1}`;
    labels.push({
      id: `${prefix.toLowerCase().trim().replace(" ", "-")}-common-label-${i}`,
      type: "label",
      position: { x: 100 + i * xSpacing, y: 50 },
      style: { zIndex: 999 },
      data: { label: labelText },
    });
  }
  return labels;
};

// ----------------------------------------------------------------
// Node Generators for Match Nodes
// ----------------------------------------------------------------

/**
 * Generates match nodes for a given bracket.
 * @param rounds - the rounds split from matches.
 * @param globalCenterY - the vertical center for the bracket.
 * @param verticalOffset - additional vertical offset.
 */
const generateMatchNodes = (
  rounds: MatchType[][],
  globalCenterY: number,
  verticalOffset: number = 0
): Node<MatchNodeData>[] => {
  const nodes: Node<MatchNodeData>[] = [];
  rounds.forEach((round, roundIndex) => {
    // Center the nodes in this round around the global center.
    const roundYOffset = globalCenterY - ((round.length - 1) * ySpacing) / 2;
    round.forEach((match, matchIndex) => {
      // Use fallback parties if data is missing.
      const topParty: Party =
        match.topParty && match.topParty.name
          ? match.topParty
          : { name: "Winner of previous match", id: `default-top-${match.id}` };
      const bottomParty: Party =
        match.bottomParty && match.bottomParty.name
          ? match.bottomParty
          : {
              name: "Winner of previous match",
              id: `default-bottom-${match.id}`,
            };
      nodes.push({
        id: match.id,
        type: "custom",
        position: {
          x: 100 + roundIndex * xSpacing, // all nodes in a round share the same x
          y: roundYOffset + matchIndex * ySpacing + verticalOffset,
        },
        data: { match, topParty, bottomParty },
      });
    });
  });
  return nodes;
};

// ----------------------------------------------------------------
// Edge Generator (Using Dynamic Ratio Approach)
// ----------------------------------------------------------------

const generateEdges = (rounds: MatchType[][]): Edge[] => {
  const edges: Edge[] = [];
  rounds.forEach((round, roundIndex) => {
    if (roundIndex === 0) return; // no incoming edges for the first round
    const prevRound = rounds[roundIndex - 1];
    round.forEach((match, matchIndex) => {
      // Compute a ratio to map indices from previous round to current.
      const ratio = prevRound.length / round.length;
      const topIndex = Math.floor(matchIndex * ratio);
      const bottomIndex = Math.min(
        Math.floor((matchIndex + 1) * ratio),
        prevRound.length - 1
      );
      if (prevRound[topIndex]) {
        edges.push({
          id: `${prevRound[topIndex].id}-${match.id}`,
          source: prevRound[topIndex].id,
          target: match.id,
          type: "smoothstep",
        });
      }
      if (prevRound[bottomIndex] && bottomIndex !== topIndex) {
        edges.push({
          id: `${prevRound[bottomIndex].id}-${match.id}`,
          source: prevRound[bottomIndex].id,
          target: match.id,
          type: "smoothstep",
        });
      }
    });
  });
  return edges;
};

// ----------------------------------------------------------------
// Ensure Unique Positions (Bump by 300px if too close)
// ----------------------------------------------------------------

const ensureUniquePositions = (
  nodes: Node<MyNodeData>[]
): Node<MyNodeData>[] => {
  const placedPositions: { x: number; y: number }[] = [];
  const threshold = 300; // if nodes are within 300px, consider them overlapping
  const bumpOffset = 300; // bump overlapping nodes by 300px
  nodes.forEach((node) => {
    let { x, y } = node.position;
    let collision = true;
    while (collision) {
      collision = false;
      for (const pos of placedPositions) {
        if (
          Math.abs(pos.x - x) < threshold &&
          Math.abs(pos.y - y) < threshold
        ) {
          x += bumpOffset;
          y += bumpOffset;
          collision = true;
          break;
        }
      }
    }
    placedPositions.push({ x, y });
    node.position = { x, y };
  });
  return nodes;
};

// ----------------------------------------------------------------
// Main Component: DoubleEliminationBracketFlow
// ----------------------------------------------------------------

const DoubleEliminationBracketFlow: React.FC<
  DoubleEliminationBracketFlowProps
> = ({ matches }) => {
  // Compute round sizes dynamically for each bracket.
  const winnersRoundSizes = getRoundSizes(matches.upper);
  const losersRoundSizes = getRoundSizes(matches.lower);

  // Split the matches into rounds.
  const winnersRounds = splitMatchesIntoRounds(
    matches.upper,
    winnersRoundSizes
  );
  const losersRounds = splitMatchesIntoRounds(matches.lower, losersRoundSizes);

  // Determine the maximum number of rounds (columns) between both brackets.
  const maxRounds = Math.max(winnersRounds.length, losersRounds.length);

  // Compute a global vertical center for each bracket (before offset).
  const computeGlobalCenterYForRounds = (rounds: MatchType[][]): number => {
    const maxMatches = Math.max(...rounds.map((round) => round.length));
    return 50 + offsetForMatchNodes + ((maxMatches - 1) * ySpacing) / 2;
  };
  const winnersGlobalCenterY = computeGlobalCenterYForRounds(winnersRounds);
  const losersGlobalCenterY = computeGlobalCenterYForRounds(losersRounds);

  // Generate match nodes for each bracket.
  const upperMatchNodes = generateMatchNodes(
    winnersRounds,
    winnersGlobalCenterY
  );
  // Initially, generate lower nodes with no vertical offset.
  let lowerMatchNodes = generateMatchNodes(
    losersRounds,
    losersGlobalCenterY,
    0
  );

  // ----------------------------------------------------
  // Compute a dynamic vertical offset so that all lower bracket nodes
  // appear below all upper bracket nodes.
  const margin = marginBetweenBrackets;
  const maxUpperY = Math.max(...upperMatchNodes.map((node) => node.position.y));
  const minLowerY = Math.min(...lowerMatchNodes.map((node) => node.position.y));
  const dynamicLowerOffset = maxUpperY + margin - minLowerY;
  // Adjust all lower bracket nodes.
  lowerMatchNodes = lowerMatchNodes.map((node) => ({
    ...node,
    position: { ...node.position, y: node.position.y + dynamicLowerOffset },
  }));

  // Generate one common row of round labels for all rounds.
  const commonRoundLabels = generateCommonRoundLabels(maxRounds);

  // Generate connecting edges.
  const upperEdges = generateEdges(winnersRounds);
  const lowerEdges = generateEdges(losersRounds);

  // --- Create the Grand Final Node ---
  // Assume the final match in each bracket is the first match of the last round.
  const winnersFinalMatch =
    winnersRounds.length > 0 &&
    winnersRounds[winnersRounds.length - 1].length > 0
      ? winnersRounds[winnersRounds.length - 1][0]
      : null;
  // For losers, find the corresponding node in the adjusted lowerMatchNodes.
  const losersFinalMatch =
    losersRounds.length > 0 && losersRounds[losersRounds.length - 1].length > 0
      ? lowerMatchNodes.find(
          (node) => node.id === losersRounds[losersRounds.length - 1][0].id
        )
      : null;

  const winnersFinalX = 100 + (winnersRounds.length - 1) * xSpacing;
  const winnersFinalY =
    winnersGlobalCenterY -
    ((winnersRounds[winnersRounds.length - 1].length - 1) * ySpacing) / 2;

  const losersFinalX = 100 + (losersRounds.length - 1) * xSpacing;
  const losersFinalY = losersFinalMatch ? losersFinalMatch.position.y : 0;

  // Place the Grand Final node to the right of both finals.
  const grandFinalX = Math.max(winnersFinalX, losersFinalX) + xSpacing;
  const grandFinalY = (winnersFinalY + losersFinalY) / 2;

  const grandFinalMatch: MatchType = {
    id: "grand-final",
    name: "Grand Final",
    numberOfRounds: 1,
    topParty: null,
    bottomParty: null,
    state: "SCHEDULED",
  };

  const grandFinalNode: Node<MatchNodeData> = {
    id: grandFinalMatch.id,
    type: "custom",
    position: { x: grandFinalX, y: grandFinalY },
    data: {
      match: grandFinalMatch,
      topParty: { name: "Winner (Upper Bracket)", id: "winner-upper" },
      bottomParty: { name: "Winner (Lower Bracket)", id: "winner-lower" },
    },
  };

  // Combine all nodes: upper bracket nodes, lower bracket nodes, common round labels, and the grand final.
  let nodes: Node<MyNodeData>[] = [
    ...upperMatchNodes,
    ...lowerMatchNodes,
    ...commonRoundLabels,
    grandFinalNode,
  ];

  // Build final edges.
  const finalEdges: Edge[] = [];
  if (winnersFinalMatch) {
    finalEdges.push({
      id: `${winnersFinalMatch.id}-to-grand-final`,
      source: winnersFinalMatch.id,
      target: grandFinalMatch.id,
      type: "smoothstep",
    });
  }
  if (losersFinalMatch) {
    finalEdges.push({
      id: `${losersFinalMatch.id}-to-grand-final`,
      source: losersFinalMatch.id,
      target: grandFinalMatch.id,
      type: "smoothstep",
    });
  }
  const edges: Edge[] = [...upperEdges, ...lowerEdges, ...finalEdges];

  // Ensure unique positions (bumping nodes by 300px if needed).
  nodes = ensureUniquePositions(nodes);

  return (
    <div className="w-full h-full">
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
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default DoubleEliminationBracketFlow;
