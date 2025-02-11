"use client";

import { Match } from "@/components";
import SingleEliminationBracketFlow from "@/components/single-elemination.component";
import "@xyflow/react/dist/style.css";
import Link from "next/link";
import { useState } from "react";
import { twJoin } from "tailwind-merge";

const mockMatches: Match[] = [
  // First round matches (6 matches with defined teams)
  {
    id: "m1",
    name: "Match 1",
    topParty: { name: "Team A" },
    numberOfRounds: 3,
    bottomParty: { name: "Team B" },
  },
  {
    id: "m2",
    name: "Match 2",
    topParty: { name: "Team C" },
    numberOfRounds: 3,
    bottomParty: { name: "Team D" },
  },
  {
    id: "m3",
    name: "Match 3",
    topParty: { name: "Team E" },
    numberOfRounds: 3,
    bottomParty: { name: "Team F" },
  },
  {
    id: "m4",
    name: "Match 4",
    topParty: { name: "Team G" },
    numberOfRounds: 3,
    bottomParty: { name: "Team H" },
  },
  {
    id: "m5",
    name: "Match 5",
    topParty: { name: "Team I" },
    numberOfRounds: 3,
    bottomParty: { name: "Team J" },
  },
  {
    id: "m6",
    name: "Match 6",
    topParty: { name: "Team K" },
    numberOfRounds: 3,
    bottomParty: { name: "Team L" },
  },
  // Additional first round matches (6 more matches)
  {
    id: "m7",
    name: "Match 7",
    topParty: { name: "Team M" },
    numberOfRounds: 3,
    bottomParty: { name: "Team N" },
  },
  {
    id: "m8",
    name: "Match 8",
    topParty: { name: "Team O" },
    numberOfRounds: 3,
    bottomParty: { name: "Team P" },
  },
  {
    id: "m9",
    name: "Match 9",
    topParty: { name: "Team Q" },
    numberOfRounds: 3,
    bottomParty: { name: "Team R" },
  },
  {
    id: "m10",
    name: "Match 10",
    topParty: { name: "Team S" },
    numberOfRounds: 3,
    bottomParty: { name: "Team T" },
  },
  {
    id: "m11",
    name: "Match 11",
    topParty: { name: "Team U" },
    numberOfRounds: 3,
    bottomParty: { name: "Team V" },
  },
  {
    id: "m12",
    name: "Match 12",
    topParty: { name: "Team W" },
    numberOfRounds: 3,
    bottomParty: { name: "Team X" },
  },
  // Later rounds (Quarterfinals, Semifinals, and Final)
  {
    id: "m13",
    name: "Quarterfinal 1",
    topParty: null,
    numberOfRounds: 3,
    bottomParty: null,
  },
  {
    id: "m14",
    name: "Quarterfinal 2",
    topParty: null,
    numberOfRounds: 3,
    bottomParty: null,
  },
  {
    id: "m15",
    name: "Quarterfinal 3",
    topParty: null,
    numberOfRounds: 3,
    bottomParty: null,
  },
  {
    id: "m16",
    name: "Quarterfinal 4",
    topParty: null,
    numberOfRounds: 3,
    bottomParty: null,
  },
  {
    id: "m17",
    name: "Semifinal 1",
    topParty: null,
    numberOfRounds: 3,
    bottomParty: null,
  },
  {
    id: "m18",
    name: "Semifinal 2",
    topParty: null,
    numberOfRounds: 3,
    bottomParty: null,
  },
  {
    id: "m19",
    name: "Final",
    topParty: null,
    numberOfRounds: 3,
    bottomParty: null,
  },
  // Additional matches (Third Place Playoff and Consolation Matches)
  {
    id: "m20",
    name: "Third Place Playoff",
    topParty: null,
    numberOfRounds: 3,
    bottomParty: null,
  },
  {
    id: "m21",
    name: "Consolation Match 1",
    topParty: null,
    numberOfRounds: 3,
    bottomParty: null,
  },
  {
    id: "m22",
    name: "Consolation Match 2",
    topParty: null,
    numberOfRounds: 3,
    bottomParty: null,
  },
];

const Page = () => {
  const [isSingleElemination, setIsSingleElemination] = useState(true);

  return (
    <div className="w-full bg-gray-900 h-screen">
      <div className="flex items-center w-full justify-between">
        <p className="p-3">
          Powered by{" "}
          <Link
            className="underline text-pink-600"
            href="https://reactflow.dev"
            target="_blank"
          >
            React Flow
          </Link>
        </p>
        <div>
          <button
            onClick={() => setIsSingleElemination(true)}
            className={twJoin(
              "transition-all duration-300 ease-in-out px-5 py-3 rounded-l-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400",
              isSingleElemination
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-white text-blue-500 border border-blue-500 hover:bg-blue-50"
            )}
          >
            Single Elimination
          </button>
          <button
            onClick={() => setIsSingleElemination(false)}
            className={twJoin(
              "transition-all duration-300 ease-in-out px-5 py-3 rounded-r-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400",
              !isSingleElemination
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-white text-blue-500 border border-blue-500 hover:bg-blue-50"
            )}
          >
            Double Elimination
          </button>
        </div>
        <p className="p-3">
          Contribute On{" "}
          <Link
            className="underline text-white"
            href="https://github.com/ScreenTechnicals"
            target="_blank"
          >
            Github
          </Link>
        </p>
      </div>
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-[80%] h-[60dvh] bg-black shadow-black/40 shadow-md">
          {isSingleElemination ? (
            <SingleEliminationBracketFlow matches={mockMatches} />
          ) : (
            "Double Elimination"
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
