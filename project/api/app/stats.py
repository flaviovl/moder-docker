"""Estatísticas das leituras com pandas."""

import pandas as pd

PERCENTILES = (0.5, 0.95)


def summarize(readings: pd.DataFrame, window: str = "30s") -> dict:
    """Resumo por sensor e médias por janela; `readings` tem sensor, value e measured_at."""
    if readings.empty:
        return {"sensors": [], "series": []}

    grouped = readings.groupby("sensor")["value"]
    summary = grouped.agg(["count", "mean", "std", "min", "max"])
    for p in PERCENTILES:
        summary[f"p{int(p * 100)}"] = grouped.quantile(p)
    summary = summary.round(2).reset_index()
    summary["std"] = summary["std"].fillna(0.0)

    series = (
        readings.set_index("measured_at")
        .groupby("sensor")["value"]
        .resample(window)
        .mean()
        .dropna()
        .round(2)
        .reset_index()
    )
    series["measured_at"] = series["measured_at"].map(pd.Timestamp.isoformat)

    return {
        "sensors": summary.to_dict(orient="records"),
        "series": series.to_dict(orient="records"),
    }
