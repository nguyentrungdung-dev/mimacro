UPDATE questions SET content=jsonb_set(content,'{version}',to_jsonb(version));
CREATE TABLE question_revisions (
  question_id text NOT NULL REFERENCES questions(id), version integer NOT NULL,
  content jsonb NOT NULL, status text NOT NULL,
  actor_id uuid REFERENCES users(id), reason text NOT NULL,
  checks jsonb NOT NULL DEFAULT '[]', created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(question_id,version)
);
INSERT INTO question_revisions(question_id,version,content,status,reason)
SELECT id,version,content,status,'Bản nhập ban đầu; chưa nghiệm thu học thuật toàn bộ' FROM questions;
ALTER TABLE content_issues ADD COLUMN resolved_at timestamptz;
ALTER TABLE content_issues ADD COLUMN resolved_by uuid REFERENCES users(id);
ALTER TABLE content_issues ADD COLUMN resolution text;
ALTER TABLE content_issues ADD COLUMN resolved_version integer;
