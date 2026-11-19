"""Checagem de saúde por linha de comando: python -m app.health (sem curl na imagem)."""

import sys
import urllib.request

try:
    with urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=2) as response:
        sys.exit(0 if response.status == 200 else 1)
except OSError:
    sys.exit(1)
