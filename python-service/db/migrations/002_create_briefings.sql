CREATE TABLE briefings (
    id SERIAL PRIMARY KEY,

    company_name TEXT NOT NULL,
    ticker TEXT NOT NULL,
    sector TEXT,
    analyst_name TEXT,

    summary TEXT NOT NULL,
    recommendation TEXT NOT NULL,

    report_generated BOOLEAN NOT NULL DEFAULT FALSE,
    report_path TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);