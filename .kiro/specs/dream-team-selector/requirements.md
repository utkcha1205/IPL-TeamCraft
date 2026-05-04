# Requirements Document

## Introduction

The Dream Team Selector feature allows users to pick two IPL teams and automatically generates an optimal playing XI of 11 players drawn from both squads. The selection algorithm evaluates players based on their career statistics (batting average, strike rate, wickets, economy) and actual per-opponent performance data derived from ball-by-ball match records. Rather than applying a flat head-to-head bonus, the system tracks granular batting and bowling statistics against each specific opponent team (runs scored, wickets taken, batting average, bowling economy, etc.) and uses these per-opponent metrics to compute a performance-weighted bonus. The resulting dream team respects standard cricket team composition rules, ensuring a balanced mix of batters, bowlers, all-rounders, and at least one wicket-keeper.

## Glossary

- **Dream_Team_Selector**: The page where users select two IPL teams and view the generated dream XI
- **Team_Picker**: A UI component that allows the user to select two IPL teams from the available teams in the Player_Data_Store
- **Dream_XI**: The generated playing XI of 11 players selected from the two chosen teams
- **Selection_Engine**: The algorithm that scores and ranks players from both teams to produce the Dream_XI
- **Player_Score**: A composite numeric score computed by the Selection_Engine for each player, combining batting and bowling performance metrics
- **Composition_Rule**: A constraint that defines the minimum and maximum number of players per role in the Dream_XI (e.g., minimum 1 wicket-keeper, minimum 3 batters, minimum 3 bowlers, maximum 4 all-rounders)
- **Head_To_Head_Weight**: A performance-weighted multiplier applied to a player's score based on actual batting and bowling statistics recorded against the selected opponent team in previous matches
- **Opponent_Stats**: A per-opponent statistical record tracking a player's batting performance (runs, innings, average, strike rate) and bowling performance (wickets, runs conceded, overs, economy) against a specific opponent team, aggregated from ball-by-ball match data
- **Performance_Weighted_Bonus**: A multiplier derived from comparing a player's Opponent_Stats against the selected opponent to the player's overall career averages; replaces the previous flat 1.1× head-to-head bonus
- **Import_Script**: The data import script (`scripts/import-ipl-data.ts`) that processes ball-by-ball CSV data and aggregates it into the Player_Data_Store, including per-opponent statistics
- **Player_Data_Store**: The local JSON data source containing IPL player statistics across seasons, including per-opponent performance breakdowns
- **Dream_Team_Card**: A UI component displaying a selected player within the Dream_XI, showing the player's name, role, team, key stats, and opponent-specific performance indicator

## Requirements

### Requirement 1: Team Selection Interface

**User Story:** As a fantasy cricket user, I want to select two IPL teams, so that the system can generate a dream XI from those two squads.

#### Acceptance Criteria

1. WHEN the user navigates to the Dream_Team_Selector page, THE Team_Picker SHALL display all IPL teams available in the Player_Data_Store as selectable options.
2. THE Team_Picker SHALL allow the user to select exactly two distinct IPL teams.
3. WHEN the user selects the same team for both slots, THE Team_Picker SHALL display a validation message indicating that two different teams are required.
4. WHEN the user has selected two distinct teams, THE Dream_Team_Selector SHALL enable a "Generate Dream XI" action.
5. WHEN fewer than two teams are selected, THE Dream_Team_Selector SHALL keep the "Generate Dream XI" action disabled.

### Requirement 2: Player Scoring Algorithm

**User Story:** As a fantasy cricket user, I want the dream team to be selected based on player stats and past performance, so that the XI reflects the strongest possible combination.

#### Acceptance Criteria

1. WHEN the user triggers dream team generation, THE Selection_Engine SHALL compute a Player_Score for each player belonging to the two selected teams.
2. THE Selection_Engine SHALL compute the batting component of the Player_Score using aggregate career batting average, strike rate, and total runs across all available seasons.
3. THE Selection_Engine SHALL compute the bowling component of the Player_Score using aggregate career wickets, bowling average, and economy across all available seasons.
4. FOR players with the "All-Rounder" secondary role, THE Selection_Engine SHALL combine both batting and bowling components into the Player_Score.
5. WHEN the player has Opponent_Stats recorded against the selected opponent team, THE Selection_Engine SHALL apply a Performance_Weighted_Bonus to the player's score based on the player's actual batting and bowling performance against that opponent relative to the player's overall career averages.
6. WHEN the player has no Opponent_Stats against the selected opponent team, THE Selection_Engine SHALL apply no head-to-head bonus to the player's score.
7. THE Selection_Engine SHALL normalize Player_Score values so that batters, bowlers, and all-rounders are comparable on the same scale.

