CREATE TABLE briefing_points (
    id SERIAL PRIMARY KEY,

    briefing_id INTEGER NOT NULL,

    type TEXT NOT NULL,
    content TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_briefing_points_briefing
        FOREIGN KEY (briefing_id)
        REFERENCES briefings(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_briefing_points_briefing_id
ON briefing_points(briefing_id);