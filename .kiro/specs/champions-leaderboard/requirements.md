# Requirements Document

## Introduction

The Champions Leaderboard is a new page in the IPL Player Stats app that showcases top performers across multiple statistical categories. Users can view all-time champions or filter by individual season. The page covers batting, bowling, fielding, extras, and milestone categories, presenting best, average, and worst performers in each. This requires expanding the data import pipeline to capture additional ball-by-ball statistics (sixes, fours, catches, fielding dismissals, extras breakdown, non-striker appearances) that are not currently tracked.

## Glossary

- **Import_Script**: The `scripts/import-ipl-data.ts` pipeline that downloads ball-by-ball CSV data and aggregates it into `data/players.json`
- **Player_Data**: The JSON dataset at `data/players.json` containing per-season statistics for each player
- **Champions_Page**: The new `/champions` route that displays leaderboard rankings
- **Leaderboard_Engine**: The utility module that computes ranked lists of players for each statistical category
- **Category**: A single statistical dimension (e.g., "Most Runs", "Best Economy") used to rank players
- **Tier**: One of three ranking levels within a category — Best (top performer), Average (median performer), Worst (bottom performer)
- **Season_Filter**: A UI control that restricts leaderboard rankings to a single IPL season or shows all-time aggregates
- **Batting_Stats**: Statistics related to a player's performance as a batter (runs, average, strike rate, sixes, fours, highest score, fifties, hundreds)
- **Bowling_Stats**: Statistics related to a player's performance as a bowler (wickets, economy, average, best figures, dot balls, maiden overs)
- **Fielding_Stats**: Statistics related to a player's fielding performance (catches, run-outs, stumpings)
- **Extras_Stats**: Statistics about extras conceded by bowlers (wides, no-balls) and extras in general (leg-byes, byes)
- **Non_Striker_Stats**: Statistics about a player's appearances as non-striker (balls faced as non-striker, involvement in run-outs as non-striker)
- **Minimum_Qualifier**: A threshold of matches or innings a player must meet to be eligible for rate-based leaderboard categories

## Requirements

### Requirement 1: Expand Data Import — Batting Milestones

**User Story:** As a developer, I want the Import_Script to capture sixes and fours per batter per season, so that the Champions_Page can rank players by boundary-hitting ability.

#### Acceptance Criteria

1. WHEN the Import_Script processes a ball record where BatsmanRun equals 6, THE Import_Script SHALL increment the sixes count for the batter in that season
2. WHEN the Import_Script processes a ball record where BatsmanRun equals 4, THE Import_Script SHALL increment the fours count for the batter in that season
3. THE Import_Script SHALL include `sixes` and `fours` fields as integers in each season's batting object in Player_Data
4. WHEN a batter has zero sixes or fours in a season, THE Import_Script SHALL store the value as 0

### Requirement 2: Expand Data Import — Fielding Stats

**User Story:** As a developer, I want the Import_Script to capture catches, run-out involvements, and stumpings per player per season, so that fielding champions can be identified.

#### Acceptance Criteria

1. WHEN the Import_Script processes a wicket delivery where Kind is "caught" and FieldersInvolved contains a player name, THE Import_Script SHALL increment the catches count for that fielder in that season
2. WHEN the Import_Script processes a wicket delivery where Kind is "run out" and FieldersInvolved contains a player name, THE Import_Script SHALL increment the runOuts count for that fielder in that season
3. WHEN the Import_Script processes a wicket delivery where Kind is "stumped" and FieldersInvolved contains a player name, THE Import_Script SHALL increment the stumpings count for that fielder in that season
4. THE Import_Script SHALL include a `fielding` object with `catches`, `runOuts`, and `stumpings` fields in each season entry in Player_Data
5. WHEN a player has no fielding involvements in a season, THE Import_Script SHALL omit the fielding object for that season

### Requirement 3: Expand Data Import — Extras Breakdown by Bowler

