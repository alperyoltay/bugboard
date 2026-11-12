import Link from "next/link";
import { api, label, SEVERITIES, STATUSES, type Bug, type BugStats } from "@/lib/api";

export const dynamic = "force-dynamic";

type Search = Promise<{ status?: string; severity?: string; q?: string }>;

export default async function HomePage({ searchParams }: { searchParams: Search }) {
  const { status = "", severity = "", q = "" } = await searchParams;
  const query = new URLSearchParams(
    Object.entries({ status, severity, q }).filter(([, v]) => v) as [string, string][],
  );

  let bugs: Bug[];
  let stats: BugStats;
  try {
    [bugs, stats] = await Promise.all([api<Bug[]>(`/bugs?${query}`), api<BugStats>("/stats")]);
  } catch {
    return (
      <div className="card error">
        Could not reach the API. Start it with <code>npm run dev</code> in <code>api/</code>.
      </div>
    );
  }

  return (
    <>
      <section className="stats">
        <div className="stat"><strong>{stats.total}</strong><span>total</span></div>
        {STATUSES.map((s) => (
          <div className="stat" key={s}><strong>{stats.byStatus[s]}</strong><span>{label(s)}</span></div>
        ))}
      </section>

      <form className="filters">
        <input name="q" placeholder="Search…" defaultValue={q} />
        <select name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <select name="severity" defaultValue={severity}>
          <option value="">All severities</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit">Filter</button>
      </form>

      {bugs.length === 0 ? (
        <p className="meta">No bugs match. 🎉</p>
      ) : (
        <ul className="list">
          {bugs.map((bug) => (
            <li key={bug.id} className="card">
              <Link href={`/bugs/${bug.id}`}>
                <span>
                  <strong>#{bug.id} {bug.title}</strong>
                  <div className="meta">{label(bug.status)} · {new Date(bug.createdAt).toLocaleDateString()}</div>
                </span>
                <span className={`badge ${bug.severity}`}>{bug.severity}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