### Requirement 3: Team Composition Constraints

**User Story:** As a fantasy cricket user, I want the dream XI to follow standard cricket team composition, so that the team is balanced and realistic.

#### Acceptance Criteria

1. THE Selection_Engine SHALL select exactly 11 players for the Dream_XI.
2. THE Selection_Engine SHALL include at least 1 player with the "Wicket-Keeper" secondary role in the Dream_XI.
3. THE Selection_Engine SHALL include at least 3 players with the "Batter" primary role (excluding all-rounders) in the Dream_XI.
4. THE Selection_Engine SHALL include at least 3 players with the "Bowler" primary role (excluding all-rounders) in the Dream_XI.
5. THE Selection_Engine SHALL include at most 4 players with the "All-Rounder" secondary role in the Dream_XI.
6. WHEN the Composition_Rule constraints cannot be satisfied with the available players from both teams, THE Selection_Engine SHALL relax the constraints and fill remaining slots with the highest-scoring available players, and THE Dream_Team_Selector SHALL display a notice indicating the composition is approximate.
7. THE Selection_Engine SHALL select players from both teams, ensuring at least 1 player from each of the two selected teams appears in the Dream_XI.

### Requirement 4: Dream XI Display

**User Story:** As a fantasy cricket user, I want to see the generated dream XI with player details and stats, so that I can understand why each player was selected.

#### Acceptance Criteria

1. WHEN the Selection_Engine produces the Dream_XI, THE Dream_Team_Selector SHALL display the 11 selected players as Dream_Team_Card components.
2. THE Dream_Team_Card SHALL display the player's name, team, role (primary and secondary), and the computed Player_Score.
3. THE Dream_Team_Selector SHALL group the Dream_XI players by role category (Wicket-Keeper, Batters, All-Rounders, Bowlers) in the display.
4. THE Dream_Team_Selector SHALL visually distinguish players from each of the two selected teams (e.g., using team color coding or team labels).
5. THE Dream_Team_Selector SHALL display a summary showing the total count of players selected from each team.

### Requirement 5: Season Filter for Dream Team

**User Story:** As a fantasy cricket user, I want to optionally filter the dream team generation by a specific season, so that I can see the best XI based on a particular year's performance.

#### Acceptance Criteria

1. THE Dream_Team_Selector SHALL provide an optional season filter dropdown listing all available seasons from the Player_Data_Store.
2. WHEN no season filter is selected, THE Selection_Engine SHALL use aggregate career statistics across all seasons to compute Player_Score values.
3. WHEN a season filter is selected, THE Selection_Engine SHALL use only the statistics from the selected season to compute Player_Score values.
4. WHEN a season filter is selected and a player has no data for that season, THE Selection_Engine SHALL exclude that player from consideration.

### Requirement 6: Navigation and Access

**User Story:** As a fantasy cricket user, I want to easily access the dream team feature from the main dashboard, so that I can quickly generate a dream XI.

#### Acceptance Criteria

1. THE Stats_Dashboard SHALL display a navigation link or button to the Dream_Team_Selector page.
2. WHEN the user clicks the navigation link, THE application SHALL navigate to the Dream_Team_Selector page at the `/dream-team` route.
3. THE Dream_Team_Selector page SHALL include a link to navigate back to the Stats_Dashboard.

### Requirement 7: Player Detail Navigation from Dream XI

**User Story:** As a fantasy cricket user, I want to click on a player in the dream XI to view their full stats, so that I can analyze the selection in more detail.

#### Acceptance Criteria

1. WHEN the user clicks on a Dream_Team_Card, THE application SHALL navigate to the Player_Detail_View for that player.
2. THE Dream_Team_Card SHALL indicate that the player name is a clickable link (e.g., via hover styling or underline).

