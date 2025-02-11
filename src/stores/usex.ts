"use client";

import { createContext, ReactNode } from "react";
import { create } from "zustand";

// Define Match and Participant types (Replace this if you have your own types)
type MatchType = {
  id: string;
  state: string;
  numberOfRounds: number;
  scoreMapping: any;
  name?: string;
};

type ParticipantType = {
  id: string;
  name: string;
  score?: number;
};

type MatchOnHover = {
  match: MatchType;
  team1: ParticipantType;
  team2: ParticipantType;
  position: [number, number];
} | null;

type TournamentLobbyStoreType = {
  matchOnHover: MatchOnHover;
  setMatchOnHover: (matchOnHover: MatchOnHover) => void;
};

// Zustand Store
export const useTournamentLobbyStore = create<TournamentLobbyStoreType>(
  (set) => ({
    matchOnHover: null,
    setMatchOnHover: (matchOnHover) => set({ matchOnHover }),
  })
);

// Context Provider (Optional, if needed in the future)
const TournamentLobbyContext = createContext<TournamentLobbyStoreType | null>(
  null
);

export const TournamentLobbyProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <TournamentLobbyContext.Provider value={useTournamentLobbyStore()}>
      {children}
    </TournamentLobbyContext.Provider>
  );
};
