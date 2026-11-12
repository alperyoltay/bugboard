import { Pool } from "pg";
import { createApp } from "./app";
import { InMemoryBugRepository, PgBugRepository, type BugRepository } from "./repository";

const port = Number(process.env.PORT ?? 4000);

function buildRepository(): BugRepository {
  if (process.env.DATABASE_URL) {
    console.log("Using PostgreSQL storage");
    return new PgBugRepository(new Pool({ connectionString: process.env.DATABASE_URL }));
  }
  console.log("DATABASE_URL not set - using in-memory storage with demo data");
  return new InMemoryBugRepository([
    {
      title: "Login button does nothing on Safari",
      description: "Clicking 'Sign in' on Safari 17 has no effect; no network request is sent.",
      stepsToReproduce: "1. Open /login in Safari 17\n2. Fill valid credentials\n3. Click 'Sign in'",
      severity: "high",
    },
    {
      title: "Typo on pricing page",
      description: "'Montly' should be 'Monthly'.",
      stepsToReproduce: "1. Open /pricing",
      severity: "low",
    },
  ]);
}

createApp(buildRepository()).listen(port, () => {
  console.log(`Bugboard API listening on http://localhost:${port}`);
});
