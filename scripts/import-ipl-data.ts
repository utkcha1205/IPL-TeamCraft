/**
 * IPL Data Import Script
 *
 * Downloads ball-by-ball match data from the open-source IPL-DATASET repo
 * (https://github.com/ritesh-ojha/IPL-DATASET) and aggregates it into
 * our data/players.json format.
 *
 * Usage: npx tsx scripts/import-ipl-data.ts
 *
 * Data source: MIT Licensed, maintained by ritesh-ojha
 */

import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";

const BALL_BY_BALL_URL =
  "https://raw.githubusercontent.com/ritesh-ojha/IPL-DATASET/main/csv/Ball_By_Ball_Match_Data.csv";
const MATCH_INFO_URL =
  "https://raw.githubusercontent.com/ritesh-ojha/IPL-DATASET/main/csv/Match_Info.csv";
const PLAYERS_DETAILS_URL =
  "https://raw.githubusercontent.com/ritesh-ojha/IPL-DATASET/main/csv/2024_players_details.csv";

// Seasons to include (last 3 full seasons)
const TARGET_SEASONS = ["2022", "2023", "2024", "2025"];

// Team name normalization
const TEAM_MAP: Record<string, string> = {
  "Chennai Super Kings": "Chennai Super Kings",
  "Mumbai Indians": "Mumbai Indians",
  "Royal Challengers Bangalore": "Royal Challengers Bengaluru",
  "Royal Challengers Bengaluru": "Royal Challengers Bengaluru",
  "Kolkata Knight Riders": "Kolkata Knight Riders",
  "Delhi Capitals": "Delhi Capitals",
  "Delhi Daredevils": "Delhi Capitals",
  "Sunrisers Hyderabad": "Sunrisers Hyderabad",
  "Punjab Kings": "Punjab Kings",
  "Kings XI Punjab": "Punjab Kings",
  "Rajasthan Royals": "Rajasthan Royals",
  "Lucknow Super Giants": "Lucknow Super Giants",
  "Gujarat Titans": "Gujarat Titans",
};

function normalizeTeam(team: string): string {
  return TEAM_MAP[team.trim()] ?? team.trim();
}

function download(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = (u: string) => {
      https.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          request(res.headers.location!);
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        res.on("error", reject);
      });
    };
    request(url);
  });
}

interface BallRecord {
  ID: string;
  Innings: string;
  Overs: string;
  BallNumber: string;
  Batter: string;
  Bowler: string;
  NonStriker: string;
  ExtraType: string;
  BatsmanRun: string;
  ExtraRun: string;
  TotalRun: string;
  IsWicketDelivery: string;
  PlayerOut: string;
  Kind: string;
  FieldersInvolved: string;
  BattingTeam: string;
}

interface MatchRecord {
  match_number: string;
  team1: string;
  team2: string;
  match_date: string;
  team1_players: string;
  team2_players: string;
}

interface PlayerSeasonData {
  team: string;
  battingMatches: Set<string>;
  bowlingMatches: Set<string>;
  battingInnings: number;
  runs: number;
  ballsFaced: number;
  fifties: number;
  hundreds: number;
  highestScore: number;
  outs: number;
  bowlingInnings: number;
  ballsBowled: number;
  runsConceded: number;
  wickets: number;
  bestWickets: number;
  bestRuns: number;
  fourWickets: number;
  fiveWickets: number;
  // Track per-innings for best figures
  inningsBowling: Map<string, { wickets: number; runs: number }>;
  inningsBatting: Map<string, { runs: number }>;
  // Batting additions
  sixes: number;
  fours: number;
  ballsAsNonStriker: number;
  // Bowling additions
  widesConceded: number;
  noballsConceded: number;
  dotBalls: number;
  legByes: number;
  byes: number;
  // Fielding
  catches: number;
  runOuts: number;
  stumpings: number;
}

function newPlayerSeasonData(team: string): PlayerSeasonData {
  return {
    team,
    battingMatches: new Set(),
    bowlingMatches: new Set(),
    battingInnings: 0,
    runs: 0,
    ballsFaced: 0,
    fifties: 0,
    hundreds: 0,
    highestScore: 0,
    outs: 0,
    bowlingInnings: 0,
    ballsBowled: 0,
    runsConceded: 0,
    wickets: 0,
    bestWickets: 0,
    bestRuns: 999,
    fourWickets: 0,
    fiveWickets: 0,
    inningsBowling: new Map(),
    inningsBatting: new Map(),
    // Batting additions
    sixes: 0,
    fours: 0,
    ballsAsNonStriker: 0,
    // Bowling additions
    widesConceded: 0,
    noballsConceded: 0,
    dotBalls: 0,
    legByes: 0,
    byes: 0,
    // Fielding
    catches: 0,
    runOuts: 0,
    stumpings: 0,
  };
}

