export const SEVERITIES = ["low", "medium", "high", "critical"] as const;
export const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

export type Severity = (typeof SEVERITIES)[number];
export type Status = (typeof STATUSES)[number];

export interface Bug {
  id: number;
  title: string;
  description: string;
  stepsToReproduce: string;
  severity: Severity;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface BugStats {
  total: number;
  byStatus: Record<Status, number>;
  bySeverity: Record<Severity, number>;
}

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? res.statusText);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const label = (value: string) => value.replace("_", " ");
