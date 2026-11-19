"""Operação com pandas cheia de pequenas alocações, para comparar a glibc (slim) e a musl (Alpine)."""

import time

import numpy as np
import pandas as pd

rng = np.random.default_rng(42)
rows = 2_000_000
start = time.perf_counter()
df = pd.DataFrame({
    "sensor": rng.integers(0, 1000, rows).astype(str),
    "value": rng.normal(25, 3, rows),
    "measured_at": pd.date_range("2026-01-01", periods=rows, freq="s", tz="UTC"),
})
df.groupby("sensor")["value"].agg(["mean", "std", "min", "max"])
df.set_index("measured_at").groupby("sensor")["value"].resample("10min").mean()
print(f"{time.perf_counter() - start:.3f}")
