require('dotenv').config();
const mongoose = require('mongoose');
const { io: Client } = require('socket.io-client');
const { createServerInstance, ensureJwtSecret } = require('./server');
const connectDB = require('./config/db');
const Certificate = require('./models/Certificate');
const User = require('./models/User');

const runExperiment8Tests = async () => {
  console.log('=====================================================');
  console.log('  Experiment 8: Socket.IO Real-Time Test Suite       ');
  console.log('=====================================================\n');

  ensureJwtSecret();
  await connectDB();

  // Create HTTP server with Socket.IO initialized
  const server = createServerInstance();
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Setup] Server running on ${baseUrl} with Socket.IO`);

  const clientSocket = Client(baseUrl, {
    transports: ['websocket'],
    reconnection: false,
  });

  let passCount = 0;
  let failCount = 0;

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`✅ PASS: ${title}`);
      passCount++;
    } else {
      console.error(`❌ FAIL: ${title} -> ${details}`);
      failCount++;
    }
  };

  const makeRequest = async (path, options = {}) => {
    const url = `${baseUrl}${path}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, ok: res.ok, data };
  };

  try {
    // 1. WebSocket Connection Test
    console.log('[Test 1] Establishing WebSocket connection');
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Connection timeout')), 4000);
      clientSocket.on('connect', () => {
        clearTimeout(timer);
        resolve();
      });
      clientSocket.on('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    assert(clientSocket.connected === true, 'Socket.IO client connected successfully');
    assert(typeof clientSocket.id === 'string' && clientSocket.id.length > 0, `Client assigned socket ID: ${clientSocket.id}`);

    // 2. Admin Authentication (JWT for certificate operations)
    console.log('\n[Test 2] Authenticating as Admin');
    const adminLoginRes = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@certified.test',
        password: 'Password123!',
      },
    });
    assert(adminLoginRes.status === 200, 'Admin login succeeded');
    const adminToken = adminLoginRes.data?.token;
    assert(Boolean(adminToken), 'JWT token received');

    // 3. Real-time Certificate Creation Event
    console.log('\n[Test 3] Verifying certificate:created and certificate:activity events');
    const testCertificateId = `CERT-WS-${Date.now()}`;

    const createdEventPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out waiting for certificate:created')), 5000);
      clientSocket.once('certificate:created', (payload) => {
        clearTimeout(timer);
        resolve(payload);
      });
    });

    const activityCreatedPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out waiting for certificate:activity')), 5000);
      clientSocket.once('certificate:activity', (payload) => {
        clearTimeout(timer);
        resolve(payload);
      });
    });

    const createRes = await makeRequest('/api/certificates', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        certificateId: testCertificateId,
        candidateName: 'Realtime Student',
        candidateEmail: 'student@certified.test',
        courseName: 'Full Stack Realtime Engineering',
        certificateTitle: 'Excellence in WebSocket Systems',
        issueDate: '2026-09-20',
        metadata: { grade: 'A+' },
      },
    });

    assert(createRes.status === 201, `Certificate created via API (${createRes.status})`);

    const createdPayload = await createdEventPromise;
    assert(
      (createdPayload?.certificate?.certificateId || createdPayload?.certificateId) === testCertificateId,
      'Socket received certificate:created event with correct certificateId',
      createdPayload?.certificateId
    );
    assert(
      (createdPayload?.certificate?.candidateName || createdPayload?.candidateName) === 'Realtime Student',
      'Socket payload includes candidate name',
      createdPayload?.candidateName
    );

    const activityPayload = await activityCreatedPromise;
    assert(
      activityPayload?.type === 'created' && activityPayload?.certificateId === testCertificateId,
      'Socket received certificate:activity (type: created) event',
      activityPayload?.certificateId
    );

    // 4. Real-time Certificate Revocation Event
    console.log('\n[Test 4] Verifying certificate:revoked event');
    const revokedEventPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out waiting for certificate:revoked')), 5000);
      clientSocket.once('certificate:revoked', (payload) => {
        clearTimeout(timer);
        resolve(payload);
      });
    });

    const revokeRes = await makeRequest(`/api/certificates/${testCertificateId}/revoke`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        reason: 'Automated test revocation for WebSocket validation',
      },
    });

    assert(revokeRes.status === 200, `Certificate revoked via API (${revokeRes.status})`);

    const revokedPayload = await revokedEventPromise;
    const revCert = revokedPayload?.certificate || revokedPayload;
    assert(
      (revCert?.certificateId || revokedPayload?.certificateId) === testCertificateId,
      'Socket received certificate:revoked event with matching certificateId',
      revCert?.certificateId
    );
    assert(
      revCert?.status === 'revoked' || revCert?.effectiveStatus === 'revoked',
      'Socket payload shows status as revoked',
      revCert?.status
    );

    // 5. Clean up test certificate
    await Certificate.deleteOne({ certificateId: testCertificateId });
    console.log('\n[Cleanup] Test certificate deleted from database.');

  } catch (err) {
    console.error('Unexpected error during Experiment 8 test suite:', err);
    failCount++;
  } finally {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close();
  }

  console.log('\n=====================================================');
  console.log(`Results: ${passCount} Passed, ${failCount} Failed`);
  console.log('=====================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
};

runExperiment8Tests();
