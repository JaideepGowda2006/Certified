require('dotenv').config();
const http = require('node:http');
const mongoose = require('mongoose');
const { app, ensureJwtSecret } = require('./server');
const connectDB = require('./config/db');
const Certificate = require('./models/Certificate');
const User = require('./models/User');

const runTests = async () => {
  console.log('--- Starting Experiment 6 Verification Suite ---');

  ensureJwtSecret();
  await connectDB();

  // Start HTTP server on random available port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running on ${baseUrl}`);

  const makeRequest = async (path, options = {}) => {
    const url = `${baseUrl}${path}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const fetchOptions = {
      method: options.method || 'GET',
      headers,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
    };

    const res = await fetch(url, fetchOptions);
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, ok: res.ok, data };
  };

  let testPassed = 0;
  let testFailed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      testPassed += 1;
    } else {
      console.error(`❌ FAIL: ${testName} - ${details}`);
      testFailed += 1;
    }
  };

  let adminToken = '';
  let studentToken = '';

  try {
    // 1. Successful login with valid credentials
    console.log('\n[Scenario 1] Successful login with valid credentials');
    const adminLoginRes = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@certified.test', password: 'Password123!' },
    });
    assert(
      adminLoginRes.status === 200 && adminLoginRes.data?.success && adminLoginRes.data?.token,
      'Admin login returns HTTP 200 and a JWT token',
      JSON.stringify(adminLoginRes.data)
    );
    assert(
      adminLoginRes.data?.user?.email === 'admin@certified.test' && adminLoginRes.data?.user?.role === 'admin',
      'Admin login returns sanitized user profile with admin role'
    );
    assert(
      adminLoginRes.data?.user?.password === undefined,
      'User password is not exposed in login response'
    );
    adminToken = adminLoginRes.data?.token;

    const studentLoginRes = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'student@certified.test', password: 'Password123!' },
    });
    assert(
      studentLoginRes.status === 200 && studentLoginRes.data?.success && studentLoginRes.data?.token,
      'Student login returns HTTP 200 and a JWT token',
      JSON.stringify(studentLoginRes.data)
    );
    assert(
      studentLoginRes.data?.user?.role === 'student',
      'Student login returns user profile with student role'
    );
    studentToken = studentLoginRes.data?.token;

    // 2. Login with incorrect credentials
    console.log('\n[Scenario 2] Login with incorrect credentials');
    const badPasswordRes = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@certified.test', password: 'WrongPassword!' },
    });
    assert(
      badPasswordRes.status === 401 && badPasswordRes.data?.success === false,
      'Login with incorrect password rejected with HTTP 401',
      `Got status ${badPasswordRes.status}`
    );

    const nonExistentUserRes = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'nonexistent@certified.test', password: 'Password123!' },
    });
    assert(
      nonExistentUserRes.status === 401 && nonExistentUserRes.data?.success === false,
      'Login with non-existent email rejected with HTTP 401',
      `Got status ${nonExistentUserRes.status}`
    );

    // 3. Access a protected API with a valid JWT
    console.log('\n[Scenario 3] Access a protected API with a valid JWT');
    const meWithToken = await makeRequest('/api/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      meWithToken.status === 200 && meWithToken.data?.user?.email === 'admin@certified.test',
      'GET /api/auth/me with valid JWT returns HTTP 200 and user data',
      JSON.stringify(meWithToken.data)
    );

    const certsWithToken = await makeRequest('/api/certificates', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      certsWithToken.status === 200 && Array.isArray(certsWithToken.data?.certificates),
      'GET /api/certificates with valid JWT returns HTTP 200',
      `Got status ${certsWithToken.status}`
    );

    // 4. Access the same API without a JWT
    console.log('\n[Scenario 4] Access the same API without a JWT');
    const meWithoutToken = await makeRequest('/api/auth/me');
    assert(
      meWithoutToken.status === 401,
      'GET /api/auth/me without JWT rejected with HTTP 401',
      `Got status ${meWithoutToken.status}`
    );

    const certsWithoutToken = await makeRequest('/api/certificates');
    assert(
      certsWithoutToken.status === 401,
      'GET /api/certificates without JWT rejected with HTTP 401',
      `Got status ${certsWithoutToken.status}`
    );

    const certsWithInvalidToken = await makeRequest('/api/certificates', {
      headers: { Authorization: 'Bearer invalid.fake.token' },
    });
    assert(
      certsWithInvalidToken.status === 401,
      'GET /api/certificates with invalid JWT rejected with HTTP 401',
      `Got status ${certsWithInvalidToken.status}`
    );

    // 5. Access an Admin-only API using a normal User/Student account
    console.log('\n[Scenario 5] Access an Admin-only API using a normal User/Student account');
    // Student tries to revoke a certificate
    const studentRevokeAttempt = await makeRequest('/api/certificates/NON_EXISTENT_ID/revoke', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      studentRevokeAttempt.status === 403,
      'Student attempting PATCH /api/certificates/:id/revoke rejected with HTTP 403 Forbidden',
      `Got status ${studentRevokeAttempt.status}: ${JSON.stringify(studentRevokeAttempt.data)}`
    );

    // Student tries to save template
    const studentTemplateAttempt = await makeRequest('/api/certificates/templates', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { templateName: 'Test', templateJson: { objects: [{ type: 'text' }] } },
    });
    assert(
      studentTemplateAttempt.status === 403,
      'Student attempting POST /api/certificates/templates rejected with HTTP 403 Forbidden',
      `Got status ${studentTemplateAttempt.status}: ${JSON.stringify(studentTemplateAttempt.data)}`
    );

    // Student tries to update certificate
    const studentUpdateAttempt = await makeRequest('/api/certificates/SAMPLE_ID', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { candidateName: 'Hacked Name' },
    });
    assert(
      studentUpdateAttempt.status === 403,
      'Student attempting PUT /api/certificates/:id rejected with HTTP 403 Forbidden',
      `Got status ${studentUpdateAttempt.status}`
    );

    // Student tries to delete certificate
    const studentDeleteAttempt = await makeRequest('/api/certificates/SAMPLE_ID', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      studentDeleteAttempt.status === 403,
      'Student attempting DELETE /api/certificates/:id rejected with HTTP 403 Forbidden',
      `Got status ${studentDeleteAttempt.status}`
    );

    // 6. Access an Admin-only API using an Admin account
    console.log('\n[Scenario 6] Access an Admin-only API using an Admin account');
    // First, let's create a certificate in the database for admin operations testing
    const adminUser = await User.findOne({ email: 'admin@certified.test' });
    const sampleCertId = `EXP6-TEST-${Date.now()}`;
    const testCert = await Certificate.create({
      certificateId: sampleCertId,
      candidateName: 'John Doe',
      certificateTitle: 'Certified Security Specialist',
      courseName: 'Information Security',
      issueDate: new Date(),
      issuerName: 'Certified Authority',
      status: 'active',
      pdfUrl: 'https://example.com/test.pdf',
      qrUrl: 'https://example.com/test.png',
      hashSignature: 'abcdef1234567890abcdef1234567890',
      cloudinaryPublicId: 'test_public_id',
      createdBy: adminUser._id,
    });

    // Admin updates certificate
    const adminUpdateRes = await makeRequest(`/api/certificates/${sampleCertId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { candidateName: 'Johnathan Doe' },
    });
    assert(
      adminUpdateRes.status === 200 && adminUpdateRes.data?.certificate?.candidateName === 'Johnathan Doe',
      'Admin can update certificate metadata with HTTP 200',
      `Got status ${adminUpdateRes.status}: ${JSON.stringify(adminUpdateRes.data)}`
    );

    // Admin revokes certificate
    const adminRevokeRes = await makeRequest(`/api/certificates/${sampleCertId}/revoke`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminRevokeRes.status === 200 && adminRevokeRes.data?.certificate?.status === 'revoked',
      'Admin can revoke certificate with HTTP 200',
      `Got status ${adminRevokeRes.status}: ${JSON.stringify(adminRevokeRes.data)}`
    );

    // Admin deletes certificate
    const adminDeleteRes = await makeRequest(`/api/certificates/${sampleCertId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminDeleteRes.status === 200 && adminDeleteRes.data?.success === true,
      'Admin can delete certificate with HTTP 200',
      `Got status ${adminDeleteRes.status}: ${JSON.stringify(adminDeleteRes.data)}`
    );

    // 7. Verify public certificate verification works without login
    console.log('\n[Scenario 7] Public certificate verification without login');
    // Create a public test certificate
    const publicCertId = `PUB-VERIFY-${Date.now()}`;
    await Certificate.create({
      certificateId: publicCertId,
      candidateName: 'Alice Verified',
      certificateTitle: 'Blockchain Practitioner',
      courseName: 'Cryptography and Security',
      issueDate: new Date(),
      issuerName: 'Certified Authority',
      status: 'active',
      pdfUrl: 'https://example.com/alice.pdf',
      qrUrl: 'https://example.com/alice.png',
      hashSignature: '9876543210abcdef9876543210abcdef',
      cloudinaryPublicId: 'alice_public_id',
      createdBy: adminUser._id,
    });

    // Request verification without Authorization header
    const publicVerifyRes = await makeRequest(`/api/verify/${publicCertId}`);
    assert(
      publicVerifyRes.status === 200 && publicVerifyRes.data?.success === true,
      'GET /api/verify/:id without JWT returns HTTP 200 and verification data',
      `Got status ${publicVerifyRes.status}: ${JSON.stringify(publicVerifyRes.data)}`
    );
    assert(
      publicVerifyRes.data?.certificate?.candidateName === 'Alice Verified',
      'Public verification returns correct certificate candidate name'
    );

    // Request non-existent certificate
    const missingVerifyRes = await makeRequest('/api/verify/DOES-NOT-EXIST-12345');
    assert(
      missingVerifyRes.status === 404,
      'Public verification of non-existent certificate returns HTTP 404',
      `Got status ${missingVerifyRes.status}`
    );

    // 8. Verify existing certificate listing functionality still works
    console.log('\n[Scenario 8] Existing certificate functionality still works');
    const adminListRes = await makeRequest('/api/certificates', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminListRes.status === 200 && adminListRes.data?.certificates?.some(c => c.certificateId === publicCertId),
      'Admin can list certificates including newly created certificates',
      `Count: ${adminListRes.data?.certificates?.length}`
    );

    const adminSummaryRes = await makeRequest('/api/certificates/summary/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminSummaryRes.status === 200 && typeof adminSummaryRes.data?.summary?.totalCertificates === 'number',
      'GET /api/certificates/summary/dashboard returns valid dashboard metrics',
      JSON.stringify(adminSummaryRes.data?.summary)
    );

    // Clean up public test certificate
    await Certificate.deleteOne({ certificateId: publicCertId });

  } catch (err) {
    console.error('Unexpected error during test suite:', err);
    testFailed += 1;
  } finally {
    server.close();
    await mongoose.disconnect();
  }

  console.log('\n--- Experiment 6 Test Suite Results ---');
  console.log(`Passed: ${testPassed}`);
  console.log(`Failed: ${testFailed}`);

  if (testFailed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL EXPERIMENT 6 TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  }
};

runTests();
