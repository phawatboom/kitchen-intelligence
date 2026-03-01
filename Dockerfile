# Stage 1: Build Frontend
FROM node:18-alpine as frontend-builder
WORKDIR /app/frontend
# Copy package files first for cache efficiency
COPY frontend/package.json frontend/pnpm-lock.yaml ./
# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install
# Copy source and build
COPY frontend/ ./
RUN pnpm run build

# Stage 2: Build Backend & Serve
FROM python:3.9-slim
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY backend/ ./backend/

# Copy Built Frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy SQLite DB if you want to ship a seed (Optional, usually we volume mount this)
# COPY kitchen.db . 

# Expose port
EXPOSE 8000

# Command to run
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
