# Certified: Digital Certificate Verification System
# Master Lab Showcase & Viva Demonstration Guide (Experiments 5 to 10)

This master document provides click-by-click instructions, screen flows, scripted viva dialogues, and sample questions for demonstrating **Experiments 5 through 10** on a **college lab PC** using only deployed cloud services and a web browser.

---

## 📌 Master Cheat Sheet: URLs & Credentials

| Resource | Value / URL | Usage During Evaluation |
| :--- | :--- | :--- |
| **Backend Docker Dashboard GUI** | `https://truecert-backend.onrender.com/` | Exp 5 & 10: Visual container status & service GUI |
| **Backend Health Check** | `https://truecert-backend.onrender.com/health` | Exp 5: Live API health & security response headers |
| **Public Certificate Verification** | `https://truecert-backend.onrender.com/api/certificates/verify/CERT-1001` | Exp 5 & 7: Public unauthenticated verification |
| **GitHub Actions (CI/CD)** | `https://github.com/JaideepGowda2006/Certified/actions` | Exp 9 & 10: Live automated pipelines & Docker smoke tests |
| **GitHub Repository** | `https://github.com/JaideepGowda2006/Certified` | Exp 9 & 10: Dockerfile, Compose & CI workflow code |
| **API Testing Tool** | `https://hoppscotch.io` | Exp 7: Browser-based Postman collection execution |
| **JWT Decoder** | `https://jwt.io` | Exp 6: Visual proof of token claims & signature |
| **Admin Test Account** | `admin@certified.test` / `Password123!` | Exp 6 & 8: Issuing & revoking certificates |
| **Student Test Account** | `student@certified.test` / `Password123!` | Exp 6 & 8: Viewing awarded certificates (read-only) |

---

## ⏱️ Pre-Evaluation Routine (Do 2 Minutes Before Faculty Arrives)

1. **Wake up the cloud backend:** Open `https://truecert-backend.onrender.com/health` in a browser tab to ensure Render is warm.
2. **Open your presentation tabs:**
   * Tab 1: `https://truecert-backend.onrender.com/` (Docker Service GUI)
   * Tab 2: Your deployed frontend web app (or `https://jwt.io` / Hoppscotch)
   * Tab 3: `https://github.com/JaideepGowda2006/Certified/actions`
   * Tab 4: `https://hoppscotch.io`

---

## 🧪 EXPERIMENT 5: Secure RESTful APIs & Middleware

### 🎯 Aim
Design, build, and secure production-grade RESTful APIs incorporating HTTP security headers, rate limiting, request sanitization, and structured error handling.

### 🖱️ Step-by-Step Showcase Instructions

1. **Step 1 — Show the Live Health Endpoint:**
   * Open: `https://truecert-backend.onrender.com/health`
   * **What Faculty Sees on Screen:**
     ```json
     {
       "success": true,
       "message": "Certified backend is healthy.",
       "environment": "production"
     }
     ```
2. **Step 2 — Demonstrate Production Security Headers (Helmet):**
   * Press **`F12`** to open Browser Developer Tools.
   * Switch to the **Network** tab.
   * Refresh the page (`Ctrl + R`).
   * Click on the `health` request in the list and inspect **Response Headers**:
     * Point out `X-Content-Type-Options: nosniff` *(Prevents MIME-type sniffing attacks)*.
     * Point out `Strict-Transport-Security` *(Enforces HTTPS-only communication)*.
     * Point out `X-Frame-Options: SAMEORIGIN` *(Prevents Clickjacking in malicious iframes)*.
3. **Step 3 — Demonstrate Structured Error Handling (Negative Test):**
   * Change the URL in your browser to an invalid route:
     `https://truecert-backend.onrender.com/api/certificates/verify/INVALID-CERT-999`
   * **What Faculty Sees:** Clean `404 Not Found` JSON `{ "success": false, "message": "Certificate not found." }` instead of an unhandled server stack trace.

