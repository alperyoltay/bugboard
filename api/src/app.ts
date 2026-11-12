import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";
import { computeStats, type BugRepository } from "./repository";
import { bugUpdateSchema, filterSchema, idSchema, newBugSchema } from "./validation";

type Handler = (req: Request, res: Response) => Promise<unknown>;
const wrap = (fn: Handler) => (req: Request, res: Response, next: NextFunction) =>
  fn(req, res).catch(next);

export function createApp(repo: BugRepository) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/bugs", wrap(async (req, res) => {
    res.json(await repo.list(filterSchema.parse(req.query)));
  }));

  app.get("/stats", wrap(async (_req, res) => {
    res.json(computeStats(await repo.list({})));
  }));

  app.get("/bugs/:id", wrap(async (req, res) => {
    const bug = await repo.get(idSchema.parse(req.params.id));
    if (!bug) return res.status(404).json({ error: "bug not found" });
    res.json(bug);
  }));

  app.post("/bugs", wrap(async (req, res) => {
    res.status(201).json(await repo.create(newBugSchema.parse(req.body)));
  }));

  app.patch("/bugs/:id", wrap(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const bug = await repo.update(id, bugUpdateSchema.parse(req.body));
    if (!bug) return res.status(404).json({ error: "bug not found" });
    res.json(bug);
  }));

  app.delete("/bugs/:id", wrap(async (req, res) => {
    const removed = await repo.remove(idSchema.parse(req.params.id));
    if (!removed) return res.status(404).json({ error: "bug not found" });
    res.status(204).end();
  }));

  app.use((_req, res) => {
    res.status(404).json({ error: "route not found" });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "validation failed", details: err.issues });
    }
    if (err instanceof SyntaxError) {
      return res.status(400).json({ error: "invalid JSON body" });
    }
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  });

  return app;
}
