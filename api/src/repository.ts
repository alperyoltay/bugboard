import type { Pool } from "pg";
import {
  SEVERITIES,
  STATUSES,
  type Bug,
  type BugFilter,
  type BugStats,
  type BugUpdate,
  type NewBug,
} from "./types";

/** Storage port: the HTTP layer only talks to this interface. */
export interface BugRepository {
  list(filter: BugFilter): Promise<Bug[]>;
  get(id: number): Promise<Bug | undefined>;
  create(input: NewBug): Promise<Bug>;
  update(id: number, patch: BugUpdate): Promise<Bug | undefined>;
  remove(id: number): Promise<boolean>;
}

export function computeStats(bugs: Bug[]): BugStats {
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as BugStats["byStatus"];
  const bySeverity = Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as BugStats["bySeverity"];
  for (const bug of bugs) {
    byStatus[bug.status]++;
    bySeverity[bug.severity]++;
  }
  return { total: bugs.length, byStatus, bySeverity };
}

/** Used by tests and for running the API without a database. */
export class InMemoryBugRepository implements BugRepository {
  private bugs = new Map<number, Bug>();
  private nextId = 1;

  constructor(seed: NewBug[] = [], private now: () => Date = () => new Date()) {
    seed.forEach((b) => void this.create(b));
  }

  async list({ status, severity, q }: BugFilter): Promise<Bug[]> {
    const needle = q?.toLowerCase();
    return [...this.bugs.values()]
      .filter((b) => !status || b.status === status)
      .filter((b) => !severity || b.severity === severity)
      .filter((b) => !needle || `${b.title} ${b.description}`.toLowerCase().includes(needle))
      .sort((a, b) => b.id - a.id);
  }

  async get(id: number) {
    return this.bugs.get(id);
  }

  async create(input: NewBug): Promise<Bug> {
    const ts = this.now().toISOString();
    const bug: Bug = { id: this.nextId++, ...input, status: "open", createdAt: ts, updatedAt: ts };
    this.bugs.set(bug.id, bug);
    return bug;
  }

  async update(id: number, patch: BugUpdate) {
    const current = this.bugs.get(id);
    if (!current) return undefined;
    const updated: Bug = { ...current, ...patch, updatedAt: this.now().toISOString() };
    this.bugs.set(id, updated);
    return updated;
  }

  async remove(id: number) {
    return this.bugs.delete(id);
  }
}

const COLUMNS = `id, title, description, steps_to_reproduce AS "stepsToReproduce", severity, status,
  created_at AS "createdAt", updated_at AS "updatedAt"`;

const UPDATABLE: Record<keyof BugUpdate, string> = {
  title: "title",
  description: "description",
  stepsToReproduce: "steps_to_reproduce",
  severity: "severity",
  status: "status",
};

/** PostgreSQL adapter. All queries are parameterized. */
export class PgBugRepository implements BugRepository {
  constructor(private pool: Pool) {}

  async list({ status, severity, q }: BugFilter): Promise<Bug[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (status) where.push(`status = $${params.push(status)}`);
    if (severity) where.push(`severity = $${params.push(severity)}`);
    if (q) where.push(`(title ILIKE $${params.push(`%${q}%`)} OR description ILIKE $${params.length})`);
    const sql = `SELECT ${COLUMNS} FROM bugs ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY id DESC`;
    return (await this.pool.query(sql, params)).rows;
  }

  async get(id: number) {
    return (await this.pool.query(`SELECT ${COLUMNS} FROM bugs WHERE id = $1`, [id])).rows[0];
  }

  async create(b: NewBug): Promise<Bug> {
    const sql = `INSERT INTO bugs (title, description, steps_to_reproduce, severity)
      VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`;
    return (await this.pool.query(sql, [b.title, b.description, b.stepsToReproduce, b.severity])).rows[0];
  }

  async update(id: number, patch: BugUpdate) {
    const sets: string[] = [];
    const params: unknown[] = [];
    for (const [key, value] of Object.entries(patch)) {
      sets.push(`${UPDATABLE[key as keyof BugUpdate]} = $${params.push(value)}`);
    }
    params.push(id);
    const sql = `UPDATE bugs SET ${sets.join(", ")}, updated_at = now()
      WHERE id = $${params.length} RETURNING ${COLUMNS}`;
    return (await this.pool.query(sql, params)).rows[0];
  }

  async remove(id: number) {
    return ((await this.pool.query("DELETE FROM bugs WHERE id = $1", [id])).rowCount ?? 0) > 0;
  }
}
