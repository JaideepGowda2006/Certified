# Certified

Certified is a production-ready full-stack SaaS application for secure digital certificate issuance and public verification.

## Core Capabilities

- JWT-based issuer authentication
- Certificate creation with unique certificate IDs
- SHA-256 tamper detection signature
- QR generation mapped to public verification URLs
- PDF generation and Cloudinary upload
- Public verify route with revocation and expiry handling
- Scan analytics with device/browser/location metadata
- Screenshot-resistance helpers (dynamic watermark, right-click and shortcut hardening, protected viewer)
- Responsive, modern React dashboard and landing pages

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router DOM, Axios, Framer Motion, Recharts, React Icons, React Share
- Backend: Node.js, Express.js, Mongoose
- Database: MongoDB Atlas
- Storage: Cloudinary
- Deploy: Vercel (frontend), Render (backend)

## Folder Structure

```text
./
  frontend/
  backend/
  README.md
  .gitignore
  render.yaml
```

## Environment Variables

### Backend (.env)

Use [backend/.env.example](backend/.env.example).

```env
PORT=5000
MONGODB_URI=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FRONTEND_URL=http://localhost:5173
PDF_ACCESS_TOKEN_TTL_MINUTES=10
DEMO_MODE=true
```

For local demonstrations, `DEMO_MODE=true` bypasses the issuer login barrier and uses a MongoDB-backed demo issuer. QR and PDF assets are stored as generated data URLs instead of being uploaded to Cloudinary. Keep `DEMO_MODE=false` or omit it in production.

### Frontend (.env)

Use [frontend/.env.example](frontend/.env.example).

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_DEMO_MODE=true
```

## Local Development

### 1. Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure Environment

- Create backend `.env` from `backend/.env.example`
- Create frontend `.env` from `frontend/.env.example`

### 3. Run Backend

```bash
cd backend
npm run dev
```

### 4. Run Frontend

```bash
cd frontend
npm run dev
```

Frontend default: `http://localhost:5173`
Backend default: `http://localhost:5000`

## API Route Documentation

Base URL: `/api`

### Auth

- `POST /auth/register`
  - body: `name`, `email`, `password`, `organization`
  - response: `token`, `user`

- `POST /auth/login`
  - body: `email`, `password`
  - response: `token`, `user`

- `GET /auth/me`
  - auth: Bearer token
  - response: authenticated `user`

### Certificates

- `POST /certificates`
  - auth: Bearer token
  - content-type: `multipart/form-data`
  - fields:
    - `candidateName`
    - `certificateTitle`
    - `courseName`
    - `issueDate`
    - `expiryDate` (optional)
    - `issuerName`
    - `grade` (optional)
    - `description` (optional)
    - `logo` file (optional)
    - `signature` file (optional)
  - creates certificate, generates QR/PDF, uploads media to Cloudinary

- `GET /certificates`
  - auth: Bearer token
  - query: `search` (optional)
  - response: all issuer certificates

- `GET /certificates/summary/dashboard`
  - auth: Bearer token
  - response:
    - `totalCertificates`
    - `activeCertificates`
    - `revokedCertificates`
    - `expiredCertificates`
    - `totalScans`
    - `lastIssuedCertificate`
    - `recentActivity`

- `GET /certificates/:certificateId`
  - auth: Bearer token
  - response: specific certificate

- `PATCH /certificates/:certificateId/revoke`
  - auth: Bearer token
  - response: revoked certificate record

### Verification

- `GET /verify/:certificateId`
  - public route
  - logs scan metadata and returns verification payload
  - returns:
    - certificate fields
    - `verification.isAuthentic`
    - `verification.message`

- `GET /verify/:certificateId/pdf?token=<signed>&sessionId=<optional>`
  - public route with signed short-lived token
  - validates token type, certificate match, token freshness, and optional session binding
  - redirects to certificate PDF URL if valid

### Analytics

- `GET /analytics`
  - auth: Bearer token
  - returns:
    - `totalScans`
    - `scansPerDay`
    - `topCertificates`
    - `recentScans`

## Security Implemented

- `helmet` hardening for HTTP headers
- rate limiting (`express-rate-limit`)
- endpoint-level limiters for auth, issue, and verify flows
- JWT auth middleware
- bcrypt password hashing
- SHA-256 certificate hash signature check
- NoSQL-style request sanitization middleware for body/query/params
- signed short-lived PDF access tokens with optional session binding
- uploaded image binary signature verification (PNG/JPEG/WEBP)
- CORS allowlist from `FRONTEND_URL`
- Screenshot-resistance enhancements in verification UI

## Deployment Notes

### Frontend to Vercel

- Root: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Add env var: `VITE_API_BASE_URL=https://<render-backend-domain>/api`
- `frontend/vercel.json` already rewrites client routes to `index.html`

### Backend to Render

- Use `render.yaml` at repo root
- Service root directory: `backend`
- Add production env vars in Render dashboard
- Ensure `FRONTEND_URL` equals deployed Vercel domain

### MongoDB Atlas

- Add production connection string to `MONGODB_URI`
- Whitelist Render outbound IPs or allow broader access with strong auth

### Cloudinary

- Use secure credentials and HTTPS-only URLs

## Build Validation

Run after configuration:

```bash
cd frontend
npm run build

cd ../backend
npm run check
```
