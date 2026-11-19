"""Acesso ao Postgres. A conexão abre na primeira consulta: a API pode subir antes do banco."""

import os
from functools import cache
from pathlib import Path

import pandas as pd
from psycopg_pool import ConnectionPool


@cache
def pool() -> ConnectionPool:
    kwargs = {}
    if password_file := os.environ.get("DB_PASSWORD_FILE"):
        kwargs["password"] = Path(password_file).read_text().strip()
    return ConnectionPool(os.environ["DATABASE_URL"], kwargs=kwargs, min_size=1, open=True)


def close() -> None:
    if pool.cache_info().currsize:
        pool().close()
        pool.cache_clear()


def readings_since(minutes: int) -> pd.DataFrame:
    with pool().connection() as conn:
        rows = conn.execute(
            "SELECT sensor, value, measured_at FROM readings"
            " WHERE measured_at > now() - make_interval(mins => %s)"
            " ORDER BY measured_at",
            (minutes,),
        ).fetchall()
    return pd.DataFrame(rows, columns=["sensor", "value", "measured_at"])


def totals() -> tuple[int, str | None]:
    with pool().connection() as conn:
        count, last = conn.execute("SELECT count(*), max(measured_at) FROM readings").fetchone()
    return count, last.isoformat() if last else None


def latest(limit: int) -> list[dict]:
    with pool().connection() as conn:
        rows = conn.execute(
            "SELECT sensor, value, measured_at FROM readings ORDER BY id DESC LIMIT %s",
            (limit,),
        ).fetchall()
    return [{"sensor": s, "value": v, "measured_at": t.isoformat()} for s, v, t in rows]
