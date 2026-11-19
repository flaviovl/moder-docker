CREATE TABLE IF NOT EXISTS readings (
    id          BIGSERIAL PRIMARY KEY,
    sensor      TEXT             NOT NULL,
    value       DOUBLE PRECISION NOT NULL,
    measured_at TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS readings_measured_at_idx ON readings (measured_at);
