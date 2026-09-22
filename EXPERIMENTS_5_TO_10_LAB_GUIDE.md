# Certified: Digital Certificate Verification System
## Comprehensive Lab Evaluation & Viva Demonstration Guide (Experiments 5 to 10)

This document is prepared specifically for demonstrating and **running** the **Certified** project on a **college lab PC** using deployed cloud services and a web browser without requiring local development software.

---

## 📌 Quick Reference Information

| Key Resource | URL / Value | Purpose |
| :--- | :--- | :--- |
| **Deployed Backend** | `https://truecert-backend.onrender.com` | Live Node.js/Express API on Render |
| **Backend Health Check** | `https://truecert-backend.onrender.com/health` | Service status & security headers |
| **GitHub Repository** | `https://github.com/JaideepGowda2006/Certified` | Source code, Dockerfile & Compose |
| **GitHub Actions (CI/CD)**| `https://github.com/JaideepGowda2006/Certified/actions`| Automated test, build & Docker logs |
| **API Testing Tool** | `https://hoppscotch.io` | Browser-based Postman collection runner |
| **JWT Decoder** | `https://jwt.io` | Live visual JWT token payload inspector |
| **Admin Login** | `admin@certified.test` / `Password123!` | Management & issuance privileges |
| **Student Login** | `student@certified.test` / `Password123!` | Read-only certificate view |

---

## ⏱️ Pre-Evaluation Setup (Do 2 Minutes Before Evaluation)

1. Open `https://truecert-backend.onrender.com/health` in a browser tab to wake up Render from sleep.
2. Open `https://github.com/JaideepGowda2006/Certified/actions` in a second tab.
3. Open `https://hoppscotch.io` in a third tab.
4. Have your credentials ready.

---

## 🔥 HOW TO "RUN" EXPERIMENTS 5 TO 10 LIVE (IF FACULTY DEMANDS EXECUTION)

If the faculty says: *"I don't want to just see screenshots or static screens, execute them right now in front of me,"* follow this exact live execution playbook:

### 1. How to RUN Experiment 5 (REST APIs & Security Middleware) Live
* **Run Live Health Check:** Open `https://truecert-backend.onrender.com/health` in the browser. Show `200 OK`.
* **Run Live Security Audit:** Press `F12` → Network tab → refresh `/health` → show `X-Content-Type-Options: nosniff` and `Strict-Transport-Security` headers.
* **Run Live Input Validation Test:** In Hoppscotch, send `POST /api/auth/login` with `{ "email": "invalid-email" }`. Watch the backend actively reject it with `400 Bad Request`.

### 2. How to RUN Experiment 6 (Auth & JWT RBAC) Live
* **Run Live Login & Token Generation:** In Hoppscotch, send `POST /api/auth/login` with `admin@certified.test` / `Password123!`. Show the live `200 OK` and copy the returned `token`.
* **Run Live JWT Decoding:** Open `https://jwt.io` in a new tab. Paste the token. Show the faculty the decoded JSON payload displaying `{ "id": "...", "role": "admin" }` signed with HMAC-SHA256.
* **Run Live Protected Route Check:** Send `GET /api/certificates` with the Bearer token header (`200 OK`). Remove the header and send again (`401 Unauthorized`).

### 3. How to RUN Experiment 7 (API Validation Suite) Live
* **Execute Hoppscotch Endpoints in Real Time:**
  1. `GET /api/certificates/verify/CERT-1001` → Returns `200 OK` without authentication.
  2. `POST /api/auth/login` → Returns `200 OK` with session token.
  3. `POST /api/certificates` with token → Creates a certificate (`201 Created`).
  4. Negative RBAC Test: Send certificate deletion using a student token → Rejection with `403 Forbidden`.

