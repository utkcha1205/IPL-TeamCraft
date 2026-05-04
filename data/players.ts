import type { Player } from "./types";
import playersData from "./players.json";

const players: Player[] = playersData as Player[];

export function getAllPlayers(): Player[] {
  return players;
}

export function getPlayerById(id: string): Player | undefined {
  return players.find((player) => player.id === id);
}
