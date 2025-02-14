import {
  Background,
  Controls,
  Edge,
  Handle,
  MiniMap,
  Node,
  Position,
  ReactFlow,
  XYPosition,
} from "@xyflow/react";
import React, { useState } from "react";

// -----------------------
// Type Definitions
// -----------------------

interface CustomNodeData extends Record<string, unknown> {
  teams: (string | null)[];
  winner: string | null;
  round: string;
  matchIndex: number;
  onTeamClick: (teamIndex: number) => void;
}

interface Match {
  id: string;
  round: string;
  teams: (string | null)[];
  matchIndex: number;
  winner?: string | null;
}

interface ConnectionData {
  source: string;
  target: string;
  animated?: boolean;
}

interface GroupSetting {
  top: number;
  height: number;
}

interface NextMapping {
  nextRound: string;
  appendIndex: boolean;
}

// -----------------------
// Custom Node Component
// -----------------------

export const MatchNode: React.FC<{ data: CustomNodeData }> = ({ data }) => {
  const { teams, winner, onTeamClick } = data;
  return (
    <div
      className="border text-black rounded p-2 cursor-pointer bg-white shadow-sm hover:shadow-md transition-shadow"
      style={{ width: 150 }}
    >
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
      {teams.map((team, index) => (
        <div
          key={index}
          className={`p-1 ${
            winner === team ? "font-bold text-green-600" : ""
          } ${!team ? "text-gray-400" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onTeamClick(index);
          }}
        >
          {team || "TBD"}
        </div>
      ))}
    </div>
  );
};

const nodeTypes = { matchNode: MatchNode };

// -----------------------
// Data and Mappings
// -----------------------

// Sample matches data for a 16-team bracket.
// In some matches a "BYE" represents a walkover.
const matchesData: Match[] = [
  // Winners Bracket – Round 1 (8 matches)
  {
    id: "winners-r1-match-0",
    round: "winners-r1",
    teams: ["T1", "T2"],
    matchIndex: 0,
  },
  {
    id: "winners-r1-match-1",
    round: "winners-r1",
    teams: ["T3", "T4"],
    matchIndex: 1,
  },
  {
    id: "winners-r1-match-2",
    round: "winners-r1",
    teams: ["T5", "BYE"],
    matchIndex: 2,
  },
  {
    id: "winners-r1-match-3",
    round: "winners-r1",
    teams: ["T7", "T8"],
    matchIndex: 3,
  },
  {
    id: "winners-r1-match-4",
    round: "winners-r1",
    teams: ["T9", "T10"],
    matchIndex: 4,
  },
  {
    id: "winners-r1-match-5",
    round: "winners-r1",
    teams: ["T11", "T12"],
    matchIndex: 5,
  },
  {
    id: "winners-r1-match-6",
    round: "winners-r1",
    teams: ["T13", "T14"],
    matchIndex: 6,
  },
  {
    id: "winners-r1-match-7",
    round: "winners-r1",
    teams: ["T15", "T16"],
    matchIndex: 7,
  },

  // Winners Bracket – Round 2 (4 matches)
  {
    id: "winners-r2-match-0",
    round: "winners-r2",
    teams: [null, null],
    matchIndex: 0,
  },
  {
    id: "winners-r2-match-1",
    round: "winners-r2",
    teams: [null, null],
    matchIndex: 1,
  },
  {
    id: "winners-r2-match-2",
    round: "winners-r2",
    teams: [null, null],
    matchIndex: 2,
  },
  {
    id: "winners-r2-match-3",
    round: "winners-r2",
    teams: [null, null],
    matchIndex: 3,
  },

  // Winners Bracket – Semifinals (2 matches)
  {
    id: "winners-semis-match-0",
    round: "winners-semis",
    teams: [null, null],
    matchIndex: 0,
  },
  {
    id: "winners-semis-match-1",
    round: "winners-semis",
    teams: [null, null],
    matchIndex: 1,
  },

  // Winners Bracket – Finals (1 match)
  {
    id: "winners-finals-match",
    round: "winners-finals",
    teams: [null, null],
    matchIndex: 0,
  },

  // Losers Bracket – Round 1 (4 matches)
  {
    id: "losers-r1-match-0",
    round: "losers-r1",
    teams: [null, null],
    matchIndex: 0,
  },
  {
    id: "losers-r1-match-1",
    round: "losers-r1",
    teams: [null, null],
    matchIndex: 1,
  },
  {
    id: "losers-r1-match-2",
    round: "losers-r1",
    teams: [null, null],
    matchIndex: 2,
  },
  {
    id: "losers-r1-match-3",
    round: "losers-r1",
    teams: [null, null],
    matchIndex: 3,
  },

  // Losers Bracket – Round 2 (4 matches)
  {
    id: "losers-r2-match-0",
    round: "losers-r2",
    teams: [null, null],
    matchIndex: 0,
  },
  {
    id: "losers-r2-match-1",
    round: "losers-r2",
    teams: [null, null],
    matchIndex: 1,
  },
  {
    id: "losers-r2-match-2",
    round: "losers-r2",
    teams: [null, null],
    matchIndex: 2,
  },
  {
    id: "losers-r2-match-3",
    round: "losers-r2",
    teams: [null, null],
    matchIndex: 3,
  },

  // Losers Bracket – Round 3 (2 matches)
  {
    id: "losers-r3-match-0",
    round: "losers-r3",
    teams: [null, null],
    matchIndex: 0,
  },
  {
    id: "losers-r3-match-1",
    round: "losers-r3",
    teams: [null, null],
    matchIndex: 1,
  },

  // Losers Bracket – Semifinals (1 match)
  {
    id: "losers-semis-match",
    round: "losers-semis",
    teams: [null, null],
    matchIndex: 0,
  },

  // Losers Bracket – Finals (1 match)
  {
    id: "losers-finals-match",
    round: "losers-finals",
    teams: [null, null],
    matchIndex: 0,
  },

  // Grand Finals (1 match)
  {
    id: "grand-finals-match",
    round: "grand-finals",
    teams: [null, null],
    matchIndex: 0,
  },
];

// Map each round to a column index for horizontal positioning.
const unifiedMapping: { [round: string]: number } = {
  "winners-r1": 0,
  "winners-r2": 1,
  "winners-semis": 2,
  "winners-finals": 3,
  "losers-r1": 0,
  "losers-r2": 1,
  "losers-r3": 2,
  "losers-semis": 3,
  "losers-finals": 4,
  "grand-finals": 5,
};

// Define vertical group settings (adjusted for increased y spacing).
const groupSettings: { [group: string]: GroupSetting } = {
  winners: { top: 50, height: 800 },
  losers: { top: 900, height: 800 },
  "grand-finals": { top: 400, height: 800 },
};

const getGroup = (round: string): string => {
  if (round.startsWith("winners")) return "winners";
  if (round.startsWith("losers")) return "losers";
  if (round === "grand-finals") return "grand-finals";
  return "winners";
};

// Helper: if one team is "BYE", auto-assign the other team as the winner.
const autoAssignWinner = (teams: (string | null)[]): string | null => {
  if (teams[0] === "BYE" && teams[1] && teams[1] !== "BYE") return teams[1]!;
  if (teams[1] === "BYE" && teams[0] && teams[0] !== "BYE") return teams[0]!;
  return null;
};

// -----------------------
// Main Component
// -----------------------

const TournamentBracketFlow: React.FC = () => {
  const horizontalSpacing = 300;

  // Count matches per round for vertical spacing.
  const roundMatchCounts: { [round: string]: number } = matchesData.reduce(
    (acc, match) => {
      acc[match.round] = (acc[match.round] || 0) + 1;
      return acc;
    },
    {} as { [round: string]: number }
  );

  // Calculate node position based on its round and index.
  const calculatePosition = (match: Match): XYPosition => {
    const group = getGroup(match.round);
    const settings = groupSettings[group];
    const col = unifiedMapping[match.round] ?? 0;
    const x = col * horizontalSpacing;
    const totalMatches = roundMatchCounts[match.round];
    const gap = settings.height / (totalMatches + 1);
    const y = settings.top + (match.matchIndex + 1) * gap;
    return { x, y };
  };

  // ------------------------------------------------------------------
  // Declare helper functions as function declarations (hoisted)
  // ------------------------------------------------------------------

  function updateNodeData(
    nodeId: string,
    newData:
      | Partial<CustomNodeData>
      | ((prev: CustomNodeData) => Partial<CustomNodeData>)
  ): void {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedData =
            typeof newData === "function" ? newData(node.data) : newData;
          return { ...node, data: { ...node.data, ...updatedData } };
        }
        return node;
      })
    );
  }

  function handleTeamClick(nodeId: string, teamIndex: number): void {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const newWinner = node.data.teams[teamIndex];
          return { ...node, data: { ...node.data, winner: newWinner } };
        }
        return node;
      })
    );
    const clickedNode = nodes.find((node) => node.id === nodeId);
    if (!clickedNode) return;
    const { round, teams, matchIndex } = clickedNode.data;
    const newWinner = teams[teamIndex];
    if (round === "winners-r1") {
      const winnersRound2Index = Math.floor(matchIndex / 2);
      const winnersRound2Id = `winners-r2-match-${winnersRound2Index}`;
      updateNodeData(winnersRound2Id, (prev) => {
        const updatedTeams = prev.teams.map((team) =>
          team === null ? newWinner : team
        );
        return { teams: updatedTeams };
      });
      const losersRound1Id = `losers-r1-match-${winnersRound2Index}`;
      const loser = teams.find((t, idx) => idx !== teamIndex) ?? null;
      updateNodeData(losersRound1Id, { teams: [loser, null] });
    }
  }

  // ------------------------------------------------------------------
  // Generate state for nodes and edges
  // ------------------------------------------------------------------

  const [nodes, setNodes] = useState<Node<CustomNodeData>[]>(() =>
    matchesData.map((match) => {
      let winner = match.winner ?? null;
      const byeWinner = autoAssignWinner(match.teams);
      if (!winner && byeWinner) {
        winner = byeWinner;
      }
      const pos = calculatePosition(match);
      return {
        id: match.id,
        type: "matchNode",
        position: pos,
        data: {
          teams: match.teams,
          winner: winner,
          round: match.round,
          matchIndex: match.matchIndex,
          onTeamClick: (teamIndex: number) =>
            handleTeamClick(match.id, teamIndex),
        },
      };
    })
  );

  // Mapping from a round to its next round for edge generation.
  const nextMapping: { [round: string]: NextMapping } = {
    "winners-r1": { nextRound: "winners-r2", appendIndex: true },
    "winners-r2": { nextRound: "winners-semis", appendIndex: true },
    "winners-semis": { nextRound: "winners-finals", appendIndex: false },
    "winners-finals": { nextRound: "grand-finals", appendIndex: false },
    "losers-r1": { nextRound: "losers-r2", appendIndex: true },
    "losers-r2": { nextRound: "losers-r3", appendIndex: true },
    "losers-r3": { nextRound: "losers-semis", appendIndex: false },
    "losers-semis": { nextRound: "losers-finals", appendIndex: false },
    "losers-finals": { nextRound: "grand-finals", appendIndex: false },
  };

  // Generate one outgoing edge per match (if a next round exists).
  const connectionsData: ConnectionData[] = matchesData.reduce(
    (edges, match) => {
      if (nextMapping[match.round] !== undefined) {
        const mapping = nextMapping[match.round];
        const targetId = mapping.appendIndex
          ? `${mapping.nextRound}-match-${Math.floor(match.matchIndex / 2)}`
          : `${mapping.nextRound}-match`;
        edges.push({ source: match.id, target: targetId, animated: true });
      }
      return edges;
    },
    [] as ConnectionData[]
  );

  const [edges, setEdges] = useState<Edge[]>(() =>
    connectionsData.map((conn, index) => ({
      id: `edge-${index}`,
      source: conn.source,
      target: conn.target,
      animated: conn.animated || false,
      type: "step",
    }))
  );

  return (
    <div className="w-full h-full">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
        <MiniMap />
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
};

export default TournamentBracketFlow;
