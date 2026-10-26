# ========================================================
# Stage 1: Build Vite React Frontend
# ========================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ========================================================
# Stage 2: Python Backend Runtime
# ========================================================
FROM python:3.11-slim AS runner
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application code and data
COPY backend/ ./backend/
COPY data/ ./data/

# Copy compiled frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose production port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

# Launch uvicorn production server
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
