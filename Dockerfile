# ==========================================
# Stage 1: Build the React Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy dependencies list and lockfile
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source files
COPY frontend/ ./

# Build production static assets
RUN npm run build

# ==========================================
# Stage 2: Final Production Runtime Environment
# ==========================================
FROM python:3.11-slim AS backend-runner
WORKDIR /app

# Install system dependencies needed for packet sniffing (Scapy)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpcap-dev \
    tcpdump \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install them
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/app/ ./app/

# Copy built frontend assets from Stage 1 into /app/static
COPY --from=frontend-builder /app/frontend/dist ./static

# Expose the port uvicorn will run on
EXPOSE 8000

# Set environment variables (defaults)
ENV AEGIS_USERNAME=admin
ENV AEGIS_PASSWORD=aegis2024
ENV PORT=8000

# Run FastAPI backend
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
