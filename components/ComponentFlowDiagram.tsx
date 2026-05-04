"use client";

import { useState, useCallback, useRef } from "react";

interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: "page" | "component" | "lib" | "data" | "api";
  detail?: string;
}

interface FlowEdge {
  from: string;
  to: string;
  label: string;
  props: string[];
}

// ─── Full Project Nodes ──────────────────────────────────────────────────────

const initialNodes: FlowNode[] = [
  // ── Data Layer ──
  { id: "players-json", label: "players.json", x: 30, y: 30, type: "data", detail: "Raw IPL player data" },
  { id: "players-ts", label: "players.ts", x: 200, y: 30, type: "data", detail: "getAllPlayers(): Player[]" },
  { id: "types-ts", label: "types.ts", x: 370, y: 30, type: "data", detail: "Player, FilterState, SortConfig, SeasonStats, BattingStats, BowlingStats" },
  { id: "test-reports", label: "test-reports/*.json", x: 700, y: 30, type: "data", detail: "Vitest / Playwright / Jest JSON reports" },
  { id: "coverage-json", label: "coverage-summary.json", x: 910, y: 30, type: "data", detail: "Istanbul coverage output" },

  // ── Lib / Utility Layer ──
  { id: "statsUtils", label: "statsUtils.ts", x: 30, y: 130, type: "lib", detail: "getAggregateStats(player) → AggregateStats\ngetSeasonStats(player, season) → SeasonStats" },
  { id: "filterPlayers", label: "filterPlayers.ts", x: 200, y: 130, type: "lib", detail: "filterPlayers(players, filters: FilterState) → Player[]" },
  { id: "sortPlayers", label: "sortPlayers.ts", x: 370, y: 130, type: "lib", detail: "sortPlayers(players, config: SortConfig) → Player[]\ngetStatValue(player, key) → number" },
  { id: "leaderboardEngine", label: "leaderboardEngine.ts", x: 540, y: 130, type: "lib", detail: "computeLeaderboard(players, season?) → LeaderboardResult\nLeaderboardCategory, RankedPlayer" },
  { id: "dreamTeamEngine", label: "dreamTeamEngine.ts", x: 540, y: 210, type: "lib", detail: "buildDreamTeam(playersA, playersB) → ScoredPlayer[]" },
  { id: "graphDataUtils", label: "graphDataUtils.ts", x: 200, y: 210, type: "lib", detail: "transformBattingData(player) → BattingDataPoint[]\ntransformBowlingData(player) → BowlingDataPoint[]\ngetChartVisibility(player) → ChartVisibility" },
  { id: "reportParser", label: "reportParser.ts", x: 700, y: 130, type: "lib", detail: "parseReport(json) → NormalizedResult\nparseCoverage(json) → number | null\nparseFileCoverage(json) → FileCoverage[]\nserialize / deserialize" },
  { id: "testDashboardUtils", label: "testDashboardUtils.ts", x: 910, y: 130, type: "lib", detail: "computeAggregate(results: NormalizedResult[]) → AggregateResult\n{ totalTests, totalPass, totalFail, passRate }" },

  // ── API Layer ──
  { id: "api-test-reports", label: "/api/test-reports", x: 800, y: 210, type: "api", detail: "GET → { results: NormalizedResult[], coveragePercent: number|null, fileCoverage: FileCoverage[], warnings: string[] }" },

  // ── Pages ──
  { id: "home", label: "/ (Home)", x: 30, y: 330, type: "page", detail: "Player list with search, filter, sort\nCompare selection (up to 5)" },
  { id: "player-detail", label: "/player/[id]", x: 30, y: 530, type: "page", detail: "Career stats, season table, performance charts" },
  { id: "compare", label: "/compare", x: 280, y: 530, type: "page", detail: "Side-by-side radar + bar charts for selected players" },
  { id: "champions", label: "/champions", x: 370, y: 330, type: "page", detail: "Leaderboard categories with best/avg/worst tiers\nHero podium for top 3" },
  { id: "dream-team", label: "/dream-team", x: 560, y: 330, type: "page", detail: "Pick two teams → auto-generated best XI" },
  { id: "test-dashboard", label: "/test-dashboard", x: 800, y: 330, type: "page", detail: "Aggregate summary, runner cards, coverage,\nfailed tests, all-tests tab, file coverage tab, flow diagram" },

  // ── Home Page Components ──
  { id: "SearchBar", label: "SearchBar", x: 10, y: 430, type: "component", detail: "Props: { query: string, onChange: (q: string) => void }" },
  { id: "FilterPanel", label: "FilterPanel", x: 150, y: 430, type: "component", detail: "Props: { filters: FilterState, onChange, teams: string[], seasons: string[], secondaryRoles: string[] }" },
  { id: "SortControls", label: "SortControls", x: 290, y: 430, type: "component", detail: "Props: { sortConfig: SortConfig, onChange: (c: SortConfig) => void }" },
  { id: "PlayerCard", label: "PlayerCard", x: 150, y: 490, type: "component", detail: "Props: { player: Player, season?: string, selected: boolean, onToggleSelect: (id) => void }" },
  { id: "ThemeToggle", label: "ThemeToggle", x: 10, y: 490, type: "component", detail: "No props — reads/writes localStorage theme" },

  // ── Player Detail Components ──
  { id: "PlayerDetailView", label: "PlayerDetailView", x: 10, y: 620, type: "component", detail: "Props: { player: Player }" },
  { id: "ProgressGraphSection", label: "ProgressGraphSection", x: 10, y: 700, type: "component", detail: "Props: { player: Player }" },
  { id: "BattingChart", label: "BattingChart", x: 10, y: 780, type: "component", detail: "Props: { data: BattingDataPoint[], playerName: string }" },
  { id: "BowlingChart", label: "BowlingChart", x: 200, y: 780, type: "component", detail: "Props: { data: BowlingDataPoint[], playerName: string }" },

  // ── Compare Components ──
  { id: "PlayerComparisonView", label: "PlayerComparisonView", x: 280, y: 620, type: "component", detail: "Props: { players: Player[] }\nRadar chart + stat bars + season charts" },

  // ── Champions Components ──
  { id: "HeroPodium", label: "HeroPodium", x: 370, y: 430, type: "component", detail: "Props: { topPerformers: RankedPlayer[] }" },
  { id: "LeaderboardCard", label: "LeaderboardCard", x: 480, y: 430, type: "component", detail: "Props: { category: LeaderboardCategory, best: RankedPlayer|null, average: RankedPlayer|null, worst: RankedPlayer|null, isEmpty: boolean }" },

  // ── Dream Team Components ──
  { id: "TeamPicker", label: "TeamPicker", x: 560, y: 430, type: "component", detail: "Props: { teams: string[], teamA: string|null, teamB: string|null, onChangeA, onChangeB }" },
  { id: "DreamTeamCard", label: "DreamTeamCard", x: 560, y: 510, type: "component", detail: "Props: { player: Player, score: number, teamLabel: 'A'|'B', backParams?: string }" },

  // ── Test Dashboard Components ──
  { id: "AggregateSummary", label: "AggregateSummary", x: 750, y: 430, type: "component", detail: "Props: { aggregate: AggregateResult, coveragePercent?: number|null }" },
  { id: "RunnerCard", label: "RunnerCard", x: 900, y: 430, type: "component", detail: "Props: { result: NormalizedResult }\nShows pass/fail/total/duration + status indicator" },
  { id: "CoverageDisplay", label: "CoverageDisplay", x: 750, y: 510, type: "component", detail: "Props: { coveragePercent: number|null }\nGreen ≥80 / Yellow 50-79 / Red <50" },
  { id: "ComponentFlowDiagram", label: "ComponentFlowDiagram", x: 900, y: 510, type: "component", detail: "No props — this interactive SVG diagram" },
];

