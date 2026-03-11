CREATE TABLE briefing_metrics (
    id SERIAL PRIMARY KEY,

    briefing_id INTEGER NOT NULL,

    name TEXT NOT NULL,
    value TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_briefing_metrics_briefing
        FOREIGN KEY (briefing_id)
        REFERENCES briefings(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_briefing_metric_name
        UNIQUE (briefing_id, name)
);

CREATE INDEX idx_briefing_metrics_briefing_id
ON briefing_metrics(briefing_id);