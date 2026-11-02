CREATE TABLE users (
  id uuid PRIMARY KEY, username text NOT NULL UNIQUE, display_name text NOT NULL,
  password_hash text NOT NULL, role text NOT NULL DEFAULT 'student' CHECK(role IN ('student','admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY, user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL
);
CREATE TABLE auth_limits (key text PRIMARY KEY, failures integer NOT NULL DEFAULT 0, window_started timestamptz NOT NULL DEFAULT now());
CREATE TABLE sources (
  id text PRIMARY KEY, title text NOT NULL, subject text NOT NULL CHECK(subject IN ('micro','macro')),
  language text NOT NULL CHECK(language IN ('en','vi')), chapter integer NOT NULL,
  topic text NOT NULL, file_hash text NOT NULL UNIQUE, question_count integer NOT NULL,
  metadata jsonb NOT NULL, imported_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE questions (
  id text PRIMARY KEY, source_id text NOT NULL REFERENCES sources(id), source_number integer NOT NULL,
  version integer NOT NULL DEFAULT 1, family_key text NOT NULL,
  status text NOT NULL CHECK(status IN ('validated','needs_review','retired')),
  kind text NOT NULL DEFAULT 'choice', difficulty text NOT NULL DEFAULT 'unrated',
  content jsonb NOT NULL, UNIQUE(source_id,source_number,version)
);
CREATE INDEX questions_source ON questions(source_id,status);
CREATE INDEX questions_family ON questions(family_key);
CREATE TABLE media (id text PRIMARY KEY, relative_path text NOT NULL, mime text NOT NULL);
CREATE TABLE content_issues (
  id text PRIMARY KEY, source_id text NOT NULL REFERENCES sources(id), question_id text REFERENCES questions(id),
  kind text NOT NULL, detail text NOT NULL, status text NOT NULL DEFAULT 'open', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE attempts (
  id uuid PRIMARY KEY, session_hash text NOT NULL REFERENCES sessions(token_hash), user_id uuid REFERENCES users(id),
  title text NOT NULL, mode text NOT NULL CHECK(mode IN ('practice','exam')),
  subject text NOT NULL, language text NOT NULL, kind text NOT NULL CHECK(kind IN ('original','mixed')),
  snapshot jsonb NOT NULL, responses jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','completed')),
  started_at timestamptz NOT NULL DEFAULT now(), deadline_at timestamptz NOT NULL,
  submitted_at timestamptz, score numeric, correct_count integer, question_count integer NOT NULL,
  CHECK(question_count>0)
);
CREATE INDEX attempts_user ON attempts(user_id,started_at DESC);
CREATE INDEX attempts_session ON attempts(session_hash,started_at DESC);
