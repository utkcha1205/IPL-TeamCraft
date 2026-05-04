# Requirements Document

## Introduction

This feature adds graphical representations of player progress over IPL seasons (2022–2025) to the player detail page. Charts visualize season-by-season trends for batting and bowling statistics, adapting to each player's primary and secondary roles. Batters see batting-focused graphs, bowlers see bowling-focused graphs, and all-rounders see both.

## Glossary

- **Player_Detail_Page**: The existing page at `/player/[id]` that displays a single player's profile, career stats, and season-by-season stats table.
- **Progress_Graph_Section**: A new section on the Player_Detail_Page that contains one or more charts showing season-over-season stat trends.
- **Chart_Component**: A reusable React component that renders a single line or bar chart for a given set of season data points.
- **Batting_Chart**: A Chart_Component configured to display batting metrics (runs, average, strike rate) across seasons.
- **Bowling_Chart**: A Chart_Component configured to display bowling metrics (wickets, economy, average) across seasons.
- **Graph_Data_Transformer**: A utility function that extracts and formats season-by-season stats from a Player object into chart-ready data arrays.
- **Player**: A data entity representing an IPL cricketer with a primaryRole ("Batter" or "Bowler") and an optional secondaryRole ("Wicket-Keeper", "All-Rounder", "Captain", or "Vice-Captain").

## Requirements

### Requirement 1: Display Batting Progress Graph

**User Story:** As a cricket fan, I want to see a graphical chart of a player's batting stats across seasons, so that I can quickly understand their batting performance trend.

#### Acceptance Criteria

1. WHEN a Player with batting season data is viewed on the Player_Detail_Page, THE Progress_Graph_Section SHALL display a Batting_Chart showing runs scored per season on the y-axis and season year on the x-axis.
2. WHEN a Player with batting season data is viewed on the Player_Detail_Page, THE Batting_Chart SHALL include line traces for batting average and strike rate across seasons.
3. WHEN a Player has batting data for only one season, THE Batting_Chart SHALL display that single data point without error.
4. IF a Player has no batting data for any season, THEN THE Progress_Graph_Section SHALL not render a Batting_Chart.

### Requirement 2: Display Bowling Progress Graph

**User Story:** As a cricket fan, I want to see a graphical chart of a player's bowling stats across seasons, so that I can quickly understand their bowling performance trend.

#### Acceptance Criteria

1. WHEN a Player with bowling season data is viewed on the Player_Detail_Page, THE Progress_Graph_Section SHALL display a Bowling_Chart showing wickets taken per season on the y-axis and season year on the x-axis.
2. WHEN a Player with bowling season data is viewed on the Player_Detail_Page, THE Bowling_Chart SHALL include line traces for bowling economy and bowling average across seasons.
3. WHEN a Player has bowling data for only one season, THE Bowling_Chart SHALL display that single data point without error.
4. IF a Player has no bowling data for any season, THEN THE Progress_Graph_Section SHALL not render a Bowling_Chart.

### Requirement 3: Role-Based Graph Selection

**User Story:** As a cricket fan, I want the graphs shown to reflect the player's role, so that I see the most relevant stats for each player.

#### Acceptance Criteria

1. WHEN a Player with primaryRole "Batter" and no secondaryRole of "All-Rounder" is viewed, THE Progress_Graph_Section SHALL display the Batting_Chart as the primary graph.
2. WHEN a Player with primaryRole "Bowler" and no secondaryRole of "All-Rounder" is viewed, THE Progress_Graph_Section SHALL display the Bowling_Chart as the primary graph.
3. WHEN a Player with secondaryRole "All-Rounder" is viewed, THE Progress_Graph_Section SHALL display both the Batting_Chart and the Bowling_Chart.
4. WHEN a Player with primaryRole "Batter" has bowling season data available, THE Progress_Graph_Section SHALL display the Bowling_Chart as a secondary graph below the Batting_Chart.
5. WHEN a Player with primaryRole "Bowler" has batting season data available, THE Progress_Graph_Section SHALL display the Batting_Chart as a secondary graph below the Bowling_Chart.

### Requirement 4: Graph Data Transformation

**User Story:** As a developer, I want a utility that transforms player season data into chart-ready format, so that graph components receive clean, structured input.

#### Acceptance Criteria

1. THE Graph_Data_Transformer SHALL accept a Player object and return an array of data points sorted by season year in ascending order.
2. WHEN a Player has batting season data, THE Graph_Data_Transformer SHALL extract runs, average, and strikeRate for each season into the batting data array.
3. WHEN a Player has bowling season data, THE Graph_Data_Transformer SHALL extract wickets, economy, and average for each season into the bowling data array.
4. IF a season has missing batting or bowling data, THEN THE Graph_Data_Transformer SHALL exclude that season from the respective data array rather than inserting null values.
5. FOR ALL Player objects, transforming season data and then reading back the values SHALL produce values identical to the original season stats (round-trip property).

### Requirement 5: Chart Interactivity and Accessibility

**User Story:** As a user, I want the charts to be interactive and accessible, so that I can explore data points and use the feature regardless of ability.

#### Acceptance Criteria

1. WHEN a user hovers over a data point on any Chart_Component, THE Chart_Component SHALL display a tooltip showing the exact numeric value and the season year.
2. THE Chart_Component SHALL render with appropriate ARIA labels describing the chart type and the player name.
3. THE Chart_Component SHALL use distinct colors for each metric line to ensure visual differentiation.
4. WHILE the Player_Detail_Page is viewed on a screen narrower than 640 pixels, THE Chart_Component SHALL adjust its width to fit the available viewport without horizontal scrolling.

### Requirement 6: Graph Section Layout and Placement

**User Story:** As a cricket fan, I want the graphs to appear in a logical position on the player detail page, so that the visual flow of information is natural.

#### Acceptance Criteria

1. THE Progress_Graph_Section SHALL be placed between the Career Stats section and the Season-by-Season Stats table on the Player_Detail_Page.
2. THE Progress_Graph_Section SHALL include a heading titled "Performance Trends".
3. WHEN both Batting_Chart and Bowling_Chart are displayed, THE Progress_Graph_Section SHALL arrange them in a two-column grid layout on screens wider than 640 pixels.
4. WHILE the screen width is narrower than 640 pixels, THE Progress_Graph_Section SHALL stack the charts vertically.