### 🗣️ Scripted Dialogue (What to Say)
> *"For Experiment 5, our REST backend follows strict production security guidelines. We integrated Helmet to harden HTTP response headers against common web vulnerabilities, an Express rate limiter that restricts clients to 250 requests per 15-minute window to mitigate DDoS attacks, and centralized error middleware that sanitizes all error responses before sending them to the client."*

### ❓ Sample Viva Questions & Answers
* **Q: What is the purpose of Helmet in Express?**  
  * **A:** *"Helmet is a security middleware collection that automatically sets appropriate HTTP response headers like Content-Security-Policy, HSTS, and X-Content-Type-Options to protect against clickjacking, cross-site scripting, and MIME sniffing."*
* **Q: How are errors handled centrally?**  
  * **A:** *"We use an Express error-handling middleware (`errorHandler`) that intercepts unhandled exceptions, logs the error internally, and formats a clean JSON response with an appropriate HTTP status code while hiding sensitive internal server details."*

---

## 🔐 EXPERIMENT 6: Authentication & Role-Based Access Control (RBAC) with JWT

### 🎯 Aim
Implement secure user authentication and authorization using stateless JSON Web Tokens (JWT) with distinct role permissions (Admin vs Student).

### 🖱️ Step-by-Step Showcase Instructions

1. **Step 1 — Side-by-Side Dual Role Demonstration:**
   * **Window 1 (Admin Login):**
     * Log in with: `admin@certified.test` / `Password123!`.
     * **What Faculty Sees:** The Admin Dashboard displays **"Issue Certificate"**, student selection dropdowns, and certificate **"Revoke"** controls.
   * **Window 2 (Student Login - Incognito Tab):**
     * Log in with: `student@certified.test` / `Password123!`.
     * **What Faculty Sees:** The Student Portal displays **only** the certificates awarded to that specific student. All administrative issue forms and revoke buttons are completely absent.
2. **Step 2 — Inspect Token in LocalStorage:**
   * In either window, press **`F12`** → **Application** tab → **Local Storage**.
   * Click your site URL and point to the key: **`truecert_token`**.
3. **Step 3 — Visual JWT Payload Inspection on jwt.io:**
   * Copy the value of `truecert_token`.
   * Open `https://jwt.io` in a new tab and paste the token into the "Encoded" box.
   * **What Faculty Sees in the Decoded Payload:**
     ```json
     {
       "id": "67...",
       "role": "admin",
       "iat": 1740000000,
       "exp": 1740086400
     }
     ```
   * Point out the `"role": "admin"` claim and show that the token is cryptographically signed with HMAC-SHA256.

### 🗣️ Scripted Dialogue (What to Say)
> *"For Experiment 6, we implemented stateless authentication using JSON Web Tokens. When a user authenticates, the backend signs a cryptographic JWT storing their user ID and verified role. Every protected route validates this token through an `authMiddleware` and enforces permission boundaries with an `adminOnly` guard, blocking unauthorized users with HTTP 401 or 403 status codes."*

### ❓ Sample Viva Questions & Answers
* **Q: Why use JWT instead of server-side sessions?**  
  * **A:** *"JWTs are stateless and self-contained. The server does not need to maintain an in-memory session table or query a session database for every request, enabling seamless horizontal scalability across multiple cloud container instances."*
* **Q: How do you prevent token tampering?**  
  * **A:** *"The token consists of Header, Payload, and a Cryptographic Signature. If a malicious user alters the payload (e.g., changing role from student to admin), the signature verification fails on the backend using our private `JWT_SECRET`, immediately invalidating the request."*

---

## 📬 EXPERIMENT 7: REST API Validation using Hoppscotch

### 🎯 Aim
Systematically test and validate functional correctness, status codes, and security rules across all backend REST endpoints using Hoppscotch (web-based Postman).

### 🖱️ Step-by-Step Showcase Instructions

1. **Step 1 — Open Hoppscotch:**
   * Navigate to `https://hoppscotch.io` in your browser.
