import { notFound } from "next/navigation";
import { deleteBug, updateStatus } from "@/app/actions";
import { api, ApiError, label, STATUSES, type Bug } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function BugPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let bug: Bug;
  try {
    bug = await api<Bug>(`/bugs/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }

  return (
    <article className="card">
      <div className="row">
        <h1 style={{ flex: 1 }}>#{bug.id} {bug.title}</h1>
        <span className={`badge ${bug.severity}`}>{bug.severity}</span>
      </div>
      <p className="meta">
        Status: {label(bug.status)} · Reported {new Date(bug.createdAt).toLocaleString()} · Updated{" "}
        {new Date(bug.updatedAt).toLocaleString()}
      </p>

      <h3>Description</h3>
      <pre>{bug.description || "—"}</pre>
      <h3>Steps to reproduce</h3>
      <pre>{bug.stepsToReproduce || "—"}</pre>

      <hr />
      <div className="row">
        <form action={updateStatus.bind(null, bug.id)} className="row">
          <select name="status" defaultValue={bug.status}>
            {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select>
          <button type="submit">Update status</button>
        </form>
        <form action={deleteBug.bind(null, bug.id)}>
          <button type="submit" className="danger">Delete</button>
        </form>
      </div>
    </article>
  );
}