### 4. How to RUN Experiment 8 (Socket.IO WebSockets) Live
* **Execute Live Dual-Screen Demonstration:**
  1. Open two browser windows side by side: **Admin Dashboard** on the left, **Student Portal** on the right.
  2. On the Admin window, click **Revoke** on any certificate, type a reason (e.g., *"Plagiarism detected"*), and hit Submit.
  3. **Point to the Student window:** **Without refreshing the page**, the certificate badge changes immediately to **Revoked** and a toast alert pops up via Socket.IO!
  4. On the Admin window, click **Remove Revoke (Reinstate)** → watch the Student window immediately flip back to active in real time.

### 5. How to RUN Experiment 9 (CI/CD Pipeline) Live
* **Trigger a Live Cloud Pipeline Run:**
  1. Go to `https://github.com/JaideepGowda2006/Certified/actions`.
  2. Click **CI/CD Pipeline** in the left menu.
  3. Click the **"Run workflow"** button on the right ▾ → click the green **"Run workflow"**.
  4. Watch a new run appear with a yellow spinning indicator. Click into it and watch GitHub spin up an Ubuntu runner, execute 16 integration tests, build Vite frontend, and sync deployments live!

### 6. How to RUN Experiment 10 (Docker) Live on a College PC
Since college lab PCs typically do not have Docker Desktop installed, you have **two bulletproof methods** to run Docker live:

* **Method A: Live GitHub Actions Cloud Runner (Easiest — 60 Seconds)**
  1. Trigger the workflow using the **"Run workflow"** button described in Exp 9 above.
  2. Click on the job titled **`Docker Image Build & Smoke Test`**.
  3. **The faculty will watch the live Linux terminal stream in real time:**
     * `docker build -t certified-backend:latest ./backend` (building the multi-stage Alpine container layers).
     * `docker run -d --name test-backend` (running container alongside MongoDB).
     * `curl -f http://127.0.0.1:5000/health` (automated live container health check succeeding).

* **Method B: Interactive Browser Terminal via GitHub Codespaces (If faculty wants you to type Docker commands)**
  1. Open your repository: `https://github.com/JaideepGowda2006/Certified`.
  2. Click the green **`< > Code`** button → select the **Codespaces** tab.
  3. Click **"Create codespace on main"**.
  4. Within 30 seconds, GitHub launches a full VS Code environment in your browser on an Ubuntu VM with **Docker pre-installed**!
  5. In the built-in terminal at the bottom, type:
     ```bash
     docker compose up --build
     ```
  6. The faculty will see Docker Compose build the image, start MongoDB, connect the backend, and print:
     ```text
     MongoDB connected successfully.
     Certified backend running on port 5000
     ```
  7. In a second terminal tab inside Codespaces, run:
     ```bash
     curl http://localhost:5000/health
     ```
     It will return `{"success": true, "message": "Certified backend is healthy."}`!

---

## 🧪 Detailed Experiment-by-Experiment Reference

---

### 🧪 Experiment 5: Secure RESTful APIs & Middleware

#### Objective
Demonstrate production-grade REST APIs incorporating rate limiting, helmet security headers, structured error handling, and data sanitization.

#### Step-by-Step Actions
1. Open `https://truecert-backend.onrender.com/health` in your browser.
2. Show status `200 OK`:
   ```json
   {
     "success": true,
     "message": "Certified backend is healthy.",
     "environment": "production"
   }
   ```
3. Press `F12` → **Network** tab → refresh the `/health` URL.
4. Click on `health` request → view **Response Headers**:
   * `X-Content-Type-Options: nosniff` (MIME-type sniffing prevention)
   * `Strict-Transport-Security` (Enforced HTTPS)
   * `X-Frame-Options: SAMEORIGIN` (Clickjacking protection)
5. Open `https://truecert-backend.onrender.com/api/certificates/verify/NON-EXISTENT-ID` to show structured `404 Not Found` JSON error handling.

#### Viva Explanation to Faculty
> *"Our REST backend follows strict production standards. We configured Helmet to safeguard HTTP headers against common web vulnerabilities, an Express rate-limiter to prevent denial-of-service abuse, and centralized error handling middleware to sanitize all output responses."*

