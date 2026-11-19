import json
from pathlib import Path

# Lido uma vez, na subida: mudar o arquivo exige reiniciar o processo, não basta o --reload.
SENSOR_NAMES: dict[str, str] = json.loads(
    (Path(__file__).resolve().parent.parent / "config" / "sensors.json").read_text()
)
