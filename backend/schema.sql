CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(40) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  privacy_level VARCHAR(20) NOT NULL DEFAULT 'PRIVATE' CHECK (privacy_level IN ('PUBLIC', 'FRIENDS_ONLY', 'PRIVATE')),
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tags ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_name_key;

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  description TEXT DEFAULT '',
  tag_id INTEGER REFERENCES tags(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED')),
  estimated_sessions INTEGER NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS active_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  tag_id INTEGER REFERENCES tags(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  planned_duration INTEGER NOT NULL,
  commitment_goal TEXT,
  paused_at TIMESTAMPTZ,
  paused_duration_seconds INTEGER NOT NULL DEFAULT 0,
  session_type VARCHAR(20) NOT NULL DEFAULT 'POMODORO' CHECK (session_type IN ('POMODORO', 'STOPWATCH')),
  last_uninterrupted_start TIMESTAMPTZ,
  verification_prompted_at TIMESTAMPTZ,
  verifications_count INTEGER NOT NULL DEFAULT 0,
  confirmations_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE active_sessions ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;
ALTER TABLE active_sessions ADD COLUMN IF NOT EXISTS paused_duration_seconds INTEGER NOT NULL DEFAULT 0;
ALTER TABLE active_sessions ADD COLUMN IF NOT EXISTS session_type VARCHAR(20) NOT NULL DEFAULT 'POMODORO';
ALTER TABLE active_sessions ADD COLUMN IF NOT EXISTS last_uninterrupted_start TIMESTAMPTZ;
ALTER TABLE active_sessions ADD COLUMN IF NOT EXISTS verification_prompted_at TIMESTAMPTZ;
ALTER TABLE active_sessions ADD COLUMN IF NOT EXISTS verifications_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE active_sessions ADD COLUMN IF NOT EXISTS confirmations_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE active_sessions DROP CONSTRAINT IF EXISTS active_sessions_status_check;
ALTER TABLE active_sessions ADD CONSTRAINT active_sessions_status_check CHECK (status IN ('RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED'));

CREATE TABLE IF NOT EXISTS focus_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  tag_id INTEGER REFERENCES tags(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  session_type VARCHAR(20) NOT NULL DEFAULT 'POMODORO',
  verifications_count INTEGER NOT NULL DEFAULT 0,
  confirmations_count INTEGER NOT NULL DEFAULT 0,
  xp_gained INTEGER NOT NULL,
  commitment_goal TEXT,
  commitment_completed BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS duration_seconds INTEGER NOT NULL DEFAULT 0;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS session_type VARCHAR(20) NOT NULL DEFAULT 'POMODORO';
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS verifications_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS confirmations_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE focus_sessions DROP CONSTRAINT IF EXISTS focus_sessions_duration_minutes_check;

CREATE TABLE IF NOT EXISTS follows (
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE TABLE IF NOT EXISTS weekly_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  target_minutes INTEGER NOT NULL,
  current_minutes INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (user_id, week_start)
);

CREATE TABLE IF NOT EXISTS weekly_reflections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  wins TEXT DEFAULT '',
  blockers TEXT DEFAULT '',
  improvements TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(40) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_start_time ON focus_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_default_name ON tags (LOWER(name)) WHERE is_default = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_user_name ON tags (user_id, LOWER(name)) WHERE user_id IS NOT NULL;

INSERT INTO tags (name, is_default)
VALUES
  ('Study', TRUE),
  ('Work', TRUE),
  ('Gym', TRUE),
  ('Meditate', TRUE),
  ('Other', TRUE)
ON CONFLICT (LOWER(name)) WHERE is_default = TRUE DO NOTHING;
