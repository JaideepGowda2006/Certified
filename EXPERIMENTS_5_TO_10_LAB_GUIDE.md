# Certified: Digital Certificate Verification System
## Lab Evaluation & Viva Demonstration Guide (Experiments 5 to 10)

This document is prepared specifically for demonstrating the **Certified** project on a **college lab PC** using only deployed cloud services and a web browser.

---

## 📌 Quick Reference Information

| Key Resource | URL / Value | Purpose |
| :--- | :--- | :--- |
| **Deployed Backend** | `https://truecert-backend.onrender.com` | Live Node.js/Express API on Render |
| **Backend Health Check** | `https://truecert-backend.onrender.com/health` | Service status & security headers |
| **GitHub Repository** | `https://github.com/JaideepGowda2006/Certified` | Source code, Dockerfile & Compose |
| **GitHub Actions (CI/CD)**| `https://github.com/JaideepGowda2006/Certified/actions`| Automated test, build & Docker logs |
| **API Testing Tool** | `https://hoppscotch.io` | Browser-based Postman collection runner |
| **Admin Login** | `admin@certified.test` / `Password123!` | Management & issuance privileges |
| **Student Login** | `student@certified.test` / `Password123!` | Read-only certificate view |

---

## ⏱️ Pre-Evaluation Setup (Do 2 Minutes Before Evaluation)

1. Open `https://truecert-backend.onrender.com/health` in a browser tab to wake up Render from sleep.
2. Open `https://github.com/JaideepGowda2006/Certified/actions` in a second tab.
3. Open `https://hoppscotch.io` in a third tab.

---

## 🧪 Experiment 5: Secure RESTful APIs & Middleware

### Objective
Demonstrate production-grade REST APIs incorporating rate limiting, helmet security headers, structured error handling, and data sanitization.

### Live Demonstration Steps
1. **Show Live Health Check:**
   * Open `https://truecert-backend.onrender.com/health` in your browser.
   * **Result:** Displays status `200 OK`:
     ```json
     {
       "success": true,
       "message": "Certified backend is healthy.",
       "environment": "production"
     }
     ```
2. **Inspect Security Headers:**
   * Press `F12` to open Developer Tools.
   * Go to the **Network** tab and refresh the `/health` URL.
   * Click on the `health` request and view **Response Headers**.
   * **Point out to faculty:**
     * `X-Content-Type-Options: nosniff` (MIME-type sniffing prevention)
     * `Strict-Transport-Security` (Enforced HTTPS)
     * `X-Frame-Options: SAMEORIGIN` (Clickjacking protection)
3. **Structured Error Handling:**
   * Open `https://truecert-backend.onrender.com/api/certificates/verify/NON-EXISTENT-ID`.
   * **Result:** Returns `404 Not Found` with clean JSON `{ "success": false, "message": "Certificate not found." }` rather than an unhandled stack trace.

### Viva Explanation to Faculty
> *"Our REST backend follows strict production standards. We configured Helmet to safeguard HTTP headers against common web vulnerabilities, an Express rate-limiter to prevent denial-of-service abuse, and centralized error handling middleware to sanitize all output responses."*

---

## 🔐 Experiment 6: Authentication & Role-Based Access Control (RBAC) with JWT

### Objective
Demonstrate token-based user authentication and role-based permissions (Admin vs Student) using JSON Web Tokens.

### Live Demonstration Steps
1. **Open Two Browser Windows Side by Side:**
   * **Window 1 (Admin Session):**
     * Log in with: `admin@certified.test` / `Password123!`.
     * **Result:** Admin Dashboard renders administrative capabilities: **"Issue Certificate"**, candidate selection, and **"Revoke"** actions.
   * **Window 2 (Student Session - Incognito):**
     * Log in with: `student@certified.test` / `Password123!`.
     * **Result:** Student Portal renders only the certificates awarded to that student. Administrative forms and action buttons are strictly restricted.
2. **Inspect Stored JWT Token:**
   * In either window, press `F12` → **Application** tab (Storage) → **Local Storage**.
   * Select the site URL and point to the `truecert_token` key.
   * **Explanation:** Show that this cryptographic token holds the encrypted user identity and role payload.

### Viva Explanation to Faculty
> *"We implemented JSON Web Token (JWT) authentication paired with role-based access middleware. On login, the backend issues an HMAC-SHA256 signed JWT containing the user ID and role (`admin` or `student`). Each protected route validates the token from the Bearer header and blocks unauthorized role actions with a 403 Forbidden status."*

---

## 📬 Experiment 7: REST API Validation using Hoppscotch

### Objective
Validate functional correctness of all backend endpoints using Hoppscotch (web-based Postman equivalent).