---

### 🔐 Experiment 6: Authentication & Role-Based Access Control (RBAC) with JWT

#### Objective
Demonstrate token-based user authentication and role-based permissions (Admin vs Student) using JSON Web Tokens.

#### Step-by-Step Actions
1. **Window 1 (Admin Session):**
   * Log in with: `admin@certified.test` / `Password123!`.
   * Admin Dashboard renders administrative capabilities: **"Issue Certificate"**, student selection, and **"Revoke"** actions.
2. **Window 2 (Student Session - Incognito):**
   * Log in with: `student@certified.test` / `Password123!`.
   * Student Portal renders only the certificates awarded to that student. Administrative forms and action buttons are strictly restricted.
3. **Inspect Stored JWT Token:**
   * In either window, press `F12` → **Application** tab (Storage) → **Local Storage**.
   * Select site URL and show the `truecert_token` key.
4. **Decode Token Live:**
   * Paste the token into `https://jwt.io` to demonstrate the cryptographic claims (`id`, `role: "admin"`).

#### Viva Explanation to Faculty
> *"We implemented JSON Web Token (JWT) authentication paired with role-based access middleware. On login, the backend issues an HMAC-SHA256 signed JWT containing the user ID and role (`admin` or `student`). Each protected route validates the token from the Bearer header and blocks unauthorized role actions with a 403 Forbidden status."*

---

### 📬 Experiment 7: REST API Validation using Hoppscotch

#### Objective
Validate functional correctness of all backend endpoints using Hoppscotch (web-based Postman equivalent).

#### Step-by-Step Actions
1. Go to `https://hoppscotch.io`.
2. **Request 1 — Public Certificate Verification:**
   * Method: `GET` | URL: `https://truecert-backend.onrender.com/api/certificates/verify/CERT-1001`
   * Click **Send** → `200 OK` returning verified candidate details **without any auth token**.
3. **Request 2 — User Authentication:**
   * Method: `POST` | URL: `https://truecert-backend.onrender.com/api/auth/login`
   * Headers: `Content-Type: application/json`
   * Body: `{"email":"admin@certified.test", "password":"Password123!"}`
   * Click **Send** → `200 OK` returning user details and signed JWT in `data.token`.
4. **Request 3 — Negative Test (Unauthorized Access):**
   * Method: `POST` | URL: `https://truecert-backend.onrender.com/api/certificates`
   * Click **Send** without Authorization header → `401 Unauthorized` (`"Authentication token required."`).

#### Viva Explanation to Faculty
> *"For Experiment 7, we validated our complete API test suite using Hoppscotch against our live cloud backend. We verified that public certificate verification is accessible without credentials, while administrative operations strictly enforce authentication and reject invalid requests with proper HTTP status codes."*

---

### ⚡ Experiment 8: Real-Time Communication via WebSockets (Socket.IO)

#### Objective
Demonstrate bidirectional, real-time certificate status synchronization between clients without page refreshes.

#### Step-by-Step Actions
1. **Dual Screen View:**
   * Admin Window on left side, Student Portal on right side.
2. **Trigger Real-Time Revocation:**
   * In Admin Window, click **Revoke** on an active certificate.
   * Enter reason: *"Course requirements not fulfilled"* and confirm.
3. **Observe the Live Reaction:**
   * **Do not refresh the right window!**
   * The status badge on the right window immediately transitions from **Valid** to **Revoked**.
   * The revocation reason appears instantly below the certificate.
   * A real-time toast alert triggers in the UI.
4. **Trigger Real-Time Reinstatement:**
   * In Admin window, click **Remove Revoke (Reinstate)**.
   * The student window immediately updates back to active status in real time.

#### Viva Explanation to Faculty
> *"Experiment 8 integrates Socket.IO to enable event-driven communication. When an administrative change occurs on Render, the backend emits `certificate:status_changed` and `certificate:revoked` events. Connected React clients receive this payload via WebSockets and update local component state instantaneously without polling or manual reloading."*