**User Story:** As a developer, I want the Import_Script to track wides and no-balls conceded per bowler per season, so that extras leaderboards can identify which bowlers concede the most or fewest extras.

#### Acceptance Criteria

1. WHEN the Import_Script processes a ball record where ExtraType is "wide", THE Import_Script SHALL increment the widesConceded count for the bowler in that season
2. WHEN the Import_Script processes a ball record where ExtraType is "noball", THE Import_Script SHALL increment the noballsConceded count for the bowler in that season
3. THE Import_Script SHALL include `widesConceded` and `noballsConceded` fields as integers in each season's bowling object in Player_Data
4. WHEN a bowler concedes zero wides or no-balls in a season, THE Import_Script SHALL store the value as 0

### Requirement 4: Expand Data Import — Bowling Dot Balls

**User Story:** As a developer, I want the Import_Script to count dot balls bowled per bowler per season, so that the Champions_Page can rank bowlers by pressure-building ability.

#### Acceptance Criteria

1. WHEN the Import_Script processes a legal delivery where TotalRun equals 0 and ExtraType is empty, THE Import_Script SHALL increment the dotBalls count for the bowler in that season
2. THE Import_Script SHALL include a `dotBalls` field as an integer in each season's bowling object in Player_Data

### Requirement 5: Expand Data Import — Non-Striker Appearances

**User Story:** As a developer, I want the Import_Script to track how many balls each player appears as non-striker per season, so that non-striker leaderboards can be computed.

#### Acceptance Criteria

1. WHEN the Import_Script processes a ball record, THE Import_Script SHALL increment the ballsAsNonStriker count for the NonStriker player in that season
2. THE Import_Script SHALL include a `ballsAsNonStriker` field as an integer in each season's batting object in Player_Data

### Requirement 6: Expand Data Import — Leg-Byes and Byes

**User Story:** As a developer, I want the Import_Script to track leg-byes and byes per season at the match level, so that extras leaderboards can show these categories.

#### Acceptance Criteria

1. WHEN the Import_Script processes a ball record where ExtraType is "legbye", THE Import_Script SHALL increment the legByes count for the bowling team in that match-season
2. WHEN the Import_Script processes a ball record where ExtraType is "bye", THE Import_Script SHALL increment the byes count for the bowling team in that match-season
3. THE Import_Script SHALL store aggregate legByes and byes per bowler per season in the bowling object in Player_Data

### Requirement 7: Update TypeScript Data Types

**User Story:** As a developer, I want the TypeScript interfaces in `data/types.ts` to reflect all new statistical fields, so that the codebase remains type-safe.

#### Acceptance Criteria

1. THE BattingStats interface SHALL include `sixes: number`, `fours: number`, and `ballsAsNonStriker: number` fields
2. THE BowlingStats interface SHALL include `widesConceded: number`, `noballsConceded: number`, `dotBalls: number`, `legByes: number`, and `byes: number` fields
3. THE SeasonStats interface SHALL include an optional `fielding` property of type FieldingStats
4. THE FieldingStats interface SHALL include `catches: number`, `runOuts: number`, and `stumpings: number` fields
5. WHEN existing code references BattingStats or BowlingStats, THE updated interfaces SHALL remain backward-compatible by keeping all existing fields unchanged

### Requirement 8: Leaderboard Engine — Ranking Computation

**User Story:** As a developer, I want a Leaderboard_Engine utility that computes ranked player lists for any statistical category, so that the Champions_Page can display best, average, and worst performers.

#### Acceptance Criteria