### Requirement 8: Responsive Layout for Dream Team

**User Story:** As a fantasy cricket user, I want the dream team page to work well on both desktop and mobile, so that I can use the feature on any device.

#### Acceptance Criteria

1. THE Dream_Team_Selector SHALL render Dream_Team_Card components in a grid layout on screens wider than 768px.
2. THE Dream_Team_Selector SHALL render Dream_Team_Card components in a single-column layout on screens 768px or narrower.
3. THE Team_Picker SHALL stack team selection dropdowns vertically on screens 768px or narrower.

### Requirement 9: Opponent Performance Data Model

**User Story:** As a fantasy cricket user, I want the system to track how each player has performed against specific opponent teams, so that the dream team selection reflects real matchup advantages.

#### Acceptance Criteria

1. THE Player_Data_Store SHALL include an Opponent_Stats record for each opponent team a player has faced, nested within each SeasonStats entry as an optional `opponentStats` map keyed by opponent team name.
2. THE Opponent_Stats batting record SHALL track the number of innings, total runs scored, balls faced, and number of dismissals against the specific opponent team.
3. THE Opponent_Stats bowling record SHALL track the number of innings bowled, total runs conceded, balls bowled, and wickets taken against the specific opponent team.
4. THE Opponent_Stats record SHALL derive batting average (runs divided by dismissals) and strike rate (runs per 100 balls faced) from the raw batting counters.
5. THE Opponent_Stats record SHALL derive bowling economy (runs conceded per over) and bowling average (runs conceded per wicket) from the raw bowling counters.
6. WHEN a player has not faced a particular opponent team in a given season, THE Player_Data_Store SHALL omit the Opponent_Stats entry for that opponent from the player's season data.

### Requirement 10: Import Script Per-Opponent Aggregation

**User Story:** As a developer, I want the import script to aggregate per-opponent statistics from ball-by-ball data, so that the Player_Data_Store contains the matchup data needed for performance-weighted scoring.

#### Acceptance Criteria

1. WHEN processing ball-by-ball records, THE Import_Script SHALL identify the opponent team for each delivery using the match teams mapping and the batting team field.
2. THE Import_Script SHALL aggregate batting statistics (runs, balls faced, innings, dismissals) per player per season per opponent team.
3. THE Import_Script SHALL aggregate bowling statistics (runs conceded, balls bowled, innings, wickets) per player per season per opponent team.
4. THE Import_Script SHALL write the aggregated Opponent_Stats into each player's SeasonStats entry in the output JSON file.
5. WHEN a player has zero deliveries against a particular opponent in a season, THE Import_Script SHALL omit that opponent from the player's Opponent_Stats for that season.

### Requirement 11: Performance-Weighted Scoring Algorithm

**User Story:** As a fantasy cricket user, I want the head-to-head bonus to reflect actual performance against the opponent rather than a flat multiplier, so that the dream team selection rewards players who genuinely perform well in specific matchups.

#### Acceptance Criteria

1. WHEN computing the Performance_Weighted_Bonus for a batter, THE Selection_Engine SHALL compare the player's batting average and strike rate against the selected opponent to the player's overall career batting average and strike rate.
2. WHEN computing the Performance_Weighted_Bonus for a bowler, THE Selection_Engine SHALL compare the player's bowling economy and bowling average against the selected opponent to the player's overall career bowling economy and bowling average.
3. FOR players with the "All-Rounder" secondary role, THE Selection_Engine SHALL compute the Performance_Weighted_Bonus using both batting and bowling opponent performance comparisons.
4. THE Selection_Engine SHALL cap the Performance_Weighted_Bonus multiplier at a maximum of 1.25 (25% boost) and a minimum of 0.85 (15% penalty) to prevent extreme outliers from dominating selection.
5. WHEN a player has Opponent_Stats with fewer than 3 batting innings or fewer than 3 bowling innings against the opponent, THE Selection_Engine SHALL reduce the weight of the Performance_Weighted_Bonus proportionally to the sample size to avoid overweighting small samples.
6. THE Performance_Weighted_Bonus SHALL be computed as a ratio of opponent-specific performance to overall career performance, where a ratio above 1.0 indicates the player performs better against the opponent and below 1.0 indicates worse performance.