2. **Step 2 — Test 1: Public Unauthenticated Verification:**
   * Method: **`GET`**
   * URL: `https://truecert-backend.onrender.com/api/certificates/verify/CERT-1001`
   * Click **Send**.
   * **What Faculty Sees:** Status **`200 OK`**. JSON returns candidate name, course, issue date, and verification hash **without requiring any authorization header**.
3. **Step 3 — Test 2: Admin Authentication (Token Acquisition):**
   * Method: **`POST`**
   * URL: `https://truecert-backend.onrender.com/api/auth/login`
   * Headers: `Content-Type: application/json`
   * Body (JSON):
     ```json
     {
       "email": "admin@certified.test",
       "password": "Password123!"
     }
     ```
   * Click **Send**.
   * **What Faculty Sees:** Status **`200 OK`**. Response returns `success: true` and the signed JWT string in `data.token`.
4. **Step 4 — Test 3: Negative Test (Protected Route Enforcing Auth):**
   * Method: **`POST`**
   * URL: `https://truecert-backend.onrender.com/api/certificates`
   * Click **Send** without providing an Authorization header.
   * **What Faculty Sees:** Status **`401 Unauthorized`** with response:
     ```json
     {
       "success": false,
       "message": "Authentication token required."
     }
     ```

### 🗣️ Scripted Dialogue (What to Say)
> *"For Experiment 7, we validated our complete API suite using Hoppscotch against our live Render deployment. We executed both positive tests (verifying successful 200 responses for public verification and credentialed login) and negative tests (confirming that protected endpoints strictly return 401 Unauthorized when tokens are missing)."*

### ❓ Sample Viva Questions & Answers
* **Q: Why test APIs independently of the frontend?**  
  * **A:** *"API testing verifies backend logic, database operations, security policies, and HTTP contract adherence directly, ensuring reliability regardless of frontend state or client-side validation."*
* **Q: What HTTP status codes does your API use?**  
  * **A:** *"We use standard REST codes: 200 OK for successful reads, 201 Created for new certificates, 400 Bad Request for invalid inputs, 401 Unauthorized for missing tokens, 403 Forbidden for insufficient role permissions, and 404 Not Found for non-existent resources."*

---

## ⚡ EXPERIMENT 8: Real-Time Communication via WebSockets (Socket.IO)

### 🎯 Aim
Enable full-duplex, event-driven real-time communication between server and connected clients using Socket.IO for instantaneous certificate updates without page reloads.

### 🖱️ Step-by-Step Showcase Instructions

1. **Step 1 — Set Up Dual Screen View:**
   * Split your screen into two browser windows:
     * **Left Window:** Admin Dashboard (logged in as Admin)
     * **Right Window:** Student Portal (logged in as Student)
2. **Step 2 — Trigger Real-Time Revocation:**
   * On the **Left Window (Admin)**, locate a certificate and click **Revoke**.
   * Enter a reason: *"Academic dishonesty in final assessment"*.
   * Click **Confirm Revoke**.
3. **Step 3 — Observe the Live Synchronization:**
   * **Do NOT refresh the Right Window (Student)!**
   * **What Faculty Sees:**
     * The status badge on the Student screen instantly transitions from **Valid** to **Revoked** in real time.
     * The revocation reason appears immediately beneath the certificate.
     * A real-time toast alert notification pops up in the corner of the student's screen.
4. **Step 4 — Trigger Real-Time Reinstatement:**
   * On the Admin window, click **Remove Revoke (Reinstate)**.
   * **What Faculty Sees:** Without any reload, the student's certificate immediately updates back to **Valid / Active**!

### 🗣️ Scripted Dialogue (What to Say)
> *"For Experiment 8, we integrated Socket.IO WebSockets. When an Admin revokes or issues a certificate, the Express server emits `certificate:revoked` and `certificate:status_changed` events over a persistent full-duplex TCP connection. The React frontend listens for these events and updates component state in real time without polling or manual page refreshes."*