// ─── Edges ───────────────────────────────────────────────────────────────────

const edges: FlowEdge[] = [
  // Data → Lib
  { from: "players-json", to: "players-ts", label: "import", props: ["JSON → Player[]"] },
  { from: "players-ts", to: "types-ts", label: "uses", props: ["Player", "SeasonStats"] },
  { from: "test-reports", to: "api-test-reports", label: "fs.readFile", props: ["*.json files"] },
  { from: "coverage-json", to: "api-test-reports", label: "fs.readFile", props: ["coverage-summary.json"] },

  // API → Lib
  { from: "api-test-reports", to: "reportParser", label: "parse", props: ["parseReport()", "parseCoverage()", "parseFileCoverage()"] },

  // Home page → components
  { from: "home", to: "SearchBar", label: "renders", props: ["query: string", "onChange: (q: string) => void"] },
  { from: "home", to: "FilterPanel", label: "renders", props: ["filters: FilterState", "onChange", "teams: string[]", "seasons: string[]", "secondaryRoles: string[]"] },
  { from: "home", to: "SortControls", label: "renders", props: ["sortConfig: SortConfig", "onChange: (c: SortConfig) => void"] },
  { from: "home", to: "PlayerCard", label: "renders ×N", props: ["player: Player", "season?: string", "selected: boolean", "onToggleSelect: (id) => void"] },
  { from: "home", to: "ThemeToggle", label: "renders", props: [] },

  // Home page → libs
  { from: "home", to: "filterPlayers", label: "uses", props: ["filterPlayers(players, filters)"] },
  { from: "home", to: "sortPlayers", label: "uses", props: ["sortPlayers(players, config)"] },
  { from: "home", to: "players-ts", label: "imports", props: ["getAllPlayers()"] },

  // Player detail
  { from: "player-detail", to: "PlayerDetailView", label: "renders", props: ["player: Player"] },
  { from: "PlayerDetailView", to: "ProgressGraphSection", label: "renders", props: ["player: Player"] },
  { from: "ProgressGraphSection", to: "BattingChart", label: "renders", props: ["data: BattingDataPoint[]", "playerName: string"] },
  { from: "ProgressGraphSection", to: "BowlingChart", label: "renders", props: ["data: BowlingDataPoint[]", "playerName: string"] },
  { from: "ProgressGraphSection", to: "graphDataUtils", label: "uses", props: ["transformBattingData()", "transformBowlingData()", "getChartVisibility()"] },
  { from: "PlayerDetailView", to: "statsUtils", label: "uses", props: ["getAggregateStats(player)"] },

  // Compare
  { from: "compare", to: "PlayerComparisonView", label: "renders", props: ["players: Player[]"] },
  { from: "PlayerComparisonView", to: "sortPlayers", label: "uses", props: ["getStatValue(player, key)"] },

  // Champions
  { from: "champions", to: "HeroPodium", label: "renders", props: ["topPerformers: RankedPlayer[]"] },
  { from: "champions", to: "LeaderboardCard", label: "renders ×N", props: ["category: LeaderboardCategory", "best: RankedPlayer|null", "average: RankedPlayer|null", "worst: RankedPlayer|null", "isEmpty: boolean"] },
  { from: "champions", to: "leaderboardEngine", label: "uses", props: ["computeLeaderboard(players, season?)"] },

  // Dream Team
  { from: "dream-team", to: "TeamPicker", label: "renders", props: ["teams: string[]", "teamA: string|null", "teamB: string|null", "onChangeA", "onChangeB"] },
  { from: "dream-team", to: "DreamTeamCard", label: "renders ×N", props: ["player: Player", "score: number", "teamLabel: 'A'|'B'", "backParams?: string"] },
  { from: "dream-team", to: "dreamTeamEngine", label: "uses", props: ["buildDreamTeam(playersA, playersB)"] },

  // Test Dashboard
  { from: "test-dashboard", to: "api-test-reports", label: "fetch GET", props: ["→ { results, coveragePercent, fileCoverage, warnings }"] },
  { from: "test-dashboard", to: "AggregateSummary", label: "renders", props: ["aggregate: AggregateResult", "coveragePercent?: number|null"] },
  { from: "test-dashboard", to: "RunnerCard", label: "renders ×N", props: ["result: NormalizedResult"] },
  { from: "test-dashboard", to: "CoverageDisplay", label: "renders", props: ["coveragePercent: number|null"] },
  { from: "test-dashboard", to: "ComponentFlowDiagram", label: "renders", props: [] },
  { from: "test-dashboard", to: "testDashboardUtils", label: "uses", props: ["computeAggregate(results)"] },

  // PlayerCard uses statsUtils
  { from: "PlayerCard", to: "statsUtils", label: "uses", props: ["getAggregateStats()", "getSeasonStats()"] },

  // Navigation links between pages
  { from: "home", to: "player-detail", label: "Link", props: ["/player/[id]"] },
  { from: "home", to: "compare", label: "Link", props: ["/compare?ids=..."] },
  { from: "home", to: "champions", label: "nav link", props: ["/champions"] },
  { from: "home", to: "dream-team", label: "nav link", props: ["/dream-team"] },
  { from: "home", to: "test-dashboard", label: "nav link", props: ["/test-dashboard"] },
];

