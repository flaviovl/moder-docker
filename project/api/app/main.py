import socket
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query

from app import db
from app.config import SENSOR_NAMES
from app.stats import summarize


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    db.close()


app = FastAPI(title="Painel de sensores", lifespan=lifespan)


@app.get("/health")
def health() -> dict:
    # Não consulta o banco: diz só se o processo responde.
    return {"status": "ok"}


@app.get("/readings")
def readings(limit: int = Query(20, ge=1, le=500)) -> list[dict]:
    return db.latest(limit)


@app.get("/stats")
def stats(minutes: int = Query(10, ge=1, le=1440), window: str = "30s") -> dict:
    result = summarize(db.readings_since(minutes), window)
    for sensor in result["sensors"]:
        sensor["name"] = SENSOR_NAMES.get(sensor["sensor"], sensor["sensor"])
    return result


@app.get("/info")
def info() -> dict:
    total, last = db.totals()
    # O hostname de um contêiner é o seu id curto: mostra qual contêiner respondeu.
    return {"total_readings": total, "last_reading_at": last, "api_host": socket.gethostname()}
