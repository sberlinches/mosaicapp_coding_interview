-- SCHEMAS
CREATE SCHEMA IF NOT EXISTS api;

-- EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS api.employees (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
person_name VARCHAR(50) NOT NULL,
role VARCHAR(50) NOT NULL,
team VARCHAR(50) NOT NULL,
allocation_pct SMALLINT NOT NULL,
start_date DATE NOT NULL,
end_date DATE NOT NULL,
CHECK (allocation_pct BETWEEN 0 AND 100),
CHECK (end_date >= start_date)
);

-- PLAN VERSION TABLES
CREATE TABLE IF NOT EXISTS api.plan_versions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name VARCHAR(100) NOT NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api.plan_version_rows (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
version_id UUID NOT NULL REFERENCES api.plan_versions(id) ON DELETE CASCADE,
row_key UUID NOT NULL,
person_name VARCHAR(50) NOT NULL,
role VARCHAR(50) NOT NULL,
team VARCHAR(50) NOT NULL,
allocation_pct SMALLINT NOT NULL CHECK (allocation_pct BETWEEN 0 AND 100),
start_date DATE NOT NULL,
end_date DATE NOT NULL,
CHECK (end_date >= start_date),
UNIQUE (version_id, row_key)
);

CREATE INDEX IF NOT EXISTS plan_versions_created_at_idx
ON api.plan_versions (created_at);

CREATE INDEX IF NOT EXISTS plan_version_rows_version_id_idx
ON api.plan_version_rows (version_id);

-- EMPLOYEES DATA
INSERT INTO api.employees (person_name, role, team, allocation_pct, start_date, end_date) VALUES
('Priya Sharma', 'Senior Software Engineer', 'Web', 50, '2026-01-05', '2026-06-30'),
('Priya Sharma', 'Senior Software Engineer', 'Platform', 50, '2026-01-05', '2026-06-30'),
('Alex Chen', 'Staff Software Engineer', 'Platform', 100, '2026-01-05', '2026-12-18'),
('Alex Cheng', 'Software Engineer', 'Mobile', 100, '2026-02-02', '2026-12-18'),
('Maria Gutierrez', 'Engineering Manager', 'Web', 100, '2026-01-05', '2026-12-18'),
('Tomás Rivera', 'Senior Software Engineer', 'Web', 100, '2026-01-12', '2026-09-25'),
('Hannah Park', 'Product Designer', 'Design', 75, '2026-01-05', '2026-08-28'),
('David Okafor', 'Senior Software Engineer', 'Mobile', 100, '2026-01-05', '2026-12-18'),
('Lena Fischer', 'Data Engineer', 'Data', 100, '2026-01-19', '2026-12-18'),
('Marcus Webb', 'QA Engineer', 'QA', 50, '2026-01-05', '2026-12-18'),
('Sofia Almeida', 'Senior Product Manager', 'Product', 100, '2026-01-05', '2026-12-18'),
('Jin-ho Kim', 'Site Reliability Engineer', 'Infra', 100, '2026-01-05', '2026-12-18'),
('Rachel Adler', 'Software Engineer', 'Web', 100, '2026-03-02', '2026-12-18'),
('Omar Haddad', 'Software Engineer', 'Platform', 75, '2026-01-26', '2026-10-30'),
('Grace Liu', 'Senior Data Scientist', 'Data', 50, '2026-02-16', '2026-09-11'),
('Nathan Brooks', 'QA Engineer', 'QA', 100, '2026-01-05', '2026-12-18'),
('Isabella Romano', 'Product Designer', 'Design', 100, '2026-01-05', '2026-12-18'),
('Kwame Mensah', 'Senior Software Engineer', 'Platform', 100, '2026-01-05', '2026-12-18'),
('Yuki Tanaka', 'Software Engineer', 'Mobile', 50, '2026-04-06', '2026-12-18'),
('Elena Petrova', 'Staff Software Engineer', 'Data', 100, '2026-01-05', '2026-12-18'),
('Connor O''Brien', 'Software Engineer', 'Web', 100, '2026-01-05', '2026-07-31'),
('Amara Diallo', 'Engineering Manager', 'Mobile', 100, '2026-01-05', '2026-12-18'),
('Felix Wagner', 'Site Reliability Engineer', 'Infra', 50, '2026-01-05', '2026-12-18'),
('Mei Wong', 'Senior Product Manager', 'Product', 75, '2026-01-05', '2026-11-27'),
('Lucas Ferreira', 'Software Engineer', 'Platform', 100, '2026-05-04', '2026-12-18'),
('Aisha Khan', 'Senior QA Engineer', 'QA', 100, '2026-01-05', '2026-12-18'),
('Erik Lindqvist', 'Data Engineer', 'Data', 75, '2026-03-16', '2026-12-18'),
('Chloe Martin', 'Product Designer', 'Design', 50, '2026-06-01', '2026-12-18'),
('Diego Santos', 'Senior Software Engineer', 'Mobile', 100, '2026-01-05', '2026-12-18'),
('Nora Eriksen', 'Software Engineer', 'Web', 50, '2026-02-02', '2026-08-28');