### Live Demonstration Steps
1. Go to `https://hoppscotch.io`.
2. **Execute Request 1 — Public Certificate Verification:**
   * Method: `GET`
   * URL: `https://truecert-backend.onrender.com/api/certificates/verify/CERT-1001`
   * Click **Send**.
   * **Result:** `200 OK` returning verified candidate name, course, issue date, and cryptographic hash **without requiring any authorization header**.
3. **Execute Request 2 — User Authentication:**
   * Method: `POST`
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
   * **Result:** `200 OK` returning user details and the signed JWT string in `data.token`.
4. **Execute Request 3 — Negative Test (Unauthorized Access):**
   * Method: `POST`
   * URL: `https://truecert-backend.onrender.com/api/certificates`
   * Click **Send** without providing an Authorization header.
   * **Result:** `401 Unauthorized` with `{ "success": false, "message": "Authentication token required." }`.

### Viva Explanation to Faculty
> *"For Experiment 7, we validated our complete API test suite using Hoppscotch against our live cloud backend. We verified that public certificate verification is accessible without credentials, while administrative operations strictly enforce authentication and reject invalid requests with proper HTTP status codes."*

---

## ⚡ Experiment 8: Real-Time Communication via WebSockets (Socket.IO)

### Objective
Demonstrate bidirectional, real-time certificate status synchronization between clients without page refreshes.

### Live Demonstration Steps
1. **Set Up Dual Screen View:**
   * Place the **Admin Window** on the left side of the screen.
   * Place the **Student Portal (or Verification Page)** on the right side.
2. **Trigger Real-Time Revocation:**
   * In the **Admin Window**, locate an active certificate and click **Revoke**.
   * Enter a reason (e.g., *"Course requirements not fulfilled"*) and confirm.
3. **Observe the Live Reaction:**
   * **Do not refresh the right window!**
   * The status badge on the right window immediately transitions from **Valid** to **Revoked**.
   * The revocation reason appears instantly below the certificate.
   * A real-time toast notification alert triggers in the UI.
4. **Trigger Real-Time Reinstatement:**
   * In the Admin window, click **Remove Revoke (Reinstate)**.
   * The student window immediately updates back to active status in real time.

### Viva Explanation to Faculty
> *"Experiment 8 integrates Socket.IO to enable event-driven communication. When an administrative change occurs on Render, the backend emits `certificate:status_changed` and `certificate:revoked` events. Connected React clients receive this payload via WebSockets and update local component state instantaneously without polling or manual reloading."*

---

## 🚀 Experiment 9: CI/CD Pipeline with GitHub Actions + Render/Vercel

### Objective
Demonstrate an automated DevOps Continuous Integration & Continuous Deployment pipeline triggered on Git version control events.

### Live Demonstration Steps
1. Navigate to: `https://github.com/JaideepGowda2006/Certified/actions`.
2. Click on the latest workflow run on the `main` branch (**CI/CD Pipeline**).
3. **Highlight the Passing Automated Stages:**
   * **Backend Syntax, Seed & Integration Tests:** Shows 16/16 unit and integration tests executing against an ephemeral MongoDB container service.
   * **Frontend Dependencies & Production Build:** Verifies dependency resolution and compiles the production Vite bundle.
   * **Continuous Deployment Verification:** Confirms continuous deployment synchronization with Vercel and Render.
4. **Inspect Pipeline Definition:**
   * Open `.github/workflows/ci.yml` in the repository file tree.
   * Point out the trigger configuration (`on: push: branches: [main]`) and the automated test matrix.

### Viva Explanation to Faculty
> *"In Experiment 9, we automated our release lifecycle with GitHub Actions. Every push to the `main` branch automatically triggers our pipeline on an Ubuntu runner, boots an isolated MongoDB service container, runs 16 integration tests, compiles production assets, and triggers automated zero-downtime deployments to Vercel and Render."*

---

## 🐳 Experiment 10: Docker & DevOps Containerization

### Objective
Demonstrate application containerization, container health checks, and multi-service orchestration.

### Live Demonstration Steps
1. **Show Automated Container Build & Smoke Test in GitHub Actions:**
   * In the same GitHub Actions run from Exp 9, click on the **`Docker Image Build & Smoke Test`** job.
   * Expand the log steps to show:
     * `docker build -t certified-backend:latest ./backend` (building the container layers using Node base image).
     * `docker run -d --name test-backend` (running container in isolated environment).
     * `curl -f http://127.0.0.1:5000/health` (automated smoke test confirming container health).
2. **Review Docker Artifacts in GitHub Repository:**
   * Open `backend/Dockerfile`:
     * Point out the **Node.js 20-alpine** base image.
     * Point out the non-root user execution (`USER node`) for container security.
     * Point out the built-in `HEALTHCHECK` command.
     * Point out `EXPOSE 5000`.
   * Open `docker-compose.yml`:
     * Point out the multi-container architecture orchestrating the backend and MongoDB database.
     * Show volume persistence (`mongodb_data`) and dependency health conditions (`depends_on`).

### Viva Explanation to Faculty
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
