CREATE TABLE IF NOT EXISTS bugs (
  id                  SERIAL PRIMARY KEY,
  title               VARCHAR(120) NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  steps_to_reproduce  TEXT NOT NULL DEFAULT '',
  severity            TEXT NOT NULL DEFAULT 'medium'
                      CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status              TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bugs_status_idx ON bugs (status);
CREATE INDEX IF NOT EXISTS bugs_severity_idx ON bugs (severity);

INSERT INTO bugs (title, description, steps_to_reproduce, severity)
SELECT 'Login button does nothing on Safari',
       'Clicking ''Sign in'' on Safari 17 has no effect; no network request is sent.',
       E'1. Open /login in Safari 17\n2. Fill valid credentials\n3. Click ''Sign in''',
       'high'
WHERE NOT EXISTS (SELECT 1 FROM bugs);
