import request from "supertest";
import { createApp } from "../src/app";
import { InMemoryBugRepository, type BugRepository } from "../src/repository";

const fixedNow = () => new Date("2026-01-01T00:00:00.000Z");

function setup() {
  const repo = new InMemoryBugRepository(
    [
      { title: "Crash on save", description: "App crashes", stepsToReproduce: "", severity: "critical" },
      { title: "Typo in footer", description: "Copyright year", stepsToReproduce: "", severity: "low" },
    ],
    fixedNow,
  );
  return { repo, app: createApp(repo) };
}

describe("GET /health", () => {
  it("returns ok", async () => {
    const res = await request(setup().app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("GET /bugs", () => {
  it("lists newest first", async () => {
    const res = await request(setup().app).get("/bugs");
    expect(res.status).toBe(200);
    expect(res.body.map((b: { id: number }) => b.id)).toEqual([2, 1]);
  });

  it("filters by severity and free text", async () => {
    const { app } = setup();
    expect((await request(app).get("/bugs?severity=critical")).body).toHaveLength(1);
    expect((await request(app).get("/bugs?q=FOOTER")).body[0].title).toBe("Typo in footer");
  });

  it("rejects an unknown status filter", async () => {
    const res = await request(setup().app).get("/bugs?status=banana");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation failed");
  });
});

describe("POST /bugs", () => {
  it("creates a bug with defaults", async () => {
    const res = await request(setup().app).post("/bugs").send({ title: "  New bug  " });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: 3,
      title: "New bug",
      severity: "medium",
      status: "open",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it.each([
    [{}, "missing title"],
    [{ title: "ab" }, "too short title"],
    [{ title: "Valid", severity: "urgent" }, "unknown severity"],
    [{ title: "x".repeat(121) }, "too long title"],
  ])("returns 400 for %j (%s)", async (body: object, _reason: string) => {
    const res = await request(setup().app).post("/bugs").send(body);
    expect(res.status).toBe(400);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await request(setup().app)
      .post("/bugs")
      .set("Content-Type", "application/json")
      .send("{not json");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid JSON body");
  });
});

describe("PATCH /bugs/:id", () => {
  it("updates status", async () => {
    const res = await request(setup().app).patch("/bugs/1").send({ status: "resolved" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("resolved");
  });

  it("rejects unknown fields and empty bodies", async () => {
    const { app } = setup();
    expect((await request(app).patch("/bugs/1").send({ id: 99 })).status).toBe(400);
    expect((await request(app).patch("/bugs/1").send({})).status).toBe(400);
  });

  it("returns 404 for a missing bug", async () => {
    expect((await request(setup().app).patch("/bugs/999").send({ status: "closed" })).status).toBe(404);
  });
});

describe("GET/DELETE /bugs/:id", () => {
  it("returns 400 for a non-numeric id", async () => {
    expect((await request(setup().app).get("/bugs/abc")).status).toBe(400);
  });

  it("deletes a bug, then 404s", async () => {
    const { app } = setup();
    expect((await request(app).delete("/bugs/1")).status).toBe(204);
    expect((await request(app).get("/bugs/1")).status).toBe(404);
  });
});

describe("GET /stats", () => {
  it("counts by status and severity", async () => {
    const res = await request(setup().app).get("/stats");
    expect(res.body.total).toBe(2);
    expect(res.body.byStatus.open).toBe(2);
    expect(res.body.bySeverity).toMatchObject({ critical: 1, low: 1, high: 0 });
  });
});

describe("error handling", () => {
  it("hides internal errors behind a 500", async () => {
    const broken: BugRepository = {
      list: jest.fn().mockRejectedValue(new Error("db down")),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    jest.spyOn(console, "error").mockImplementation(() => {});
    const res = await request(createApp(broken)).get("/bugs");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "internal server error" });
  });

  it("returns 404 json for unknown routes", async () => {
    expect((await request(setup().app).get("/nope")).status).toBe(404);
  });
});
