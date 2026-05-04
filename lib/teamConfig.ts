/**
 * IPL team brand colors and logo configuration.
 * Player avatars use ui-avatars.com with team-colored backgrounds.
 * Team logos use SVG data URIs as placeholders — swap with real assets in /public/teams/ when available.
 */

export interface TeamConfig {
  color: string;       // Primary brand hex color
  textColor: string;   // Text color for contrast on the brand color
  shortName: string;   // 2-3 letter abbreviation
}

const TEAM_MAP: Record<string, TeamConfig> = {
  "Chennai Super Kings":        { color: "#FFCB05", textColor: "#0D47A1", shortName: "CSK" },
  "Mumbai Indians":             { color: "#004BA0", textColor: "#FFFFFF", shortName: "MI" },
  "Royal Challengers Bengaluru":{ color: "#D4213D", textColor: "#FFFFFF", shortName: "RCB" },
  "Kolkata Knight Riders":      { color: "#3A225D", textColor: "#FFD700", shortName: "KKR" },
  "Delhi Capitals":             { color: "#004C93", textColor: "#FFFFFF", shortName: "DC" },
  "Rajasthan Royals":           { color: "#EA1A85", textColor: "#FFFFFF", shortName: "RR" },
  "Punjab Kings":               { color: "#ED1B24", textColor: "#FFFFFF", shortName: "PBKS" },
  "Sunrisers Hyderabad":        { color: "#FF822A", textColor: "#000000", shortName: "SRH" },
  "Gujarat Titans":             { color: "#1C1C2B", textColor: "#B8860B", shortName: "GT" },
  "Lucknow Super Giants":       { color: "#A72056", textColor: "#FFFFFF", shortName: "LSG" },
};

const DEFAULT_CONFIG: TeamConfig = { color: "#6b7280", textColor: "#FFFFFF", shortName: "?" };

export function getTeamConfig(teamName: string): TeamConfig {
  return TEAM_MAP[teamName] ?? DEFAULT_CONFIG;
}

/** Get all known team names */
export function getAllTeamNames(): string[] {
  return Object.keys(TEAM_MAP);
}

/**
 * Generate a player avatar URL using ui-avatars.com.
 * Returns a URL that renders the player's initials on a team-colored circle.
 * Replace with real player image paths (e.g. `/players/${id}.png`) when available.
 */
export function getPlayerImageUrl(playerName: string, teamName: string): string {
  const config = getTeamConfig(teamName);
  const bg = config.color.replace("#", "");
  const fg = config.textColor.replace("#", "");
  const encoded = encodeURIComponent(playerName);
  return `https://ui-avatars.com/api/?name=${encoded}&background=${bg}&color=${fg}&size=128&bold=true&format=svg`;
}

/**
 * Generate a team logo as an SVG data URI showing the team's short name.
 * Replace with real logo paths (e.g. `/teams/${shortName}.png`) when available.
 */
export function getTeamLogoUrl(teamName: string): string {
  const config = getTeamConfig(teamName);
  const bg = config.color;
  const fg = config.textColor;
  const text = config.shortName;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <rect width="48" height="48" rx="8" fill="${bg}"/>
    <text x="24" y="25" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="${text.length > 3 ? 10 : 12}" font-weight="700" fill="${fg}">${text}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