1. WHEN given a list of players, a Category, and an optional season filter, THE Leaderboard_Engine SHALL return a ranked list sorted by that category's stat in descending order for "higher is better" stats
2. WHEN given a Category where lower values are better (e.g., economy, widesConceded), THE Leaderboard_Engine SHALL return a ranked list sorted in ascending order
3. THE Leaderboard_Engine SHALL identify the Best performer as rank 1, the Worst performer as the last rank, and the Average performer as the player closest to the median rank
4. WHEN a season filter is provided, THE Leaderboard_Engine SHALL compute rankings using only that season's data
5. WHEN no season filter is provided, THE Leaderboard_Engine SHALL compute rankings using aggregated all-time data
6. THE Leaderboard_Engine SHALL apply a Minimum_Qualifier of at least 5 innings (batting or bowling as appropriate) before including a player in rate-based categories (average, strike rate, economy)
7. FOR ALL valid player lists and categories, ranking then extracting the stat values SHALL produce a non-increasing sequence for "higher is better" stats and a non-decreasing sequence for "lower is better" stats (sort-order invariant)

### Requirement 9: Champions Page — Layout and Navigation

**User Story:** As a user, I want to access a Champions Leaderboard page from the main navigation, so that I can explore top performers across categories.

#### Acceptance Criteria

1. THE Champions_Page SHALL be accessible at the `/champions` route
2. THE app header on the Dashboard page SHALL include a navigation link labeled "Champions" that navigates to `/champions`
3. THE Champions_Page SHALL include a breadcrumb navigation showing "Dashboard / Champions"
4. THE Champions_Page SHALL use CSS variable inline styles consistent with the existing app theme (no Tailwind dark: classes)
5. THE Champions_Page SHALL include a Season_Filter dropdown that lists all available seasons plus an "All Seasons" option

### Requirement 10: Champions Page — Batting Leaderboards

**User Story:** As a user, I want to see batting leaderboards showing best, average, and worst performers, so that I can identify batting champions.

#### Acceptance Criteria

1. THE Champions_Page SHALL display a "Batting" section with leaderboard cards for: Most Runs, Highest Average, Highest Strike Rate, Most Sixes, Most Fours, Most Fifties, Most Hundreds, and Highest Score
2. WHEN a Category card is displayed, THE Champions_Page SHALL show the Best performer (rank 1) with a gold accent, the Average performer with a silver accent, and the Worst performer with a bronze accent
3. WHEN the Season_Filter is changed, THE Champions_Page SHALL recompute and display updated batting leaderboards within the same render cycle
4. WHEN a player name on a leaderboard card is clicked, THE Champions_Page SHALL navigate to that player's detail page at `/player/[id]`

### Requirement 11: Champions Page — Bowling Leaderboards

**User Story:** As a user, I want to see bowling leaderboards showing best, average, and worst performers, so that I can identify bowling champions.

#### Acceptance Criteria

1. THE Champions_Page SHALL display a "Bowling" section with leaderboard cards for: Most Wickets, Best Economy (lowest), Best Bowling Average (lowest), Most Dot Balls, Most Wides Conceded (worst), and Most No-Balls Conceded (worst)
2. WHEN displaying economy and bowling average categories, THE Champions_Page SHALL show the lowest value as Best and the highest value as Worst
3. WHEN displaying wides and no-balls conceded categories, THE Champions_Page SHALL show the highest value as Worst and the lowest value as Best
4. WHEN the Season_Filter is changed, THE Champions_Page SHALL recompute and display updated bowling leaderboards

### Requirement 12: Champions Page — Fielding Leaderboards

**User Story:** As a user, I want to see fielding leaderboards showing best, average, and worst fielders, so that I can identify fielding champions.

#### Acceptance Criteria

1. THE Champions_Page SHALL display a "Fielding" section with leaderboard cards for: Most Catches, Most Run-Outs, and Most Stumpings
2. WHEN a player has no fielding data for the selected season, THE Champions_Page SHALL exclude that player from fielding leaderboards
3. WHEN the Season_Filter is changed, THE Champions_Page SHALL recompute and display updated fielding leaderboards

### Requirement 13: Champions Page — Extras Leaderboards

**User Story:** As a user, I want to see extras leaderboards showing which bowlers concede the most and fewest extras, so that I can evaluate bowler discipline.

