# Experiment 10: Docker & DevOps Deployment — College Lab Guide

This guide is specifically designed for presenting and executing **Experiment 10 (Docker & DevOps Deployment)** on a college PC. It provides exact commands, step-by-step instructions, and multiple foolproof ways to prove to faculty/evaluators that the system is genuinely running inside Docker containers and not locally.

---

## 📑 Table of Contents
1. [Prerequisites on College PC](#1-prerequisites-on-college-pc)
2. [Step-by-Step Setup Instructions](#2-step-by-step-setup-instructions)
3. [Live Proof: How to Show It Is Running via Docker](#3-live-proof-how-to-show-it-is-running-via-docker)
4. [Live Demonstration Flow for Faculty](#4-live-demonstration-flow-for-faculty)
5. [Tear Down & Clean Up](#5-tear-down--clean-up)
6. [Troubleshooting Common Lab Issues](#6-troubleshooting-common-lab-issues)

---

## 1. Prerequisites on College PC

1. **Docker Desktop** installed and running (verify the Docker whale icon in the Windows taskbar).
2. **Git** (to clone or pull this repository).
3. **Web Browser** (Chrome / Edge / Firefox).
4. **Internet connection** (to pull base images and communicate with MongoDB Atlas).

---

## 2. Step-by-Step Setup Instructions

### Step 1: Open Terminal / PowerShell in Project Root
```powershell
cd path\to\Certified
```

### Step 2: Create the Environment File
Create a `.env.docker` file in the project root:
```powershell
copy .env.docker.example .env.docker
```
*(On Linux / macOS use `cp .env.docker.example .env.docker`)*

Make sure `.env.docker` has the following values:
```env
BACKEND_PORT=5000
FRONTEND_PORT=3000
MONGODB_URI=mongodb+srv://jaideep:jaideep@certified.jwhfyyx.mongodb.net/test?retryWrites=true&w=majority&appName=Certified
JWT_SECRET=+2OT/AXcqFPe9Be3/cWYNEB1qlDmiMez5tJxcenuOrc=
CLOUDINARY_CLOUD_NAME=yamhcgxd
CLOUDINARY_API_KEY=212554738369365
CLOUDINARY_API_SECRET=iYC49tEXL5WDh_lSYVhokBigo9E
FRONTEND_URL=http://localhost:3000,http://localhost:5173,https://certified-dusky.vercel.app,https://hoppscotch.io
NODE_ENV=production
DEMO_MODE=false
```

### Step 3: Build the Docker Images
```powershell
# 1. Build Backend Container Image
docker build -f Dockerfile.backend -t certified-backend:docker .

# 2. Build Frontend Container Image (Nginx + React SPA)
docker build -f Dockerfile.frontend -t certified-frontend:docker .
```

### Step 4: Launch Containers with Docker Compose
```powershell
docker compose --env-file .env.docker -f docker-compose.docker.yml up -d
```

---

## 3. Live Proof: How to Show It Is Running via Docker

If faculty asks *"How do I know this is running inside Docker and not a standard `npm run dev`?"*, show them these **5 live proofs**:

### Proof 1: Docker CLI Active Container Table
Run:
```powershell
docker compose -f docker-compose.docker.yml ps
```
**What this proves:**
- `certified-backend-docker`: Status `Up (healthy)`, port mapping `0.0.0.0:5000->5000/tcp`.
- `certified-frontend-docker`: Status `Up`, port mapping `0.0.0.0:3000->80/tcp`.
- Shows container IDs, base images, and internal port forwarding.

### Proof 2: Browser Developer Tools (HTTP Response Headers)
1. Open Chrome / Edge and go to **`http://localhost:3000`**.
2. Press **F12** $\rightarrow$ switch to the **Network** tab.
3. Refresh the page (`F5`) and click on the first document request (`localhost`).
4. Look under **Response Headers**:
   ```http
   Server: nginx/1.31.6
   X-Served-By: Docker-Nginx-Frontend-Container
   X-Docker-Architecture: Experiment-10-Certified-DevOps
   ```
**What this proves:**
- A standard Vite dev server sends `Server: Vite` on port `5173`.
- Here, the response is explicitly tagged from **Nginx running inside a Linux Docker container** on port `80`.

### Proof 3: The Dedicated Docker Node Dashboard
Open:
```
http://localhost:5000/
```
In your browser.
**What this proves:**
- Renders the custom **Certified Backend Service - Docker Container Node** dark-mode dashboard showing:
  - Architecture: **Docker (Node.js 20 Alpine)**
  - Container Status: **Active & Operational**
  - WebSockets: **Socket.IO Enabled**
  - Healthcheck: **HTTP 200 OK**

### Proof 4: Stream Live Logs as You Click
Keep this terminal visible on half your screen:
```powershell
docker compose -f docker-compose.docker.yml logs -f
```
Now click anything in the browser or verify a certificate at `http://localhost:3000`.
**What this proves:**
- The terminal will stream real-time HTTP requests with timestamp tags like `certified-backend-docker | 127.0.0.1 - - [POST /api/verify/...]`.

### Proof 5: Execute Commands Inside the Running Container (`docker exec`)
Run:
```powershell
docker exec -it certified-backend-docker uname -a
docker exec -it certified-backend-docker cat /etc/os-release
```
**What this proves:**
- Outputs: `Linux ... Alpine Linux v3.20`.
- Even though your college PC is running Windows, this proves the app is executing inside a sandboxed Linux Alpine container!

---

## 4. Live Demonstration Flow for Faculty

1. **Start the containers** in front of them:
   ```powershell
   docker compose --env-file .env.docker -f docker-compose.docker.yml up -d
   ```
2. **Show container health**:
   ```powershell
   docker compose -f docker-compose.docker.yml ps
   ```
3. **Open the frontend web application**:
   - URL: **`http://localhost:3000`**
   - Demonstrate certificate verification (e.g., search certificate ID `TCRHAMY558G4C`).
   - Show that it loads live from MongoDB Atlas with status `Verified Authentic Certificate ✅`.
4. **Open Backend Docker Node Dashboard**:
   - URL: **`http://localhost:5000`**
5. **Open Docker Health API**:
   - URL: **`http://localhost:3000/health`** (via Nginx reverse proxy)
   - Returns: `{"success":true,"message":"Certified backend is healthy.","environment":"production"}`
6. **Open Network Tab (F12)** to show the `X-Served-By: Docker-Nginx-Frontend-Container` header.

---

## 5. How to Stop and Clean Up Docker

When your viva/evaluation is complete, or if you need to stop the containers to free up system resources and ports, use the following commands:

### A. Clean Shutdown (Recommended)
Stops both containers, removes them, and deletes the virtual bridge network cleanly:
```powershell
docker compose -f docker-compose.docker.yml down
```

**What this does:**
1. Gracefully stops `certified-frontend-docker` (Nginx container).
2. Gracefully stops `certified-backend-docker` (Node.js container).
3. Removes both stopped containers.
4. Removes the internal bridge network (`certified_certified-docker-net`).
5. Completely releases ports **3000** and **5000** back to the host operating system.

---

### B. Temporary Pause (Without Deleting Containers)
If you just want to pause the containers without deleting them:
```powershell
docker compose -f docker-compose.docker.yml stop
```
To restart them later without rebuilding:
```powershell
docker compose -f docker-compose.docker.yml start
```

---

### C. Verify Everything Has Stopped
To confirm that no containers are running and all ports are free:
```powershell
docker compose -f docker-compose.docker.yml ps
```
*(Should return empty).*

---

## 6. Troubleshooting Common Lab Issues

| Problem | Cause | Quick Fix |
|---|---|---|
| `docker: command not found` | Docker Desktop is not open or not installed. | Open Docker Desktop from the Start menu and wait 20s. |
| `port is already allocated: 3000` | Another process is using port 3000. | In `.env.docker`, change `FRONTEND_PORT=3001` and open `http://localhost:3001`. |
| College Wi-Fi blocks MongoDB Atlas | Strict college firewall blocks port 27017. | In `.env.docker`, set `DEMO_MODE=true`. The server will run in standalone demo mode with all features working. |
