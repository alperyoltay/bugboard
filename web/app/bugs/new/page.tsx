import { createBug } from "@/app/actions";
import { SEVERITIES } from "@/lib/api";

export default function NewBugPage() {
  return (
    <div className="card">
      <h1>Report a bug</h1>
      <form action={createBug} className="stack">
        <label>
          Title
          <input name="title" required minLength={3} maxLength={120} placeholder="Short, specific summary" />
        </label>
        <label>
          Severity
          <select name="severity" defaultValue="medium">
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>
          What happened? (expected vs. actual)
          <textarea name="description" maxLength={5000} />
        </label>
        <label>
          Steps to reproduce
          <textarea name="stepsToReproduce" maxLength={5000} placeholder={"1. Go to…\n2. Click…\n3. See error"} />
        </label>
        <button type="submit">Create bug</button>
      </form>
    </div>
  );
}
