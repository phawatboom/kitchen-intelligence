# Deployment Guide

The application is containerized using Docker, making it easy to deploy to any cloud provider (VPS, Fly.io, AWS, etc.).

## 1. Docker (Generic VPS)

Use this method for DigitalOcean, Hetzner, AWS EC2, or a home server.

### Prerequisites
*   Server with Docker & Docker Compose installed.

### Steps
1.  **Copy files** to the server (git clone).
2.  **Configure Nginx** (Optional):
    *   Edit `nginx/default.conf` to set your `server_name` (domain).
3.  **Run**:
    ```bash
    docker-compose up -d --build
    ```
4.  **Access**:
    *   Open your browser to your server's IP or Domain.

### Data Persistence
*   The database is stored in a Docker Volume named `kitchen-data`.
*   It persists even if you restart or rebuild containers.

---

## 2. Fly.io (Recommended Cloud)

Fly.io is ideal for this stack because it supports persistent storage volumes for SQLite.

### Prerequisites
*   [Fly CLI installed](https://fly.io/docs/hands-on/install-flyctl/).
*   Fly.io account.

### Steps

1.  **Login**:
    ```bash
    fly auth login
    ```

2.  **Launch (First time)**:
    ```bash
    fly launch --no-deploy
    ```
    *   Select "Yes" to copy the existing `fly.toml` configuration.

3.  **Create Volume**:
    This is critical. It creates the persistent disk for the database.
    ```bash
    # Change 'lhr' to your preferred region (e.g., 'iad' for US East)
    fly volumes create kitchen_data --region lhr --size 1
    ```

4.  **Deploy**:
    ```bash
    fly deploy
    ```

5.  **Access**:
    Your app will be live at `https://collective-kitchen-os.fly.dev`.