### ❓ Sample Viva Questions & Answers
* **Q: Why use WebSockets instead of short polling or long polling?**  
  * **A:** *"HTTP polling repeatedly creates and closes TCP connections every few seconds, generating high network latency and server CPU overhead. WebSockets maintain a single persistent connection with minimal frame header overhead (2–10 bytes), enabling sub-millisecond bidirectional event delivery."*
* **Q: What happens if the WebSocket connection drops?**  
  * **A:** *"Socket.IO features built-in automatic reconnection with exponential backoff and transparent fallback to HTTP long-polling if the client network blocks WebSocket upgrades."*

---

## 🚀 EXPERIMENT 9: CI/CD Pipeline with GitHub Actions + Render/Vercel

### 🎯 Aim
Automate the continuous integration, testing, build verification, and deployment lifecycle triggered automatically on Git repository push events.

### 🖱️ Step-by-Step Showcase Instructions

1. **Step 1 — Open GitHub Actions Dashboard:**
   * Navigate to: `https://github.com/JaideepGowda2006/Certified/actions`
2. **Step 2 — Showcase the Automated Pipeline:**
   * Click on the top workflow run on the `main` branch (**CI/CD Pipeline**).
   * **What Faculty Sees on Screen:** Show the passing stages marked with green checkmarks:
     * 🟢 **Backend Syntax, Seed & Integration Tests:** Executes 16 automated integration tests against an ephemeral MongoDB container service.
     * 🟢 **Frontend Dependencies & Production Build:** Installs Vite dependencies and compiles production assets.
     * 🟢 **Continuous Deployment Verification:** Automatically verifies deployment sync with Render (backend) and Vercel (frontend).
3. **Step 3 — Trigger a Live Pipeline Run (Live Demo):**
   * In the Actions tab, click **"CI/CD Pipeline"** in the left menu.
   * Click the **"Run workflow"** button on the right ▾ → click the green **"Run workflow"**.
   * **What Faculty Sees:** A live workflow run starts immediately with a spinning indicator, demonstrating automated DevOps execution in real time!

### 🗣️ Scripted Dialogue (What to Say)
> *"For Experiment 9, we built an automated CI/CD pipeline using GitHub Actions configured in `.github/workflows/ci.yml`. On every commit pushed to the `main` branch, an Ubuntu runner automatically spins up, verifies syntax, starts an isolated MongoDB container, executes 16 automated integration tests, validates the frontend production bundle, and triggers zero-downtime deployment to Render and Vercel."*

### ❓ Sample Viva Questions & Answers
* **Q: What is the purpose of CI/CD?**  
  * **A:** *"Continuous Integration (CI) automatically validates that code changes pass all tests and builds before merging. Continuous Deployment (CD) automatically releases validated code to production environments, reducing human error and deployment time."*
* **Q: How does your pipeline prevent broken code from deploying?**  
  * **A:** *"The deployment verification step depends on all preceding test jobs (`needs: [backend-checks, frontend-checks, docker-build]`). If even a single integration test fails, the pipeline halts immediately with a non-zero exit code, preventing faulty code from reaching production."*

---

## 🐳 EXPERIMENT 10: Docker & DevOps Containerization

### 🎯 Aim
Containerize the full-stack backend application using Docker, enforce container security best practices, configure multi-service orchestration with Docker Compose, and verify container health.

### 🖱️ Step-by-Step Showcase Instructions

1. **Step 1 — Show the Live Container GUI Dashboard (Recommended):**
   * In any browser, open:
     👉 **`https://truecert-backend.onrender.com/`**
   * **What Faculty Sees on Screen:**
     * A modern visual dark-mode dashboard with a glowing green pulse:
       * 🟢 **Container Status:** `Active & Operational`
       * **Architecture:** `Docker (Node.js 20 Alpine)`
       * **Environment:** `production`
       * **WebSockets:** `Socket.IO Enabled`
       * **Health Check:** `HTTP 200 OK`
     * Clickable links to test live `/health` and `/api/certificates/verify/CERT-1001` directly in the browser!
