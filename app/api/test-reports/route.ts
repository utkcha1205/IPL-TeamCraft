import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { parseReport, parseCoverage, parseFileCoverage, NormalizedResult, FileCoverage } from "@/lib/reportParser";

export async function GET() {
  const results: NormalizedResult[] = [];
  const warnings: string[] = [];
  let coveragePercent: number | null = null;
  let fileCoverage: FileCoverage[] = [];

  const projectRoot = process.cwd();
  const reportsDir = path.join(projectRoot, "test-reports");

  // Read and parse test report files
  try {
    const files = await readdir(reportsDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(reportsDir, file);
        const content = await readFile(filePath, "utf-8");
        const json = JSON.parse(content);
        const result = parseReport(json);
        results.push(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        warnings.push(`Failed to parse ${file}: ${message}`);
      }
    }
  } catch {
    // test-reports/ directory doesn't exist — return empty results
  }

  // Read coverage data
  try {
    const coveragePath = path.join(projectRoot, "coverage", "coverage-summary.json");
    const content = await readFile(coveragePath, "utf-8");
    const json = JSON.parse(content);
    coveragePercent = parseCoverage(json);
    fileCoverage = parseFileCoverage(json);
  } catch {
    // coverage file doesn't exist or is unreadable — leave as null
  }

  return NextResponse.json({ results, coveragePercent, fileCoverage, warnings });
}