---

### 🚀 Experiment 9: CI/CD Pipeline with GitHub Actions + Render/Vercel

#### Objective
Demonstrate an automated DevOps Continuous Integration & Continuous Deployment pipeline triggered on Git version control events.

#### Step-by-Step Actions
1. Navigate to: `https://github.com/JaideepGowda2006/Certified/actions`.
2. Click on the latest workflow run on the `main` branch (**CI/CD Pipeline**).
3. **Highlight the Passing Automated Stages:**
   * **Backend Syntax, Seed & Integration Tests:** Shows 16/16 unit and integration tests executing against an ephemeral MongoDB container service.
   * **Frontend Dependencies & Production Build:** Verifies dependency resolution and compiles the production Vite bundle.
   * **Continuous Deployment Verification:** Confirms continuous deployment synchronization with Vercel and Render.
4. **Trigger a Run Live:**
   * Click **"Run workflow"** to demonstrate pipeline execution live in front of the faculty.

#### Viva Explanation to Faculty
> *"In Experiment 9, we automated our release lifecycle with GitHub Actions. Every push to the `main` branch automatically triggers our pipeline on an Ubuntu runner, boots an isolated MongoDB service container, runs 16 integration tests, compiles production assets, and triggers automated zero-downtime deployments to Vercel and Render."*

---

### 🐳 Experiment 10: Docker & DevOps Containerization

#### Objective
Demonstrate application containerization, container health checks, and multi-service orchestration.

#### Step-by-Step Actions
1. **Show Automated Container Build & Smoke Test in GitHub Actions:**
   * Click the **`Docker Image Build & Smoke Test`** job in GitHub Actions.
   * Show log steps:
     * `docker build -t certified-backend:latest ./backend` (building container layers).
     * `docker run -d --name test-backend` (running container in isolated environment).
     * `curl -f http://127.0.0.1:5000/health` (automated smoke test confirming container health).
2. **Review Docker Artifacts in GitHub Repository:**
   * Open `backend/Dockerfile`:
     * Node.js 20-alpine base image.
     * Non-root user execution (`USER node`) for container security.
     * Built-in `HEALTHCHECK` command.
     * `EXPOSE 5000`.
   * Open `docker-compose.yml`:
     * Multi-container architecture orchestrating backend and MongoDB.
     * Volume persistence (`mongodb_data`) and dependency health conditions (`depends_on`).

#### Viva Explanation to Faculty
> *"In Experiment 10, we containerized the backend application using Docker. Our Dockerfile adheres to production best practices by utilizing an Alpine base image, executing as a non-privileged user, and configuring an automated health check. Our Docker Compose file manages container networking and persistent database volumes, and our CI pipeline validates the container build and startup on every commit."*

---

## ❓ Frequently Asked Viva Questions & Model Answers

**Q1: Why did you use JWT instead of standard session cookies?**  
> *"JWTs are stateless and self-contained, meaning the backend server does not need to store session state in memory or a database. This allows our backend to easily scale horizontally across multiple cloud instances."*

**Q2: What is the benefit of WebSockets over HTTP polling for certificate updates?**  
> *"HTTP polling requires the client to repeatedly send requests to the server every few seconds, generating unnecessary network overhead and latency. WebSockets maintain a persistent, low-latency, full-duplex TCP connection where the server pushes updates only when an event occurs."*

**Q3: How does your CI/CD pipeline ensure that broken code never reaches production?**  
> *"The GitHub Actions workflow requires all jobs—including syntax verification, 16 integration tests, and the Docker smoke test—to pass before the deployment verification step succeeds. If any test fails, the build halts immediately, preventing faulty code from being released."*

**Q4: Why use a non-root user inside the Dockerfile?**  
> *"Running containers as root poses a security risk. If an attacker discovers a vulnerability within the application, running as a non-privileged user (`USER node`) prevents them from gaining administrative privileges on the host system."*
