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

export interface NewBug {
  title: string;
  description: string;
  stepsToReproduce: string;
  severity: Severity;
}

export type BugUpdate = Partial<NewBug & { status: Status }>;

export interface BugFilter {
  status?: Status;
  severity?: Severity;
  q?: string;
}

export interface BugStats {
  total: number;
  byStatus: Record<Status, number>;
  bySeverity: Record<Severity, number>;
}
