import type { Pool } from "pg";
import { PgBugRepository } from "../src/repository";

/** London-school tests: the pg Pool is mocked, we assert on the SQL we send. */
function mockPool(rows: unknown[] = [], rowCount = rows.length) {
  const query = jest.fn().mockResolvedValue({ rows, rowCount });
  return { pool: { query } as unknown as Pool, query };
}

describe("PgBugRepository", () => {
  it("builds a parameterized filter query", async () => {
    const { pool, query } = mockPool();
    await new PgBugRepository(pool).list({ status: "open", severity: "high", q: "login" });
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("status = $1 AND severity = $2 AND (title ILIKE $3 OR description ILIKE $3)");
    expect(params).toEqual(["open", "high", "%login%"]);
  });

  it("never interpolates user input into SQL", async () => {
    const { pool, query } = mockPool();
    await new PgBugRepository(pool).list({ q: "'; DROP TABLE bugs; --" });
    expect(query.mock.calls[0][0]).not.toContain("DROP TABLE");
  });

  it("maps camelCase patch keys to snake_case columns", async () => {
    const { pool, query } = mockPool([{ id: 1 }]);
    await new PgBugRepository(pool).update(1, { stepsToReproduce: "1. click", status: "closed" });
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("steps_to_reproduce = $1, status = $2");
    expect(sql).toContain("WHERE id = $3");
    expect(params).toEqual(["1. click", "closed", 1]);
  });

  it("reports whether a delete removed a row", async () => {
    expect(await new PgBugRepository(mockPool([], 1).pool).remove(1)).toBe(true);
    expect(await new PgBugRepository(mockPool([], 0).pool).remove(1)).toBe(false);
  });
});