2. **Step 2 — Show Automated Docker Build & Smoke Test in GitHub Actions:**
   * Go to `https://github.com/JaideepGowda2006/Certified/actions`.
   * Click the latest workflow run → click the **`Docker Image Build & Smoke Test`** job.
   * Expand the log steps to show the faculty:
     * `docker build -t certified-backend:latest ./backend` (building the Alpine layers).
     * `docker run -d --name test-backend` (spinning up the isolated container).
     * `curl -f http://127.0.0.1:5000/health` (automated live container health check succeeding).
3. **Step 3 — Inspect Dockerfile & Compose in GitHub Repo:**
   * Open `backend/Dockerfile` in the GitHub file viewer:
     * Point out the lightweight **`node:20-alpine`** base image (under 150 MB).
     * Point out the `HEALTHCHECK` directive monitoring `/health`.
     * Point out `EXPOSE 5000`.
   * Open `docker-compose.yml`:
     * Point out the multi-container configuration linking `certified-backend` and `mongodb` with persistent volume storage (`mongodb_data`).
4. **Step 4 — (Optional) Live Terminal Run in Codespaces / Lab PC:**
   * If the faculty requests live terminal execution:
     ```bash
     docker build -t certified-backend ./backend
     docker run --network host -e DEMO_MODE=true -e NODE_ENV=production -e PORT=5000 certified-backend
     ```
   * It boots in 2 seconds and displays: `Certified backend with Socket.IO listening on 0.0.0.0:5000`.

### 🗣️ Scripted Dialogue (What to Say)
> *"For Experiment 10, we containerized our backend using Docker. We created an optimized Dockerfile using the lightweight Node.js 20 Alpine base image, implemented automated container health checking, and defined a multi-service Docker Compose configuration for container orchestration with MongoDB. Our CI/CD pipeline builds this Docker image and runs a container smoke test on every Git push."*

### ❓ Sample Viva Questions & Answers
* **Q: Why use Alpine Linux as a Docker base image?**  
  * **A:** *"Alpine Linux is a minimal security-oriented distribution. It reduces the container image size from over 1 GB (standard Debian) to under 150 MB, resulting in faster download times, reduced attack surface, and lower cloud storage costs."*
* **Q: What is the difference between `docker build` and `docker compose`?**  
  * **A:** *"`docker build` packages a single application into a standalone container image using instructions from a Dockerfile. `docker compose` is an orchestration tool defined in YAML that coordinates and connects multiple interdependent containers (like our backend and MongoDB database) with shared networks and persistent volumes."*
* **Q: What is the purpose of the `HEALTHCHECK` instruction in a Dockerfile?**  
  * **A:** *"The `HEALTHCHECK` instruction tells the Docker daemon how to test if the containerized process is actually healthy and serving traffic (by probing `/health`), rather than just checking if the process ID is still alive."*

---

## 🏆 Final Summary Table for Faculty Evaluation

| Exp | Core Technology | Primary Proof to Show |
| :---: | :--- | :--- |
| **5** | REST APIs & Helmet | `/health` endpoint + F12 Network Security Headers + Structured 404 Error |
| **6** | JWT & RBAC | Admin vs Student views + LocalStorage `truecert_token` + `jwt.io` payload |
| **7** | Hoppscotch / Postman | Live API execution: 200 OK (Public), 200 OK (Login), 401 (Unauthorized) |
| **8** | WebSockets (Socket.IO) | Dual-window side-by-side live revocation & toast alert without page reload |
| **9** | CI/CD (GitHub Actions) | 4 passing green jobs on GitHub Actions + Live "Run workflow" trigger |
| **10** | Docker & DevOps | Live Container GUI (`/`) + Actions `docker-build` smoke test + `Dockerfile` |
