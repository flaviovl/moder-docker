"""Testes contra um Postgres real, indicado por DATABASE_URL, com o schema do db/init.sql."""

import pytest
from fastapi.testclient import TestClient

from app import db
from app.main import app

pytestmark = pytest.mark.integration


@pytest.fixture
def client():
    with db.pool().connection() as conn:
        conn.execute("TRUNCATE readings")
        conn.execute(
            "INSERT INTO readings (sensor, value, measured_at) VALUES"
            " ('sensor-1', 10, now() - interval '20 seconds'),"
            " ('sensor-1', 20, now() - interval '10 seconds'),"
            " ('sensor-2', 30, now())"
        )
    with TestClient(app) as client:
        yield client


def test_stats_summarizes_recent_readings(client):
    response = client.get("/stats", params={"minutes": 5})
    assert response.status_code == 200
    by_sensor = {s["sensor"]: s for s in response.json()["sensors"]}
    assert by_sensor["sensor-1"]["count"] == 2
    assert by_sensor["sensor-1"]["mean"] == 15.0
    assert by_sensor["sensor-2"]["mean"] == 30.0
    assert all(isinstance(s["name"], str) and s["name"] for s in by_sensor.values())


def test_info_counts_all_readings(client):
    response = client.get("/info")
    assert response.status_code == 200
    body = response.json()
    assert body["total_readings"] == 3
    assert body["last_reading_at"] is not None


def test_readings_returns_latest_first(client):
    response = client.get("/readings", params={"limit": 2})
    assert response.status_code == 200
    assert [r["sensor"] for r in response.json()] == ["sensor-2", "sensor-1"]