#### Acceptance Criteria

1. THE Champions_Page SHALL display an "Extras" section with leaderboard cards for: Most Wides by Bowler, Fewest Wides by Bowler, Most No-Balls by Bowler, and Fewest No-Balls by Bowler
2. THE Champions_Page SHALL apply the Minimum_Qualifier of 5 bowling innings before including a bowler in extras leaderboards
3. WHEN the Season_Filter is changed, THE Champions_Page SHALL recompute and display updated extras leaderboards

### Requirement 14: Champions Page — Non-Striker Leaderboard

**User Story:** As a user, I want to see which players appear most frequently as non-striker, so that I can understand batting partnerships.

#### Acceptance Criteria

1. THE Champions_Page SHALL display a "Non-Striker" section with a leaderboard card for: Most Balls as Non-Striker
2. WHEN the Season_Filter is changed, THE Champions_Page SHALL recompute and display the updated non-striker leaderboard

### Requirement 15: Champions Page — Additional Categories

**User Story:** As a user, I want to see additional interesting leaderboards beyond the standard categories, so that I can discover unique statistical insights.

#### Acceptance Criteria

1. THE Champions_Page SHALL display a "Milestones" section with leaderboard cards for: Most Matches Played (across batting and bowling), Best Win Contributor (player with highest total runs + wickets combined), and Most Consistent Batter (lowest standard deviation in runs across seasons, minimum 3 seasons)
2. WHEN computing Most Consistent Batter, THE Leaderboard_Engine SHALL require the player to have batting data in at least 3 seasons
3. WHEN the Season_Filter is set to a specific season, THE Champions_Page SHALL hide the "Most Consistent Batter" card since it requires multi-season data

### Requirement 16: Champions Page — Visual Presentation

**User Story:** As a user, I want the Champions Leaderboard to be visually impressive with clear hierarchy and engaging design, so that the page feels like a celebration of top performers.

#### Acceptance Criteria

1. THE Champions_Page SHALL display each Category as a card containing the player name, team, stat value, and rank indicator for Best, Average, and Worst tiers
2. THE Champions_Page SHALL use a trophy or medal icon (emoji or SVG) next to the Best performer in each category
3. THE Champions_Page SHALL display a top-3 podium-style layout for the overall best performers in the hero section at the top of the page
4. THE Champions_Page SHALL render leaderboard sections in a responsive grid layout: 1 column on mobile, 2 columns on tablet, 3 or 4 columns on desktop
5. WHEN a leaderboard card is hovered, THE Champions_Page SHALL apply a subtle elevation or highlight effect using CSS transitions

### Requirement 17: Leaderboard Engine — Round-Trip Consistency

**User Story:** As a developer, I want to verify that the Leaderboard_Engine produces consistent results when re-ranked, so that rankings are deterministic.

#### Acceptance Criteria

1. FOR ALL valid player lists and categories, computing rankings twice with the same inputs SHALL produce identical output (idempotence property)
2. FOR ALL valid player lists and categories, the number of players in the ranked output SHALL equal the number of players that meet the Minimum_Qualifier for that category (size preservation property)
3. FOR ALL ranked outputs, the Best performer's stat value SHALL be greater than or equal to the Average performer's stat value for "higher is better" categories, and less than or equal to for "lower is better" categories (ordering property)

### Requirement 18: Error Handling

**User Story:** As a user, I want the Champions_Page to handle edge cases gracefully, so that the page remains usable even with incomplete data.

#### Acceptance Criteria

1. IF no players meet the Minimum_Qualifier for a category, THEN THE Champions_Page SHALL display a message "Not enough data for this category" instead of an empty card
2. IF the Player_Data file is empty or missing, THEN THE Champions_Page SHALL display a message "No player data available"
3. IF a season is selected that has no data, THEN THE Champions_Page SHALL display a message "No data available for this season"
