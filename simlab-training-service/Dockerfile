FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml /app/
COPY simlab_training_service /app/simlab_training_service
COPY alembic.ini /app/alembic.ini
COPY alembic /app/alembic

RUN pip install --no-cache-dir -e .

EXPOSE 8090

CMD ["sh", "-c", "alembic upgrade head && uvicorn simlab_training_service.app:app --host 0.0.0.0 --port 8090"]