// ─── Rendering Constants ─────────────────────────────────────────────────────

const NODE_W = 160;
const NODE_H = 36;
const SVG_W = 1120;
const SVG_H = 840;

const nodeColors: Record<FlowNode["type"], { bg: string; border: string; text: string }> = {
  page: { bg: "#3b82f620", border: "#3b82f6", text: "#3b82f6" },
  component: { bg: "#22c55e20", border: "#22c55e", text: "#22c55e" },
  lib: { bg: "#a855f720", border: "#a855f7", text: "#a855f7" },
  data: { bg: "#f59e0b20", border: "#f59e0b", text: "#f59e0b" },
  api: { bg: "#06b6d420", border: "#06b6d4", text: "#06b6d4" },
};

const legendItems: { type: FlowNode["type"]; label: string }[] = [
  { type: "data", label: "Data" },
  { type: "lib", label: "Utility / Lib" },
  { type: "api", label: "API Route" },
  { type: "page", label: "Page" },
  { type: "component", label: "Component" },
];


// ─── Component ───────────────────────────────────────────────────────────────

export default function ComponentFlowDiagram() {
  const [nodes, setNodes] = useState<FlowNode[]>(initialNodes);
  const [dragging, setDragging] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const getNode = useCallback(
    (id: string) => nodes.find((n) => n.id === id),
    [nodes]
  );

  // ── Drag handlers ──

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || !svgRef.current) return;
      const pt = svgRef.current.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
      dragOffset.current = { x: svgP.x - node.x, y: svgP.y - node.y };
      setDragging(nodeId);
    },
    [nodes]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !svgRef.current) return;
      const pt = svgRef.current.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
      setNodes((prev) =>
        prev.map((n) =>
          n.id === dragging
            ? { ...n, x: svgP.x - dragOffset.current.x, y: svgP.y - dragOffset.current.y }
            : n
        )
      );
    },
    [dragging]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNode((prev) => (prev === nodeId ? null : nodeId));
    },
    []
  );

  const handleBgClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // ── Edge path computation ──

  function getEdgePath(fromNode: FlowNode, toNode: FlowNode) {
    const fx = fromNode.x + NODE_W / 2;
    const fy = fromNode.y + NODE_H / 2;
    const tx = toNode.x + NODE_W / 2;
    const ty = toNode.y + NODE_H / 2;
    const dx = tx - fx;
    const dy = ty - fy;
    const angle = Math.atan2(dy, dx);
    const fromEdgeX = fx + (NODE_W / 2) * Math.cos(angle);
    const fromEdgeY =
      fy +
      (NODE_H / 2) *
        Math.sign(Math.sin(angle)) *
        Math.min(1, Math.abs(Math.sin(angle) / Math.cos(angle)) * (NODE_W / NODE_H));
    const toEdgeX = tx - (NODE_W / 2) * Math.cos(angle);
    const toEdgeY =
      ty -
      (NODE_H / 2) *
        Math.sign(Math.sin(angle)) *
        Math.min(1, Math.abs(Math.sin(angle) / Math.cos(angle)) * (NODE_W / NODE_H));
    return {
      x1: fromEdgeX,
      y1: fromEdgeY,
      x2: toEdgeX,
      y2: toEdgeY,
      mx: (fromEdgeX + toEdgeX) / 2,
      my: (fromEdgeY + toEdgeY) / 2,
    };
  }

  // Highlight edges connected to selected/hovered node
  const activeNodeId = selectedNode ?? hoveredNode;
  const connectedEdgeIds = new Set<string>();
  if (activeNodeId) {
    edges.forEach((e) => {
      if (e.from === activeNodeId || e.to === activeNodeId) {
        connectedEdgeIds.add(`${e.from}-${e.to}`);
      }
    });
  }

  // Detail panel for selected node
  const selectedNodeData = selectedNode ? getNode(selectedNode) : null;
  const selectedNodeEdges = selectedNode
    ? edges.filter((e) => e.from === selectedNode || e.to === selectedNode)
    : [];

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        {legendItems.map((item) => (
          <div key={item.type} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded"
              style={{ backgroundColor: nodeColors[item.type].border }}
            />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {item.label}
            </span>
          </div>
        ))}
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Drag to rearrange · Hover lines for props · Click nodes for details
        </span>
      </div>

      <div style={{ overflow: "auto" }}>
        <svg
          ref={svgRef}
          width="100%"
          height={SVG_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ cursor: dragging ? "grabbing" : "default", minWidth: 900 }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleBgClick}
        >
          {/* Arrow marker */}
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--text-muted)" fillOpacity={0.6} />
            </marker>
            <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((edge) => {
            const fromNode = getNode(edge.from);
            const toNode = getNode(edge.to);
            if (!fromNode || !toNode) return null;
            const { x1, y1, x2, y2, mx, my } = getEdgePath(fromNode, toNode);
            const edgeId = `${edge.from}-${edge.to}`;
            const isHovered = hoveredEdge === edgeId;
            const isConnected = connectedEdgeIds.has(edgeId);
            const isActive = isHovered || isConnected;
            const dimmed = activeNodeId && !isConnected;
            return (
              <g key={edgeId}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={isActive ? "#3b82f6" : "var(--text-muted)"}
                  strokeWidth={isActive ? 2 : 1}
                  strokeOpacity={dimmed ? 0.1 : isActive ? 1 : 0.35}
                  markerEnd={isActive ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                />
                {/* Wider invisible hover target */}
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="transparent"
                  strokeWidth={14}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHoveredEdge(edgeId)}
                  onMouseLeave={() => setHoveredEdge(null)}
                />
                {/* Edge label on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={mx - 4}
                      y={my - 10}
                      width={edge.label.length * 6.5 + 8}
                      height={16}
                      rx={3}
                      fill="#3b82f6"
                      fillOpacity={0.9}
                    />
                    <text
                      x={mx + edge.label.length * 3.25}
                      y={my + 2}
                      textAnchor="middle"
                      fontSize={9}
                      fill="#fff"
                      fontWeight={600}
                      style={{ pointerEvents: "none" }}
                    >
                      {edge.label}
                    </text>
                  </g>
                )}
                {/* Props tooltip on hover */}
                {isHovered && edge.props.length > 0 && (
                  <g>
                    {edge.props.map((prop, i) => {
                      const tooltipY = my + 12 + i * 14;
                      return (
                        <g key={i}>
                          <rect
                            x={mx - 4}
                            y={tooltipY - 9}
                            width={prop.length * 5.8 + 10}
                            height={14}
                            rx={3}
                            fill="var(--bg-card)"
                            stroke="var(--border-color)"
                            strokeWidth={0.5}
                          />
                          <text
                            x={mx + 1}
                            y={tooltipY + 1}
                            fontSize={9}
                            fill="var(--text-primary)"
                            fontFamily="monospace"
                            style={{ pointerEvents: "none" }}
                          >
                            {prop}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const colors = nodeColors[node.type];
            const isSelected = selectedNode === node.id;
            const dimmed = activeNodeId && activeNodeId !== node.id && !connectedEdgeIds.has(`${activeNodeId}-${node.id}`) && !connectedEdgeIds.has(`${node.id}-${activeNodeId}`) && !edges.some((e) => (e.from === activeNodeId && e.to === node.id) || (e.to === activeNodeId && e.from === node.id));
            return (
              <g
                key={node.id}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={(e) => { e.stopPropagation(); handleNodeClick(node.id); }}
                style={{ cursor: dragging === node.id ? "grabbing" : "grab", opacity: dimmed ? 0.25 : 1, transition: "opacity 0.2s" }}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                  fill={colors.bg}
                  stroke={isSelected ? "#3b82f6" : colors.border}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                <text
                  x={node.x + NODE_W / 2}
                  y={node.y + NODE_H / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10}
                  fontWeight={node.type === "page" ? 700 : 500}
                  fill={colors.text}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail panel for selected node */}
      {selectedNodeData && (
        <div
          className="mt-3 rounded-lg border p-4"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: nodeColors[selectedNodeData.type].border,
            borderWidth: 2,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded"
              style={{ backgroundColor: nodeColors[selectedNodeData.type].border }}
            />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {selectedNodeData.label}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: nodeColors[selectedNodeData.type].bg,
                color: nodeColors[selectedNodeData.type].text,
              }}
            >
              {selectedNodeData.type}
            </span>
          </div>
          {selectedNodeData.detail && (
            <pre
              className="text-xs whitespace-pre-wrap mb-2"
              style={{ color: "var(--text-secondary)", fontFamily: "monospace" }}
            >
              {selectedNodeData.detail}
            </pre>
          )}
          {selectedNodeEdges.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                Connections:
              </span>
              {selectedNodeEdges.map((e, i) => {
                const isOutgoing = e.from === selectedNode;
                const otherNode = getNode(isOutgoing ? e.to : e.from);
                return (
                  <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <span style={{ color: isOutgoing ? "#22c55e" : "#3b82f6" }}>
                      {isOutgoing ? "→" : "←"}
                    </span>
                    <span className="font-medium">{otherNode?.label ?? (isOutgoing ? e.to : e.from)}</span>
                    <span style={{ color: "var(--text-muted)" }}>({e.label})</span>
                    {e.props.length > 0 && (
                      <span className="font-mono" style={{ color: "var(--text-muted)" }}>
                        [{e.props.join(", ")}]
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
