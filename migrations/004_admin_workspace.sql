ALTER TABLE users ADD COLUMN is_active boolean NOT NULL DEFAULT true;
CREATE TABLE admin_audit (
 id uuid PRIMARY KEY, actor_id uuid NOT NULL REFERENCES users(id),
 action text NOT NULL, entity_id text NOT NULL, detail jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE source_uploads (
 id uuid PRIMARY KEY, file_hash text NOT NULL UNIQUE, filename text NOT NULL,
 data bytea NOT NULL, metadata jsonb NOT NULL, actor_id uuid NOT NULL REFERENCES users(id),
 status text NOT NULL CHECK(status IN ('queued','processing','needs_review','failed','ready')),
 source_id text REFERENCES sources(id), report jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE managed_exams (
 id uuid PRIMARY KEY, title text NOT NULL, subject text NOT NULL, language text NOT NULL,
 minutes integer NOT NULL CHECK(minutes BETWEEN 1 AND 600), snapshot jsonb NOT NULL,
 status text NOT NULL CHECK(status IN ('draft','published','retired')), free_candidate boolean NOT NULL DEFAULT false,
 created_by uuid NOT NULL REFERENCES users(id), version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE content_reports (
 id uuid PRIMARY KEY, attempt_id uuid NOT NULL REFERENCES attempts(id), question_id text NOT NULL,
 user_id uuid REFERENCES users(id), session_hash text NOT NULL REFERENCES sessions(token_hash),
 detail text NOT NULL, status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewing','resolved')),
 resolution text, resolved_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX content_reports_status ON content_reports(status,created_at DESC);
CREATE TABLE ai_usage (
 id uuid PRIMARY KEY, task text NOT NULL, model text NOT NULL, job_id text,
 input_tokens integer NOT NULL DEFAULT 0, output_tokens integer NOT NULL DEFAULT 0,
 cost_usd numeric NOT NULL CHECK(cost_usd>=0), created_at timestamptz NOT NULL DEFAULT now()
);
