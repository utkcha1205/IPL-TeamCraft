import { Player, FilterState } from "@/data/types";

/**
 * Filters players by search query and active filters (primaryRole, secondaryRole, team, season).
 * All active filters are intersected (AND logic).
 */
export function filterPlayers(
  players: Player[],
  filters: FilterState,
  searchQuery: string
): Player[] {
  return players.filter((player) => {
    // Name search: case-insensitive substring match against name and originalName
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = player.name.toLowerCase().includes(query);
      const matchesOriginal = player.originalName?.toLowerCase().includes(query) ?? false;
      if (!matchesName && !matchesOriginal) {
        return false;
      }
    }

    // Primary role filter
    if (filters.primaryRole && player.primaryRole !== filters.primaryRole) {
      return false;
    }

    // Secondary role filter
    if (filters.secondaryRole && player.secondaryRole !== filters.secondaryRole) {
      return false;
    }

    // Team filter
    if (filters.team && player.team !== filters.team) {
      return false;
    }

    // Season filter: player must have a season entry for that year
    if (filters.season) {
      const hasSeason = player.seasons.some((s) => s.year === filters.season);
      if (!hasSeason) {
        return false;
      }
    }

    return true;
  });
}
