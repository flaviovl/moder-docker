FROM python:latest
WORKDIR /app
ARG PYPI_TOKEN
COPY . .
RUN apt-get update
RUN apt-get install -y build-essential libpq-dev
RUN apt-get clean && rm -rf /var/lib/apt/lists/*
RUN pip install -r requirements.txt
EXPOSE 8000
CMD uvicorn app.main:app --host 0.0.0.0 --port 8000