async function main() {
  console.log("Downloading ball-by-ball data...");
  const ballCsv = await download(BALL_BY_BALL_URL);
  console.log("Downloading match info...");
  const matchCsv = await download(MATCH_INFO_URL);
  console.log("Downloading player details...");
  const playerDetailsCsv = await download(PLAYERS_DETAILS_URL);

  console.log("Parsing CSVs...");
  const balls: BallRecord[] = parse(ballCsv, { columns: true, skip_empty_lines: true });
  const matches: MatchRecord[] = parse(matchCsv, { columns: true, skip_empty_lines: true });

  // Build short name -> full name mapping from player details
  const fullNameMap = new Map<string, string>();
  const playerDetails: { Name: string; longName: string }[] = parse(playerDetailsCsv, { columns: true, skip_empty_lines: true });
  for (const pd of playerDetails) {
    if (pd.Name && pd.longName && pd.Name !== pd.longName) {
      fullNameMap.set(pd.Name.trim(), pd.longName.trim());
    }
  }

  // Supplementary full names for players not in the 2024 details CSV
  const EXTRA_FULL_NAMES: Record<string, string> = {
    "V Suryavanshi": "Vaibhav Suryavanshi",
    "Tilak Varma": "Tilak Varma",
    "Abhishek Sharma": "Abhishek Sharma",
    "T Stubbs": "Tristan Stubbs",
    "PK Garg": "Priyansh Arya",
    "Sai Sudharsan": "Sai Sudharsan",
    "R Parag": "Riyan Parag",
    "N Rana": "Nitish Rana",
    "Arshdeep Singh": "Arshdeep Singh",
    "Harpreet Brar": "Harpreet Brar",
    "Avesh Khan": "Avesh Khan",
    "Noor Ahmad": "Noor Ahmad",
    "Anrich Nortje": "Anrich Nortje",
    "Navdeep Saini": "Navdeep Saini",
    "Sandeep Sharma": "Sandeep Sharma",
    "Mukesh Kumar": "Mukesh Kumar",
    "T Natarajan": "Thangarasu Natarajan",
    "K Gowtham": "Krishnappa Gowtham",
    "Washington Sundar": "Washington Sundar",
    "Shahbaz Ahmed": "Shahbaz Ahmed",
    "Ravi Bishnoi": "Ravi Bishnoi",
    "Rahul Chahar": "Rahul Chahar",
    "M Prasidh Krishna": "Prasidh Krishna",
    "Akash Deep": "Akash Deep",
    "Yash Dayal": "Yash Dayal",
    "Tushar Deshpande": "Tushar Deshpande",
    "Mohsin Khan": "Mohsin Khan",
    "Umran Malik": "Umran Malik",
    "Rinku Singh": "Rinku Singh",
    "Dhruv Jurel": "Dhruv Jurel",
    "Jitesh Sharma": "Jitesh Sharma",
    "M Shahrukh Khan": "Shahrukh Khan",
    "Rashid Khan": "Rashid Khan",
    "Phil Salt": "Phil Salt",
    "Heinrich Klaasen": "Heinrich Klaasen",
    "Travis Head": "Travis Head",
    "T Head": "Travis Head",
    "Venkatesh Iyer": "Venkatesh Iyer",
    "Ramandeep Singh": "Ramandeep Singh",
    "Shivam Dube": "Shivam Dube",
    "S Dube": "Shivam Dube",
    "Varun Chakaravarthy": "Varun Chakaravarthy",
    "Varun CV": "Varun Chakaravarthy",
    // 2025 debutants and previously unmapped players
    "A Mhatre": "Ayush Mhatre",
    "AJ Finch": "Aaron Finch",
    "AT Rayudu": "Ambati Rayudu",
    "Abdul Samad": "Abdul Samad",
    "Abishek Porel": "Abishek Porel",
    "Akash Madhwal": "Akash Madhwal",
    "Akash Singh": "Akash Singh",
    "Aman Hakim Khan": "Aman Hakim Khan",
    "Aniket Verma": "Aniket Verma",
    "Anmolpreet Singh": "Anmolpreet Singh",
    "Anuj Rawat": "Anuj Rawat",
    "Arjun Tendulkar": "Arjun Tendulkar",
    "Arshad Khan": "Arshad Khan",
    "Ashutosh Sharma": "Ashutosh Sharma",
    "Ashwani Kumar": "Ashwani Kumar",
    "Atharva Taide": "Atharva Taide",
    "Azmatullah Omarzai": "Azmatullah Omarzai",
    "Basil Thampi": "Basil Thampi",
    "CJ Jordan": "Chris Jordan",
    "D Pretorius": "Dwaine Pretorius",
    "DJ Bravo": "Dwayne Bravo",
    "DR Sams": "Daniel Sams",
    "DS Rathi": "Dhruv Rathi",
    "E Lewis": "Evin Lewis",
    "E Malinga": "Eshan Malinga",
    "Fazalhaq Farooqi": "Fazalhaq Farooqi",
    "HR Shokeen": "Hrithik Shokeen",
    "Harpreet Singh": "Harpreet Singh",
    "Harshit Rana": "Harshit Rana",
    "Ishan Kishan": "Ishan Kishan",
    "J Little": "Joshua Little",
    "J Suchith": "Jagadeesha Suchith",
    "JC Archer": "Jofra Archer",
    "JO Holder": "Jason Holder",
    "JP Inglis": "Josh Inglis",
    "JR Hazlewood": "Josh Hazlewood",
    "KA Pollard": "Kieron Pollard",
    "KK Nair": "Karun Nair",
    "KL Rahul": "Lokesh Rahul",
    "Kartik Tyagi": "Kartik Tyagi",
    "Kuldeep Yadav": "Kuldeep Yadav",
    "Lalit Yadav": "Lalit Yadav",
    "M Ashwin": "Murugan Ashwin",
    "MG Bracewell": "Michael Bracewell",
    "MS Dhoni": "Mahendra Singh Dhoni",
    "MW Short": "Matthew Short",
    "Mandeep Singh": "Mandeep Singh",
    "Mayank Dagar": "Mayank Dagar",
    "Mohammad Nabi": "Mohammad Nabi",
    "Mohammed Shami": "Mohammed Shami",
    "Mohammed Siraj": "Mohammed Siraj",
    "Mukesh Choudhary": "Mukesh Choudhary",
    "Mustafizur Rahman": "Mustafizur Rahman",
    "N Jagadeesan": "Narayan Jagadeesan",
    "Naman Dhir": "Naman Dhir",
    "Naveen-ul-Haq": "Naveen-ul-Haq",
    "Nithish Kumar Reddy": "Nithish Kumar Reddy",
    "OC McCoy": "Obed McCoy",
    "OF Smith": "Odean Smith",
    "P Simran Singh": "Prabhsimran Singh",
    "PBB Rajapaksa": "Bhanuka Rajapaksa",
    "PHKD Mendis": "Kusal Mendis",
    "PWH de Silva": "Wanindu Hasaranga",
    "Prince Yadav": "Prince Yadav",
    "Priyansh Arya": "Priyansh Arya",
    "RD Rickelton": "Ryan Rickelton",
    "RP Meredith": "Riley Meredith",
    "RV Patel": "Ravi Patel",
    "RV Uthappa": "Robin Uthappa",
    "Rahmanullah Gurbaz": "Rahmanullah Gurbaz",
    "Rasikh Salam": "Rasikh Salam",
    "SN Khan": "Shah Nawaz Khan",
    "SP Jackson": "Sheldon Jackson",
    "SW Billings": "Sam Billings",
    "Sameer Rizvi": "Sameer Rizvi",
    "Sanvir Singh": "Sanvir Singh",
    "Shashank Singh": "Shashank Singh",
    "Shivam Mavi": "Shivam Mavi",
    "Shubman Gill": "Shubman Gill",
    "Sikandar Raza": "Sikandar Raza",
    "Simarjeet Singh": "Simarjeet Singh",
    "Suyash Sharma": "Suyash Sharma",
    "Swapnil Singh": "Swapnil Singh",
    "TG Southee": "Tim Southee",
    "TS Mills": "Tymal Mills",
    "V Nigam": "Vaibhav Nigam",
    "V Puthur": "Vyshak Vijaykumar",
    "Vijaykumar Vyshak": "Vijaykumar Vyshak",
    "WD Parnell": "Wayne Parnell",
    "Yash Thakur": "Yash Thakur",
    "Yudhvir Singh": "Yudhvir Singh",
    "Zeeshan Ansari": "Zeeshan Ansari",
  };
  for (const [short, full] of Object.entries(EXTRA_FULL_NAMES)) {
    if (!fullNameMap.has(short)) fullNameMap.set(short, full);
  }

  // Build match_id -> year and match_id -> teams mapping
  const matchYear = new Map<string, string>();
  const matchTeams = new Map<string, { team1: string; team2: string; team1Players: string[]; team2Players: string[] }>();

  for (const m of matches) {
    const year = m.match_date?.split("-")[0];
    if (!year || !TARGET_SEASONS.includes(year)) continue;
    matchYear.set(m.match_number, year);
    matchTeams.set(m.match_number, {
      team1: normalizeTeam(m.team1),
      team2: normalizeTeam(m.team2),
      team1Players: m.team1_players?.split(",").map((s) => s.trim()) ?? [],
      team2Players: m.team2_players?.split(",").map((s) => s.trim()) ?? [],
    });
  }

  // player -> season -> data
  const playerData = new Map<string, Map<string, PlayerSeasonData>>();
  // player -> teams they played for (most recent)
  const playerTeams = new Map<string, string>();

  console.log(`Processing ${balls.length} ball records...`);

  for (const ball of balls) {
    const year = matchYear.get(ball.ID);
    if (!year) continue;

    const matchInfo = matchTeams.get(ball.ID);
    if (!matchInfo) continue;

    const battingTeam = normalizeTeam(ball.BattingTeam);
    const bowlingTeam = battingTeam === matchInfo.team1 ? matchInfo.team2 : matchInfo.team1;
    const inningsKey = `${ball.ID}-${ball.Innings}`;

    // Process batter
    const batter = ball.Batter.trim();
    if (batter) {
      if (!playerData.has(batter)) playerData.set(batter, new Map());
      const seasons = playerData.get(batter)!;
      if (!seasons.has(year)) seasons.set(year, newPlayerSeasonData(battingTeam));
      const sd = seasons.get(year)!;

      sd.battingMatches.add(ball.ID);
      playerTeams.set(batter, battingTeam);

      // Track innings
      if (!sd.inningsBatting.has(inningsKey)) {
        sd.inningsBatting.set(inningsKey, { runs: 0 });
        sd.battingInnings++;
      }

      const batsmanRun = parseInt(ball.BatsmanRun) || 0;
      sd.runs += batsmanRun;
      sd.inningsBatting.get(inningsKey)!.runs += batsmanRun;

      // Count legal deliveries faced (not wides)
      if (ball.ExtraType !== "wide") {
        sd.ballsFaced++;
      }

      // Check if this batter got out
      if (ball.IsWicketDelivery === "1" && ball.PlayerOut?.trim() === batter) {
        sd.outs++;
      }

      // Batting milestones: sixes and fours
      if (ball.BatsmanRun === "6") {
        sd.sixes++;
      }
      if (ball.BatsmanRun === "4") {
        sd.fours++;
      }
    }

    // Process non-striker
    const nonStriker = ball.NonStriker.trim();
    if (nonStriker) {
      if (!playerData.has(nonStriker)) playerData.set(nonStriker, new Map());
      const nsSeason = playerData.get(nonStriker)!;
      if (!nsSeason.has(year)) nsSeason.set(year, newPlayerSeasonData(battingTeam));
      const nsData = nsSeason.get(year)!;
      nsData.ballsAsNonStriker++;
      playerTeams.set(nonStriker, battingTeam);
    }

    // Process bowler
    const bowler = ball.Bowler.trim();
    if (bowler) {
      if (!playerData.has(bowler)) playerData.set(bowler, new Map());
      const seasons = playerData.get(bowler)!;
      if (!seasons.has(year)) seasons.set(year, newPlayerSeasonData(bowlingTeam));
      const sd = seasons.get(year)!;

      sd.bowlingMatches.add(ball.ID);
      playerTeams.set(bowler, bowlingTeam);

      if (!sd.inningsBowling.has(inningsKey)) {
        sd.inningsBowling.set(inningsKey, { wickets: 0, runs: 0 });
        sd.bowlingInnings++;
      }

      const totalRun = parseInt(ball.TotalRun) || 0;
      sd.runsConceded += totalRun;
      sd.inningsBowling.get(inningsKey)!.runs += totalRun;

      // Count legal deliveries (not wides, not no-balls for ball count)
      if (!ball.ExtraType || ball.ExtraType === "legbye" || ball.ExtraType === "bye") {
        sd.ballsBowled++;
      }

      // Wickets (not run-outs)
      if (ball.IsWicketDelivery === "1" && ball.Kind !== "run out" && ball.Kind !== "retired hurt") {
        sd.wickets++;
        sd.inningsBowling.get(inningsKey)!.wickets++;
      }

      // Bowling extras and dot balls
      if (ball.ExtraType === "wide") {
        sd.widesConceded++;
      }
      if (ball.ExtraType === "noball") {
        sd.noballsConceded++;
      }
      if (ball.TotalRun === "0" && ball.ExtraType === "") {
        sd.dotBalls++;
      }
      if (ball.ExtraType === "legbye") {
        sd.legByes++;
      }
      if (ball.ExtraType === "bye") {
        sd.byes++;
      }
    }

    // Process fielding stats on wicket deliveries
    if (ball.IsWicketDelivery === "1" && ball.FieldersInvolved) {
      const fielders = ball.FieldersInvolved.split(",").map((f) => f.trim()).filter((f) => f.length > 0);
      for (const fielder of fielders) {
        if (!playerData.has(fielder)) playerData.set(fielder, new Map());
        const fSeasons = playerData.get(fielder)!;
        if (!fSeasons.has(year)) fSeasons.set(year, newPlayerSeasonData(bowlingTeam));
        const fd = fSeasons.get(year)!;
        playerTeams.set(fielder, bowlingTeam);

        if (ball.Kind === "caught") {
          fd.catches++;
        } else if (ball.Kind === "run out") {
          fd.runOuts++;
        } else if (ball.Kind === "stumped") {
          fd.stumpings++;
        }
      }
    }
  }

  // Finalize per-innings stats (50s, 100s, highest score, best figures)
  for (const [, seasons] of playerData) {
    for (const [, sd] of seasons) {
      for (const [, inn] of sd.inningsBatting) {
        if (inn.runs >= 100) sd.hundreds++;
        else if (inn.runs >= 50) sd.fifties++;
        if (inn.runs > sd.highestScore) sd.highestScore = inn.runs;
      }
      for (const [, inn] of sd.inningsBowling) {
        if (inn.wickets > sd.bestWickets || (inn.wickets === sd.bestWickets && inn.runs < sd.bestRuns)) {
          sd.bestWickets = inn.wickets;
          sd.bestRuns = inn.runs;
        }
        if (inn.wickets >= 5) sd.fiveWickets++;
        else if (inn.wickets >= 4) sd.fourWickets++;
      }
    }
  }

  // Determine player primary role based on stats
  function determinePrimaryRole(seasons: Map<string, PlayerSeasonData>): "Batter" | "Bowler" {
    let totalBattingInnings = 0;
    let totalBowlingInnings = 0;
    for (const [, sd] of seasons) {
      totalBattingInnings += sd.battingInnings;
      totalBowlingInnings += sd.bowlingInnings;
    }
    // Bowler: more bowling innings than batting, or very close
    if (totalBowlingInnings > totalBattingInnings * 0.8) {
      return "Bowler";
    }
    return "Batter";
  }

  // Determine secondary role
  function determineSecondaryRole(
    name: string,
    primaryRole: "Batter" | "Bowler",
    seasons: Map<string, PlayerSeasonData>
  ): "Wicket-Keeper" | "All-Rounder" | undefined {
    if (KNOWN_KEEPERS.has(name)) return "Wicket-Keeper";

    let totalBattingInnings = 0;
    let totalBowlingInnings = 0;
    let totalRuns = 0;
    let totalWickets = 0;
    for (const [, sd] of seasons) {
      totalBattingInnings += sd.battingInnings;
      totalBowlingInnings += sd.bowlingInnings;
      totalRuns += sd.runs;
      totalWickets += sd.wickets;
    }
    const hasMeaningfulBatting = totalBattingInnings >= 5 && totalRuns >= 100;
    const hasMeaningfulBowling = totalBowlingInnings >= 5 && totalWickets >= 5;
    if (hasMeaningfulBatting && hasMeaningfulBowling) return "All-Rounder";

    return undefined;
  }

  // Known wicket-keepers
  const KNOWN_KEEPERS = new Set([
    "MS Dhoni", "KL Rahul", "RR Pant", "Ishan Kishan", "SV Samson",
    "KS Bharat", "Q de Kock", "JC Buttler", "N Jagadeesan", "Dhruv Jurel",
    "JM Bairstow", "PBB Rajapaksa", "W Saha", "PP Shaw", "KD Karthik",
    "Heinrich Klaasen", "Jitesh Sharma", "RD Gaikwad",
  ]);

  // Build final player objects
  interface OutputPlayer {
    id: string;
    name: string;
    originalName?: string;
    team: string;
    primaryRole: "Batter" | "Bowler";
    secondaryRole?: "Wicket-Keeper" | "All-Rounder" | "Captain" | "Vice-Captain";
    nationality: string;
    seasons: {
      year: string;
      team: string;
      batting?: {
        matches: number;
        innings: number;
        runs: number;
        average: number;
        strikeRate: number;
        fifties: number;
        hundreds: number;
        highestScore: number;
        sixes: number;
        fours: number;
        ballsAsNonStriker: number;
      };
      bowling?: {
        matches: number;
        innings: number;
        wickets: number;
        economy: number;
        average: number;
        bestFigures: string;
        fourWickets: number;
        fiveWickets: number;
        widesConceded: number;
        noballsConceded: number;
        dotBalls: number;
        legByes: number;
        byes: number;
      };
      fielding?: {
        catches: number;
        runOuts: number;
        stumpings: number;
      };
    }[];
  }

  // Known nationalities for prominent players
  const NATIONALITIES: Record<string, string> = {
    "V Kohli": "Indian", "RG Sharma": "Indian", "MS Dhoni": "Indian",
    "RA Jadeja": "Indian", "JJ Bumrah": "Indian", "HH Pandya": "Indian",
    "KL Rahul": "Indian", "RR Pant": "Indian", "SA Yadav": "Indian",
    "SV Samson": "Indian", "Ishan Kishan": "Indian", "YBK Jaiswal": "Indian",
    "Shubman Gill": "Indian", "R Ashwin": "Indian", "Mohammed Siraj": "Indian",
    "Arshdeep Singh": "Indian", "YS Chahal": "Indian", "KH Pandya": "Indian",
    "RD Gaikwad": "Indian", "S Dhawan": "Indian", "PP Shaw": "Indian",
    "Rashid Khan": "Afghan", "AB de Villiers": "South African",
    "F du Plessis": "South African", "DA Miller": "South African",
    "Q de Kock": "South African", "Heinrich Klaasen": "South African",
    "GJ Maxwell": "Australian", "PJ Cummins": "Australian",
    "JR Hazlewood": "Australian", "MA Starc": "Australian",
    "MP Stoinis": "Australian", "T Head": "Australian",
    "JC Buttler": "English", "JM Bairstow": "English",
    "LS Livingstone": "English", "MM Ali": "English",
    "SM Curran": "English", "DJ Mitchell": "New Zealander",
    "TA Boult": "New Zealander", "Mustafizur Rahman": "Bangladeshi",
    "M Pathirana": "Sri Lankan", "DL Chahar": "Indian",
    "Kuldeep Yadav": "Indian", "Axar Patel": "Indian",
    "R Parag": "Indian", "N Rana": "Indian",
    "SP Narine": "West Indian", "AD Russell": "West Indian",
    "DJ Bravo": "West Indian", "KA Pollard": "West Indian",
    "Dhruv Jurel": "Indian", "KD Karthik": "Indian",
    "W Saha": "Indian", "Jitesh Sharma": "Indian",
    "AT Rayudu": "Indian", "M Shahrukh Khan": "Indian",
    "Tilak Varma": "Indian", "Abhishek Sharma": "Indian",
    "T Stubbs": "South African", "PBB Rajapaksa": "Sri Lankan",
  };

  const players: OutputPlayer[] = [];
  const minMatches = 5; // Only include players with at least 5 matches across target seasons

  for (const [name, seasons] of playerData) {
    let totalMatches = 0;
    for (const [, sd] of seasons) {
      totalMatches += Math.max(sd.battingMatches.size, sd.bowlingMatches.size);
    }
    if (totalMatches < minMatches) continue;

    const primaryRole = determinePrimaryRole(seasons);
    const secondaryRole = determineSecondaryRole(name, primaryRole, seasons);

    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const team = playerTeams.get(name) ?? "Unknown";
    const nationality = NATIONALITIES[name] ?? "Indian";

    const seasonList = [];
    for (const yr of TARGET_SEASONS) {
      const sd = seasons.get(yr);
      if (!sd) continue;

      const entry: OutputPlayer["seasons"][0] = { year: yr, team: sd.team };

      if (sd.battingInnings > 0) {
        const avg = sd.outs > 0 ? sd.runs / sd.outs : sd.runs;
        const sr = sd.ballsFaced > 0 ? (sd.runs / sd.ballsFaced) * 100 : 0;
        entry.batting = {
          matches: sd.battingMatches.size,
          innings: sd.battingInnings,
          runs: sd.runs,
          average: Math.round(avg * 100) / 100,
          strikeRate: Math.round(sr * 100) / 100,
          fifties: sd.fifties,
          hundreds: sd.hundreds,
          highestScore: sd.highestScore,
          sixes: sd.sixes,
          fours: sd.fours,
          ballsAsNonStriker: sd.ballsAsNonStriker,
        };
      }

      if (sd.bowlingInnings > 0) {
        const overs = sd.ballsBowled / 6;
        const econ = overs > 0 ? sd.runsConceded / overs : 0;
        const bowlAvg = sd.wickets > 0 ? sd.runsConceded / sd.wickets : 0;
        entry.bowling = {
          matches: sd.bowlingMatches.size,
          innings: sd.bowlingInnings,
          wickets: sd.wickets,
          economy: Math.round(econ * 100) / 100,
          average: Math.round(bowlAvg * 100) / 100,
          bestFigures: sd.bestWickets > 0 ? `${sd.bestWickets}/${sd.bestRuns}` : "0/0",
          fourWickets: sd.fourWickets,
          fiveWickets: sd.fiveWickets,
          widesConceded: sd.widesConceded,
          noballsConceded: sd.noballsConceded,
          dotBalls: sd.dotBalls,
          legByes: sd.legByes,
          byes: sd.byes,
        };
      }

      if (sd.catches + sd.runOuts + sd.stumpings > 0) {
        entry.fielding = {
          catches: sd.catches,
          runOuts: sd.runOuts,
          stumpings: sd.stumpings,
        };
      }

      seasonList.push(entry);
    }

    if (seasonList.length === 0) continue;

    const fullName = fullNameMap.get(name);
    const player: OutputPlayer = { id, name, team, primaryRole, nationality, seasons: seasonList };
    if (secondaryRole) player.secondaryRole = secondaryRole;
    if (fullName) player.originalName = fullName;
    players.push(player);
  }

  // Sort by total runs descending for a nice default order
  players.sort((a, b) => {
    const aRuns = a.seasons.reduce((s, ss) => s + (ss.batting?.runs ?? 0), 0);
    const bRuns = b.seasons.reduce((s, ss) => s + (ss.batting?.runs ?? 0), 0);
    return bRuns - aRuns;
  });

  const outPath = path.join(__dirname, "..", "data", "players.json");
  fs.writeFileSync(outPath, JSON.stringify(players, null, 2));
  console.log(`\nWrote ${players.length} players to ${outPath}`);
  console.log(`Seasons: ${TARGET_SEASONS.join(", ")}`);

  // Summary
  const primaryRoles = { Batter: 0, Bowler: 0 };
  const secondaryRoles: Record<string, number> = {};
  for (const p of players) {
    primaryRoles[p.primaryRole]++;
    if (p.secondaryRole) secondaryRoles[p.secondaryRole] = (secondaryRoles[p.secondaryRole] || 0) + 1;
  }
  console.log("Primary Roles:", primaryRoles);
  console.log("Secondary Roles:", secondaryRoles);

  const teams = new Set(players.map((p) => p.team));
  console.log(`Teams: ${teams.size} (${[...teams].join(", ")})`);
}

main().catch(console.error);
