import pandas as pd
import pytest

from app.stats import summarize

pytestmark = pytest.mark.unit


def frame(rows):
    df = pd.DataFrame(rows, columns=["sensor", "value", "measured_at"])
    df["measured_at"] = pd.to_datetime(df["measured_at"], utc=True)
    return df


def test_summary_per_sensor():
    df = frame([
        ("sensor-1", 10.0, "2026-11-19T12:00:00Z"),
        ("sensor-1", 20.0, "2026-11-19T12:00:10Z"),
        ("sensor-2", 5.0, "2026-11-19T12:00:00Z"),
    ])
    result = summarize(df)
    by_sensor = {s["sensor"]: s for s in result["sensors"]}
    assert by_sensor["sensor-1"]["count"] == 2
    assert by_sensor["sensor-1"]["mean"] == 15.0
    assert by_sensor["sensor-1"]["p50"] == 15.0
    assert by_sensor["sensor-2"]["std"] == 0.0


def test_series_averages_each_window():
    df = frame([
        ("sensor-1", 10.0, "2026-11-19T12:00:00Z"),
        ("sensor-1", 20.0, "2026-11-19T12:00:20Z"),
        ("sensor-1", 40.0, "2026-11-19T12:00:40Z"),
    ])
    series = summarize(df, window="30s")["series"]
    assert [p["value"] for p in series] == [15.0, 40.0]


def test_empty_readings():
    assert summarize(frame([])) == {"sensors": [], "series": []}
